# Implementation Prompt: Supabase Database Schema & Data Access Layer

## 1. Goal
Establish the complete Supabase database schema, SQL seed data, TypeScript database types, Supabase client initialization (browser & server service role), and data access module (DAO/queries) for **biasly news**, strictly following `AGENTS.md` and `.agents/skills/supabase`.

---

## 2. Skills Read
- `.agents/skills/supabase` (Core Principles, RLS Policies, Data API settings, Security Checklist, CLI/Migration best practices)
- `AGENTS.md` (Sections 1, 3, 5, 6, 7, 8, 9, 10, 14, 15, 19)

---

## 3. Existing Code Inspected
- `package.json` (verified `@supabase/supabase-js` package needs to be installed)
- `.env.local` (verified placeholder keys needed for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BIASLY_ADMIN_SECRET`)
- Directory structure (confirmed `lib/` and `supabase/` directories need to be created)

---

## 4. Decisions or Assumptions
1. **Packages**: Install `@supabase/supabase-js`.
2. **Schema & Migration**: Place full DDL in `supabase/schema.sql` and initial news sources seed in `supabase/seed.sql`.
3. **Database Types**: Export strong TypeScript types in `lib/supabase/types.ts` for all database tables, views, inserts, updates, and join payloads.
4. **Supabase Clients**:
   - `lib/supabase/client.ts` — Browser client (uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - `lib/supabase/server.ts` — Server client with service-role capability for backend scraping, scheduling, logging, and AI analysis pipelines.
5. **Data Access Layer (`lib/supabase/db.ts`)**:
   - `sources`: `getActiveSources`, `getAllSources`, `createSource`
   - `articles`: `getArticlesWithAnalysis`, `getArticleById`, `getExistingArticleUrls` (with mandatory <=15 chunking filter per Section 9), `insertArticles` (append-only deduplicated), `getPendingAnalysisArticles` (LEFT JOIN on `article_analyses` checking `article_analyses.id IS NULL` per Section 19)
   - `article_analyses`: `saveArticleAnalysis` (and setting `analyzed_at` on target article)
   - `logs`: `createLog`, `getLogs`
   - `oxylabs_schedules`: `upsertSchedule`, `getActiveSchedules`, `deleteOrphanSchedules`
   - `oxylabs_schedule_runs`: `recordScheduleRun`, `updateScheduleRunStatus`
6. **Vector Search Note**: Omit `embedding vector(1536)` column for now per Section 7 (to be added in Section 20 pgvector phase).
7. **Security & RLS**: Enable RLS on all 6 tables. Allow public `SELECT` for active sources, articles, and article_analyses. Restrict write/update operations to `service_role`.
8. **API Endpoints**:
   - `GET /api/sources` (returns active news sources)
   - `GET /api/logs` (returns recent logs)

---

## 5. Files Likely to Change / Be Created
- [MODIFY] `package.json` — Add `@supabase/supabase-js` dependency.
- [MODIFY] `.env.local` — Add Supabase environment variable placeholders.
- [NEW] `supabase/schema.sql` — DDL script for all 6 tables, indexes, RLS policies, and triggers.
- [NEW] `supabase/seed.sql` — Seed script for initial news sources (Reuters, NPR, BBC, Guardian, Fox News).
- [NEW] `lib/supabase/types.ts` — TypeScript interfaces for database entities.
- [NEW] `lib/supabase/client.ts` — Browser Supabase client helper.
- [NEW] `lib/supabase/server.ts` — Server-side / Service-role Supabase client helper.
- [NEW] `lib/supabase/db.ts` — Comprehensive data access query helper functions.
- [NEW] `app/api/sources/route.ts` — API route handler for `GET /api/sources`.
- [NEW] `app/api/logs/route.ts` — API route handler for `GET /api/logs`.

---

## 6. Implementation Requirements

### Schema Specifications (`supabase/schema.sql`)
1. `sources`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `name` (text, not null)
   - `listing_url` (text, not null) — homepage entry page URL
   - `parser_strategy` (text, nullable)
   - `is_active` (boolean, not null, default `true`)
   - `logo_url` (text, nullable)
   - `created_at` (timestamptz, not null, default `now()`)

2. `articles`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `source_id` (uuid, not null, references `sources(id)` on delete cascade)
   - `original_url` (text, unique, not null) — used for deduplication
   - `canonical_url` (text, nullable)
   - `title` (text, not null)
   - `image_url` (text, not null) — required before saving
   - `published_at` (timestamptz, not null) — required before saving
   - `raw_text` (text, not null)
   - `scraped_at` (timestamptz, not null, default `now()`)
   - `analyzed_at` (timestamptz, nullable) — null until analysis is saved
   - `created_at` (timestamptz, not null, default `now()`)

3. `article_analyses`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `article_id` (uuid, unique, not null, references `articles(id)` on delete cascade)
   - `summary` (text, not null) — neutral summary
   - `sentiment_score` (double precision, not null) — range [-1, 1]
   - `sentiment_label` (text, not null) — `positive`, `neutral`, or `negative`
   - `bias_score` (double precision, not null) — derived `(right_percentage - left_percentage) / 100`
   - `bias_label` (text, not null) — `left`, `center`, `right`, `mixed`, or `unclear`
   - `left_percentage` (integer, not null) — range [0, 100]
   - `center_percentage` (integer, not null) — range [0, 100]
   - `right_percentage` (integer, not null) — range [0, 100]
   - `confidence` (double precision, not null) — range [0, 1]
   - `framing_notes` (text, nullable)
   - `loaded_terms` (text[], nullable)
   - `disclaimer` (text, nullable)
   - `model` (text, not null) — AI model name used
   - `created_at` (timestamptz, not null, default `now()`)

4. `logs`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `level` (text, not null) — `info`, `warn`, `error`
   - `message` (text, not null)
   - `metadata` (jsonb, nullable)
   - `created_at` (timestamptz, not null, default `now()`)

5. `oxylabs_schedules`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `source_id` (uuid, references `sources(id)` on delete cascade)
   - `schedule_id` (text, not null, unique) — stored as text to avoid 64-bit integer overflow
   - `status` (text, not null, default `'active'`)
   - `created_at` (timestamptz, not null, default `now()`)
   - `updated_at` (timestamptz, not null, default `now()`)

6. `oxylabs_schedule_runs`:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `schedule_id` (text, not null)
   - `run_id` (text, nullable)
   - `status` (text, not null)
   - `started_at` (timestamptz, nullable)
   - `completed_at` (timestamptz, nullable)
   - `created_at` (timestamptz, not null, default `now()`)

---

## 7. Security Requirements
- **RLS Policies**:
  - `ALTER TABLE sources ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE articles ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE article_analyses ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE logs ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE oxylabs_schedules ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE oxylabs_schedule_runs ENABLE ROW LEVEL SECURITY;`
  - Public `SELECT` allowed on `sources`, `articles`, and `article_analyses`.
  - Service role bypasses RLS for write operations.
- **Service Role Key Usage**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side JS or Next.js browser bundles (`NEXT_PUBLIC_`).

---

## 8. Acceptance Criteria
- [x] Schema SQL (`supabase/schema.sql`) cleanly executes in Supabase Dashboard SQL Editor without errors.
- [x] Seed SQL (`supabase/seed.sql`) populates initial active news sources.
- [x] TypeScript interfaces in `lib/supabase/types.ts` strictly model database tables and relationships.
- [x] Browser client (`lib/supabase/client.ts`) and Server client (`lib/supabase/server.ts`) properly initialize.
- [x] Data access module (`lib/supabase/db.ts`) provides clean, type-safe functions for all CRUD operations, including chunked URL existence checks and pending analysis LEFT JOIN checks.
- [x] API routes (`GET /api/sources` and `GET /api/logs`) work properly.
- [x] Build check (`npx tsc --noEmit`) passes with zero type errors.

---

## 9. Checks to Run
- `npx tsc --noEmit`
- `npm run lint`

---

## 10. Exact Manual Test Steps Expected After Implementation
1. Copy `supabase/schema.sql` into Supabase SQL Editor and run it.
2. Copy `supabase/seed.sql` into Supabase SQL Editor and run it.
3. Test `GET /api/sources` via curl:
   ```bash
   curl -X GET http://localhost:3000/api/sources
   ```
4. Test `GET /api/logs` via curl:
   ```bash
   curl -X GET http://localhost:3000/api/logs
   ```
