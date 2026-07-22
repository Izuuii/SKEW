# Implementation Prompt: Clerk Authentication Implementation

## Goal
Implement Clerk authentication for **biasly** according to project requirements and `@.agents/skills/clerk`. Anyone can browse the home feed (`/`), but opening a full article analysis (`/article/[id]`) requires signing in. Middleware uses `createRouteMatcher` to guard `/article/(.*)` and redirects signed-out users to `/sign-in`.

## Skills Read & References
- `AGENTS.md` (Project Rules & Guidelines - Sections 1, 2, 3, 4, 6)
- `.agents/skills/clerk/SKILL.md` (Clerk Skills Router)
- `.agents/skills/clerk-setup/SKILL.md` (Adding Clerk, framework detection, ClerkProvider placement, environment setup)
- `.agents/skills/clerk-nextjs-patterns/SKILL.md` (Next.js server/client auth patterns, `clerkMiddleware()`, `createRouteMatcher()`, `auth.protect()`, `<SignedIn>`, `<SignedOut>`, `<UserButton>`)

## Existing Code Inspected
- `package.json`: Contains Next.js 16.2.10 and React 19.2.4 dependencies. `@clerk/nextjs` needs to be installed.
- `app/layout.tsx`: Root layout with Google Poppins font. Requires `<ClerkProvider>` wrapping `<body>` contents.
- `app/page.tsx`: Skew Home page UI containing article cards and header navigation with a `Login` button.
- `app/article/[id]/page.tsx`: News Details page UI displaying the full article analysis and header navigation.
- `.env.local`: Environment configuration where Clerk keys and route variables are set.

## Decisions & Assumptions
1. **SDK Package**: `@clerk/nextjs` (Current SDK v6/v7 targeting Next.js 16 App Router).
2. **Access Control Policy**:
   - **Home Feed (`/`)**: Publicly accessible to all users (signed-in or signed-out).
   - **Full Article Analysis (`/article/[id]`)**: Protected route requiring authentication.
3. **Middleware Configuration (`middleware.ts` or `proxy.ts`)**:
   - Use `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server`.
   - Define `isProtectedRoute = createRouteMatcher(['/article/(.*)'])`.
   - In `clerkMiddleware`, check `if (isProtectedRoute(req)) await auth.protect()` to automatically redirect signed-out users attempting to view full article analysis to `/sign-in`.
4. **Provider Placement**:
   - Wrap `<body>` content in `app/layout.tsx` with `<ClerkProvider>`.
5. **Dedicated Auth Pages**:
   - `app/sign-in/[[...sign-in]]/page.tsx`: Renders Clerk `<SignIn path="/sign-in" />` centered on screen with biasly styling.
   - `app/sign-up/[[...sign-up]]/page.tsx`: Renders Clerk `<SignUp path="/sign-up" />` centered on screen with biasly styling.
6. **Header Navigation Integration**:
   - In `app/page.tsx` and `app/article/[id]/page.tsx`:
     - When Signed Out: Display a `Login` button linking to `/sign-in` (or using `<SignInButton mode="modal">`).
     - When Signed In: Display `<SignedIn><UserButton showName={false} /></SignedIn>`.
7. **Environment Variables**:
   - Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` in `.env.local`.

## Files Likely to Change
- `prompts/clerk-authentication.md` [MODIFY]
- `package.json` [MODIFY] (Install `@clerk/nextjs`)
- `.env.local` [MODIFY] (Add Clerk environment keys)
- `middleware.ts` or `proxy.ts` [NEW] (Add `clerkMiddleware()` with `createRouteMatcher(['/article/(.*)'])`)
- `app/layout.tsx` [MODIFY] (Wrap body in `<ClerkProvider>`)
- `app/sign-in/[[...sign-in]]/page.tsx` [NEW] (Dedicated sign-in page)
- `app/sign-up/[[...sign-up]]/page.tsx` [NEW] (Dedicated sign-up page)
- `app/page.tsx` [MODIFY] (Update header with Clerk auth components)
- `app/article/[id]/page.tsx` [MODIFY] (Update header with Clerk auth components)

## Implementation Requirements
1. Install `@clerk/nextjs`.
2. Set up Clerk environment variables in `.env.local`.
3. Wrap `app/layout.tsx` inside `<body>` with `<ClerkProvider>`.
4. Create `middleware.ts` (or `proxy.ts`) using `clerkMiddleware()` and `createRouteMatcher`:
   ```typescript
   import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

   const isProtectedRoute = createRouteMatcher(['/article/(.*)']);

   export default clerkMiddleware(async (auth, req) => {
     if (isProtectedRoute(req)) {
       await auth.protect();
     }
   });

   export const config = {
     matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
   };
   ```
5. Create `app/sign-in/[[...sign-in]]/page.tsx` rendering `<SignIn path="/sign-in" />`.
6. Create `app/sign-up/[[...sign-up]]/page.tsx` rendering `<SignUp path="/sign-up" />`.
7. Update `app/page.tsx` and `app/article/[id]/page.tsx` headers with `<SignedOut>` (showing Login button) and `<SignedIn>` (showing `<UserButton />`).

## Security Requirements
- Keep `CLERK_SECRET_KEY` safe in `.env.local` and never expose it to client code.
- Enforce server-side middleware route guarding for `/article/[id]` so unauthorized requests are caught before rendering article details.

## Acceptance Criteria
- Anyone can browse the home feed (`/`) without signing in.
- Clicking an article card on `/` or navigating directly to `/article/1` while signed out automatically redirects the user to `/sign-in`.
- After logging in successfully on `/sign-in`, the user is redirected back to the article page or home feed.
- Signed-in users can view full article analysis pages and see their `<UserButton />` avatar in the header.
- Signing out from `<UserButton />` revokes session access and redirects back to `/`.
- `npm run build` passes cleanly.

## Checks to Run
- `npm run build`
- `npm run lint`

## Exact Manual Test Steps Expected After Implementation
1. Run `npm run dev`.
2. Open `http://localhost:3000` while signed out — verify the home feed loads cleanly.
3. Click on any article card (e.g. `Trump Sends Iran Revised Peace Proposal...`) to open `/article/1`.
4. Verify that middleware intercepts the request and redirects to `http://localhost:3000/sign-in`.
5. Sign in (or register) using Clerk credentials.
6. Verify that after authentication, you can access `http://localhost:3000/article/1` and view full article analysis.
7. Verify `<UserButton />` avatar is displayed in the header on both `/` and `/article/1`.
8. Click `<UserButton />` and sign out — verify navigation returns to `/` and access to `/article/1` is restricted again.
