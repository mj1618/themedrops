# Gallery Filters (REVIEWED)

## Review Notes

**Reviewed by:** Claude (automated review)
**Verdict:** Mostly correct, one missing feature fixed.

### Issues Found & Fixed

1. **Description search not implemented (FIXED)** — The "Search Enhancement" requirement asked for search to also cover theme descriptions, but only the `name` field was indexed. Added a second Convex search index (`search_themes_description`) on the `description` field and updated the `search` query to run both indexes in parallel, merging and deduplicating results with name matches prioritized.

### Verified as Correct

- Filter panel UI: chip-based filters with dropdown popovers, dismissable active filters, "Clear all" button — all working
- Tone filter: WCAG 2.0 relative luminance formula correctly implemented, threshold at 0.5 per spec
- Color family filter: hue-based classification covers full 360° range with saturation check for neutrals
- Font family filter: dynamically derived from loaded themes, correctly hidden when no themes are loaded
- Has description filter: properly checks for non-empty trimmed description
- Most Forked sort: `forkCount` field added, `by_forks` index created, fork mutation increments count with `?? 0` fallback for pre-existing data
- Filters reset on sort tab change: confirmed in `handleSortChange`
- Filter count display: shows "Showing X of Y themes" when filters are active
- Seed data: all seed themes include `forkCount: 0`
- TypeScript compiles cleanly with no errors
- Browser test: UI renders correctly with all filter chips and sort tabs visible

### Notes

- `forkCount` is `v.optional(v.number())` in the schema to handle pre-existing themes, but new themes always get `forkCount: 0` — this is fine
- The `description` search index handles `undefined` descriptions gracefully (Convex skips documents without the field)

---

## Completion Notes

All requirements implemented:

- **Filter Panel UI**: Created `GalleryFilters.tsx` with chip-based filter UI, dropdown popovers, dismissable active filters, and "Clear all" button
- **Tone filter**: Light/Dark toggle based on background color luminance (WCAG 2.0 relative luminance formula)
- **Primary Color Family filter**: Dropdown with 8 color families (Red, Orange, Yellow, Green, Blue, Purple, Pink, Neutral) with color dot indicators, classified by hue angle
- **Font Family filter**: Dynamic dropdown listing unique heading fonts from loaded themes
- **Has Description filter**: Toggle to show only themes with descriptions
- **Most Forked sort tab**: Added `forkCount` field to schema, `by_forks` index, increment in fork mutation, and "Most Forked" sort option in the list query
- **Filter count display**: Shows "Showing X of Y themes" when filters active
- **Backend**: Updated `schema.ts`, `themes.ts` (list query, fork mutation, create mutation), and `seed.ts`
- **Utilities**: Added `relativeLuminance()` and `hexToColorFamily()` to `colorConvert.ts`
- **Filters reset when switching sort tabs**

---

Add advanced filtering to the theme gallery so users can narrow down themes by visual characteristics beyond just name search. PLAN.md explicitly requires: "The gallery provides a lot of filters to filter down to the theme you want."

## Context

Currently the homepage gallery only has:
- Sort tabs: Popular / Newest
- Text search by theme name (via Convex search index on `name` field)

Themes have 6 colors (background, foreground, primary, secondary, accent, muted) and 3 fonts (heading, body, mono). There's no way to filter by any of these properties.

## Requirements

### Filter Panel UI
- [ ] Add a collapsible "Filters" panel below the sort tabs / search bar on the homepage gallery
- [ ] Show a row of filter chips/pills; clicking one opens a dropdown or popover for that filter
- [ ] Active filters show as dismissable chips with an "x" to remove
- [ ] "Clear all" button when any filter is active
- [ ] Filters should feel lightweight — not a heavy sidebar, more like a toolbar row

### Filter: Tone (Light / Dark)
- [ ] Add a toggle or segmented control: All / Light / Dark
- [ ] Classify based on background color luminance: luminance > 0.5 = light, <= 0.5 = dark
- [ ] Compute luminance from hex using relative luminance formula (already have `colorConvert.ts` with hex-to-RGB)
- [ ] This filter runs client-side on the loaded themes (query already returns all public themes via pagination)

### Filter: Primary Color Family
- [ ] Dropdown with color family options: Red, Orange, Yellow, Green, Blue, Purple, Pink, Neutral
- [ ] Classify by mapping the primary color's hue angle to a color family bucket
- [ ] Client-side filter applied on top of existing results
- [ ] Show a small color dot next to each option label

### Filter: Font Family
- [ ] Dropdown listing all unique heading font values across loaded themes
- [ ] Selecting one filters to themes using that heading font
- [ ] Client-side filter

### Filter: Has Description
- [ ] Simple toggle to show only themes with a description filled in
- [ ] Client-side filter — useful since many themes may have empty descriptions

### Sort: Most Forked
- [ ] Add a "Most Forked" sort tab alongside Popular / Newest
- [ ] Backend query: new sort option in `themes.list` that orders by fork count
- [ ] Need to add a `forkCount` field to the themes table (denormalized counter, similar to `starCount`)
- [ ] Increment `forkCount` in the `fork` mutation
- [ ] Add index `by_forks` on `forkCount` for efficient sorting
- [ ] Backfill: update `seedData` to set `forkCount: 0` on all seed themes

### Search Enhancement
- [ ] Update the Convex search index `search_themes` to also search the `description` field (change `searchField` to include description, or add a second search index)
- [ ] Note: Convex search indexes only support one `searchField` — so concatenate name + description into a searchable text field, OR add a second query that searches description separately and merge results client-side

## Implementation Notes

### Files to modify
- `app/convex/schema.ts` — add `forkCount` field, add `by_forks` index
- `app/convex/themes.ts` — add `forkCount` increment in `fork` mutation, add `"forks"` sort option to `list` query
- `app/convex/seed.ts` — add `forkCount: 0` to all seed themes
- `app/app/routes/index.tsx` — add filter panel UI, client-side filter logic, "Most Forked" tab
- `app/app/lib/colorConvert.ts` — add `relativeLuminance(hex)` and `hueToColorFamily(hex)` utility functions

### Files to create
- `app/app/components/GalleryFilters.tsx` — filter panel component (chips, dropdowns, filter state)

### Design guidance
- Filters panel should use the existing theme CSS variables (`td-primary`, `td-secondary`, `td-muted`, etc.)
- Keep it compact — a horizontal row of filter chips that expand into small popovers/dropdowns
- Active filters should be visually distinct (use `td-primary` color)
- Mobile: filters should stack or scroll horizontally
- Match the existing rounded-xl, border-white/5, bg-td-secondary design language

### Client-side filtering approach
- All filters (tone, color family, font, has-description) apply client-side on the `displayedThemes` array
- Chain filters: each active filter narrows the result set further
- Filter state lives in `HomePage` component state (or in the `GalleryFilters` component, lifted up via callback)
- When any filter is active, show filtered count: "Showing X of Y themes"

### Testing
- Test in browser: verify each filter correctly narrows results
- Test combinations of multiple active filters
- Test clearing individual filters and "clear all"
- Test that filters reset when switching sort tabs
- Test mobile layout — filters should remain usable on small screens
- Verify "Most Forked" sort tab works with pagination (load more)
