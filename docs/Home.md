# 🏠 Biasly — Knowledge Vault

Welcome to the **Biasly** developer knowledge base. Open this `docs/` folder in Obsidian as a vault. All internal links use `[[wikilinks]]` for graph navigation.

---

## 🗺 System Map

```
[User Request]
      │
      ▼
[Clerk Auth] ──────────────────────────────────────────────▶ /sign-in · /sign-up
      │
      ▼
[Home Feed /]  ──── reads ────▶  [Supabase: articles + article_analyses]
      │                                          ▲              ▲
      │                                          │              │
      ▼                                          │              │
[Article Detail /article/[id]]          [Scraping Pipeline] → [AI Analysis Pipeline]
                                                 │
                                                 ▼
                                         [Oxylabs API]
```

---

## 📚 Documentation Index

### Feature Guides

| Doc | What it covers |
|---|---|
| [[clerk-authentication-guide]] | Full-page sign-in/up routes, middleware, `<Show>` wiring, Clerk v7 API |
| [[clerk-authentication-architecture]] | Architecture diagram, file-by-file middleware & route breakdown |
| [[scraping-pipeline-guide]] | 9-step Oxylabs scrape-to-insert flow, URL filtering, content gate, deduplication |
| [[ai-analysis-guide]] | AI model selection, Zod schema, prompt design, normalization, retry logic, cron integration |

---

## 🔄 How the Pipelines Connect

1. **Scraping** → [[scraping-pipeline-guide]]
   Oxylabs fetches news homepages, extracts story links, filters non-article URLs, scrapes detail pages, validates content, and inserts raw articles into `articles` table with `analyzed_at = null`.

2. **AI Analysis** → [[ai-analysis-guide]]
   Reads all `articles` rows with no matching `article_analyses` row (LEFT JOIN), sends each to LLM via Vercel AI SDK (OpenAI / OpenRouter), normalizes the structured output, and writes results to `article_analyses`. Sets `analyzed_at` on the article row.

3. **Home Feed** reads only articles where `analyzed_at IS NOT NULL` — articles without analysis are invisible to users.

4. **Clerk Auth** → [[clerk-authentication-guide]]
   Middleware guards `/article/[id]`. Public browsing is allowed on `/`. Full analysis details require sign-in.

---

## 🧩 Tech Stack Quick Reference

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Clerk v7 (`@clerk/nextjs`) |
| Database | Supabase (Postgres + pgvector) |
| Scraping | Oxylabs Web Scraper API + Scheduler |
| HTML Parsing | Cheerio |
| AI | Vercel AI SDK + OpenAI / OpenRouter |
| Validation | Zod |
| UI | Tailwind CSS + shadcn/ui |
| Cron | Vercel Cron |

---

## 📁 Directory Structure

```
docs/
├── Home.md                         ← You are here
├── ai-analysis-guide.md            ← AI pipeline deep-dive
├── scraping-pipeline-guide.md      ← Oxylabs scraping deep-dive
├── clerk-authentication-guide.md   ← Auth feature breakdown
├── clerk-authentication-architecture.md ← Auth architecture diagram
├── 01_Architecture/README.md       ← High-level system design notes
├── 02_Features/README.md           ← Feature specs and TODOs
├── 03_Snippets/README.md           ← Reusable code snippets
└── 04_Bugs/README.md               ← Known issues and fixes
```

---

## 🚀 Quick Start

1. Open this `docs/` folder in **Obsidian** → File → Open Folder as Vault.
2. Enable **Graph View** (Ctrl+G) to see how all docs connect.
3. Use **Backlinks** panel on any note to trace dependencies.
