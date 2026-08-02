# Oxylabs Scheduler and Vercel Cron Implementation Prompt

## Goal
Implement the automatic hourly news scraping and AI analysis pipeline using Oxylabs Scheduler, Vercel Cron, and Supabase persistence. This includes creating and syncing Oxylabs recurring schedules per active source, deactivating orphan schedules, retrieving completed schedule runs (`/runs` endpoint with `result_status === 'done'`), executing the scrape-to-insert pipeline for candidate articles, running AI analysis on pending articles, configuring `vercel.json` for `:15` past every hour, and exposing protected API routes (`POST /api/oxylabs/schedules`, `GET /api/oxylabs/schedules`, `POST /api/oxylabs/scheduled-results/process`, `GET /api/oxylabs/runs`, and `GET /api/cron/pipeline`).

## Skills Read
- `.agents/skills/oxylabs-web-scraper/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Existing Code Inspected
- `AGENTS.md` (Sections 7, 8, 9, 14, 15, 18, 19)
- `lib/scraping/oxylabs.ts` (Oxylabs Web Scraper API credentials & fetch wrapper)
- `lib/scraping/parser.ts` (Cheerio HTML link extraction, detail parsing, text cleaning, validation)
- `lib/scraping/pipeline.ts` (Scrape-to-insert pipeline orchestrator)
- `lib/ai/analysis.ts` (`runAnalysisPipeline` for AI sentiment, framing, and embedding analysis)
- `lib/supabase/db.ts` (Data access for sources, articles, logs, oxylabs_schedules, oxylabs_schedule_runs)
- `lib/supabase/types.ts` (TypeScript types for schedules and runs)

## Decisions & Assumptions
1. **Oxylabs Scheduler Endpoints**: Use `https://data.oxylabs.io/v1/schedules` with HTTP Basic Auth (`OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`).
2. **Large Integer ID Precision (Critical)**: Oxylabs `schedule_id` and job `id` values are 64-bit integers exceeding JavaScript's `Number.MAX_SAFE_INTEGER`. Parse IDs from raw HTTP response text using string/regex extraction before `JSON.parse` to prevent ID truncation and corruption.
3. **Run Monitoring**: Use `GET /schedules/{id}/runs` (not `/jobs`) to obtain per-job `result_status`, filtering strictly for `result_status === 'done'`. Fetch job result content from `GET /v1/queries/{job_id}/results`.
4. **Orphan Schedule Deactivation**: When syncing schedules via `POST /api/oxylabs/schedules`, list all remote Oxylabs schedules via `GET /v1/schedules`, compare against active DB sources, and deactivate any unneeded schedules via `PUT /v1/schedules/{id}/state` with `{"status": "inactive"}`.
5. **Scrape-to-Insert Pipeline Reuse**: Process scheduled homepage HTML results through the same validation, cleanup, dedupe, 15-item chunk URL existence check, detail page scraping, and run logging as manual scraping.
6. **Automatic Pipeline Flow**: Configure `vercel.json` with cron `"15 * * * *"` triggering `GET /api/cron/pipeline`. Step 1 processes scheduled results; Step 2 immediately executes AI analysis on pending articles. Step 2 runs even if Step 1 encounters errors or inserts no new articles.
7. **Security**:
   - `POST /api/oxylabs/schedules` and `POST /api/oxylabs/scheduled-results/process` require `x-biasly-admin-secret` header.
   - `GET /api/cron/pipeline` requires `Authorization: Bearer <CRON_SECRET>` (bypassed in local development).
   - Read routes `GET /api/oxylabs/schedules` and `GET /api/oxylabs/runs` return stored rows.

## Files to Create / Modify
- [NEW] `lib/scraping/scheduler.ts`: Core Oxylabs Scheduler manager (sync schedules, orphan deactivation, run processing, result fetching, DB tracking).
- [NEW] `app/api/oxylabs/schedules/route.ts`: API route for syncing schedules (`POST`) and listing schedules (`GET`).
- [NEW] `app/api/oxylabs/scheduled-results/process/route.ts`: API route for processing scheduled results (`POST`).
- [NEW] `app/api/oxylabs/runs/route.ts`: API route for listing recorded schedule runs (`GET`).
- [NEW] `app/api/cron/pipeline/route.ts`: Internal Vercel Cron pipeline endpoint (`GET`) chaining result processing + AI analysis.
- [NEW] `vercel.json`: Vercel Cron configuration (`15 * * * *`).

## Implementation Requirements
1. **Oxylabs Scheduler Wrapper (`lib/scraping/scheduler.ts`)**:
   - `syncOxylabsSchedules()`:
     - Fetch active sources from Supabase.
     - For each source, issue `POST https://data.oxylabs.io/v1/schedules` with `cron: "0 * * * *"` and item `{ source: "universal", url: source.listing_url }`.
     - Extract `schedule_id` from raw response text via regex.
     - Upsert schedules into `oxylabs_schedules` table in Supabase.
     - Fetch remote schedules list `GET https://data.oxylabs.io/v1/schedules`, extract remote IDs from raw text, and deactivate orphan schedules (`PUT /v1/schedules/{id}/state`).
   - `processScheduledResults()`:
     - Fetch active schedules from `oxylabs_schedules`.
     - For each schedule, fetch runs `GET /v1/schedules/{id}/runs`.
     - Filter jobs where `result_status === 'done'`.
     - Fetch HTML content from `GET /v1/queries/{job_id}/results`.
     - Run candidate extraction, deduplication against Supabase (15-item chunk check), detail page scraping via Oxylabs Realtime API, content validation, and append-only article insertion.
     - Record run execution in `oxylabs_schedule_runs`.

2. **API Routes**:
   - `POST /api/oxylabs/schedules`: Require `x-biasly-admin-secret`. Execute `syncOxylabsSchedules()`.
   - `GET /api/oxylabs/schedules`: Return rows from `oxylabs_schedules`.
   - `POST /api/oxylabs/scheduled-results/process`: Require `x-biasly-admin-secret`. Execute `processScheduledResults()`.
   - `GET /api/oxylabs/runs`: Return rows from `oxylabs_schedule_runs`.
   - `GET /api/cron/pipeline`: Check `CRON_SECRET` (if set or in production). Run `processScheduledResults()` then `runAnalysisPipeline()`.

3. **Vercel Cron (`vercel.json`)**:
   - Define crons array with path `/api/cron/pipeline` and schedule `15 * * * *`.

## Security Requirements
- Enforce `x-biasly-admin-secret` check on `POST /api/oxylabs/schedules` and `POST /api/oxylabs/scheduled-results/process`.
- Enforce `CRON_SECRET` check on `GET /api/cron/pipeline` (skip in local development if header/env is missing).
- Never expose admin secret or Oxylabs credentials in responses or logs.

## Acceptance Criteria
- Sync schedules endpoint creates Oxylabs schedules for active sources and deactivates orphan schedules.
- `schedule_id` and job `id` 64-bit integers are safely extracted from raw text without precision loss.
- Processing scheduled results fetches completed runs (`/runs`), processes homepage HTML through the scrape-to-insert pipeline, and inserts valid new articles.
- The cron pipeline route runs scheduled result processing and immediately triggers AI analysis on pending articles.
- `vercel.json` is configured for hourly execution at `:15`.
- Detailed console logs and DB logs track all operations.

## Checks to Run
- `npm run build` to verify Next.js & TypeScript compilation.
- `npm run lint` to verify code formatting & rules.

## Manual Test Steps
1. Sync schedules via API:
   ```bash
   curl -X POST http://localhost:3000/api/oxylabs/schedules \
     -H "x-biasly-admin-secret: <BIASLY_ADMIN_SECRET>"
   ```
2. Verify created schedules:
   ```bash
   curl http://localhost:3000/api/oxylabs/schedules
   ```
3. Process scheduled results manually:
   ```bash
   curl -X POST http://localhost:3000/api/oxylabs/scheduled-results/process \
     -H "x-biasly-admin-secret: <BIASLY_ADMIN_SECRET>"
   ```
4. Check recorded schedule runs:
   ```bash
   curl http://localhost:3000/api/oxylabs/runs
   ```
5. Trigger automatic cron pipeline manually in dev mode:
   ```bash
   curl http://localhost:3000/api/cron/pipeline
   ```
6. Monitor server console logs to verify that scheduled result processing and AI analysis both complete cleanly.
