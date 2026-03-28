# Add homepage sort tabs and recent activity feed

## Context
The PLAN.md explicitly states: "The home page should be some sort of feed that includes a mix of popular/new themes, and also people commenting on the themes." Currently the homepage is a single grid sorted by star count (descending) with no way to change the sort order and no visibility into community activity like recent comments or newly added themes. For an MVP, users need to discover themes by different criteria and see that the site has active community engagement.

## Scope
Add sort/filter tabs to the homepage gallery (Popular, Newest, Recently Commented) and a compact "Recent Activity" section below the hero that shows a timeline of recent comments and new theme additions. This requires new Convex queries and UI updates to the homepage.

## Tasks

### 1. Add a Convex query for newest themes (by creation time)
- **File:** `app/convex/themes.ts`
- Add a new paginated query `listNewest` that returns public themes ordered by `_creationTime` descending
- This needs an index on `isPublic` + `_creationTime` — add `by_public_and_creation_time` index to the themes table in `schema.ts`
- The query should use the same pagination pattern as the existing `list` query

### 2. Add a Convex query for recently commented themes
- **File:** `app/convex/themes.ts` or `app/convex/comments.ts`
- Add a query `listRecentlyCommented` that returns public themes that have received comments recently
- Approach: query comments ordered by `_creationTime` desc, take the last N, then look up the distinct themes they belong to and return those themes
- Return up to 20 distinct themes, skip private themes
- This does NOT need pagination for MVP — just a flat list of the top 20

### 3. Add a Convex query for recent activity feed
- **File:** `app/convex/comments.ts`
- Add a query `listRecent` that returns the most recent 10-15 comments across all public themes
- Each comment should include: comment body (truncated), author info (username, displayName, avatarUrl), theme info (name, slug), and creation time
- Filter out comments on private themes
- This powers the "Recent Activity" sidebar/section on the homepage

### 4. Add sort tabs UI to the homepage gallery
- **File:** `app/src/app/page.tsx`
- Add a tab bar above the theme grid with three options: "Popular" (default), "Newest", "Recently Active"
- "Popular" uses the existing `themes.list` query (sorted by stars)
- "Newest" uses the new `themes.listNewest` query
- "Recently Active" uses the new `themes.listRecentlyCommented` query
- Active tab should have a visual indicator (underline, bold, or background highlight)
- Tab selection should be preserved in URL search params (e.g. `?sort=newest`) so it's linkable
- When searching, hide the tabs (search has its own results)
- Each tab should support "Load more" pagination where applicable

### 5. Add "Recent Activity" section to the homepage
- **File:** `app/src/app/page.tsx`
- Add a compact section below the hero (above the gallery grid) or as a horizontal scrollable strip
- Show recent comments as small cards: "[user avatar] [username] commented on [theme name]: [truncated comment]" with a relative timestamp
- Each activity card should link to the theme detail page
- Keep it visually lightweight — this is context, not the main content
- Show a "No recent activity" placeholder if there are no comments yet
- Limit to 8-10 items, no pagination needed
- Style should be consistent with the existing site design (gray-50 bg, subtle borders, small text)

### 6. Update schema with needed indexes
- **File:** `app/convex/schema.ts`
- Add index `by_public_and_creation_time` on themes table: `["isPublic", "_creationTime"]` (if Convex supports indexing on `_creationTime` — check guidelines; if not, add a `createdAt` field)
- Verify the comments `by_theme` index is sufficient for the recent comments query, or add a general creation-time index if needed

## Acceptance criteria
- [ ] Homepage has visible sort tabs: Popular, Newest, Recently Active
- [ ] "Popular" tab shows themes sorted by star count (existing behavior)
- [ ] "Newest" tab shows themes sorted by creation time, newest first
- [ ] "Recently Active" tab shows themes that have recent comments
- [ ] Each tab supports pagination ("Load more")
- [ ] Tab selection is reflected in the URL (`?sort=popular|newest|active`)
- [ ] A "Recent Activity" section shows the latest comments across all themes
- [ ] Activity items show commenter info, theme name, truncated comment, and relative time
- [ ] Activity items link to the theme detail page
- [ ] Search mode hides tabs and activity (existing search behavior preserved)
- [ ] No regressions to existing homepage functionality
- [ ] Works on mobile and desktop

## Technical notes
- Convex uses `_creationTime` as a system field on all documents — check `convex/_generated/ai/guidelines.md` for whether it can be used in indexes
- If `_creationTime` cannot be indexed, add an explicit `createdAt: v.number()` field and populate it with `Date.now()` in mutations
- Use `usePaginatedQuery` for tabs that need pagination, `useQuery` for the activity feed
- For relative timestamps, use a simple helper (e.g. "2m ago", "1h ago", "3d ago") — no need for a library
- Tailwind v4 is in use
- Next.js app router — the page is already a client component (`"use client"`)
- The `useSearchParams` hook from Next.js can be used to read/write the `?sort=` param
- Keep the existing `usePaginatedQuery` for "Popular" tab and add conditional query switching based on active tab
