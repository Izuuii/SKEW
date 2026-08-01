# pgvector & Related Articles Feature — Implementation Prompt

## Goal

Implement pgvector support and the Related Articles feature for Biasly. This covers:

1. Enabling pgvector in Supabase schema and adding the `embedding vector(1536)` column to `article_analyses` with an IVFFlat cosine index.
2. Creating an RPC function `match_related_articles` in Supabase for vector cosine similarity lookup.
3. Updating TypeScript definitions in `lib/supabase/types.ts`.
4. Upgrading the AI Analysis pipeline in `lib/ai/analysis.ts` to generate 1536-dimensional embeddings via OpenAI `text-embedding-3-small` using Vercel AI SDK `embed` alongside structured text analysis.
5. Updating pending article detection so articles missing embeddings are automatically backfilled.
6. Creating `lib/supabase/queries/articles.ts` with `getRelatedArticles(articleId, embedding)`.
7. Creating API endpoint `GET /api/articles/[id]/related`.
8. Updating the News Details Page (`app/article/[id]/page.tsx`) to render a responsive "Related Articles" section displaying up to 5 similar articles ordered by cosine similarity.

---

## Skills Read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

---

## Existing Code Inspected

- `AGENTS.md` (Sections 1–7, 14, 15, 19, 20, 21, 22)
- `supabase/schema.sql`
- `lib/supabase/types.ts`
- `lib/supabase/db.ts`
- `lib/ai/analysis.ts`
- `app/api/analyze/route.ts`
- `app/api/articles/[id]/route.ts`
- `app/article/[id]/page.tsx`

---

## Decisions & Assumptions

### 1. Database Schema & pgvector Setup
- Update `supabase/schema.sql` to include:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;

  ALTER TABLE article_analyses 
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

  CREATE INDEX IF NOT EXISTS idx_article_analyses_embedding 
  ON article_analyses 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
  ```
- Create Supabase RPC function `match_related_articles`:
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
      1 - (aa.embedding <=> target_embedding) AS similarity
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

### 2. Embedding Generation in AI Pipeline
- Use Vercel AI SDK `embed` from `ai` package:
  ```ts
  import { embed } from 'ai';
  import { createOpenAI } from '@ai-sdk/openai';
  ```
- Generate embedding using OpenAI `text-embedding-3-small` for input text derived from article title and raw content.
- Update `saveArticleAnalysis` to store the 1536-element float array in `article_analyses.embedding`.
- `analyzed_at` on `articles` table is set only after both analysis and embedding are persisted.
- Pending detection handles backfilling articles where `article_analyses.embedding` is NULL.

### 3. Data Query Function — `getRelatedArticles`
- Location: `lib/supabase/queries/articles.ts`.
- Uses Supabase service role client to invoke `match_related_articles` RPC function or perform vector query, then fetches full article details with source and analysis for matching IDs.

### 4. REST API Endpoint
- Route: `GET /api/articles/[id]/related`.
- Returns `{ success: true, data: ArticleWithAnalysis[] }`.
- Returns empty array if article has no embedding or no related articles found.

### 5. News Details UI Updates
- Component: `app/article/[id]/page.tsx`.
- Render a new "Related Articles" section below the main article body and analysis sidebar.
- Display up to 5 article cards with source badge, title, publication date, framing badge, and bias percentage bar.
- Hide section gracefully if the article has no embedding or 0 related articles.

---

## Files Likely to Change

| File | Status | Description |
|---|---|---|
| `supabase/schema.sql` | MODIFIED | Add `vector` extension, `embedding` column, IVFFlat index, and `match_related_articles` RPC |
| `lib/supabase/types.ts` | MODIFIED | Add `embedding` field to `ArticleAnalysis` & `ArticleAnalysisInsert` and update `Database` definition |
| `lib/supabase/queries/articles.ts` | NEW | Implement `getRelatedArticles(articleId, embedding)` |
| `lib/supabase/db.ts` | MODIFIED | Export query function & support embedding save / pending backfill check |
| `lib/ai/analysis.ts` | MODIFIED | Add embedding generation via `text-embedding-3-small` and update pipeline summary |
| `app/api/articles/[id]/related/route.ts` | NEW | API route handler for related articles |
| `app/article/[id]/page.tsx` | MODIFIED | Integrate Related Articles section with responsive UI |

---

## Security Requirements

- All OpenAI API keys and Supabase service role keys remain server-side.
- Public UI accesses related articles via thin API route `GET /api/articles/[id]/related`.

---

## UI & Design Expectations

- **Layout**: Full-width section below the main article and sidebar, featuring a grid of 1 to 3 columns (responsive: 1 column on mobile, 2 on tablet, 3 on desktop).
- **Typography & Colors**: Match the existing Biasly theme (`#0D0D0F` text, `#F0F0F0` background, `#E5E7EB` borders, white card backgrounds, colored bias bars for Left/Center/Right).
- **Interactivity**: Clean hover shadow and scale effects on cards, clickable links navigating to `/article/[id]`.

---

## Acceptance Criteria

- [x] Schema and types include `vector(1536)` and `match_related_articles` RPC function.
- [x] `/api/analyze` generates and saves embeddings alongside AI analysis.
- [x] `getRelatedArticles` returns up to 5 nearest neighbors ordered by cosine distance.
- [x] News details page displays Related Articles section only when embeddings are available.
- [x] `npm run typecheck` and `npm run lint` complete with 0 errors.

---

## Checks to Run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

---

## Manual Test Steps

1. Execute the ALTER SQL / RPC script in Supabase Dashboard → SQL Editor.
2. Trigger AI analysis with embeddings:
   ```powershell
   curl.exe -s -X POST http://localhost:3000/api/analyze `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: biasly_admin_secret_key_123" `
     -d "{}"
   ```
3. Visit an article details page in the browser (e.g. `http://localhost:3000/article/<article-id>`) and verify the "Related Articles" section displays relevant stories.
