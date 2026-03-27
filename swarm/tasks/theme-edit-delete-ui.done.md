# Add edit and delete UI for theme owners

## Context
Users can create themes but have no way to edit or delete them. The backend mutations `themes.update` and `themes.remove` already exist with proper authorization (owner-only checks), but the theme detail page has no edit or delete controls. This is a critical MVP gap — users need to be able to manage their own themes.

## Scope
Add edit and delete functionality to the theme detail page (`/theme/[slug]`) for theme owners only. No new backend work needed — `themes.update` and `themes.remove` already handle authorization and cleanup.

## Tasks

### 1. Add owner detection to the theme detail page
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Compare the current authenticated user's ID with `theme.authorId`
- Only show edit/delete controls when the viewer is the theme owner

### 2. Add a delete button with confirmation
- Show a "Delete" button (styled as a danger action) visible only to the owner
- On click, show a confirmation dialog (inline confirm/cancel, not `window.confirm`)
- On confirm, call `useMutation(api.themes.remove)` with the theme `_id`
- On success, redirect to the homepage (`/`)
- Show an error message if the mutation fails

### 3. Add an inline edit mode for theme metadata
- Add an "Edit" button visible only to the owner
- Clicking "Edit" toggles the page into an edit mode where:
  - Theme name becomes an editable text input
  - Description becomes an editable textarea
  - Public/private becomes a toggle switch
- Show "Save" and "Cancel" buttons in edit mode
- On "Save", call `useMutation(api.themes.update)` with only the changed fields
- On "Cancel", revert to the display view without saving
- If the name changes, the slug will change server-side — after save, redirect to the new slug URL (returned from the mutation, or re-fetch)

### 4. Add inline edit mode for colors
- In edit mode, each color swatch becomes editable
- Use color picker inputs (`<input type="color">`) or hex text inputs for each color
- Pre-fill with the current values
- Include in the save payload sent to `themes.update`

### 5. Add inline edit mode for fonts
- In edit mode, font names become editable text inputs
- Pre-fill with current values
- Include in the save payload sent to `themes.update`

### 6. Handle edge cases
- Disable save button while mutation is in progress (prevent double-submit)
- Show loading state on save/delete buttons during mutation
- If theme is deleted by someone else while editing, handle gracefully (theme becomes null)
- Ensure the live preview panel updates in real-time as colors are edited

## Acceptance criteria
- [x] Edit and delete buttons only appear for the theme owner
- [x] Delete shows inline confirmation and redirects to `/` on success
- [x] Edit mode allows changing name, description, visibility, colors, and fonts
- [x] Save calls `themes.update` with only changed fields and handles slug changes
- [x] Cancel reverts all edits without calling the backend
- [x] Live preview updates as colors are edited
- [x] Loading/disabled states during mutations prevent double-submit
- [x] Page is styled with Tailwind, consistent with existing detail page design
- [x] No new backend changes or npm dependencies needed

## Implementation notes
- Owner detection via `currentUser._id === theme.authorId`
- Edit/Delete buttons render in the header area, only visible to the owner
- Delete uses inline confirm/cancel UI (not `window.confirm`), with loading and error states
- Edit mode replaces name with text input, description with textarea, adds visibility toggle switch
- Colors become editable via color picker + hex text input (`EditableColorSwatch` component)
- Fonts become editable text inputs in edit mode
- Live preview uses `editColors` state during editing, updating in real-time
- Save computes a diff of changed fields and only sends what changed to `themes.update`
- On name change, client-side slugifies the new name and redirects via `router.push`
- Comments section hidden during edit mode to reduce clutter
- TypeScript compiles cleanly, no new dependencies

## Technical notes
- `themes.update` accepts partial fields — only send what changed
- `themes.update` regenerates the slug if the name changes — the response doesn't return the new slug, so after a name change, use `router.push` to navigate to the new slug (compute it client-side as lowercase-hyphenated, or re-query)
- `themes.remove` cascades deletes to all stars and comments for the theme
- The current user's ID can be obtained from the auth context already used by the star/comment features on this page
- Tailwind v4 is in use
