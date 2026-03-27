# Theme Create Page

## Problem

Users can sign up and sign in, but there is no UI to create a new theme. The backend `themes.create` mutation exists and works (convex/themes.ts:118-164), but there is no frontend page wired to it. This means the only themes on the site are seeded ones — users literally cannot contribute content, which breaks the core value proposition.

## Goal

Add a `/create` page that lets authenticated users create a new theme with a live preview, using the existing `themes.create` mutation.

## Requirements

- Add route at `app/src/app/create/page.tsx`
- Form fields matching the `themes.create` mutation args:
  - **Name** (required text input)
  - **Description** (optional textarea)
  - **Public/Private** toggle (default public)
  - **Colors**: background, foreground, primary, secondary, accent, muted — use color picker inputs (`<input type="color">`) with hex text inputs alongside
  - **Fonts**: sans, serif, mono — text inputs (e.g. "Inter", "Georgia", "Fira Code")
- Show a **live preview card** as the user picks colors/fonts (reuse the `LivePreview` component pattern from the theme detail page)
- Require authentication — if not signed in, show a message prompting sign-in
- On success, redirect to the new theme's detail page (`/theme/{slug}`)
- Add a "Create Theme" button/link in the site header or navigation (visible only when signed in)
- Match existing design patterns and Tailwind styling from the homepage and theme detail page
- Handle loading/error states on form submission

## Out of Scope

- Theme editing (update mutation) — separate task
- Image/icon uploads
- Advanced color tools (palette generators, contrast checkers)

## Acceptance Criteria

1. Signed-in user can navigate to `/create` and see the theme creation form
2. Color pickers update the live preview in real time
3. Submitting the form calls `themes.create` and redirects to the new theme page
4. Unauthenticated users see a prompt to sign in instead of the form
5. The page is visually consistent with the rest of the site
6. A navigation link to "Create Theme" is accessible from the main layout when signed in

## Completion Notes

All acceptance criteria met:

- Created `app/src/app/create/page.tsx` with full theme creation form (name, description, visibility toggle, 6 color pickers with hex inputs, 3 font inputs)
- LivePreview component updates in real time as colors change
- Form calls `themes.create` mutation and redirects to `/theme/{slug}` on success
- Unauthenticated users see a lock icon and "Sign in to create a theme" prompt
- Created `app/src/app/components/CreateThemeLink.tsx` — a "+ Create" button shown only when signed in
- Added CreateThemeLink to both homepage and theme detail page headers
- Modified `themes.create` mutation to return `{ id, slug }` (was returning only id) to enable redirect
- Error and loading states handled on form submission
- Styling matches existing site patterns (Tailwind, rounded-xl inputs, gray-900 buttons, indigo focus rings)

## Review Notes

Reviewed by Claude on 2026-03-27. All acceptance criteria verified:

1. **Route exists** — `app/src/app/create/page.tsx` renders the creation form at `/create`
2. **Color pickers + live preview** — 6 color pickers with hex text inputs; `LivePreview` component updates in real time via React state
3. **Form submission** — calls `themes.create` mutation with correct args; redirects to `/theme/{slug}` using the returned slug
4. **Unauthenticated gate** — lock icon and "Sign in to create a theme" message shown when not authenticated (verified via browser screenshot)
5. **Visual consistency** — styling matches the site (Tailwind classes, rounded-xl inputs, gray-900 buttons, indigo focus rings, consistent header layout)
6. **Navigation link** — `CreateThemeLink` component added to homepage and theme detail page headers, visible only when signed in
7. **Build passes** — `next build` succeeds with no TypeScript errors
8. **Error/loading states** — auth loading spinner, submit disabled state, and error banner all handled

No bugs or issues found. Code is clean and well-structured.
