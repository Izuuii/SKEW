# Prompt: Update README.md with Complete Project Guide, Architecture, Tech Stack, and Feature Roadmap

## Goal
Update `README.md` to transform it from default Next.js starter boilerplate into comprehensive, production-ready documentation for **Biasly**. The documentation will thoroughly explain the project summary, core features, full technology stack, system architecture, database schema, API operational routes, local environment setup, and future feature expansion options.

---

## Skills Read
- `.agents/skills/supabase`
- `.agents/skills/oxylabs-web-scraper`
- `.agents/skills/ai-sdk`
- `.agents/skills/clerk`

---

## Existing Code Inspected
- `README.md` (current boilerplate content)
- `package.json` (dependencies, scripts, framework versions)
- `supabase/schema.sql` (table definitions, pgvector extension, indexes, RLS policies, match_related_articles RPC)
- `app/api/` (`/api/scrape`, `/api/analyze`, `/api/oxylabs/schedules`, `/api/oxylabs/scheduled-results/process`, `/api/cron/pipeline`, `/api/sources`, `/api/logs`)
- `lib/scraping/` (`oxylabs.ts`, `extractor.ts`, `pipeline.ts`)
- `lib/ai/` (`analyzer.ts`)
- `lib/supabase/` (`server.ts`, `client.ts`, `types.ts`)
- `components/` (`bias-meter.tsx`, `article-card.tsx`, `navbar.tsx`, etc.)

---

## Key Decisions & Assumptions
1. **Comprehensive Documentation**: Replace the generic Next.js `create-next-app` starter text completely with a structured, developer-friendly `README.md`.
2. **Visual & Architectural Clarity**: Include visual Markdown tables, code blocks, and an ASCII/Mermaid architecture diagram showing the end-to-end flow from news source scraping to AI vector similarity search and UI presentation.
3. **Accuracy**: Mirror the exact technologies, environment keys, table schema, API methods, and pipeline workflows present in the codebase.
4. **Future Expansion Roadmap**: Add a dedicated section titled "Potential Future Additions & Roadmap" detailing high-value features (multi-model comparison, historical bias trends, topic alerts, user bookmarks, video transcript scraping).

---

## Files Likely to Change
- `README.md` (to be overwritten with the comprehensive project documentation)

---

## Implementation Requirements

The new `README.md` will contain the following detailed sections:

1. **Header & Project Summary**:
   - Title, overview, description of Biasly as an automated AI-powered news analysis and political framing platform.

2. **Core Capabilities & Features**:
   - Multi-Source Web Scraping (Oxylabs + Cheerio)
   - Automated Ingestion & Scheduler (Oxylabs Scheduler + Vercel Cron)
   - AI Sentiment & Political Bias Framing Analysis (Vercel AI SDK + OpenAI structured outputs)
   - Semantic Vector Search for Related Articles (`pgvector` cosine similarity)
   - User Authentication (Clerk)
   - Premium Modern UI (Next.js App Router, Tailwind CSS, custom Bias Meter)

3. **Technology Stack**:
   - Framework & UI: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide React
   - Authentication: Clerk Auth (`@clerk/nextjs`)
   - Database & Vector Storage: Supabase PostgreSQL + `pgvector` extension
   - Web Scraping Engine: Oxylabs Web Scraper API, Oxylabs Scheduler, Cheerio
   - AI Engine: Vercel AI SDK (`ai`, `@ai-sdk/openai`), OpenAI (`gpt-4o-mini`, `text-embedding-3-small`), Zod
   - Orchestration & Analytics: Vercel Cron, PostHog

4. **System Architecture**:
   - High-level data flow diagram (News Sources -> Oxylabs -> Scrape Pipeline -> Supabase DB -> Vercel AI Engine -> pgvector -> UI/Details Page).
   - Component & Layer Breakdown: Presentation Layer, API Layer, Ingestion & Parser Engine, AI & Vector Engine, Storage Layer.

5. **Database Schema (`supabase/schema.sql`)**:
   - Overview of tables (`sources`, `articles`, `article_analyses`, `logs`, `oxylabs_schedules`, `oxylabs_schedule_runs`).
   - Explanation of `embedding vector(1536)` and `match_related_articles` RPC function.

6. **Environment Variables & Setup Guide**:
   - List of all required environment keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OXYLABS_USERNAME`, `OXYLABS_PASSWORD`, `OPENAI_API_KEY`, `BIASLY_ADMIN_SECRET`, `CRON_SECRET`).
   - Prerequisites & local execution instructions (`npm install`, `npm run dev`).

7. **API & Pipeline Operations Reference**:
   - Manual scraping (`POST /api/scrape`)
   - Manual AI analysis (`POST /api/analyze`)
   - Oxylabs Scheduler sync & job processing (`POST /api/oxylabs/schedules`, `POST /api/oxylabs/scheduled-results/process`)
   - Vercel Cron pipeline (`GET /api/cron/pipeline`)

8. **Potential Future Enhancements ("What You Can Add Next")**:
   - Multi-Model AI Framing Comparison (OpenAI vs Anthropic vs Gemini)
   - Historical Media Outlet Bias Trend Analytics
   - Personalized Newsfeed & Saved Bookmarks
   - Breaking News High-Bias Slack/Discord/Email Alerts
   - Podcast & YouTube Video News Transcript Analysis
   - Independent Fact-Checking API Cross-Referencing

---

## Security Requirements
- Document that administrative mutation routes require the `x-biasly-admin-secret` header matching `BIASLY_ADMIN_SECRET`.
- Document that the cron route relies on `CRON_SECRET` sent by Vercel Cron.
- Remind developers never to expose service role keys or admin secrets to the client bundle.

---

## Acceptance Criteria
- `README.md` is updated with clean, professional, highly structured Markdown.
- Contains accurate explanations of how the project works, tech stack, architecture, database schema, operational API routes, and future additions.

---

## Checks to Run
- Review `README.md` formatting and verify markdown rendering.
- Run `npm run lint` to ensure no linting issues.

---

## Exact Manual Test Steps Expected After Implementation
1. View `README.md` in the project root to inspect the updated content.
2. Confirm all sections (Summary, Features, Tech Stack, Architecture Diagram, Database Schema, API Reference, Environment Setup, Future Additions) are present and properly formatted.
