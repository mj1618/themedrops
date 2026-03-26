# Theme Public API Endpoint

## Problem

PLAN.md specifies that themes should be "requested through an API to give back the theme as JSON" with query parameters for format options (e.g. HSL instead of RGB). Currently `convex/http.ts` only has auth routes -- there is no public API for fetching themes.

This is a core MVP feature: external consumers (VS Code extensions, Tailwind configs, Discord bots, custom sites) need a way to fetch theme data over HTTP without using the Convex client SDK.

## Scope

Add HTTP API routes to `convex/http.ts` for fetching theme data in various color formats.

## Tasks

- [x] Add `GET /api/themes/:slug` route to `convex/http.ts` that returns a theme as JSON
- [x] Support `?format=` query parameter with values: `hex` (default), `hsl`, `rgb`, `oklch`
- [x] Write a color conversion utility (hex -> hsl, hex -> rgb, hex -> oklch) in a new `convex/lib/colors.ts` file
- [x] Transform the theme's `colors` object values into the requested format before returning
- [x] Return proper HTTP status codes: 200 for success, 404 for not found, 400 for invalid format
- [x] Only return public themes (respect `isPublic` flag)
- [x] Include CORS headers (`Access-Control-Allow-Origin: *`) so the API is usable from browsers
- [x] Add `GET /api/themes` route that lists public themes (paginated via `?cursor=` and `?limit=` query params)
- [x] Test both endpoints work correctly using a browser or curl

## Implementation Notes

- Convex HTTP routes are defined in `convex/http.ts` using `httpRouter()` -- see existing auth routes for pattern
- The route handler should use `ctx.runQuery` to call an internal query (or inline the DB read)
- Color values are stored as strings in the schema (likely hex like `#ff0000`); parsing and converting these is the main logic
- Keep the response shape close to the DB schema but strip internal fields (`_id`, `_creationTime`, `authorId`); include `author` username instead
- The format param only affects color values, not fonts or other fields

## Acceptance Criteria

- `GET /api/themes/my-cool-theme` returns the theme JSON with hex colors by default
- `GET /api/themes/my-cool-theme?format=hsl` returns colors converted to HSL strings like `hsl(210, 50%, 60%)`
- `GET /api/themes/nonexistent` returns 404
- `GET /api/themes/private-theme` returns 404 (not leaked)
- Response includes CORS headers
- `GET /api/themes?limit=10` returns a paginated list of public themes

## Completion Notes

Implemented the public theme API with the following files:

### New files
- **`convex/lib/colors.ts`** — Color conversion utility supporting hex→hsl, hex→rgb, hex→oklch. Validates hex input format before converting; passes through non-hex values unchanged.
- **`convex/themeApi.ts`** — Two internal queries (`getPublicBySlug`, `listPublic`) that strip internal fields (`_id`, `_creationTime`, `authorId`) and resolve the author username. Both enforce `isPublic` filtering.

### Modified files
- **`convex/http.ts`** — Added four HTTP routes:
  - `GET /api/themes` (exact path) — paginated list of public themes
  - `GET /api/themes/<slug>` (pathPrefix `/api/themes/`) — single theme by slug
  - `OPTIONS` handlers for both paths (CORS preflight)

### Verified via curl
- All four color formats (hex, hsl, rgb, oklch) return correct conversions
- Private themes return 404 (not leaked)
- Nonexistent slugs return 404
- Invalid format param returns 400
- CORS headers present on all responses
- Pagination works with `?cursor=` and `?limit=` params

## Review Notes

Reviewed all three new/modified files (`convex/lib/colors.ts`, `convex/themeApi.ts`, `convex/http.ts`).

### Issues found and fixed

1. **`listPublic` query used `.filter()` instead of an index** — Convex guidelines explicitly prohibit `.filter()` in queries, requiring `withIndex` instead. The `listPublic` query was filtering `isPublic` with `.filter()` after using the `by_star_count` index, which would cause a full scan of the index.
   - **Fix:** Added a compound index `by_public_and_star_count: ["isPublic", "starCount"]` to the `themes` table in `convex/schema.ts`, and updated the query in `themeApi.ts` to use `.withIndex("by_public_and_star_count", (q) => q.eq("isPublic", true))`.

### What looked good

- Color conversion math (HSL, RGB, OKLCH) is correct with proper linearization for OKLCH
- Non-hex values are passed through unchanged (defensive handling)
- Internal fields properly stripped from API responses
- CORS headers on all responses including preflight OPTIONS handlers
- Proper HTTP status codes (200, 400, 404)
- Private themes return 404 (not leaked)
- Pagination limit is clamped to 1-100 range
- Internal queries correctly use `internalQuery` (not exposed publicly)
