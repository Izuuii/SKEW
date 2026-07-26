# AI Analysis Pipeline: Architecture & Developer Guide

> **Related**: [[scraping-pipeline-guide]] → [[ai-analysis-guide]] → [[clerk-authentication-guide]]
> **Supabase tables used**: `articles`, `article_analyses`, `logs`

---

## 1. Overview

The **AI Analysis Pipeline** is the intelligence layer of Biasly. After the [[scraping-pipeline-guide|Oxylabs Scraping Pipeline]] inserts raw articles into Supabase, this pipeline picks up every article that has no corresponding row in `article_analyses`, sends it to an LLM via OpenRouter API, validates and normalizes the structured output via Zod, then writes the full analysis back into Supabase.

Articles only appear on the home feed **after** `analyzed_at` is set, which happens only after a valid analysis row is saved. The pipeline is **append-only** and **never overwrites** a completed analysis.

---

## 2. Architecture & Pipeline Sequence

```
 ┌─────────────────────────────────┐
 │   POST /api/analyze             │ (Protected by x-biasly-admin-secret)
 └──────────────┬──────────────────┘
                │
 ┌──────────────▼──────────────────┐
 │  runAnalysisPipeline()          │ lib/ai/analysis.ts
 │  - Optional: limit, articleIds  │
 └──────────────┬──────────────────┘
                │
 ┌──────────────▼──────────────────┐
 │  getPendingAnalysisArticles()   │ lib/supabase/db.ts
 │  LEFT JOIN articles →           │
 │  article_analyses WHERE null    │
 └──────────────┬──────────────────┘
                │  (Returns Article[] with no analysis row)
 ┌──────────────▼──────────────────┐
 │  analyzeArticleText(article)    │ lib/ai/analysis.ts
 │  - Calls getAIModel()           │
 │  - generateObject() via AI SDK  │
 │  - Zod schema validation        │
 └──────────────┬──────────────────┘
                │
 ┌──────────────▼──────────────────┐
 │  normalizePercentages()         │
 │  Ensures L + C + R = 100        │
 │  Derives bias_score formula     │
 └──────────────┬──────────────────┘
                │
 ┌──────────────▼──────────────────┐
 │  saveArticleAnalysis()          │ lib/supabase/db.ts
 │  - Upserts article_analyses     │
 │  - Sets articles.analyzed_at    │
 └──────────────┬──────────────────┘
                │
 ┌──────────────▼──────────────────┐
 │  createLog() → logs table       │ Per-run summary persisted
 └─────────────────────────────────┘
```

---

## 3. Core Modules & Responsibilities

| Module | File Path | Primary Responsibility |
|---|---|---|
| **Analysis Engine** | [`lib/ai/analysis.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/ai/analysis.ts) | Model selection, Zod schema, prompt construction, percentage normalization, retry logic, pipeline orchestration. |
| **API Route Handler** | [`app/api/analyze/route.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/api/analyze/route.ts) | Secure `POST /api/analyze` endpoint — validates admin secret, parses optional body params, delegates to pipeline. |
| **Database Access** | [`lib/supabase/db.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/db.ts) | `getPendingAnalysisArticles()` (LEFT JOIN), `saveArticleAnalysis()` (upsert + `analyzed_at` stamp), `createLog()`. |

---

## 4. AI Model Selection (`getAIModel`)

The pipeline uses the OpenAI provider (`@ai-sdk/openai`), configured for OpenRouter or OpenAI-compatible endpoints via environment variables:

```typescript
// lib/ai/analysis.ts — getAIModel()
function getAIModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is missing.');
  }

  const openai = createOpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
  });
  const modelName = process.env.OPENAI_MODEL || 'openrouter/free';
  return { model: openai.chat(modelName), modelName };
}
```

**Key Behaviors**:
- **Mandatory API Key**: `OPENAI_API_KEY` is strictly required. If missing, the function throws an explicit `Error`.
- **OpenRouter / Proxy Support**: Setting `OPENAI_BASE_URL` (e.g. `https://openrouter.ai/api/v1`) routes requests to OpenRouter or compatible proxies.
- **Default Model**: If `OPENAI_MODEL` is not specified, it defaults to `openrouter/free`.

---

## 5. Zod Output Schema (`ArticleAnalysisSchema`)

The AI is forced to return structured JSON that matches this schema exactly. `generateObject()` from the Vercel AI SDK handles schema enforcement — it will not return until the output satisfies the type.

```typescript
export const ArticleAnalysisSchema = z.object({
  summary:               z.string(),         // 2-4 sentence neutral summary
  sentimentScore:        z.number().min(-1).max(1),
  sentimentLabel:        z.enum(['positive', 'neutral', 'negative']),
  leftPercentage:        z.number().min(0).max(100),
  centerPercentage:      z.number().min(0).max(100),
  rightPercentage:       z.number().min(0).max(100),
  politicalFramingLabel: z.enum(['left', 'center', 'right', 'mixed', 'unclear']),
  confidence:            z.number().min(0).max(1),
  framingNotes:          z.string(),          // Narrative explanation of framing indicators
  loadedTerms:           z.array(z.string()), // Partisan / emotionally loaded words found
  disclaimer:            z.string(),          // Standard AI-estimated framing disclaimer
});
```

### Field Meanings

| Field | Range / Values | Meaning |
|---|---|---|
| `sentimentScore` | `-1.0` → `1.0` | Negative to positive emotional tone |
| `sentimentLabel` | `positive / neutral / negative` | Categorical label derived from score |
| `leftPercentage` | `0` → `100` | % of left-leaning framing language detected |
| `centerPercentage` | `0` → `100` | % of neutral / centrist framing language |
| `rightPercentage` | `0` → `100` | % of right-leaning framing language |
| `politicalFramingLabel` | `left / center / right / mixed / unclear` | Dominant framing classification |
| `confidence` | `0.0` → `1.0` | AI confidence in its own analysis |
| `loadedTerms` | `string[]` | Words/phrases with partisan or emotional charge |

---

## 6. The Two-Step Prompt Design

The pipeline sends two prompts to the model on every article call:

### System Prompt (Role & Rules)
```
You are an expert, non-partisan media analyst for Biasly.
Your job is to analyze news articles for political framing, tone, sentiment, loaded language, and media bias.

Strict Guidelines:
1. Base your evaluation STRICTLY on the provided article title and text content.
   Do NOT infer bias or framing from the news source name or domain.
2. leftPercentage + centerPercentage + rightPercentage MUST equal 100.
3. Use 'unclear' politicalFramingLabel if evidence is weak; set confidence low.
4. Extract loaded terms into the loadedTerms array.
5. Write a neutral, objective summary without taking a stance.
6. Rate sentiment from -1.0 to 1.0.
```

### User Prompt (Article Content)
```
Title: {article.title}

Article Text:
{article.raw_text}
```

**Temperature**: `0.2` — low temperature ensures consistent, deterministic scoring rather than creative output.

---

## 7. Percentage Normalization (`normalizePercentages`)

The AI's raw percentages may not sum exactly to 100 due to rounding. This utility ensures mathematical integrity before the `bias_score` is derived:

```typescript
function normalizePercentages(left, center, right) {
  // 1. Clamp each value to [0, 100] and round to integer
  let l = Math.round(Math.max(0, Math.min(100, left)));
  let c = Math.round(Math.max(0, Math.min(100, center)));
  let r = Math.round(Math.max(0, Math.min(100, right)));

  const total = l + c + r;
  if (total === 100) return { left: l, center: c, right: r };  // Already correct
  if (total === 0)   return { left: 0, center: 100, right: 0 }; // Edge: default to center

  // 2. Scale proportionally to sum to 100
  l = Math.round((l / total) * 100);
  c = Math.round((c / total) * 100);
  r = 100 - (l + c);  // Remainder assigned to right to guarantee exact 100

  if (r < 0) { c += r; r = 0; } // Correction if rounding pushes right below 0
  return { left: l, center: c, right: r };
}
```

### Derived `bias_score` Formula
```
bias_score = (right_percentage - left_percentage) / 100
```
- `-1.0` = fully left-leaning
- `0.0` = perfectly balanced
- `+1.0` = fully right-leaning

This is stored directly in `article_analyses.bias_score`.

---

## 8. Pending Article Detection (LEFT JOIN Strategy)

> **AGENTS.md Section 19 Rule**: Never rely on `analyzed_at IS NULL` alone. An article is pending only when no `article_analyses` row exists for it.

```typescript
// lib/supabase/db.ts — getPendingAnalysisArticles()
const { data } = await supabase
  .from('articles')
  .select(`*, article_analyses!left(id)`)   // LEFT JOIN — null analysis = pending
  .order('created_at', { ascending: false });

const pending = rows.filter((art) => {
  const analyses = art.article_analyses;
  if (!analyses) return true;
  if (Array.isArray(analyses) && analyses.length === 0) return true;
  return false;
});
```

This handles the edge case where `analyzed_at` is set but the `article_analyses` row was manually deleted — the LEFT JOIN catches real pending state regardless of timestamp.

---

## 9. Retry Logic & Error Handling

Each article gets up to **3 attempts** before being marked as failed:

```typescript
// Attempt 1, 2, then 3 — exponential back-off for rate limits
if (attempt < 3) {
  const isRateLimit = errorMsg.includes('quota') || errorMsg.includes('429');
  const delayMs = isRateLimit ? 6000 * attempt : 1000;  // 6s, 12s for rate limits
  return analyzeArticleText(article, attempt + 1);
}
throw new Error(`AI Analysis generation failed after ${attempt} attempts: ${errorMsg}`);
```

**Between articles**: A fixed `2000ms` inter-article delay prevents rate limit bursts.

**Failed articles**: Pushed to `results[]` with `status: 'failed'` and counted in the summary. They are **not saved** to Supabase — they remain as pending for the next run.

---

## 10. Saving Analysis to Supabase (`saveArticleAnalysis`)

```typescript
// lib/supabase/db.ts — saveArticleAnalysis()

// Step 1: Upsert the analysis row (conflict on article_id)
await supabase
  .from('article_analyses')
  .upsert(analysis, { onConflict: 'article_id' })
  .select()
  .single();

// Step 2: Stamp the article as analyzed
await supabase
  .from('articles')
  .update({ analyzed_at: new Date().toISOString() })
  .eq('id', analysis.article_id);
```

Both writes happen in the same function call. If the analysis upsert fails, the `analyzed_at` stamp is never set — keeping the article correctly in the pending queue.

---

## 11. Pipeline Run Summary

At the end of every run, the pipeline returns and logs a structured summary:

```json
{
  "status": "completed",
  "totalPending": 23,
  "analyzed": 21,
  "skipped": 0,
  "failed": 2,
  "durationMs": 94031,
  "results": [
    {
      "articleId": "uuid-...",
      "title": "Senate Passes Emergency Aid Bill",
      "status": "success",
      "biasLabel": "center",
      "biasScore": 0.05
    },
    {
      "articleId": "uuid-...",
      "title": "...",
      "status": "failed",
      "error": "AI Analysis generation failed after 3 attempts: 429 Too Many Requests"
    }
  ]
}
```

This is also written to the Supabase `logs` table as a structured `metadata` JSON blob with `level: 'info'`.

---

## 12. API Route Details (`POST /api/analyze`)

```typescript
// app/api/analyze/route.ts
export async function POST(request: Request) {
  // Section 15: Admin Secret Gate
  const adminSecretHeader = request.headers.get('x-biasly-admin-secret');
  if (adminSecretHeader !== process.env.BIASLY_ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit, articleIds } = await request.json();

  const summary = await runAnalysisPipeline({
    limit: typeof limit === 'number' && limit > 0 ? limit : undefined,
    articleIds: Array.isArray(articleIds) && articleIds.length > 0 ? articleIds : undefined,
  });

  return NextResponse.json(summary, { status: 200 });
}
```

### Optional Request Body Parameters

| Parameter | Type | Default | Effect |
|---|---|---|---|
| *(none)* | — | — | Processes **all** pending articles |
| `limit` | `number` | — | Processes at most N pending articles |
| `articleIds` | `string[]` | — | Processes only the specified article IDs |

---

## 13. Security Requirements

- **Admin Secret Gate**: `POST /api/analyze` requires the `x-biasly-admin-secret` header matching `process.env.BIASLY_ADMIN_SECRET`. Missing or wrong secret returns `401`.
- **Service Role client** is used for all Supabase writes (`saveArticleAnalysis`, `createLog`) — never the public anon client.
- AI API key (`OPENAI_API_KEY`) is never exposed to browser code or logs.

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenRouter or OpenAI API key (required) |
| `OPENAI_MODEL` | Model name override (default: `openrouter/free`) |
| `OPENAI_BASE_URL` | Base URL for OpenRouter or custom proxy (e.g. `https://openrouter.ai/api/v1`) |
| `BIASLY_ADMIN_SECRET` | Admin protection for the `/api/analyze` route |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role client for DB writes |

---

## 14. How to Trigger Analysis

### A. PowerShell — Analyze All Pending
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/analyze `
  -Method POST `
  -Headers @{
    "Content-Type"          = "application/json";
    "x-biasly-admin-secret" = "biasly_admin_secret_key_123"
  } `
  -Body '{}'
```

### B. PowerShell — Analyze with Limit
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/analyze `
  -Method POST `
  -Headers @{
    "Content-Type"          = "application/json";
    "x-biasly-admin-secret" = "biasly_admin_secret_key_123"
  } `
  -Body '{"limit": 5}'
```

### C. PowerShell — Analyze Specific Articles
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/analyze `
  -Method POST `
  -Headers @{
    "Content-Type"          = "application/json";
    "x-biasly-admin-secret" = "biasly_admin_secret_key_123"
  } `
  -Body '{"articleIds": ["uuid-1", "uuid-2"]}'
```

### D. Programmatic (TypeScript)
```typescript
import { runAnalysisPipeline } from '@/lib/ai/analysis';

const summary = await runAnalysisPipeline({ limit: 10 });
console.log(summary);
```

---

## 15. Connection to the Automatic Pipeline

The AI analysis step is integrated into the automatic hourly cron pipeline:

```
Oxylabs Scheduler (top of hour)
  → Vercel Cron fires GET /api/cron/pipeline (15 min later)
      → Step 1: POST /api/oxylabs/scheduled-results/process (scrape & insert articles)
      → Step 2: runAnalysisPipeline() (analyze all newly inserted articles)
```

If Step 1 fails, Step 2 still runs — there may be pre-existing unanalyzed articles from a prior scrape.

See [[scraping-pipeline-guide]] for the full scrape-to-insert flow that produces the articles this pipeline consumes.

---

## 16. Supabase Schema Reference

### `article_analyses` table

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `article_id` | `uuid` | FK → `articles.id` |
| `summary` | `text` | Neutral 2-4 sentence summary |
| `sentiment_score` | `float8` | -1.0 to 1.0 |
| `sentiment_label` | `text` | `positive / neutral / negative` |
| `bias_score` | `float8` | Derived: `(right - left) / 100` |
| `bias_label` | `text` | `left / center / right / mixed / unclear` |
| `left_percentage` | `int4` | 0–100 |
| `center_percentage` | `int4` | 0–100 |
| `right_percentage` | `int4` | 0–100 |
| `confidence` | `float8` | 0.0–1.0 |
| `framing_notes` | `text` | Narrative framing explanation |
| `loaded_terms` | `text[]` | Array of partisan/loaded words |
| `disclaimer` | `text` | Standard AI-estimate disclaimer |
| `model` | `text` | Model name used (e.g. `gpt-4o-mini`) |
| `created_at` | `timestamptz` | Auto-set on insert |
