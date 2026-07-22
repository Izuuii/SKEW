# Clerk Authentication Architecture & Implementation Details

This document explains the technical architecture, middleware behavior, route protection flow, and UI wiring for the **Clerk Authentication** integration in **biasly**.

---

## Architectural Flow

```
                                  +-------------------+
                                  |   Client Request  |
                                  +---------+---------+
                                            |
                                            v
                                  +-------------------+
                                  |   middleware.ts   |  <-- Intercepts requests
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

## File-by-File Detailed Breakdown

### 1. [`package.json`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/package.json) *(Modified)*
- **Change**: Added `@clerk/nextjs` (v7) dependency targeting Next.js 16 App Router.
- **Purpose**: Provides standard Clerk components (`ClerkProvider`, `Show`, `SignIn`, `SignUp`, `UserButton`, `SignInButton`) and server utilities (`clerkMiddleware`, `createRouteMatcher`, `auth`).

### 2. [`.env.local`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/.env.local) *(Modified)*
- **Change**: Configured Clerk environment keys and redirect route URLs:
  ```env
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  ```
- **Purpose**: Specifies public/secret API keys and configures `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` so Clerk redirects users to dedicated full-page auth routes.

### 3. [`app/layout.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/layout.tsx) *(Modified)*
- **Change**: Wrapped `{children}` inside `<body>` with `<ClerkProvider>`:
  ```tsx
  <body className="min-h-full flex flex-col bg-[#F0F0F0] text-[#0D0D0F] font-sans">
    <ClerkProvider>
      {children}
    </ClerkProvider>
  </body>
  ```
- **Purpose**: Establishes global Clerk authentication context across the entire application, allowing client hooks (`useAuth`, `useUser`) and auth components (`Show`, `UserButton`) to consume session state without hydration errors.

### 4. [`middleware.ts`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/middleware.ts) *(Generated)*
- **Change**: Created edge middleware to protect `/article/[id]` routes:
  ```typescript
  import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

  // Guard /article/[id] route — requires user authentication
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
- **Purpose**: Intercepts requests on the server before page rendering. If a signed-out user attempts to visit `/article/1`, `auth.protect()` halts execution and returns a `307 Temporary Redirect` to `/sign-in?redirect_url=...`.

### 5. [`app/sign-in/[[...sign-in]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/sign-in/%5B%5B...sign-in%5D%5D/page.tsx) *(Generated)*
- **Change**: Implemented full-page sign-in route with optional catch-all parameter:
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
- **Purpose**: Renders Clerk's `<SignIn />` component on a dedicated page. The catch-all route (`[[...sign-in]]`) allows sub-paths like `/sign-in/sso` or `/sign-in/factor-two` to render within the same component structure.

### 6. [`app/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/sign-up/%5B%5B...sign-up%5D%5D/page.tsx) *(Generated)*
- **Change**: Implemented full-page sign-up route:
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
- **Purpose**: Renders Clerk's `<SignUp />` component matching the biasly design system (`#F0F0F0` background, centered card layout).

### 7. [`app/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/page.tsx) *(Modified)*
- **Change**:
  1. Wrapped each `ArticleCard` in `<Link href={`/article/${article.id}`}>`:
     ```tsx
     <Link key={article.id} href={`/article/${article.id}`} className="block">
       <ArticleCard ... />
     </Link>
     ```
  2. Updated the top header navigation right actions using Clerk's `<Show>` component:
     ```tsx
     <Show when="signed-out">
       <Link href="/sign-up">
         <Button variant="primary">Subscribe</Button>
       </Link>
       <Link href="/sign-in">
         <Button variant="secondary" outline>Login</Button>
       </Link>
     </Show>
     <Show when="signed-in">
       <UserButton />
     </Show>
     ```
- **Purpose**: Home feed (`/`) remains public for browsing, but clicking an article navigates to `/article/[id]` (which middleware protects). Header actions switch dynamically based on user session state.

### 8. [`app/article/[id]/page.tsx`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/app/article/%5Bid%5D/page.tsx) *(Modified)*
- **Change**: Updated header navigation buttons to match `app/page.tsx` (`<Show when="signed-out">` with `<Link href="/sign-in">` and `<Link href="/sign-up">`, and `<Show when="signed-in">` with `<UserButton />`).
- **Purpose**: Ensures consistent header authentication controls across both home and detail pages.

### 9. [`prompts/clerk-authentication.md`](file:///c:/Users/Dan%20Denver/Documents/jsm-skew/prompts/clerk-authentication.md) *(Generated)*
- **Purpose**: Detailed prompt document outlining goal, inspected files, decision log, security rules, acceptance criteria, and manual test steps per `AGENTS.md`.

---

## How Protected Routes Work

1. `createRouteMatcher(["/article/(.*)"])` matches any URL starting with `/article/`.
2. When a user clicks an article card on `/`, Next.js routes to `/article/1`.
3. `middleware.ts` runs on the server before page rendering.
4. `middleware.ts` evaluates `isProtectedRoute(req)`.
5. If signed out:
   - `auth.protect()` issues a `307` server redirect to `/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Farticle%2F1`.
6. Once signed in on `/sign-in`, Clerk automatically redirects the user back to `/article/1`.

---

## How Login, Subscribe, and UserButton are Wired into the UI

- **Conditional Rendering (`<Show>`)**:
  - `<Show when="signed-out">`: Renders only when no user session is active.
  - `<Show when="signed-in">`: Renders only when a valid user session is active.
- **Full Page Navigation**:
  - **Login** button is wrapped in `<Link href="/sign-in">`, navigating directly to the dedicated full-page `/sign-in` route.
  - **Subscribe** button is wrapped in `<Link href="/sign-up">`, navigating directly to the dedicated full-page `/sign-up` route.
- **User Avatar (`<UserButton />`)**:
  - When signed in, `<UserButton />` displays the user's avatar icon, profile modal trigger, and sign-out action button.
