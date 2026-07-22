# Implementation Prompt: App Design System Implementation

## Goal
Implement the core design system for **biasly** based on the provided UI reference specification image. This includes setting up the font system (Poppins), Tailwind v4 / CSS design tokens (colors, typography scale, spacing, shadows, border-radii), baseline UI primitives (Buttons, Chips/Categories, Bias Meter, Card components, Header/Footer bar), and updated global layout.

## Skills Read & References
- `node_modules/next/dist/docs/` (Next.js font optimization, server/client component boundaries, Tailwind integration)
- Existing code: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `package.json`

## Existing Code Inspected
- `app/globals.css`: Contains default Next.js v16 Tailwind v4 CSS `@import "tailwindcss";` and dark mode / root variable setups. Currently uses `Geist` font variables.
- `app/layout.tsx`: Configured with Geist sans & mono fonts.
- `app/page.tsx`: Placeholder home page.

## Decisions & Assumptions
1. **Typography**: Replace default Geist font setup in `app/layout.tsx` with Google Font `Poppins` (`weights: ['400', '500', '600', '700']`) as specified in the typography guide.
2. **Color Palette Tokens**:
   - Primary Text: `#0D0D0F`
   - Secondary Text: `#6B7280`
   - Surface: `#F6F6F6`
   - Left Bias (Semantic): `#B42318`
   - Center (Semantic): `#E5E7EB`
   - Right Bias (Semantic): `#1D4ED8`
   - Background Primary: `#FFFFFF`
   - Background Secondary: `#F0F0F0`
   - Border & Divider: `#E5E7EB`
3. **Typography Scale**:
   - `H1`: 32px (2rem), Bold (700), line-height 1.2
   - `H2`: 24px (1.5rem), SemiBold (600), line-height 1.3
   - `H3`: 20px (1.25rem), SemiBold (600), line-height 1.3
   - `H4`: 16px (1rem), Medium (500), line-height 1.4
   - `Body Large`: 16px (1rem), Regular (400), line-height 1.6
   - `Body Medium`: 14px (0.875rem), Regular (400), line-height 1.6
   - `Body Small`: 13px (0.8125rem), Regular (400), line-height 1.6
   - `Caption`: 11px (0.6875rem), Regular (400), line-height 1.4
4. **Spacing System**: Base unit 4px (4px, 8px, 16px, 24px, 32px, 40px, 64px).
5. **Grid System**: Max width 1280px container, 12 columns, 24px gutters, 24px outer margins.
6. **Shadow Tokens**:
   - Small: `0px 1px 2px rgba(0, 0, 0, 0.05)`
   - Medium: `0px 4px 12px rgba(0, 0, 0, 0.08)`
   - Large: `0px 12px 24px rgba(0, 0, 0, 0.12)`
7. **Border Radius Tokens**:
   - Small: `4px` (`rounded-sm` / `rounded-[4px]`)
   - Medium: `8px` (`rounded-md` / `rounded-[8px]`)
   - Large: `12px` (`rounded-lg` / `rounded-[12px]`)
   - Full: `9999px` (`rounded-full`)
8. **UI Components & Elements to Implement**:
   - `Button`: Primary, Secondary, Text variants across Default, Hover, Outline, Disabled states.
   - `Chip / Category Filter`: Interactive pills with `+` icon, hover states.
   - `BiasMeter`: Visual bar with Left (Red `#B42318`), Center (Grey `#E5E7EB`), Right (Blue `#1D4ED8`) percentages and scale ticks (`0%`, `50%`, `100%`).
   - `ArticleCard`: Spec-compliant sample news card displaying image, category metadata, title, snippet, bias meter, and meta footer (timestamp, read time, bookmark button).
   - `DesignSystemShowcase` / `App Header & Footer`: Display brand elements ("biasly News - Balanced news coverage, powered by AI.") and design token showcase gallery on `app/page.tsx` for immediate visual feedback and testing.

## Files Likely to Change
- `app/globals.css`: Define design system CSS variables, custom utilities, theme tokens.
- `app/layout.tsx`: Import and apply Google `Poppins` font variables, set root container background and styles.
- `components/ui/button.tsx`: Reusable Button component matching UI design specs.
- `components/ui/chip.tsx`: Category chip component.
- `components/ui/bias-meter.tsx`: Custom Bias Meter component with scale ticks and segments.
- `components/ui/article-card.tsx`: News card component matching UI spec reference.
- `app/page.tsx`: Page layout showcasing the design system and UI reference elements.

## Implementation Requirements
- Use Tailwind CSS v4 `@theme` configuration and standard CSS variables in `app/globals.css`.
- Ensure clean TypeScript interfaces for all UI components.
- Install `lucide-react` for line-style icons with 2px stroke as shown in the UI reference.
- Follow pixel-perfect specifications for typography, spacing, shadows, colors, and radii.
- Ensure full responsiveness across screen sizes down to mobile, constrained by max-width 1280px container.

## Security Requirements
- Ensure UI components are pure presentation components without exposing client secrets or unvalidated inputs.

## Visual Interpretation & Pixel-Perfect Expectations
- **Typography**: Poppins geometric sans-serif font across headings and body text.
- **Colors**: Strict adherence to exact hex codes (`#0D0D0F`, `#6B7280`, `#F6F6F6`, `#B42318`, `#E5E7EB`, `#1D4ED8`).
- **Layout & Spacing**: Clean grid alignment with 24px gutters, max-width 1280px, consistent 4px scale spacing.
- **Shadows & Elevation**: Subtle 0.05, 0.08, and 0.12 opacity shadows for soft cards and dropdowns.
- **Header / Footer Branding**: Dark bar `#0D0D0F` with white logo and tagline "Stay consistent. Stay unbiased."

## Acceptance Criteria
- Font rendered as Poppins for all text elements.
- All colors, typography, buttons, chips, bias meters, shadows, and card elements strictly match the UI reference specifications.
- `npm run build` succeeds without TypeScript or CSS errors.
- Visual demonstration page on `app/page.tsx` renders all design system components cleanly.

## Checks to Run
- `npm run build`
- `npm run lint`

## Exact Manual Test Steps
1. Run `npm run dev` to start the Next.js development server.
2. Open `http://localhost:3000` in the browser.
3. Verify Poppins font is loaded and applied to headings and body text.
4. Verify Primary, Secondary, and Text button states (Default, Hover, Outline, Disabled).
5. Verify Category chips with interactive hover state.
6. Verify Bias Meter displaying left (red), center (grey), right (blue) percentages with 0%, 50%, 100% ticks.
7. Verify Article Card matching the reference design layout (Trump Iran peace proposal sample card).
8. Verify light/dark theme aesthetics and 1280px grid centering.
