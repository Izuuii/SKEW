# Implementation Prompt: Skew Home Page UI Implementation

## Goal
Implement the Skew Home page UI for **biasly** matching the provided reference design (`02-homepage.png`). The home page will feature a top utility bar, primary navigation header with logo and navigation links, interactive topic filter pills bar, "Top News" section heading, 12 news article cards rendered in a 3-column responsive grid with accurate headlines, categories, bias meters, and source counts, and a multi-column dark footer.

## Skills Read & References
- `AGENTS.md` (Project Rules & Guidelines)
- `node_modules/next/dist/docs/` (Next.js App Router, layout, UI patterns)
- `.agents/skills/clerk` (Clerk Auth integration patterns)

## Existing Code Inspected
- `app/layout.tsx`: Root layout with Google Poppins font and global background styling.
- `app/globals.css`: Color variables (`#0D0D0F`, `#6B7280`, `#F6F6F6`, `#B42318`, `#E5E7EB`, `#1D4ED8`), typography utilities, border radii, shadow tokens.
- `app/page.tsx`: Currently contains the design system showcase gallery. Will be updated to display the full Skew Home page layout.
- `components/ui/article-card.tsx`: Card component (will be updated or extended to support vertical grid cards with ⓘ info button overlay, category/location meta, title, compact bias meter, and source count footer).
- `components/ui/bias-meter.tsx`: Bias meter bar component displaying Left, Center, Right percentages.
- `components/ui/chip.tsx`: Category filter pills with `+` icons.
- `components/ui/button.tsx`: Subscribe and Login buttons.

## Decisions & Assumptions
1. **Layout & Container**: Max-width `1280px` container centered horizontally on background `#F0F0F0`.
2. **Top Utility Bar**:
   - Left side: "Browser Extension", "Theme: Light Dark Auto" switcher.
   - Right side: "Monday, June 1, 2026", "Set Location", "🌐 International Edition ∨".
3. **Main Navigation Header**:
   - Hamburger menu icon (`≡`), logo `biasly News` (bold `biasly`, regular `News`).
   - Center navigation items: `Home` (active with bottom indicator), `For You *` (with red notification dot), `Local`, `Blindspot`.
   - Right actions: `Subscribe` button (solid dark `#0D0D0F`), `Login` button (secondary / outline).
4. **Topic Filter Bar**:
   - Horizontal scrollable list with left `<` and right `>` navigation arrows.
   - Topics: `World Cup`, `IPL`, `Social Media`, `Business & Markets`, `Health & Medicine`, `Soccer`, `Artificial Intelligence`, `Arsenal FC`, `Extreme Weather and Disasters`.
5. **Top News Grid**:
   - Heading: "Top News" (bold H1 text, 32px / 28px).
   - Responsive 3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
   - 12 Cards matching exact content from the reference spec:
     1. Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report (Politics • United States | L 20%, Center 31%, Right 49% | 12 sources)
     2. Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence (Health • United States | L 18%, Center 42%, Right 40% | 7 sources)
     3. CERN Finds High-Significance Hint of Physics Beyond Standard Model (Science • Switzerland | L 16%, Center 62%, Right 22% | 8 sources)
     4. Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention (World • Nicaragua | L 54%, Center 28%, Right 18% | 63 sources)
     5. UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon (World • Middle East | L 22%, Center 35%, Right 43% | 15 sources)
     6. Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand (Business • Global | L 25%, Center 50%, Right 28% | 11 sources)
     7. SpaceX Launches Starship Test Flight in Milestone for Mars Program (Technology • United States | L 12%, Center 45%, Right 49% | 9 sources)
     8. Apple Unveils AI-Powered Features Across iPhone, iPad and Mac (Business • United States | L 15%, Center 40%, Right 45% | 10 sources)
     9. 2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says (Climate • Global | L 33%, Center 34%, Right 33% | 14 sources)
     10. Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook (Economy • United States | L 30%, Center 45%, Right 25% | 13 sources)
     11. Real Madrid Win Champions League After Comeback Victory in Final (Soccer • Europe | L 10%, Center 20%, Right 70% | 26 sources)
     12. Wildfires Force Thousands to Evacuate Across Western Canada (Environment • Canada | L 27%, Center 33%, Right 40% | 17 sources)
6. **Card Layout Details**:
   - Card image on top with subtle hover zoom effect.
   - Info icon `ⓘ` in white/translucent pill overlay on top-right of image.
   - Category • Location in small muted text (`Politics • United States`).
   - Article title in bold text (`font-bold text-[16px] text-[#0D0D0F]`).
   - Compact bias meter bar (`L 20% | Center 31% | Right 49%`).
   - Footer displaying `{X} sources`.
7. **Footer Layout**:
   - Dark background (`#1E1E22` or `#0D0D0F`) with multi-column layout.
   - Left: Logo `biasly News` + Tagline "Balanced news coverage powered by AI."
   - Company links: About, Careers, Press, Contact.
   - Help links: Help Center, Guides, Privacy Policy, Terms of Service.
   - Social links: X, LinkedIn, Substack, YouTube icons.
   - Bottom copyright bar: `© 2026 Biasly News. All rights reserved.`

## Files Likely to Change
- `prompts/homepage-ui.md` [NEW]
- `components/ui/article-card.tsx` [MODIFY]
- `app/page.tsx` [MODIFY]

## Implementation Requirements
- Use Tailwind CSS v4 and standard design system tokens from `globals.css`.
- Ensure clean TypeScript interfaces and high visual fidelity.
- Use Unsplash images corresponding accurately to each article topic (Trump/politics, grapes/grapes field, CERN/particle accelerator, Nicaragua/protest-ruins, Middle East/buildings, OPEC/oil pump, SpaceX/rocket, Apple/store-logo, Climate/thermometer, Fed/Federal Reserve building, Soccer/Real Madrid player, Wildfire/forest fire).
- Ensure full responsiveness on desktop, tablet, and mobile displays.

## Security Requirements
- Ensure UI components are pure presentation components without exposing client secrets or unvalidated inputs.

## Visual Interpretation & Pixel-Perfect Expectations
- Color fidelity matching hex tokens (`#0D0D0F`, `#6B7280`, `#F6F6F6`, `#B42318`, `#E5E7EB`, `#1D4ED8`).
- Clean grid alignment, 24px gutters, max-width 1280px container.
- Clean typography hierarchy using Google Font Poppins.

## Acceptance Criteria
- Home page visual layout matches the attached `02-homepage.png` design spec.
- Top utility header, primary navigation, topic pills bar, 12 news cards in 3 columns, and dark multi-column footer render cleanly.
- `npm run build` succeeds without TypeScript or CSS errors.

## Checks to Run
- `npm run build`
- `npm run lint`

## Exact Manual Test Steps
1. Run `npm run dev` to start the Next.js dev server.
2. Navigate to `http://localhost:3000` in the browser.
3. Verify top bar (date, location, theme switcher).
4. Verify primary header (logo, menu, navigation links, Subscribe/Login buttons).
5. Verify topic filter bar with horizontal scrollable chips (`+ World Cup +`, `+ IPL +`, etc.).
6. Verify "Top News" section heading and 12 article cards arranged in a 3-column grid.
7. Inspect article cards to confirm image, info button, category/location meta, title, bias meter, and source count.
8. Verify multi-column dark footer branding, links, and copyright text.
