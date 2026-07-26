# Oxylabs Scraping Pipeline Architecture & Developer Guide

> **Related**: [[Home]] → [[scraping-pipeline-guide]] → [[ai-analysis-guide]]
> **Supabase tables used**: `sources`, `articles`, `logs`
> **Feeds into**: [[ai-analysis-guide]] (articles inserted here are picked up by AI analysis)

---

## 1. Overview

The **Oxylabs Scraping Pipeline** is the automated data collection engine for **Biasly**. It fetches news homepages in real-time, extracts article links, filters out non-article pages (categories, author pages, podcasts, etc.), deduplicates against stored database records, parses and cleans article content, enforces a strict quality gate, and persists valid articles into Supabase for subsequent AI sentiment and bias analysis.

---

## 2. Architecture & Pipeline Sequence

```
 ┌──────────────────────┐
 │   Active Sources     │ (Loaded from Supabase `sources` table)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │ Oxylabs Realtime API │ (POST https://realtime.oxylabs.io/v1/queries)
 └──────────┬───────────┘
            │  (Fetches live homepage HTML)
 ┌──────────▼───────────┐
 │ Cheerio Link Parser  │ (Extracts story card candidate URLs)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │  Candidate Filter    │ (Rejects non-article URLs & applies source rules)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │ URL Existence Check  │ (Queries Supabase in <=15 URL chunks)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │ Detail Page Scraper  │ (Fetches article detail pages via Oxylabs)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │ Content Gate & Clean │ (Title, Image, Published Date, Text quality gate)
 └──────────┬───────────┘
            │
 ┌──────────▼───────────┐
 │   Supabase Upsert    │ (Append-only insert with `ignoreDuplicates: true`)
 └──────────────────────┘
```

---

## 3. Core Modules & Responsibilities

| Module | File Path | Primary Responsibility |
|---|---|---|
| **Oxylabs Client** | [`lib/scraping/oxylabs.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/scraping/oxylabs.ts) | Sends HTTP Basic Auth requests to Oxylabs Realtime API (`source: "universal"`). Enforces a 30-second timeout per fetch. |
| **Parser & Cleaner** | [`lib/scraping/parser.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/scraping/parser.ts) | Cheerio-based URL normalization, non-article pattern rejection, source-specific link strategies, HTML text cleaning, metadata extraction, and Article Content Gate validation. |
| **Pipeline Orchestrator** | [`lib/scraping/pipeline.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/scraping/pipeline.ts) | Executes the 9-step scrape-to-insert pipeline, handles batching and deduplication, logs console progress, and writes structured run metrics to Supabase `logs`. |
| **API Route Handler** | [`app/api/scrape/route.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/api/scrape/route.ts) | Secure `POST /api/scrape` endpoint requiring `x-biasly-admin-secret` request header. |
| **Database Access** | [`lib/supabase/db.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/lib/supabase/db.ts) | Source retrieval (`getActiveSources`), chunked existence checks (`getExistingArticleUrls`), and atomic article upserts (`insertArticles`). |

---

## 4. Detailed 9-Step Scrape-to-Insert Workflow

### Step 1: Active Source Selection
- Queries Supabase `sources` table where `is_active = true`.
- Deduplicates active sources by domain/name to prevent double-scraping.
- Target default sources: **BBC News**, **Fox News**, **NPR**, **Reuters**, **The Guardian**.

### Step 2: Live Homepage Fetching
- Sends a request to Oxylabs Realtime API (`POST https://realtime.oxylabs.io/v1/queries`) with basic authentication:
  ```json
  {
    "source": "universal",
    "url": "https://www.reuters.com"
  }
  ```
- Receives raw homepage HTML.

### Step 3: Story Card Link Extraction
- Parses homepage HTML with Cheerio (`cheerio.load(html)`).
- Strips header, footer, navigation, and menu elements to focus on main story cards.
- Normalizes relative URLs (e.g. `/world/asia-pacific/...`) to absolute URLs (`https://www.reuters.com/...`).
- Strips query tracking parameters (`utm_*`, `fbclid`, `gclid`) and hash fragments.

### Step 4: Candidate Filtering & Non-Article Reject List
Each candidate URL is evaluated against the **Canonical Non-Article Reject List**:
- Categories / sections (`/world`, `/politics`, `/sections/`)
- Topics and tag hubs (`/topic/`, `/tag/`)
- Author / profile pages (`/author/`, `/profile/`)
- Search, show, program, and podcast hubs (`/show/`, `/podcast/`)
- Live feeds and sports hubs (`/live/`, `/game/`)
- Shopping, product, and review pages (`/product/`, `/shopping/`)
- Corporate, newsletter, and support pages (`/newsletter/`, `/privacy/`)

Additionally, source-specific regex strategies are applied:
- **Reuters**: Requires article slug with date pattern (e.g., `-2026-07-26`).
- **NPR**: Requires `/YYYY/MM/DD/` date path.
- **BBC News**: Requires `/articles/<id>` or `/news/articles/` pattern.
- **The Guardian**: Requires `/YYYY/MMM/DD/` date path.
- **Fox News**: Requires multi-segment path with a long hyphenated title slug.

### Step 5: Chunked URL Existence Check
- Checks candidate URLs against the Supabase `articles` table.
- Queries in small chunks of **at most 15 URLs per `.in()` filter** (per project rules).
- Skips URLs already present in the database.

### Step 6: Article Detail Scraping
- Fetches candidate article detail pages via Oxylabs Realtime API up to `limitPerSource` (default: 5 per source).

### Step 7: Content Extraction & Text Cleanup
Parses article detail HTML to extract:
1. **Title**: Cleaned of site suffixes (e.g. ` | Reuters`).
2. **Canonical URL**: `<link rel="canonical">` or original URL.
3. **Published Date**: `meta[property="article:published_time"]`, `<time datetime="...">`, or JSON-LD `datePublished`. Converted to ISO timestamp.
4. **Image URL**: `meta[property="og:image"]`, `meta[name="twitter:image"]`, or main article body image.
5. **Raw Text**: Paragraphs extracted after stripping ads, scripts, styles, social share buttons, newsletter boxes, and CSS dumps.

### Step 8: Article Content Gate Validation
Before an article is accepted, it must pass all of the following validation rules:
- Must have a valid `title` (length >= 10 chars).
- Must have a valid `image_url`.
- Must have a valid `published_at` date.
- Must pass the **Body Quality Gate**:
  $$\text{Paragraph Count} \ge 3 \quad \text{OR} \quad \text{Character Count} \ge 900$$

If validation fails, the article is rejected, logged with a reason, and not saved.

### Step 9: Append-Only Supabase Upsert & Logging
- Valid articles are prepared as `ArticleInsert` objects with `analyzed_at = null`.
- Articles are upserted into Supabase using:
  ```ts
  supabase.from('articles').upsert(uniqueArticles, { onConflict: 'original_url', ignoreDuplicates: true })
  ```
- Generates structured console logs and writes execution metrics to the `logs` table.

---

## 5. Security Requirements

- **Admin Secret Protection**: `POST /api/scrape` requires the `x-biasly-admin-secret` request header matching `process.env.BIASLY_ADMIN_SECRET`.
- **Environment Variables**:
  - `OXY_WSA_USERNAME`: Oxylabs API username
  - `OXY_WSA_PASSWORD`: Oxylabs API password
  - `BIASLY_ADMIN_SECRET`: Biasly secret key for administrative endpoints
- Secrets are never logged or exposed to browser code.

---

## 6. How to Trigger Scraping

### A. PowerShell (`curl.exe`)
```powershell
curl.exe -X POST http://localhost:3000/api/scrape `
  -H "Content-Type: application/json" `
  -H "x-biasly-admin-secret: biasly_admin_secret_key_123" `
  -d "{\"limitPerSource\": 5}"
```

### B. PowerShell (`Invoke-RestMethod`)
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/scrape `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json";
    "x-biasly-admin-secret" = "biasly_admin_secret_key_123"
  } `
  -Body '{"limitPerSource": 5}'
```

### C. Programmatic Call (TypeScript)
```ts
import { runScrapingPipeline } from '@/lib/scraping/pipeline';

const summary = await runScrapingPipeline({
  sourceIds: ['11111111-1111-1111-1111-111111111111'], // Optional specific source
  limitPerSource: 3 // Optional per-source limit
});
```

---

## 7. Sample Summary Output

```json
{
  "status": "success",
  "sourcesChecked": 5,
  "candidatesFound": 394,
  "candidatesRejected": 0,
  "duplicatesSkipped": 1,
  "detailPagesScraped": 25,
  "articlesInserted": 23,
  "articlesRejected": 2,
  "articlesFailed": 0,
  "totalDurationMs": 110452,
  "rejectionReasons": {
    "Body quality failed: has 2 paragraph(s) and 223 character(s) (requires >= 3 paragraphs or >= 900 chars)": 1,
    "Body text missing or insufficient": 1
  },
  "sourceDetails": [
    { "sourceName": "BBC News", "candidatesFound": 30, "articlesInserted": 5 },
    { "sourceName": "Fox News", "candidatesFound": 127, "articlesInserted": 5 },
    { "sourceName": "NPR", "candidatesFound": 45, "articlesInserted": 5 },
    { "sourceName": "Reuters", "candidatesFound": 64, "articlesInserted": 3 },
    { "sourceName": "The Guardian", "candidatesFound": 128, "articlesInserted": 5 }
  ]
}
```
