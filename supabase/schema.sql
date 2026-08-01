-- Schema definition for Biasly News database

-- 1. Sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    listing_url TEXT NOT NULL,
    parser_strategy TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    original_url TEXT UNIQUE NOT NULL,
    canonical_url TEXT,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    raw_text TEXT NOT NULL,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Article Analyses table
CREATE TABLE IF NOT EXISTS article_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID UNIQUE NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    sentiment_score DOUBLE PRECISION NOT NULL,
    sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    bias_score DOUBLE PRECISION NOT NULL,
    bias_label TEXT NOT NULL CHECK (bias_label IN ('left', 'center', 'right', 'mixed', 'unclear')),
    left_percentage INTEGER NOT NULL CHECK (left_percentage >= 0 AND left_percentage <= 100),
    center_percentage INTEGER NOT NULL CHECK (center_percentage >= 0 AND center_percentage <= 100),
    right_percentage INTEGER NOT NULL CHECK (right_percentage >= 0 AND right_percentage <= 100),
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    framing_notes TEXT,
    loaded_terms TEXT[],
    disclaimer TEXT,
    model TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector index for cosine distance similarity search
CREATE INDEX IF NOT EXISTS idx_article_analyses_embedding ON article_analyses USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC Function to query related articles by vector similarity
CREATE OR REPLACE FUNCTION match_related_articles(
  target_article_id UUID,
  target_embedding vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  article_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.article_id,
    (1 - (aa.embedding <=> target_embedding))::FLOAT AS similarity
  FROM article_analyses aa
  JOIN articles a ON a.id = aa.article_id
  WHERE aa.embedding IS NOT NULL
    AND a.analyzed_at IS NOT NULL
    AND aa.article_id != target_article_id
  ORDER BY aa.embedding <=> target_embedding
  LIMIT match_count;
END;
$$;

-- 4. Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Oxylabs Schedules table
CREATE TABLE IF NOT EXISTS oxylabs_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    schedule_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Oxylabs Schedule Runs table
CREATE TABLE IF NOT EXISTS oxylabs_schedule_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id TEXT NOT NULL,
    run_id TEXT,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_analyzed_at ON articles(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_analyses_article_id ON article_analyses(article_id);
CREATE INDEX IF NOT EXISTS idx_article_analyses_bias_label ON article_analyses(bias_label);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oxylabs_schedules_schedule_id ON oxylabs_schedules(schedule_id);

-- Row Level Security (RLS) Configuration
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oxylabs_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE oxylabs_schedule_runs ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies for UI display
CREATE POLICY "Allow public select for active sources" ON sources
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Allow public select for articles" ON articles
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public select for article_analyses" ON article_analyses
    FOR SELECT TO anon, authenticated
    USING (true);

-- Allow public select for logs
CREATE POLICY "Allow public select for logs" ON logs
    FOR SELECT TO anon, authenticated
    USING (true);
