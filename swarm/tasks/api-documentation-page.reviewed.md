# API Documentation Page

Create an interactive `/api` documentation page that showcases the themedrops public API, making it easy for developers to discover, understand, and start using themes programmatically.

PLAN.md explicitly calls for: "Themes that can be requested through an API to give back the theme as JSON... The theme details page should make it clear how to call the API for this theme also."

The HTTP API already exists in `app/convex/http.ts` with two endpoints and color format conversion — but there's no user-facing documentation anywhere.

## Tasks

### 1. Create the `/api` route and page component
- Add a new route at `/api` (or `/developers`) in the TanStack router
- Page should match the site's existing design language and respect the active theme

### 2. Build the documentation layout
- Hero section: brief intro ("Build with themedrops themes"), the base API URL
- Endpoint cards for each endpoint:
  - `GET /api/themes` — list all public themes
  - `GET /api/themes/:slug` — get a single theme by slug
- Each endpoint card shows: method badge, path, description, query parameters table, example request (curl), example response JSON

### 3. Interactive "Try It" panel
- Let users pick a real theme slug from a dropdown (fetched from Convex)
- Let users pick a color format (hex / rgb / hsl / oklch)
- Show the constructed URL updating live
- "Copy URL" and "Copy curl" buttons
- Show a live response preview (fetch from the actual API and display formatted JSON)

### 4. Quick-start code snippets
- Tabbed code blocks showing usage in: `fetch` (JS), `curl`, `Python requests`
- Each snippet uses the currently selected theme slug and format from the Try It panel
- Copy button on each snippet

### 5. Add API link to site navigation
- Add an "API" or "Developers" link in the site header/nav
- Add a small "API" badge/link on individual theme detail pages that deep-links to `/api` with that theme's slug pre-selected

### 6. Response schema reference
- Document the JSON response shape with a clean table or typed schema block
- Show which fields are always present vs optional (e.g., fonts, description)
- Document the `?format=` query parameter values and what each returns

## Design Notes
- Use the site's existing component patterns (cards, tabs, buttons, code blocks)
- The page itself should feel polished and developer-friendly — think Stripe/Vercel docs aesthetic
- Syntax-highlighted JSON responses (can use a simple `<pre>` with theme colors)
- Mobile responsive

## Out of Scope
- Authentication/API keys (API is public, no auth needed)
- Rate limiting documentation
- SDK generation
- New API endpoints (just document what exists)

## Acceptance Criteria
- [x] `/api` route loads with full documentation for both endpoints
- [x] Interactive Try It panel fetches real data and displays formatted response
- [x] Code snippets update dynamically based on selected theme/format
- [x] Copy buttons work for URLs and code snippets
- [x] Theme detail pages link to the API docs for that specific theme
- [x] Page is responsive and matches site design

## Completion Notes

Implemented by creating:
- `app/app/routes/api.tsx` — Full API documentation page with hero, endpoint cards, interactive Try It panel, quick-start code snippets (JS/curl/Python), and response schema reference
- Updated `app/app/components/Header.tsx` — Added "API" link to site navigation
- Updated `app/app/routes/theme/$slug.tsx` — Added green "API" badge button that deep-links to `/api?theme=<slug>`
- Route tree auto-regenerated with new `/api` route
- TypeScript passes clean with no errors

## Review Notes

Reviewed all code changes. Page renders correctly on desktop and mobile, with proper layout for all sections (Hero, Endpoints, Try It, Quick Start, Response Schema).

### Issues found and fixed:
1. **`as any` type hack on search params** — The `/api` route lacked `validateSearch`, forcing `as any` cast in the theme detail page Link. Added proper `validateSearch` to the route definition with an optional `theme` param.
2. **Raw `window.location.search` usage** — The API page read the `?theme=` query param via `window.location.search` instead of TanStack Router's `Route.useSearch()`. This bypasses the router's search handling and could break with SSR. Replaced with `Route.useSearch()`.
3. **Header Link missing required `search` prop** — After adding `validateSearch`, the Header's API link needed the `search` prop. Added `search={{ theme: undefined }}`.

TypeScript compiles cleanly after fixes. Browser testing confirms page renders correctly.
