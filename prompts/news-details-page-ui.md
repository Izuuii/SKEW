# Implementation Prompt: News Details Page UI Implementation

## Goal
Implement the news details page UI for **biasly** matching the attached reference design (`03-news-details-page.png`). The page displays full article analysis including header navigation, topic breadcrumb, headline, byline, save/share actions, main hero image with caption, bias distribution card, multi-paragraph article body, 2-column related stories section, right-sidebar cards (Bias Analysis, AI Summary, Source Breakdown), newsletter email subscription banner, and multi-column dark footer.

## Skills Read & References
- `AGENTS.md` (Project Rules & Guidelines)
- `node_modules/next/dist/docs/` (Next.js App Router, layout, client/server routing, dynamic parameters)
- `.agents/skills/clerk` (Clerk Auth integration patterns)

## Existing Code Inspected
- `app/layout.tsx`: Root layout with Google Poppins font and global styling.
- `app/globals.css`: Design tokens (`#0D0D0F`, `#6B7280`, `#F6F6F6`, `#B42318`, `#E5E7EB`, `#1D4ED8`, etc.).
- `app/page.tsx`: Skew Home page UI with 12 article cards that link to detail pages.
- `components/ui/article-card.tsx`: Vertical and horizontal article card components.
- `components/ui/bias-meter.tsx`: Multi-segment bias distribution meter bar.
- `components/ui/button.tsx`: Action button component.

## Decisions & Assumptions
1. **Route Location**: `app/article/[id]/page.tsx` (Dynamic route allowing `/article/1` to display the detailed analysis for article 1, as well as a standalone fallback route `/article` if accessed directly).
2. **Main Layout**: Max-width `1280px` container centered with `gap-8` between the main content column (2/3 width, ~65%) and the right analysis sidebar (1/3 width, ~35%). Fully responsive stacking on mobile and tablet screens.
3. **Main Column Components**:
   - **Header Nav**: Reuses standard top utility bar and main navigation bar with `biasly News` logo, nav links (`Home`, `For You *`, `Local`, `Blindspot`), `Subscribe` and `Login` buttons.
   - **Category Breadcrumb**: `Politics • United States` in muted text (`#6B7280`).
   - **Main Headline**: `Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report` (bold header text, `text-[28px]` to `text-[36px]`).
   - **Byline Bar**: `By David Morgan` | `May 31, 2026` | `12 min read` on the left; Action buttons (`Save` [Bookmark], `Share` [Share2], `...` [MoreHorizontal]) on the right.
   - **Hero Image & Caption**: Cabinet Room photo of Donald Trump with full caption text and photographer credit (`Andrew Harnik/Getty Images`).
   - **Bias Distribution Card**: Light gray card (`bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-5`) with `Bias Distribution ⓘ`, 3-segment bar (Left 20%, Center 31%, Right 49%), and `12 sources` count label.
   - **Article Body Text**: 8 full news paragraphs with clean typography, optimal line-height (`1.7`), and clear paragraph spacing (`space-y-5`).
   - **Related Stories Section**: Section header `Related Stories` followed by a 2-column grid of 6 compact horizontal news cards with thumbnails, category metadata, title, date, and read time.
4. **Right Sidebar Column Components**:
   - **Bias Analysis Card**: Displays `Overall Bias` label, large `Right 49%` callout in navy blue, subtext `Based on 12 balanced sources`, Left/Center/Right breakdown bars, descriptive methodology note, and `How We Analyze Bias` outline button.
   - **AI Summary Card**: Displays `Generated May 31, 2026 • 3 min read`, 5 structured bullet points detailing key story aspects, disclaimer note `AI summaries can make mistakes.`, and `Provide Feedback` outline button.
   - **Source Breakdown Card**: Displays `12 Total Sources`, category progress distribution (Left 2 (20%), Center 4 (31%), Right 6 (49%)), Top Sources table listing 8 publications (Fox News, WSJ, Reuters, BBC, CNN, NYT, WashPost, Newsmax) with color-coded bias labels, and `View All Sources` outline button.
5. **Newsletter Banner & Footer**:
   - **Newsletter Banner**: `Stay Informed. Stay Balanced.` with email input and dark `Subscribe` button.
   - **Dark Footer**: Standard multi-column footer with logo, links, social icons, and `© 2026 Biasly News. All rights reserved.`

## Files Likely to Change
- `prompts/news-details-page-ui.md` [NEW]
- `app/article/[id]/page.tsx` [NEW]
- `app/page.tsx` [MODIFY] (Add navigation link to `/article/1` when clicking top article card)

## Implementation Requirements
- Build pure presentation UI matching the attached reference screenshot (`03-news-details-page.png`).
- Use Tailwind CSS v4 and existing design system tokens from `globals.css`.
- Ensure full visual accuracy for typography, colors (`#0D0D0F`, `#6B7280`, `#F6F6F6`, `#B42318`, `#E5E7EB`, `#1D4ED8`), layout margins, and card borders.
- Include interactive tab/button states (e.g. Save, Share, Subscribe, How We Analyze Bias, Provide Feedback, View All Sources).
- Ensure mobile, tablet, and desktop responsiveness.

## Security Requirements
- Component must be pure presentation UI without exposing server keys or executing unsafe scripts.

## Visual Interpretation & Pixel-Perfect Expectations
- Exact alignment of 2-column desktop layout (65% main article column, 35% right sidebar).
- Consistent rounded corners (`rounded-[12px]`), border styling (`border-[#E5E7EB]`), and background colors (`#F0F0F0` page background, `#FFFFFF` card backgrounds).
- Clean typography using Google Poppins font.

## Acceptance Criteria
- `/article/1` route renders the complete News Details Page matching `03-news-details-page.png`.
- Top header, headline, byline, main image, bias distribution banner, 8 article paragraphs, 6 related stories, 3 right-sidebar analysis cards, email newsletter box, and dark footer render cleanly.
- Clicking on the Trump Iran article card on the homepage (`/`) navigates smoothly to `/article/1`.
- `npm run build` succeeds without TypeScript or CSS errors.

## Checks to Run
- `npm run build`
- `npm run lint`

## Exact Manual Test Steps Expected After Implementation
1. Run `npm run dev` to start the Next.js dev server.
2. Open browser to `http://localhost:3000` (Homepage).
3. Click on the "Trump Sends Iran Revised Peace Proposal..." article card to navigate to `http://localhost:3000/article/1`.
4. Verify top utility bar and navigation header.
5. Verify headline, byline, save/share buttons, hero image, and photo caption.
6. Verify "Bias Distribution" card under hero image.
7. Verify 8 paragraphs of article content.
8. Verify "Related Stories" grid with 6 horizontal cards.
9. Inspect right sidebar: "Bias Analysis" card, "AI Summary" card with 5 bullet points, "Source Breakdown" card with source spectrum and top 8 sources list.
10. Verify newsletter subscription section and dark footer.
