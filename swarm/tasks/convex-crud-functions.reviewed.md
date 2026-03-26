# Add Convex query and mutation functions for existing schema

## Context
The Convex schema (`app/convex/schema.ts`) defines 4 tables — `users`, `themes`, `stars`, `comments` — with proper indexes, but there are **zero** query or mutation functions. The frontend cannot read or write any data. This is the most fundamental gap blocking the MVP.

Additionally, the frontend layout (`app/src/app/layout.tsx`) does not wrap the app in a `ConvexProvider`, so even once functions exist, hooks like `useQuery`/`useMutation` won't work.

## Tasks

### 1. Wire up ConvexProvider in the root layout
- Wrap the app in `ConvexProvider` (and `ConvexAuthProvider` from `@convex-dev/auth`) in `app/src/app/layout.tsx`
- Create a `providers.tsx` client component if needed (since layout may be a server component)
- Import `NEXT_PUBLIC_CONVEX_URL` from env

### 2. Add `app/convex/themes.ts` — Theme CRUD
- `list` query: list public themes, sorted by star count (use `by_star_count` index), with pagination
- `getBySlug` query: fetch a single theme by slug (use `by_slug` index)
- `getByAuthor` query: fetch all themes by a given author (use `by_author` index)
- `search` query: full-text search on theme name (use `search_name` index)
- `create` mutation: create a new theme (authenticated), auto-generate slug from name
- `update` mutation: update a theme (only by author)
- `remove` mutation: delete a theme (only by author)
- `fork` mutation: duplicate a theme under the current user, setting `forkedFromId`

### 3. Add `app/convex/users.ts` — User functions
- `getByUsername` query: fetch user profile by username (use `by_username` index)
- `getCurrentUser` query: fetch the currently authenticated user (use `by_token` index with auth identity)
- `updateProfile` mutation: update displayName, bio, avatarUrl for current user
- `ensureUser` mutation: called on first login to create a user record if one doesn't exist for the current auth identity

### 4. Add `app/convex/stars.ts` — Star/favorite functions
- `isStarred` query: check if current user has starred a theme (use `by_user_and_theme` index)
- `toggle` mutation: star or unstar a theme, and increment/decrement `starCount` on the theme
- `getStarredThemes` query: list themes starred by a given user

### 5. Add `app/convex/comments.ts` — Comment functions
- `listByTheme` query: list comments for a theme, sorted by creation time (use `by_theme` index)
- `create` mutation: add a comment to a theme (authenticated)
- `remove` mutation: delete a comment (only by author)

## Implementation notes
- All mutations that require auth should use `ctx.auth.getUserIdentity()` and throw if not authenticated
- Use Convex's built-in `_creationTime` for sorting where appropriate
- Keep functions minimal — no over-engineering, just the basics needed for an MVP
- Refer to `app/convex/schema.ts` for exact field names and types
- Slug generation: lowercase, replace spaces with hyphens, strip non-alphanumeric chars

## Acceptance criteria
- `npx convex dev` runs without errors in `app/`
- All query and mutation functions type-check against the existing schema
- ConvexProvider is wired up so frontend components can use `useQuery`/`useMutation`
- Each function handles auth checks where needed

## Completion notes

All tasks completed. Files created/modified:

- **`app/src/app/providers.tsx`** — New client component wrapping the app in `ConvexAuthNextjsProvider` from `@convex-dev/auth/nextjs`
- **`app/src/app/layout.tsx`** — Updated to import and use `ConvexClientProvider`
- **`app/convex/themes.ts`** — 8 functions: `list` (paginated, sorted by stars), `getBySlug`, `getByAuthor`, `search`, `create`, `update`, `remove`, `fork`
- **`app/convex/users.ts`** — 4 functions: `getByUsername`, `getCurrentUser`, `updateProfile`, `ensureUser`
- **`app/convex/stars.ts`** — 3 functions: `isStarred`, `toggle` (with starCount sync), `getStarredThemes`
- **`app/convex/comments.ts`** — 3 functions: `listByTheme`, `create`, `remove`

All functions type-check and deploy successfully via `npx convex dev --typecheck=enable --once`. Auth checks use `ctx.auth.getUserIdentity()` with `tokenIdentifier` lookups. All queries use proper indexes as defined in the schema.

## Review notes

Reviewed all created files against the task requirements, schema, and Convex guidelines. Found and fixed 3 issues:

### Bug fixes applied

1. **`themes.ts` `list` query was exposing private themes** — The query listed all themes regardless of `isPublic`. Added `.filter((q) => q.eq(q.field("isPublic"), true))` to only return public themes. Note: ideally this would use a composite index (e.g. `by_public_and_star_count`) instead of `.filter()`, but adding indexes is a schema change out of scope for this task.

2. **`themes.ts` slug collisions** — `create`, `update`, and `fork` all called `generateSlug()` without checking for existing slugs. Since `getBySlug` uses `.unique()`, duplicate slugs would cause runtime errors. Added `uniqueSlug()` helper that appends `-2`, `-3`, etc. when a slug already exists.

3. **`themes.ts` `remove` left orphaned stars and comments** — Deleting a theme did not clean up associated `stars` and `comments` records. Added cascade deletion for both before deleting the theme.

### Items reviewed and found correct
- All auth checks use `ctx.auth.getUserIdentity()` with `tokenIdentifier` (not `subject`)
- All mutations validate ownership before modifying/deleting
- ConvexProvider wiring in `providers.tsx` and `layout.tsx` is correct
- `users.ts` `ensureUser` correctly derives username from identity fields
- `stars.ts` `toggle` correctly syncs `starCount` with `Math.max(0, ...)` guard
- `comments.ts` functions are clean and correct
- All queries use proper indexes and bounded results (`.take()` or `.paginate()`)
- Type check passes: `npx convex dev --typecheck=enable --once`
