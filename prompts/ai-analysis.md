# AI Article Analysis Pipeline — Implementation Record

## Goal

Implement the AI Article Analysis pipeline for Biasly. This covers:

- Detecting pending articles via LEFT JOIN between `articles` and `article_analyses` (never relying solely on `analyzed_at IS NULL`)
- Executing structured AI analysis using Vercel AI SDK `generateObject` with dynamic provider selection
- Enforcing Zod output schema validation and political framing percentage constraints
- Persisting results into Supabase `article_analyses`
- Updating `articles.analyzed_at` only after a successful analysis write
- Structured logging to the `logs` table and server console
- Secure `POST /api/analyze` route protected by `BIASLY_ADMIN_SECRET`

---

## Skills Read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

---

## Existing Code Inspected

- `AGENTS.md` (Sections 1, 2, 3, 5, 6, 7, 14, 15, 17, 19)
- `.env.local`
- `lib/supabase/db.ts` — `getPendingAnalysisArticles`, `saveArticleAnalysis`, `createLog`, `getArticleById`
- `lib/supabase/types.ts` — `Article`, `ArticleAnalysis`, `ArticleAnalysisInsert`, `SentimentLabel`, `BiasLabel`
- `package.json`

---

## Decisions & Assumptions

### 1. AI Provider Selection — `getAIModel()`

Model provider uses OpenAI-compatible client (`createOpenAI` from `@ai-sdk/openai`) via OpenRouter API:

```ts
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
```

Active env config:
| Var | Value |
|---|---|
| `OPENAI_API_KEY` | OpenRouter API Key (required) |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | `openrouter/free` |

- `OPENAI_API_KEY` is required; missing key throws an immediate error.
- Uses `openai.chat(modelName)` for model invocation.
- Gemini fallback was removed in favor of single OpenRouter/OpenAI provider configuration.

---

### 2. Pending Analysis Query

`getPendingAnalysisArticles()` in `lib/supabase/db.ts` performs a LEFT JOIN between `articles` and `article_analyses`. An article is pending when no `article_analyses` row exists for it — `analyzed_at IS NULL` alone is not sufficient.

---

### 3. Zod Schema — `ArticleAnalysisSchema`

All fields use `.describe()` only. **No `.default()`** — OpenAI strict mode requires every field in the `required` array; `.default()` makes fields optional and breaks the schema.

Fields:
- `summary` — neutral 2–4 sentence summary
- `sentimentScore` — number −1.0 to 1.0
- `sentimentLabel` — `'positive' | 'neutral' | 'negative'`
- `leftPercentage` — 0–100
- `centerPercentage` — 0–100
- `rightPercentage` — 0–100
- `politicalFramingLabel` — `'left' | 'center' | 'right' | 'mixed' | 'unclear'`
- `confidence` — 0.0–1.0
- `framingNotes` — narrative explanation
- `loadedTerms` — array of charged/partisan words
- `disclaimer` — AI-estimated framing caveat

---

### 4. Percentage Normalization & Bias Score

- Percentages are proportionally normalized so `left + center + right === 100`.
- `bias_score = (right_percentage - left_percentage) / 100`

---

### 5. Retry Logic

Up to 3 attempts per article with exponential backoff:
- Rate limit / quota errors → 6s × attempt delay
- Other errors → 1s delay
- After 3 failures → article marked failed, no data saved to DB
- 2-second pacing delay between consecutive articles in batch

---

### 6. Persistence Workflow

1. Upsert into `article_analyses` (keyed by `article_id`)
2. Update `articles.analyzed_at` **only after** analysis row write succeeds

---

### 7. API Route Security

`POST /api/analyze` requires header `x-biasly-admin-secret` matching `process.env.BIASLY_ADMIN_SECRET`. Returns `401` if missing or wrong.

---

### 8. Request Options

`POST /api/analyze` accepts optional JSON body:
- `{ limit?: number }` — process up to N pending articles
- `{ articleIds?: string[] }` — analyze specific articles by ID
- `{}` — default: process all pending articles

---

## Files Created / Modified

| File | Status | Change |
|---|---|---|
| `lib/ai/analysis.ts` | NEW | `getAIModel()`, `ArticleAnalysisSchema`, `analyzeArticleText()`, `runAnalysisPipeline()` |
| `app/api/analyze/route.ts` | NEW | Secure `POST` handler |
| `package.json` | MODIFIED | Added `ai`, `@ai-sdk/openai`, `@ai-sdk/google`, `zod` |
| `.env.local` | MODIFIED | `OPENAI_API_KEY` (OpenRouter), `OPENAI_BASE_URL`, `OPENAI_MODEL` |

---

## Security Requirements

- `x-biasly-admin-secret` required on every call — `401` if missing/invalid
- AI keys never appear in response payloads or DB logs
- All model calls are server-side only

---

## Acceptance Criteria

- `POST /api/analyze` detects pending articles via LEFT JOIN
- Analysis runs through `openrouter/free` via OpenRouter (`/v1/chat/completions`), OpenRouter API
- Framing percentages sum to 100; `bias_score` is correctly derived
- Results saved to `article_analyses`; `articles.analyzed_at` updated after success
- Console and `logs` table both receive structured run records
- Response includes full summary: `{ status, totalPending, analyzed, skipped, failed, durationMs, results }`

---

## Checks Run

- `npm run build` — passed, 0 TypeScript or Next.js errors

---

## Manual Test (PowerShell)

```powershell
# Analyze all pending articles
curl.exe -s -X POST http://localhost:3000/api/analyze `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: biasly_admin_secret_key_123" `
  -d "{}"

# Analyze with limit
curl.exe -s -X POST http://localhost:3000/api/analyze `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: biasly_admin_secret_key_123" `
  -d "{\"limit\": 2}"
```

Watch the Next.js dev server terminal for live per-article progress logs.

Verify in Supabase Dashboard → Table Editor → `article_analyses` that rows exist and `articles.analyzed_at` is set.