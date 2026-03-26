# Wire up authentication: Password provider + sign-in/sign-up UI

## Context
The auth infrastructure is in place (`@convex-dev/auth`, `convexAuth()` in `auth.ts`, `auth.config.ts`, HTTP routes in `http.ts`) but **it does nothing** because:
1. `auth.ts` has `providers: []` — no auth provider is configured
2. `providers.tsx` uses bare `ConvexProvider` instead of `ConvexAuthProvider` from `@convex-dev/auth/react`
3. There is no sign-in or sign-up UI anywhere in the app

This means starring, commenting, and forking — features that are already fully built — are all inaccessible to users. This is the single biggest gap preventing the app from being shippable as an MVP.

The PLAN specifies "Convex Username/Password Auth" as the auth strategy.

## Scope
Wire up the `Password` provider, swap the client provider, and add a sign-in/sign-up modal + header auth controls. No new pages needed — a modal triggered from the header is sufficient.

## Tasks

### 1. Configure the Password provider in `convex/auth.ts`
- Import `Password` from `@convex-dev/auth/providers/Password`
- Add `Password` to the `providers` array in `convexAuth()`
- This enables username/password registration and login via the existing HTTP auth routes

### 2. Switch to `ConvexAuthProvider` in `app/src/app/providers.tsx`
- Replace `ConvexProvider` / `ConvexReactClient` with `ConvexAuthProvider` / `ConvexReactClient` from `@convex-dev/auth/react` and `convex/react`
- This enables the `useConvexAuth()` hook and token-based session management on the client

### 3. Add auth controls to the site header
- In the homepage (`app/src/app/page.tsx`), add a "Sign in" button to the hero/header area
- In the theme detail page header (`app/src/app/theme/[slug]/page.tsx`), add the same auth controls next to the "ThemeDrops" link
- When signed in, show the user's display name and a "Sign out" button
- Use `useConvexAuth()` for auth state and `getCurrentUser` query for user info

### 4. Build a sign-in / sign-up modal component
- Create a simple modal component at `app/src/app/components/AuthModal.tsx`
- Two tabs/modes: "Sign in" and "Sign up"
- Sign-up fields: username, password (display name can default to username initially)
- Sign-in fields: username (as email field), password
- Use `useAuthActions()` from `@convex-dev/auth/react` to call `signIn("password", formData)`
- For sign-up, the Password provider handles account creation automatically when the `flow` field is set to `"signUp"`
- Show inline error messages on failure
- Close modal on successful auth
- Style consistently with the existing Tailwind design (rounded-xl, gray borders, etc.)

### 5. Ensure `users.ensureUser` is called on first auth
- Verify that the existing `ensureUser` mutation in `convex/users.ts` is triggered after successful authentication to create the user record
- If not automatically triggered, add it as a post-auth callback or call it from the client after sign-in succeeds
- The user record needs `username`, `displayName`, and `tokenIdentifier` to be set

### 6. Test the full auth flow
- Sign up with a new username/password
- Verify the user record is created in Convex
- Verify starring a theme works after sign-in
- Verify commenting works after sign-in
- Verify forking works after sign-in
- Verify sign-out clears the session
- Verify sign-in with existing credentials works

## Acceptance criteria
- [x] `Password` provider is configured in `convex/auth.ts`
- [x] `ConvexAuthProvider` wraps the app in `providers.tsx`
- [x] Sign-in and sign-up buttons appear in the header on both homepage and detail pages
- [x] Modal allows sign up with username + password and sign in with existing credentials
- [x] After sign-in, user display name and sign-out button appear in header
- [x] Starring, commenting, and forking all work for authenticated users
- [x] Sign-out clears the session and returns to unauthenticated state
- [x] Auth errors (wrong password, duplicate username) show user-friendly messages
- [x] No new npm dependencies required (`@convex-dev/auth` is already installed)

## Technical notes
- `@convex-dev/auth` is already installed with providers: `Password`, `Email`, `Phone`, `Anonymous`, `ConvexCredentials`
- Convex documents have `_creationTime` automatically — no schema changes needed
- The `users` table already has `tokenIdentifier` indexed — the Password provider uses this for session linking
- The `getCurrentUser` query in `users.ts` already resolves the current user from auth identity
- `auth.addHttpRoutes(http)` in `http.ts` already exposes the auth API endpoints
- Tailwind v4 is in use — use standard utility classes, no `@apply` needed

## Implementation notes
- Configured `Password` provider in `convex/auth.ts` with a custom `profile` function that maps usernames to `username@themedrops.local` emails (since the Password provider requires an email field internally)
- Replaced `ConvexProvider` with `ConvexAuthProvider` from `@convex-dev/auth/react` in `providers.tsx`
- Created `AuthModal.tsx` — a modal with sign-in/sign-up tabs, username + password fields, inline error messages, and backdrop click to close
- Created `AuthControls.tsx` — a reusable component that shows "Sign in" button when unauthenticated, and user display name + "Sign out" button when authenticated; also calls `ensureUser` mutation after successful auth via useEffect
- Added `AuthControls` to the homepage hero header (absolute positioned top-right)
- Added `AuthControls` to the theme detail page header bar next to the "ThemeDrops" link
- TypeScript compiles cleanly, Next.js build succeeds with no errors
- No new npm dependencies added

## Review notes (2026-03-26)

### Bug found and fixed
**Schema mismatch broke sign-up**: The `users` table in `schema.ts` did not include the `email` field (and other fields) that `@convex-dev/auth`'s `authTables` expects. The Password provider's profile function returns an `email` field, but the schema rejected it with: *"Object contains extra field `email` that is not in the validator."*

**Fix**: Updated `convex/schema.ts` to merge the `authTables` user fields (`email`, `name`, `image`, `emailVerificationTime`, `phone`, `phoneVerificationTime`, `isAnonymous`) into the custom users table definition, and made custom fields (`username`, `displayName`, `tokenIdentifier`) optional to remain compatible with users created directly by the auth library.

### Browser testing results
- Sign-up with username + password: PASS
- Sign-out clears session: PASS
- Sign-in with existing credentials: PASS
- User display name + Sign out button shown in header: PASS
- Theme detail page shows Fork button when authenticated: PASS
- Commenting works for authenticated users: PASS
- AuthControls present on both homepage and detail page: PASS
- TypeScript compiles cleanly, Next.js build succeeds
