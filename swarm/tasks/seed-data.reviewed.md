# Add seed data: system user and starter themes

## Context
The PLAN explicitly states: "Seed the site with a system user, and themes under this user." Currently there is no seeding mechanism. When the site deploys, the homepage feed will be empty — there are no themes, no users, nothing to browse. For an MVP, the site needs to launch with curated content so visitors immediately see what the product is about.

The backend CRUD is fully in place (`themes.ts`, `users.ts`, `stars.ts`, `comments.ts`) and the public API works, but all tables are empty.

## Tasks

### 1. Create a seed mutation in `app/convex/themes.ts` (or a new `app/convex/seed.ts`)
- Add a mutation `seedData` that:
  - Creates a system user (e.g. username: `"themedrops"`, displayName: `"ThemeDrops"`) with a fixed `tokenIdentifier` like `"system:themedrops"` — only if it doesn't already exist (idempotent)
  - Creates 8–12 starter themes under this system user, each with:
    - A unique descriptive name (e.g. "Midnight", "Sunset Glow", "Ocean Breeze", "Forest Canopy", "Nordic Frost", "Warm Ember", "Lavender Dreams", "Cyber Neon", "Minimalist Mono", "Desert Sand")
    - A slug auto-generated from the name
    - `isPublic: true`
    - A complete `colors` object with all 6 color slots filled (background, foreground, primary, secondary, accent, muted) using valid hex values that form a cohesive palette
    - A `fonts` object with at least `sans` and `mono` filled in with real Google Font names
    - A short description explaining the vibe/use-case of the theme
    - `starCount: 0`
  - Is idempotent: if themes with these slugs already exist, skip them
- The themes should be genuinely good — diverse color palettes spanning dark themes, light themes, vibrant themes, and muted themes. They represent the quality bar for the site.

### 2. Make the seed callable
- The seed mutation should be runnable via `npx convex run seed:seedData` (or `themes:seedData` depending on file placement)
- Alternatively, if Convex supports an init function or similar, wire it up there
- Document in the task completion notes how to run the seed

### 3. Verify the seed works
- Run `npx convex dev --once` to confirm the function type-checks
- Run the seed mutation and verify themes appear in the dashboard or via the `/api/themes` HTTP endpoint

## Acceptance criteria
- A system user exists in the `users` table after seeding
- 8+ public themes exist with complete color palettes and font selections
- The seed is idempotent — running it twice doesn't create duplicates
- All functions type-check: `npx convex dev --typecheck=enable --once`
- Themes are visible via the `themes.list` query and `/api/themes` HTTP endpoint

## Completion notes

**Created:** `app/convex/seed.ts`

**What was done:**
- Created an `internalMutation` called `seedData` in a new `app/convex/seed.ts` file
- The mutation creates a system user (`username: "themedrops"`, `displayName: "ThemeDrops"`, `tokenIdentifier: "system:themedrops"`) if one doesn't already exist
- Creates 10 starter themes with diverse, cohesive color palettes (dark: Midnight, Forest Canopy, Warm Ember, Cyber Neon; light: Sunset Glow, Ocean Breeze, Nordic Frost, Lavender Dreams, Minimalist Mono, Desert Sand)
- Each theme has all 6 color slots filled, `sans` and `mono` fonts using real Google Font names, a description, and `isPublic: true`
- Idempotent: checks for existing user by `tokenIdentifier` and existing themes by slug before inserting
- Type-checks pass: `npx convex dev --typecheck=enable --once` succeeds

**How to run the seed:**
```bash
cd app
npx convex run seed:seedData
```

## Review notes

**Reviewed by:** Claude (automated review)
**Status:** Approved — no issues found

**What was checked:**
- Schema compatibility: all seed fields match `schema.ts` definitions (colors, fonts, required/optional fields)
- Idempotency: correctly guards on `tokenIdentifier` for user and `slug` for themes
- 10 themes meet the 8+ requirement with good diversity (4 dark, 6 light/vibrant)
- Color palettes are cohesive and use valid hex values
- Font names are real Google Fonts
- `generateSlug` logic matches the implementation in `themes.ts`
- `internalMutation` is appropriate — keeps seed out of public API while remaining CLI-callable
- Type check passes: `npx convex dev --typecheck=enable --once` succeeds
- API compatibility verified: `themeApi.ts` queries work with the seeded data structure
