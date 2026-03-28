# Add comment delete button to theme detail page

## Completion notes
- Wired up `comments.remove` mutation in theme detail page
- Added "Delete" button on each comment, visible only to the comment author (`currentUser?._id === comment.userId`)
- Clicking delete shows a `window.confirm` prompt before proceeding
- Button shows "Deleting..." and is disabled while the mutation is in flight
- Fixed API reference text from `/api/theme/{slug}` to `/api/themes/{slug}` to match actual HTTP route
- TypeScript compiles cleanly, no new dependencies added

## Context
The `comments.remove` mutation already exists in `app/convex/comments.ts` (line 76) and handles auth checks (only the comment author can delete their own comment). However, the theme detail page (`app/src/app/theme/[slug]/page.tsx`) has no UI to trigger this mutation. Users can post comments but can never delete them. This is an incomplete feature that needs to be rounded out for MVP.

Also fix a minor bug: the API usage reference on the theme detail page shows `/api/theme/{slug}` (line 519) but the correct Convex HTTP endpoint pattern should match whatever is actually deployed. Verify and correct if needed.

## Scope
Add a delete button to each comment in the theme detail page, visible only to the comment's author. Wire it to the existing `comments.remove` mutation. Small, focused change in a single file.

## Tasks

### 1. Wire up the `comments.remove` mutation
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Add `useMutation(api.comments.remove)` alongside the existing comment mutations
- Add a handler function that calls remove with the comment `_id` and includes a confirmation prompt

### 2. Add delete button to comment UI
- **File:** `app/src/app/theme/[slug]/page.tsx` (around lines 690-714)
- In each comment's rendered div, add a small delete button (trash icon or "Delete" text)
- Only show the button when `currentUser?._id === comment.userId`
- The comment list query returns `comment.userId` (the raw field from the comments table) which can be compared against the current user's `_id`
- Style consistently with the existing UI (small, subtle, hover to reveal or always visible but muted)

### 3. Handle delete state
- Show a loading/disabled state while the delete is in progress
- Optimistic UI is not needed since Convex queries auto-update reactively

## Acceptance criteria
- [ ] Each comment shows a delete button only to the comment's author
- [ ] Clicking delete prompts for confirmation ("Delete this comment?")
- [ ] After confirming, the comment is removed and the list updates reactively
- [ ] Delete button is styled consistently with the page (subtle, not visually heavy)
- [ ] No new npm dependencies required
- [ ] TypeScript compiles cleanly

## Technical notes
- The `comments.remove` mutation (`app/convex/comments.ts:76`) takes `{ id: v.id("comments") }` and checks that `comment.userId === user._id` server-side
- The `listByTheme` query already returns `comment._id` and `comment.userId` on each comment object
- The current user object is already fetched in the page component as `currentUser`
- Convex reactive queries will automatically refresh the comment list after deletion — no manual refetch needed
