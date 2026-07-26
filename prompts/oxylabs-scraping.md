# Oxylabs Scraping Pipeline Implementation Prompt

## Goal
Implement the core Oxylabs web scraping pipeline for Biasly. This includes live fetching of active news source homepages via Oxylabs Web Scraper API, homepage article link extraction, candidate filtering & deduplication, detail page scraping, HTML parsing & text cleanup, article validation (requiring title, published date, image URL, and quality body text), append-only insertion into Supabase, structured logging, and exposing a secure `POST /api/scrape` endpoint protected by `BIASLY_ADMIN_SECRET`.

## Skills Read
- `.agents/skills/oxylabs-web-scraper/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Existing Code Inspected
- `AGENTS.md` (Sections 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17)
- `lib/supabase/db.ts` (Data access functions: `getActiveSources`, `getExistingArticleUrls`, `insertArticles`, `createLog`)
- `lib/supabase/types.ts` (TypeScript types for `Source`, `Article`, `ArticleInsert`, `Log`)
- `supabase/seed.sql` (Default active sources: Reuters, NPR, BBC News, The Guardian, Fox News)

## Decisions & Assumptions
1. **Scraping Entry Point**: Use active sources from Supabase `sources` table (`is_active = true`). By default, process all active sources (Reuters, NPR, BBC News, The Guardian, Fox News) with a default limit of 5 valid articles per source per run.
2. **Oxylabs Realtime API**: Perform live fetches of homepages and article detail pages using Oxylabs Web Scraper API (`POST https://realtime.oxylabs.io/v1/queries` with `source: "universal"` and HTTP Basic Auth from `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`).
3. **Link Extraction & Filtering**: Extract card links from source homepages using Cheerio. Reject links matching the non-article reject list (categories, sections, topics, tags, authors, search, navigation/footer, show/program/podcast, live, game, product/review, corporate/support, newsletter, video-only). Apply source-specific parser patterns where available.
4. **URL Deduplication**: Normalize URLs and query Supabase using `getExistingArticleUrls` in chunks of at most 15 URLs per `.in()` query (per AGENTS.md Section 9).
5. **Article Content Gate & Cleanup**: Extract title, `published_at`, `image_url`, and body paragraphs. Strip unwanted elements (scripts, styles, ads, social sharing, navigation, newsletter blocks). Require valid title, image URL, published date, and either >= 3 paragraphs or >= 900 clean characters.
6. **API Security**: Expose `POST /api/scrape` requiring `x-biasly-admin-secret` header matching `process.env.BIASLY_ADMIN_SECRET`. Missing or invalid header returns `401 Unauthorized`.
7. **Run Logging**: Emit detailed console logs and return a complete summary object containing status, sources checked, candidates found, candidates rejected, duplicates skipped, detail pages scraped, articles inserted, articles rejected, articles failed, total duration, and rejection reasons grouped by count.

## Files to Create / Modify
- [NEW] `lib/scraping/oxylabs.ts`: Oxylabs API client wrapper using HTTP Basic Auth.
- [NEW] `lib/scraping/parser.ts`: Cheerio-based homepage link extractor, detail page content parser, text cleaner, and source-specific validation rules.
- [NEW] `lib/scraping/pipeline.ts`: Scrape-to-insert pipeline orchestrator running steps 1–9.
- [NEW] `app/api/scrape/route.ts`: Secure API route handler (`POST`) protected by `BIASLY_ADMIN_SECRET`.
- [MODIFY] `package.json`: Install `cheerio` for HTML parsing.

## Implementation Requirements
1. **Oxylabs Client (`lib/scraping/oxylabs.ts`)**:
   - `fetchPageHtml(url: string)`: Sends `POST https://realtime.oxylabs.io/v1/queries` with `{ source: "universal", url }` and basic auth header created from `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`.
   - Error handling for 401 (invalid credentials), 429 (rate limits), and network errors.

2. **Parsing & Filtering (`lib/scraping/parser.ts`)**:
   - `extractCandidateUrls(html: string, source: Source)`: Uses Cheerio to find all `<a>` tags in homepage story cards, converts relative paths to absolute URLs, filters out non-article URLs using reject lists and source-specific regex patterns (e.g., Reuters, NPR, BBC, Guardian, Fox News).
   - `parseArticleDetail(html: string, articleUrl: string, source: Source)`: Extracts title, image URL (`meta[property="og:image"]`, etc.), published date (`meta[property="article:published_time"]`, `<time datetime="...">`, etc.), and clean body text.
   - `cleanArticleText(rawHtmlOrText: string)`: Strips scripts, styles, ad placeholders, newsletter boxes, share buttons, nav text, class dumps.
   - `validateArticleContent(data)`: Enforces that `title`, `published_at`, `image_url` are present and body text meets the quality gate (>= 3 paragraphs OR >= 900 chars).

3. **Pipeline Orchestrator (`lib/scraping/pipeline.ts`)**:
   - `runScrapingPipeline(options)`:
     - Fetches active sources from Supabase.
     - Loops over sources, fetching homepages via Oxylabs.
     - Extracts and filters candidate URLs.
     - Checks existence in Supabase using 15-item chunks (`getExistingArticleUrls`).
     - Scrapes detail pages for new URLs up to `limitPerSource`.
     - Validates detail page content and constructs `ArticleInsert` objects.
     - Inserts valid articles using `insertArticles` (append-only).
     - Logs events to console and DB via `createLog`.
     - Returns summary object.

4. **API Route (`app/api/scrape/route.ts`)**:
   - `POST` handler checking `x-biasly-admin-secret` against `process.env.BIASLY_ADMIN_SECRET`.
   - Accepts optional JSON body: `{ sourceIds?: string[], limitPerSource?: number }`.
   - Returns 200 with summary object on success, 401 on unauthorized, 500 on server error.

## Security Requirements
- Require `x-biasly-admin-secret` header on `POST /api/scrape`. Return 401 if missing/invalid.
- Do not expose secret in response or logs.
- Never hardcode Oxylabs credentials or admin secret in code. Use `process.env`.

## Acceptance Criteria
- Executing `POST /api/scrape` successfully fetches active source homepages via Oxylabs.
- Homepage links are correctly extracted, filtered against non-article reject rules, and deduped against Supabase.
- Valid article detail pages are parsed, cleaned, and inserted into Supabase `articles` table with `image_url`, `published_at`, `raw_text`, and `analyzed_at = null`.
- Summary object with complete metrics and rejection reasons is returned.
- Server console logs clear step-by-step progress.

## Checks to Run
- `npm run build` to verify TypeScript & Next.js compilation.
- `npm run lint` to verify code quality.

## Manual Test Steps
1. Ensure `.env.local` contains `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and `BIASLY_ADMIN_SECRET`.
2. Start the dev server (`npm run dev`).
3. Send a POST request to scrape active sources:
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -H "x-biasly-admin-secret: <BIASLY_ADMIN_SECRET>" \
     -d '{"limitPerSource": 2}'
   ```
4. Observe the server-side console logs and verify the returned summary JSON object.
5. Query Supabase to confirm new articles appear in the `articles` table with valid `image_url`, `published_at`, and `raw_text`.
