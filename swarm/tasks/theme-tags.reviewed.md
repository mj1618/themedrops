# Theme Tags System

Add user-defined tags to themes so users can categorize and discover themes more easily. Tags like "dark", "minimalist", "vibrant", "retro", "pastel", "neon", etc. should be attachable to themes by their authors, and browsable/filterable in the gallery.

## Tasks

### Schema & Backend

- [ ] Add `tags` field to the `themes` table in the Convex schema as `v.optional(v.array(v.string()))` — an optional array of lowercase, trimmed tag strings
- [ ] Add a `tags` table with fields: `name` (string, unique tag name), `count` (number, how many public themes use this tag) — this denormalized table enables fast "browse by tag" and "popular tags" queries
- [ ] Add index on `tags` table: `by_name` on `["name"]` and `by_count` on `["count"]`
- [ ] Create `convex/tags.ts` with the following queries/mutations:
  - [ ] `listPopular` query — returns the top 30 tags sorted by count descending
  - [ ] `search` query — takes a `query` string arg, returns tags whose name starts with the query (for autocomplete), limit 10
  - [ ] `getThemesByTag` query — takes a `tag` string, returns paginated public themes that include this tag (filter on the `tags` field of themes table)
- [ ] Update the existing theme create/update mutations to:
  - [ ] Validate tags: max 5 tags per theme, each tag max 24 chars, lowercase alphanumeric + hyphens only
  - [ ] On create: increment the `count` for each tag in the `tags` table (insert tag row if it doesn't exist)
  - [ ] On update: diff old vs new tags, increment counts for added tags, decrement counts for removed tags
  - [ ] On delete: decrement counts for all tags on the theme
- [ ] Update the seed data to include tags on the system themes (e.g., "dark", "light", "warm", "cool", "monochrome", "pastel", "vibrant", "minimal", "bold")

### Theme Create/Edit UI

- [ ] Add a tag input component to the theme create and edit forms:
  - [ ] Text input with autocomplete dropdown that calls the `search` query as the user types
  - [ ] Tags display as removable pills/chips below the input
  - [ ] Enforce the 5-tag limit in the UI with a message when limit is reached
  - [ ] Show existing tags on edit form pre-populated

### Gallery / Discovery UI

- [ ] Add a "Popular Tags" section to the gallery/homepage — a horizontal row of clickable tag pills above the theme grid
  - [ ] Clicking a tag navigates to `/tags/$tagName` or filters the gallery to show only themes with that tag
- [ ] Create a `/tags/$tagName` route that shows:
  - [ ] The tag name as the page title
  - [ ] A grid of theme cards for themes with this tag (reuse existing theme card component)
  - [ ] Pagination / load-more
- [ ] Add a `/tags` index route that shows all popular tags as a cloud or grid with their theme counts

### Theme Detail Page

- [ ] Display the theme's tags as clickable pills on the theme detail page (link to `/tags/$tagName`)

## Validation & Edge Cases

- [ ] Tags are always stored lowercase and trimmed
- [ ] Duplicate tags on a single theme are silently deduplicated
- [ ] Empty string tags are rejected
- [ ] Tag count never goes below 0 (clamp to 0 on decrement)
- [ ] Deleting a theme properly decrements all its tag counts

## Design Notes

- Tag pills should use the site's accent/muted colors and be compact (small rounded badges)
- The popular tags row on the homepage should be horizontally scrollable on mobile
- Autocomplete dropdown should appear inline below the tag input, not as a modal

## Completion Notes

All tasks implemented:

- **Schema**: Added `tags` field to `themes` table and new `tags` table with `by_name` and `by_count` indexes
- **Backend**: Created `convex/tags.ts` with `listPopular`, `search`, `getThemesByTag` queries and tag count helper functions
- **Mutations**: Updated `create`, `update`, and `remove` mutations in `themes.ts` with tag validation (max 5, 24 chars, alphanumeric+hyphens), deduplication, and denormalized count management
- **Seed data**: Added tag mappings for all 40 seed themes, plus a `backfillTags` migration mutation
- **ThemeForm**: Added `TagInput` component with autocomplete dropdown, removable pill chips, 5-tag limit enforcement
- **Homepage**: Added horizontally scrollable "Popular Tags" section with counts and link to `/tags`
- **Routes**: Created `/tags` index page (grid of all tags with counts) and `/tags/$tagName` page (paginated theme grid filtered by tag)
- **Detail page**: Tags displayed as clickable pills linking to `/tags/$tagName`
- **Validation**: Tags normalized to lowercase, deduplicated, empty strings rejected, counts clamped to 0

## Review Notes

Reviewed by: Claude (automated review)

### Issues Found & Fixed

1. **Bug: `getThemesByTag` pagination was broken** (`convex/tags.ts`)
   - The query used Convex `.paginate()` then filtered the paginated page client-side for the tag. This caused pages to return fewer results than requested (or empty pages) while the cursor advanced past non-matching themes.
   - **Fix**: Replaced with a scan-and-manual-paginate approach — fetch a batch of themes, filter for the tag, then manually slice for the requested page. This gives consistent page sizes.

2. **Bug: Tag counts wrong when `isPublic` changes** (`convex/themes.ts`)
   - When a theme's visibility changed (public→private or private→public), the update mutation did not adjust tag counts. A public theme made private kept inflated tag counts; a private theme made public didn't increment counts.
   - **Fix**: Added four-way visibility handling in the update mutation: both-public (diff tags), public→private (decrement old), private→public (increment new), both-private (no-op). Also handles the case where `isPublic` changes but `tags` arg is not provided.

3. **Improvement: `search` query efficiency** (`convex/tags.ts`)
   - The search query fetched 200 tags and filtered client-side. Replaced with index range queries on `by_name` for prefix matching, then sorts by count.

### Verified

- All pages render without errors (homepage, /tags, /tags/$tagName, /create, theme detail)
- TypeScript compiles cleanly with `tsc --noEmit`
- Tag input component renders correctly with autocomplete, pill chips, and limit enforcement
- Popular tags section on homepage conditionally renders when tags exist
- Tag pills on theme detail page link to `/tags/$tagName` correctly
