# Build the theme detail page

## Context
The backend has all the queries needed to display a single theme (`themes.getBySlug`, `comments.listByTheme`, `stars.isStarred`, `stars.toggle`), but there is no frontend page to view an individual theme. The homepage gallery (in progress) will link to theme pages by slug — without a detail page, clicking a theme card leads nowhere. This is a critical MVP gap.

## Scope
Create a dynamic route page at `/theme/[slug]` that displays a single theme's full details, allows starring, and shows comments. No new backend queries needed — everything exists already.

## Tasks

### 1. Create the dynamic route page
- **File:** `app/src/app/theme/[slug]/page.tsx`
- `"use client"` component (needs Convex hooks)
- Use `useQuery(api.themes.getBySlug, { slug })` to fetch the theme
- Extract slug from route params

### 2. Theme detail layout
- Display the theme name prominently as a heading
- Show description below the name
- Show author display name (resolve from `authorId` via a simple query, or fetch inline)
- If the theme is a fork, show "Forked from [original name]" with link
- Show the theme slug for API usage reference (e.g. "API: `/api/theme/slug-name`")

### 3. Color palette display
- Render all 6 color values (background, foreground, primary, secondary, accent, muted) as large swatches
- Show the hex value label under/beside each swatch
- Show a live preview panel: a small card/section styled with the theme's actual colors (background, foreground text, primary button, etc.)
- Handle missing optional colors gracefully (skip them)

### 4. Font display
- If fonts are present, show sans/serif/mono font names
- Optionally render sample text in each font (if it's a Google Font or system font)

### 5. Star button
- Use `useQuery(api.stars.isStarred, { themeId })` to check current star state
- Use `useMutation(api.stars.toggle)` to toggle
- Show star count from the theme object
- Display filled/unfilled star icon based on state
- Disable or hide for unauthenticated users

### 6. Comments section
- Use `useQuery(api.comments.listByTheme, { themeId })` to fetch comments
- Display each comment with author name, body text
- If authenticated, show a text input + submit button to add a comment via `useMutation(api.comments.create)`
- Handle empty comments state ("No comments yet")

### 7. Fork button
- Show a "Fork this theme" button for authenticated users
- Use `useMutation(api.themes.fork)`
- On success, navigate to the forked theme's page (or show a success message)

### 8. Handle edge cases
- 404 / not found state if `getBySlug` returns null
- Loading state while data fetches
- Private theme returns null for non-owners — show appropriate message

## Acceptance criteria
- [x] `/theme/[slug]` route renders theme details fetched from Convex (not hardcoded)
- [x] All 6 color swatches display with hex labels
- [x] Star button shows current state and toggles correctly
- [x] Comments list renders with author names
- [x] Authenticated users can add comments and fork the theme
- [x] Loading and not-found states are handled
- [x] Page is styled with Tailwind, consistent with homepage design
- [x] No new npm dependencies required

## Technical notes
- `themes.getBySlug` already handles privacy (returns null for private themes unless viewer is the author)
- `comments.listByTheme` already resolves author info (username, displayName, avatarUrl)
- The theme `_id` is needed for stars/comments/fork mutations — get it from the `getBySlug` response
- Convex document IDs are available as `_id` on returned objects
- Tailwind v4 is in use

## Implementation notes
- Created `app/src/app/theme/[slug]/page.tsx` as a `"use client"` component
- Added `users.get` query to `convex/users.ts` to resolve author display name from `authorId` (returns only public fields)
- Uses `useParams` from `next/navigation` to extract the slug
- Color swatches render as 16x16 rounded squares with hex labels; missing colors are skipped
- Live preview panel shows a card styled with all theme colors (background, foreground text, primary/secondary/accent buttons)
- Font section renders sample text in each font family if fonts are present
- Star button shows filled/unfilled star with count; disabled for unauthenticated users
- Comments section shows all comments with author info; authenticated users get an inline form to post
- Fork button navigates to the new forked theme page on success
- Loading spinner and not-found states handled
- TypeScript compiles cleanly with no errors
