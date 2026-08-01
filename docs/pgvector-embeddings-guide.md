# pgvector & Related Articles: Architecture & Developer Guide

> **Related**: [[ai-analysis-guide]] → [[pgvector-embeddings-guide]] → [[scraping-pipeline-guide]]
> **Supabase tables used**: `articles`, `article_analyses`, `logs`
> **PostgreSQL Extension**: `pgvector` (`vector(1536)`)

---

## 1. Overview

The **pgvector & Related Articles Feature** introduces semantic vector similarity search into Biasly. When an article is processed by the AI Analysis pipeline, the system generates a 1536-dimensional vector embedding using OpenAI's `text-embedding-3-small` model via the Vercel AI SDK.

This embedding is stored in the `embedding vector(1536)` column of the `article_analyses` table. An IVFFlat cosine index optimizes nearest-neighbor queries, allowing the system to recommend up to 5 semantically related articles on the **News Details Page** (`/article/[id]`).

---

## 2. Architecture & System Flow

```
  ┌────────────────────────────────────────────────────────┐
  │                 POST /api/analyze                      │ (Admin Secret Protected)
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │               runAnalysisPipeline()                    │ lib/ai/analysis.ts
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │          getPendingAnalysisArticles()                  │ lib/supabase/db.ts
  │          LEFT JOIN: missing analysis OR embedding      │
  └───────────────────────────┬────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
  ┌───────────▼────────────┐      ┌───────────▼────────────┐
  │  analyzeArticleText()  │      │ generateArticleEmbedding│
  │  LLM Structured Text   │      │ text-embedding-3-small │
  └───────────┬────────────┘      └───────────┬────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │             saveArticleAnalysis()                      │ lib/supabase/db.ts
  │  - Stores analysis JSON + vector(1536) embedding       │
  │  - Sets articles.analyzed_at                           │
  └────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────────

  ┌────────────────────────────────────────────────────────┐
  │            User Visits /article/[id]                   │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │         GET /api/articles/[id]/related                 │ app/api/articles/[id]/related/route.ts
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │               getRelatedArticles()                     │ lib/supabase/queries/articles.ts
  │  Calls match_related_articles RPC (cosine distance <=>)│
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │        Renders Related Coverage Section                │ app/article/[id]/page.tsx
  │  Displays cards with bias distribution bars            │
  └────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema & Migration (`supabase/schema.sql`)

### 3.1 Extension & Column Definition

The `pgvector` extension provides vector data types and similarity search operators:

```sql
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to article_analyses
ALTER TABLE article_analyses 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. IVFFlat Cosine Distance Index
CREATE INDEX IF NOT EXISTS idx_article_analyses_embedding 
ON article_analyses 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

### 3.2 PostgREST RPC Function (`match_related_articles`)

To execute vector similarity searches over PostgREST without custom backend SQL parsing, an RPC stored procedure is created:

```sql
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
```

**Key Features**:
- **Cosine Distance Operator (`<=>`)**: Calculates vector distance between candidate articles and the target article.
- **Similarity Conversion**: `1 - (a <=> b)` converts distance into cosine similarity.
- **Filter Guard**: Excludes unanalyzed articles, null embeddings, and the current article itself.

---

## 4. Embedding Generation in AI Pipeline (`lib/ai/analysis.ts`)

The embedding is generated alongside the structured text analysis using `embed` from Vercel AI SDK and OpenAI's `text-embedding-3-small`:

```typescript
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function generateArticleEmbedding(article: Article): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = createOpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
  });

  const textToEmbed = `${article.title}\n\n${article.raw_text}`.slice(0, 8000);

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: textToEmbed,
  });

  return embedding;
}
```

### Automatic Backfilling & LEFT JOIN Query

Articles requiring embedding backfill (where text analysis exists but `embedding IS NULL`) are detected automatically by `getPendingAnalysisArticles()` in [`lib/supabase/db.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/db.ts):

```typescript
// Detects articles missing EITHER an analysis row OR missing embedding
const pending = rows.filter((art) => {
  const analyses = art.article_analyses;
  if (!analyses) return true;
  const item = Array.isArray(analyses) ? analyses[0] : analyses;
  if (!item || !item.id) return true;
  if (!item.embedding || item.embedding.length === 0) return true;
  return false;
});
```

---

## 5. Query Engine (`lib/supabase/queries/articles.ts`)

`getRelatedArticles(articleId, embedding)` uses the service role Supabase client to fetch vector matches:

```typescript
export async function getRelatedArticles(
  articleId: string,
  embedding?: number[] | null
): Promise<ArticleWithAnalysis[]> {
  if (!articleId) return [];

  const supabase = createServiceRoleClient();
  let targetVec = embedding;

  // Fallback: load vector from DB if not passed
  if (!targetVec || targetVec.length === 0) {
    const { data: analysis } = await supabase
      .from('article_analyses')
      .select('embedding')
      .eq('article_id', articleId)
      .single();

    if (analysis && Array.isArray(analysis.embedding)) {
      targetVec = analysis.embedding as number[];
    }
  }

  if (!targetVec || targetVec.length === 0) return [];

  // Invoke RPC function
  const { data: rpcMatches, error } = await supabase.rpc(
    'match_related_articles',
    {
      target_article_id: articleId,
      target_embedding: JSON.stringify(targetVec),
      match_count: 5,
    }
  );

  const matches = (rpcMatches || []) as Array<{ article_id: string; similarity: number }>;
  if (!error && matches.length > 0) {
    const matchedIds = matches.map((m) => m.article_id);
    const relatedArticles: ArticleWithAnalysis[] = [];
    for (const id of matchedIds) {
      const art = await getArticleById(id);
      if (art) relatedArticles.push(art);
    }
    return relatedArticles;
  }

  return [];
}
```

---

## 6. REST API Endpoint (`app/api/articles/[id]/related/route.ts`)

Exposes a thin read-only GET endpoint for the news details UI:

- **Endpoint**: `GET /api/articles/[id]/related`
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Article Title",
      "image_url": "https://...",
      "published_at": "2026-07-26T12:00:00Z",
      "source": { "name": "Reuters" },
      "analysis": {
        "bias_label": "center",
        "left_percentage": 25,
        "center_percentage": 50,
        "right_percentage": 25
      }
    }
  ]
}
```

---

## 7. News Details UI Integration (`app/article/[id]/page.tsx`)

The **Related Articles** section renders dynamically below the main article body:

- **Responsive Grid**: 1 column on mobile, 2 on tablet, 3 on desktop.
- **Card Elements**:
  - Image thumbnail with fallback error handling.
  - Source tag and publication date.
  - Title with multi-line text truncation (`line-clamp-2`).
  - Political bias framing badge and custom Left/Center/Right color distribution bar.
- **Visibility Constraint**: Hides automatically if the current article has no embedding or no matches exist.

---

## 8. Summary of Files Created & Modified

| File | Status | Description |
|---|---|---|
| [`supabase/schema.sql`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/supabase/schema.sql) | MODIFIED | Added `pgvector` extension, `vector(1536)` column, IVFFlat index, and `match_related_articles` RPC procedure. |
| [`lib/supabase/types.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/types.ts) | MODIFIED | Added `embedding` field to TypeScript interfaces and `Database` schema types. |
| [`lib/supabase/queries/articles.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/queries/articles.ts) | **NEW** | Implemented `getRelatedArticles(articleId, embedding)` RPC caller. |
| [`lib/supabase/db.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/db.ts) | MODIFIED | Updated `getPendingAnalysisArticles()` for embedding backfilling and exported query helpers. |
| [`lib/ai/analysis.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/ai/analysis.ts) | MODIFIED | Added `generateArticleEmbedding()` using `text-embedding-3-small` via AI SDK `embed`. |
| [`app/api/articles/[id]/related/route.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/api/articles/[id]/related/route.ts) | **NEW** | REST API handler returning vector-similar related stories. |
| [`app/article/[id]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/article/[id]/page.tsx) | MODIFIED | Integrated Related Articles grid section with responsive design. |
