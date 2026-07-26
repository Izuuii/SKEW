# Implementation Prompt: UI Database Integration (Supabase Stored Data)

## 1. Goal
Replace static client-side mock data in `app/page.tsx` and `app/article/[id]/page.tsx` with real data fetched from Supabase using `lib/supabase/db.ts` (`getArticlesWithAnalysis`, `getArticleById`, `getActiveSources`), adhering to Section 5 ("UI must display stored data only") of `AGENTS.md`.

---

## 2. Skills Read
- `.agents/skills/supabase`
- `AGENTS.md` (Sections 1, 5, 7, 19)

---

## 3. Existing Code Inspected
- `app/page.tsx` (Currently contains static `articlesData` mock array)
- `app/article/[id]/page.tsx` (Currently contains static mock article detail view)
- `lib/supabase/db.ts` (Contains `getArticlesWithAnalysis`, `getArticleById`, `getActiveSources`)

---

## 4. Decisions or Assumptions
1. **Data Layer**:
   - `app/page.tsx`: Fetch active sources and analyzed articles using `getArticlesWithAnalysis()` and `getActiveSources()`. Fallback to seed articles stored in database.
   - `app/article/[id]/page.tsx`: Fetch article details and analysis by ID using `getArticleById(id)`.
2. **UI Updates**:
   - Render article cards dynamically with real article title, source name/logo, published date, image, AI-estimated framing label, left/center/right percentages, and sentiment.
   - Support category/source filtering and bias filtering.
   - On news detail page, display neutral summary, sentiment score/label, left/center/right percentages, confidence score, framing notes, loaded terms list, and disclaimer.

---

## 5. Files Likely to Change
- [MODIFY] `app/page.tsx` — Connect to Supabase queries for news cards feed and category/source filters.
- [MODIFY] `app/article/[id]/page.tsx` — Connect to Supabase query `getArticleById` for real article detail & AI analysis.

---

## 6. Implementation Requirements
- `app/page.tsx` must load articles with `getArticlesWithAnalysis()` from `lib/supabase/db.ts`.
- `app/article/[id]/page.tsx` must load article by ID with `getArticleById(id)` from `lib/supabase/db.ts`.
- Render real stored fields: `title`, `image_url`, `published_at`, `source.name`, `analysis.summary`, `analysis.sentiment_label`, `analysis.bias_label`, `analysis.left_percentage`, `analysis.center_percentage`, `analysis.right_percentage`, `analysis.confidence`, `analysis.framing_notes`, `analysis.loaded_terms`, `analysis.disclaimer`.
- Preserve existing responsive UI layout, dark/light aesthetics, and Clerk authentication navigation bar.

---

## 7. Acceptance Criteria
- [x] Homepage (`/`) displays stored articles fetched from Supabase.
- [x] Article details page (`/article/[id]`) displays real article data and full AI analysis fetched from Supabase.
- [x] Zero hardcoded mock arrays remain for core article feeds.
- [x] Build check (`npx tsc --noEmit`) passes with zero type errors.

---

## 8. Checks to Run
- `npx tsc --noEmit`

---

## 9. Exact Manual Test Steps Expected After Implementation
1. Visit `http://localhost:3000` in the browser and verify the news cards display real database articles.
2. Click on an article card to navigate to `/article/<id>` and verify full AI sentiment, summary, and framing breakdown render from Supabase.
