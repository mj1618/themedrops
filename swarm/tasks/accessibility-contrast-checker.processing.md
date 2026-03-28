# Accessibility Contrast Checker

Add a WCAG contrast ratio checker to the theme detail page so creators and users can see whether a theme's color combinations meet accessibility standards.

## Why

Themes are meant to be used in real applications. If a theme has poor contrast (e.g., light text on a light background), it's unusable for many people. Showing contrast ratios directly on the theme page helps creators fix issues before publishing and helps users pick accessible themes.

## Scope

- Add a new "Accessibility" section/panel to the theme detail page (`/theme/$slug`)
- Calculate WCAG 2.1 contrast ratios between relevant color pairs
- Display pass/fail badges for AA and AAA compliance levels
- Pure frontend feature — no schema or backend changes needed

## Design

### Color Pairs to Check

Check these semantically meaningful pairs from the theme's 6 colors:

| Pair | Purpose |
|------|---------|
| foreground / background | Main body text readability |
| primary / background | Primary buttons, links |
| secondary / background | Secondary UI elements |
| accent / background | Accent highlights |
| muted / background | Subdued text, placeholders |
| foreground / muted | Text on muted surfaces (e.g., cards) |
| primary / foreground | Primary element on text-colored bg |

### UI Layout

- Collapsible section below the existing theme detail content (or as a tab alongside the export panel)
- Each pair shown as a row:
  - Left: two color swatches side by side
  - Middle: the contrast ratio (e.g., "4.5:1")
  - Right: badge(s) — "AA" (green) if >= 4.5:1, "AAA" (green) if >= 7:1, "Fail" (red) if < 4.5:1
  - For large text: "AA" if >= 3:1, "AAA" if >= 4.5:1
- Show an overall score/summary at the top: e.g., "5/7 pairs pass AA" with a progress-style indicator
- Style the section using the theme's own colors for consistency with the rest of the detail page

### Contrast Calculation

WCAG 2.1 contrast ratio formula:
1. Convert hex to sRGB (0-1 range)
2. Linearize each channel: if c <= 0.04045 then c/12.92, else ((c+0.055)/1.055)^2.4
3. Relative luminance L = 0.2126*R + 0.7152*G + 0.0722*B
4. Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05)

Note: `app/app/lib/colorConvert.ts` already has a `relativeLuminance` function — extend or reuse it.

## Tasks

- [ ] Add contrast ratio utility functions to `app/app/lib/colorConvert.ts`:
  - `contrastRatio(hex1: string, hex2: string): number` — returns ratio like 4.5
  - `wcagLevel(ratio: number): "AAA" | "AA" | "Fail"` — for normal text thresholds
  - `wcagLevelLargeText(ratio: number): "AAA" | "AA" | "Fail"` — for large text thresholds
- [ ] Create `app/app/components/ContrastChecker.tsx` component:
  - Takes theme colors as props
  - Renders the color pair rows with swatches, ratio, and badges
  - Shows summary at top
  - Collapsible with a toggle
- [ ] Integrate the ContrastChecker into the theme detail page (`app/app/routes/theme.$slug.tsx`)
  - Place it after the existing content (export panel, comments, etc.)
  - Should be visible but not dominate the page — collapsed by default
- [ ] Test in browser:
  - Verify ratios match an external WCAG checker (e.g., WebAIM contrast checker)
  - Check with both light and dark themes
  - Ensure the component is responsive on mobile

## Out of Scope

- Suggesting color fixes or auto-adjusting colors for compliance
- Checking font-size-dependent thresholds dynamically (we use fixed normal/large text thresholds)
- Adding contrast data to the API or database
- Blocking theme publishing based on contrast scores
