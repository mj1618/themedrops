# Add share/copy-link button to theme detail page

## Context
The theme detail page (`app/src/app/theme/[slug]/page.tsx`) has star, fork, edit, and delete buttons but no way to share a theme. For an MVP, users need a simple way to copy the theme's URL to share it with others. The PLAN.md mentions themes should be "shared".

## Scope
Add a share button to the theme detail page action bar that copies the theme URL to the clipboard, with a brief "Copied!" confirmation. Also add a small share icon button on theme cards on the homepage so users can quickly grab a link without navigating to the detail page.

## Tasks

### 1. Add share/copy-link button on theme detail page
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Add a "Share" or link-copy button in the action bar (near the star/fork buttons)
- On click, copy the current page URL (`window.location.href`) to the clipboard using `navigator.clipboard.writeText()`
- Show a brief visual confirmation (e.g. button text changes to "Copied!" for 2 seconds, then reverts)
- Style consistently with the existing action buttons (use a share/link icon)

### 2. Add share icon on homepage theme cards
- **File:** `app/src/app/page.tsx`
- Add a small share/link icon button on each theme card (e.g. in the bottom-right area near the star count)
- On click, prevent navigation to the detail page (`e.preventDefault()` + `e.stopPropagation()`)
- Copy the theme URL (`/theme/{slug}`) to clipboard using `navigator.clipboard.writeText()` with the full origin
- Show brief "Copied!" tooltip or visual feedback

## Acceptance criteria
- [ ] Theme detail page has a share/copy-link button in the action area
- [ ] Clicking it copies the full theme URL to the clipboard
- [ ] Brief visual confirmation (e.g. "Copied!") appears after clicking
- [ ] Homepage theme cards have a small share icon
- [ ] Clicking the share icon on a card copies the URL without navigating away
- [ ] Styled consistently with existing UI, looks polished
- [ ] No new npm dependencies required

## Technical notes
- Use `navigator.clipboard.writeText()` for clipboard access
- Use `window.location.origin` + `/theme/${slug}` to construct the full URL
- Use React `useState` for the "copied" state with a `setTimeout` to reset
- Share icon can be an inline SVG (link/chain icon or share icon) consistent with the existing icon style
- Tailwind v4 is in use
- Next.js docs are in `node_modules/next/dist/docs/` — check for breaking changes

## Completion notes (agent 6dc422e1)
- Added share/copy-link button on theme detail page action bar (next to star button) with link icon SVG and "Copied!" feedback
- Added `ShareButton` component on homepage theme cards (next to star count) with link icon that changes to checkmark on copy
- Both use `navigator.clipboard.writeText()` with 2-second "Copied!" timeout
- Click on card share button uses `e.preventDefault()` + `e.stopPropagation()` to prevent navigation
- No new dependencies added. TypeScript compiles cleanly.
