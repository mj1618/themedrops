# Polish theme detail page: API docs, timestamps, and auth UX

## Context
The PLAN.md explicitly says: "The theme details page should make it clear how to call the API for this theme also." Currently, the API section is a single tiny monospace line (`API: /api/themes/{slug}`) with no documentation of query parameters, no example response, and no copy button. Additionally, comments show no timestamps, and non-authenticated users see disabled buttons with no guidance on how to sign in to interact. These are all gaps that hurt the MVP experience on the most important page of the site.

## Scope
Improve the theme detail page (`app/src/app/theme/[slug]/page.tsx`) in three areas: (1) expand the API documentation section, (2) add relative timestamps to comments, and (3) improve the experience for non-authenticated users. No new backend queries or mutations are needed — this is purely frontend polish using data already available.

## Tasks

### 1. Expand the API documentation section on the theme detail page
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Replace the current one-line `API: /api/themes/{slug}` with a proper collapsible "API" section
- Show the full endpoint URL (using the Convex deployment URL + `/api/themes/{slug}`) with a copy-to-clipboard button
- Document the `?format=` query parameter with the four supported values: `hex` (default), `hsl`, `rgb`, `oklch`
- Show a live example JSON response block using the theme's actual color data, formatted nicely with syntax highlighting (just use a `<pre>` with colored spans, no library needed)
- Add a format selector (small tab bar or dropdown) that updates the example response in real-time to show colors in the selected format
- The section should be collapsed by default with a "View API" toggle to keep the page clean
- Use the color conversion logic from `app/convex/lib/colors.ts` — import and reuse the `convertColors` function client-side, or replicate the hex-to-hsl/rgb/oklch conversion in a small client utility
- Style the code block with a dark background (gray-900), monospace font, and a copy button

### 2. Add relative timestamps to comments
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Comments already have `_creationTime` from Convex but it's not displayed
- Add a relative timestamp (e.g., "2m ago", "3h ago", "5d ago") next to each comment author name
- Write a small `timeAgo(timestamp: number): string` helper function inline or in a utils file
- Handle edge cases: "just now" for < 1 minute, "Xm ago", "Xh ago", "Xd ago", and "Mon DD" for > 30 days
- Style as small, muted text (text-xs text-gray-400) to the right of the author name or below it

### 3. Improve non-authenticated user experience
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Currently, the star button is disabled with `opacity-50` when not logged in, but has no sign-in prompt beyond a title attribute
- The fork button is completely hidden when not logged in — show it but disabled with a "Sign in to fork" tooltip or text
- The comment form is hidden when not logged in — show a "Sign in to leave a comment" placeholder instead of nothing
- For the star button, change the title to "Sign in to star" and consider adding a small text label below or a tooltip
- Don't add an auth modal trigger — just make it clear that the user needs to sign in, and rely on the existing AuthControls in the header
- The goal is to show non-authenticated users what they *could* do, encouraging sign-up

### 4. Show fork count on the theme
- **File:** `app/convex/themes.ts` — add a new query `countForks` that counts themes with `forkedFromId` equal to the given theme ID
- **File:** `app/convex/schema.ts` — verify there's an index on `forkedFromId` (add `by_forked_from` index on `["forkedFromId"]` if missing)
- **File:** `app/src/app/theme/[slug]/page.tsx` — display the fork count next to the fork button (e.g., "Fork (3)")
- Only count public forks (filter `isPublic: true`)
- If count is 0, just show "Fork" with no number

## Acceptance criteria
- [ ] API section shows full endpoint URL with copy-to-clipboard button
- [ ] API section documents the `?format=` query parameter with all four options
- [ ] API section shows a live example JSON response using the theme's actual colors
- [ ] Format selector updates the example response in real-time
- [ ] API section is collapsible and collapsed by default
- [ ] Code block has dark styling with monospace font and copy button
- [ ] Every comment shows a relative timestamp (e.g., "2h ago")
- [ ] Timestamps update format based on age (minutes, hours, days, date)
- [ ] Non-authenticated users see a disabled fork button with "Sign in to fork" hint
- [ ] Non-authenticated users see a "Sign in to leave a comment" prompt where the comment form would be
- [ ] Star button shows "Sign in to star" guidance for non-authenticated users
- [ ] Fork count is displayed next to the fork button when > 0
- [ ] Fork count query only counts public forks
- [ ] No regressions to existing functionality (edit, delete, star, comment, share)
- [ ] Looks polished and consistent with existing design language

## Technical notes
- Convex `_creationTime` is a number (ms since epoch) available on all documents — use it directly for timestamps
- The color conversion functions in `app/convex/lib/colors.ts` convert hex to hsl/rgb/oklch — check if they can be imported client-side (they're pure functions with no Convex dependencies). If not, copy the conversion logic to a client-side util
- For the API base URL, use `process.env.NEXT_PUBLIC_CONVEX_URL` and strip the trailing path, or just show a relative path and let users figure out the base URL from the Convex deployment
- The existing detail page is already ~800 lines — keep the new API section as a separate component to avoid bloating the file further
- Tailwind v4 is in use
- For the fork count query, use `.withIndex("by_forked_from", q => q.eq("forkedFromId", themeId))` and `.collect()` then filter + count (Convex doesn't have a count aggregation)
- The `<details>`/`<summary>` HTML elements work well for the collapsible API section and require no JS state

## Completion Notes (agent 033eb2d6)

All four tasks completed:

1. **API docs section**: Replaced one-line API reference with a collapsible `<details>` section containing: full endpoint URL with copy button, `?format=` query param documentation, live example JSON response with format selector (hex/hsl/rgb/oklch) that updates in real-time, dark-themed code block with copy button. Color conversion logic replicated client-side.

2. **Comment timestamps**: Added `timeAgo()` helper displaying "just now", "Xm ago", "Xh ago", "Xd ago", or "Mon DD" for older. Shown next to each comment author name in muted text.

3. **Non-auth UX**: Star button now shows "Sign in to star" text label. Fork button shown (disabled) with "Sign in to fork" hint. Comment form replaced with "Sign in to leave a comment" placeholder.

4. **Fork count**: Added `countForks` query in `themes.ts` using new `by_forked_from` index (added to schema). Displays count in fork button text when > 0.
