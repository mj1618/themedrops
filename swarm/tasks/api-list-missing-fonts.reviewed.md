# Fix: /api/themes list endpoint omits font data

## Problem

The `listPublic` internal query in `convex/themeApi.ts` (used by the `GET /api/themes` HTTP endpoint) does not include `fonts` in the response objects. However, the `getPublicBySlug` query (used by `GET /api/themes/<slug>`) does return `fonts`.

This means API consumers who list themes get no font information, but when they fetch a single theme by slug they do. This is an inconsistency that breaks the usefulness of the list endpoint — a consumer can't apply a theme from the list without making a second request per theme just to get the fonts.

## Files to change

- `app/convex/themeApi.ts` — `listPublic` handler: add `fonts` to the returned object for each theme

## Implementation

In `listPublic`, the `themes.push(...)` block currently returns:

```ts
{
  name: theme.name,
  slug: theme.slug,
  description: theme.description,
  author: author?.username ?? null,
  starCount: theme.starCount,
  colors: theme.colors,
}
```

It should also include:

```ts
  fonts: theme.fonts ?? null,
```

to match the shape returned by `getPublicBySlug`.

Additionally, in `http.ts`, the `/api/themes` list handler applies `convertColors` to each theme but the font data needs no conversion — it just needs to be passed through, which it will be automatically once included in the query response.

## Verification

1. Run `npx convex dev` and confirm no type errors.
2. Hit `GET /api/themes` and confirm each theme object in the response now includes a `fonts` field.
3. Hit `GET /api/themes/<slug>` and confirm the response shape matches (both have `fonts`).

## Done

Added `fonts: theme.fonts ?? null` to the `listPublic` query's response object in `app/convex/themeApi.ts`. The `http.ts` list handler already uses object spread (`...theme`), so fonts pass through automatically with no additional changes needed. TypeScript compiles cleanly.

## Review

Reviewed by Claude. The change is correct and complete:

- `fonts: theme.fonts ?? null` correctly added to `listPublic` at `themeApi.ts:48`, matching the shape from `getPublicBySlug` at line 24.
- The HTTP handler in `http.ts:56-61` uses `...theme` spread, so fonts pass through to the API response with no additional changes needed.
- TypeScript compiles cleanly with no errors.
- No bugs, missing edge cases, or code quality issues found.
- Note: `listPublic` still omits `forkedFromId` and `isPublic` fields that `getPublicBySlug` includes — this is a pre-existing difference outside the scope of this task.
