# Similar Themes Recommendations

## Done

Implemented the Similar Themes feature:
- Created `app/app/lib/colorDistance.ts` with weighted Euclidean RGB distance for perceptual color similarity
- Added `getSimilarThemes` Convex query in `app/convex/themes.ts` that fetches a pool of top-starred + recent themes, scores them by color similarity, and returns the top matches
- Created `app/app/components/SimilarThemes.tsx` — horizontal scrollable row of compact theme preview cards with scroll indicators
- Integrated into `app/app/routes/theme/$slug.tsx` below the contrast checker section

## Summary

Add a "Similar Themes" section to the theme detail page that recommends themes with visually similar color palettes. This improves theme discovery and keeps users browsing.

## Motivation

Currently, when a user views a theme, there's no way to discover related themes. If they like a theme's vibe but want slight variations, they have to go back to the gallery and manually search. Showing similar themes on the detail page creates a natural browsing flow — like "you might also like" on any content platform.

## Implementation Plan

### 1. Color distance utility (`app/app/lib/colorDistance.ts`)

Create a utility that computes perceptual color distance between two hex colors using the CIELAB Delta E formula (or a simplified weighted Euclidean distance in RGB space for pragmatism).

- `hexToRgb(hex: string): [number, number, number]`
- `colorDistance(hex1: string, hex2: string): number` — Euclidean distance in RGB
- `themeSimilarity(colorsA: ThemeColors, colorsB: ThemeColors): number` — average distance across all 6 color slots (background, foreground, primary, secondary, accent, muted). Lower = more similar.

### 2. Convex query (`app/convex/themes.ts`)

Add a new query: `getSimilarThemes`

```ts
// Args: { themeId: v.id("themes"), limit: v.optional(v.number()) }
// Returns: up to `limit` (default 6) public themes sorted by similarity
```

**Approach:** Since Convex doesn't support complex math in queries natively, fetch a batch of recent/popular public themes (e.g., 50-100), compute similarity scores in the query function, sort by score, and return the top N. Exclude the current theme and its direct forks.

- Fetch the target theme's colors
- Fetch a candidate pool: combine top-starred themes + recent themes (up to ~80 total, deduplicated)
- For each candidate, compute a similarity score based on weighted color distance across the 6 color fields
- Sort by similarity (ascending = most similar first), return top `limit`

### 3. Frontend component (`app/app/components/SimilarThemes.tsx`)

A section component that:

- Takes a `themeId` prop
- Calls `api.themes.getSimilarThemes` via `useQuery`
- Renders a horizontal scrollable row of theme preview cards (reuse the existing card style from the gallery)
- Each card shows: theme name, color swatches, author name, star count
- Cards link to `/theme/{slug}`
- Shows a loading skeleton while fetching
- Hides entirely if no similar themes are found (e.g., < 2 results)

### 4. Integration into theme detail page (`app/app/routes/theme/$slug.tsx`)

- Import and render `<SimilarThemes themeId={theme._id} />` below the comments section
- Section header: "Similar Themes"
- Should blend with the existing page design (use `td-` CSS variable classes)

## Design Notes

- Cards should be the compact preview style — show the theme's own colors as the card background/text so users can visually compare at a glance
- Horizontal scroll with subtle scroll indicators (fade edges or arrow buttons)
- On mobile, cards should be swipeable
- Keep it lightweight — no extra database tables or indexes needed

## Files to Create/Modify

- **Create:** `app/app/lib/colorDistance.ts`
- **Create:** `app/app/components/SimilarThemes.tsx`
- **Modify:** `app/convex/themes.ts` — add `getSimilarThemes` query
- **Modify:** `app/app/routes/theme/$slug.tsx` — add SimilarThemes section

## Testing

- Verify similar themes appear on a theme detail page
- Verify the recommendations look visually reasonable (themes with similar palettes should rank higher)
- Verify the current theme is excluded from results
- Verify clicking a similar theme navigates to its detail page
- Verify the section is hidden when there are no similar themes
- Test on mobile for horizontal scroll behavior
