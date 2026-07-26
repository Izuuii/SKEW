# Clerk Authentication: Feature Breakdown & Technical Explanation

> **Related**: [[Home]] → [[clerk-authentication-guide]]
> **See also**: [[clerk-authentication-architecture]] for the architecture diagram
> **Protects**: [[ai-analysis-guide]] and [[scraping-pipeline-guide]] API routes via `x-biasly-admin-secret`

This document provides a detailed technical breakdown of every generated and modified file for the **Clerk Authentication** feature in **biasly News**. It covers the edge middleware, full-page sign-in and sign-up catch-all routes, server-side protected route behavior, and UI wiring for authentication components.

---

## Architectural Flow

```
                                  +-------------------+
                                  |   Client Request  |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |   middleware.ts   |  <-- Edge Interceptor
                                  | (auth.protect())  |      Guards /article/[id]
                                  +----+---------+----+
                                       |         |
                      Unauthenticated  |         |  Authenticated
                      (Redirects)      |         |  (Allowed)
                                       v         v
                             +-----------+     +------------------------+
                             | /sign-in  |     | /article/[id] Page     |
                             +-----------+     +------------------------+
```

---

## Summary of Generated & Modified Files

| File                                                                                                                                  | Status    | Core Responsibility                                                      |
| :------------------------------------------------------------------------------------------------------------------------------------ | :-------- | :----------------------------------------------------------------------- |
| [`package.json`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/package.json)                                                       | Modified  | Dependency configuration for `@clerk/nextjs` (v7).                       |
| [`.env.local`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/.env.local)                                                           | Modified  | Clerk API keys and fallback redirect path routing variables.             |
| [`app/layout.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/layout.tsx)                                                   | Modified  | App root provider wrapper `<ClerkProvider>`.                             |
| [`middleware.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/middleware.ts)                                                     | Generated | Edge middleware interceptor & route protection matcher.                  |
| [`app/sign-in/[[...sign-in]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/sign-in/%5B%5B...sign-in%5D%5D/page.tsx) | Generated | Catch-all full-page sign-in route with biasly layout.                    |
| [`app/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/sign-up/%5B%5B...sign-up%5D%5D/page.tsx) | Generated | Catch-all full-page sign-up route with biasly layout.                    |
| [`app/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/page.tsx)                                                       | Modified  | Home feed article route links & dynamic auth header controls (`<Show>`). |
| [`app/article/[id]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/article/%5Bid%5D/page.tsx)                         | Modified  | Detail page header auth controls & protected destination content.        |
| [`prompts/clerk-authentication.md`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/prompts/clerk-authentication.md)                 | Generated | Implementation prompt artifact complying with `AGENTS.md` guidelines.    |

---

## In-Depth Breakdown of Each File & Mechanism

### 1. Root Authentication Context: [`app/layout.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/layout.tsx)
- **Role**: Wraps the entire Next.js component hierarchy in `<ClerkProvider>`.
- **Implementation**:
  ```tsx
  import { ClerkProvider } from "@clerk/nextjs";

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" className={`${poppins.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-[#F0F0F0] text-[#0D0D0F] font-sans">
          <ClerkProvider>
            {children}
          </ClerkProvider>
        </body>
      </html>
    );
  }
  ```
- **Why it matters**: `<ClerkProvider>` initializes session tracking, client-side state hooks (`useAuth`, `useUser`), and enables authentication-aware components (`<Show>`, `<UserButton>`) without causing server/client hydration mismatches.

---

### 2. Edge Middleware & Route Protection: [`middleware.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/middleware.ts)
- **Role**: Evaluates incoming request paths on Next.js Edge runtime before page execution or rendering occurs.
- **Implementation**:
  ```typescript
  import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

  // Matcher for protected article detail pages
  const isProtectedRoute = createRouteMatcher(["/article/(.*)"]);

  export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  });

  export const config = {
    matcher: [
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
      "/(api|trpc)(.*)",
    ],
  };
  ```
- **How Protected Routes Work**:
  1. `createRouteMatcher(["/article/(.*)"])` builds a helper function `isProtectedRoute(req)` that returns `true` for any path under `/article/` (e.g., `/article/1`, `/article/xyz`).
  2. When an HTTP request comes in, `clerkMiddleware` passes `auth` context and `req` object.
  3. If `isProtectedRoute(req)` evaluates to `true`, `await auth.protect()` checks for a valid session token.
  4. If **unauthenticated**, `auth.protect()` automatically halts request processing and sends an HTTP `307 Temporary Redirect` pointing to `/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Farticle%2F1`.
  5. If **authenticated**, the request proceeds to render the requested page component.

---

### 3. Dedicated Sign-In Route: [`app/sign-in/[[...sign-in]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/sign-in/%5B%5B...sign-in%5D%5D/page.tsx)
- **Role**: Serves the full-page Sign-In screen inside Next.js App Router using optional catch-all route syntax (`[[...sign-in]]`).
- **Implementation**:
  ```tsx
  import { SignIn } from "@clerk/nextjs";
  import Link from "next/link";

  export default function SignInPage() {
    return (
      <main className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] flex flex-col items-center justify-center p-4">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 select-none">
            <span className="text-[28px] font-bold tracking-tight text-[#0D0D0F]">biasly</span>
            <span className="text-[28px] font-normal text-[#0D0D0F]">News</span>
          </Link>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Sign in to access full article analyses and sentiment insights
          </p>
        </div>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </main>
    );
  }
  ```
- **Why `[[...sign-in]]` Catch-All is Used**:
  - Clerk handles sub-flows (such as multi-factor authentication, OAuth callbacks, email link verifications, password reset) via sub-paths like `/sign-in/sso` or `/sign-in/factor-two`.
  - Using Next.js catch-all directory `[[...sign-in]]` allows all those sub-paths to load within this exact page layout and component.

---

### 4. Dedicated Sign-Up Route: [`app/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-up/%5B%5B...sign-up%5D%5D/page.tsx)
- **Role**: Serves the full-page Sign-Up registration screen.
- **Implementation**:
  ```tsx
  import { SignUp } from "@clerk/nextjs";
  import Link from "next/link";

  export default function SignUpPage() {
    return (
      <main className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] flex flex-col items-center justify-center p-4">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 select-none">
            <span className="text-[28px] font-bold tracking-tight text-[#0D0D0F]">biasly</span>
            <span className="text-[28px] font-normal text-[#0D0D0F]">News</span>
          </Link>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Create an account to unlock balanced news perspectives
          </p>
        </div>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </main>
    );
  }
  ```
- **Key Props**: `path="/sign-up"`, `routing="path"`, and `signInUrl="/sign-in"`. These tell Clerk to use path-based routing rather than hash-based routing and provide seamless navigation to sign-in.

---

### 5. Home Feed & UI Wiring: [`app/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/page.tsx) & [`app/article/[id]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/article/%5Bid%5D/page.tsx)
- **Role**: Integrates authentication UI elements cleanly into the top header navigation bar.
- **UI Wiring Mechanics (`<Show>`, `SignInButton`, `UserButton`)**:
  ```tsx
  import { Show, UserButton } from "@clerk/nextjs";
  import Link from "next/link";
  import { Button } from "@/components/ui/button";

  {/* Header Right Actions */}
  <div className="flex items-center gap-2 sm:gap-3">
    {/* Rendered only when user is NOT signed in */}
    <Show when="signed-out">
      <Link href="/sign-up">
        <Button variant="primary" className="bg-[#0D0D0F] text-white hover:bg-[#0D0D0F]/90">
          Subscribe
        </Button>
      </Link>
      <Link href="/sign-in">
        <Button variant="secondary" outline className="border border-[#E5E7EB] bg-white text-[#0D0D0F]">
          Login
        </Button>
      </Link>
    </Show>

    {/* Rendered only when user IS signed in */}
    <Show when="signed-in">
      <UserButton />
    </Show>
  </div>
  ```
- **Detailed UI Wire Behavior**:
  1. **`<Show when="signed-out">`**: Evaluates session state. When signed out, it renders the **Subscribe** (sign-up link) and **Login** (sign-in link) buttons.
  2. **Login & Subscribe Links**: Wrapped in standard Next.js `<Link href="/sign-in">` and `<Link href="/sign-up">` tags, navigating to the dedicated auth pages.
  3. **`<Show when="signed-in">`**: When a session exists, the Subscribe and Login buttons are hidden, and Clerk's `<UserButton />` component is rendered instead.
  4. **`<UserButton />`**: Displays the user's profile avatar. Clicking it opens a dropdown modal with profile settings, session management, and a built-in Sign Out button.

---

## Verification & Testing Summary

1. **Unauthenticated Access**:
   - Navigating to `/` displays the news feed with **Subscribe** and **Login** buttons in the header.
   - Clicking an article card (`/article/1`) triggers `middleware.ts`, which redirects to `/sign-in?redirect_url=...`.
2. **Authentication Flow**:
   - Signing in via `/sign-in` completes authentication and immediately redirects back to `/article/1`.
3. **Authenticated Header**:
   - Header displays `<UserButton />` avatar instead of Login/Subscribe buttons.
   - User can freely navigate between `/` and `/article/[id]` routes.
