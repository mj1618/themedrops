# Theme Preview Playground

## Completion Notes

Implemented `ThemePreviewPlayground` component with all 4 preview scenes (Dashboard, Chat, Blog, Form) and wired it into the theme detail page between fonts display and ThemeExport. Includes Google Fonts loading, tab switching, full-width toggle, and all styling via inline styles using the theme's colors/fonts. TypeScript compiles cleanly.

Add a realistic, interactive preview section to the theme detail page that renders mock UI components using the theme's colors and fonts. This lets users see what a theme actually looks like when applied to real interfaces, not just color swatches.

## Why

The current theme detail page shows color swatches and a small abstract preview card. For a design-oriented site, users need to see themes applied to realistic UI patterns before they commit to using one. This is the difference between browsing paint chips vs. seeing a painted room.

## What to Build

### A `ThemePreviewPlayground` component on the theme detail page

Add it between the color swatches and the Export section. It should accept the theme's `colors` and `fonts` as props and render everything in an isolated container (inline styles, not CSS variables) so it doesn't affect the rest of the page.

### Preview Scenes (tabs the user can switch between)

1. **Dashboard** — A mini analytics dashboard with a sidebar nav, stat cards, a simple bar chart (CSS-only), and a table with a few rows. Uses `background`, `secondary`, `foreground`, `primary`, `accent`, and `muted` colors.

2. **Chat** — A messaging interface with a conversation thread (incoming/outgoing bubbles), a text input bar, and a user list sidebar. Shows `primary` for sent messages, `secondary` for received, `accent` for online indicators.

3. **Blog / Article** — A content page with a heading (heading font), body text (body font), a code block (mono font, secondary bg), a blockquote (accent border), and a CTA button (primary). Demonstrates typography alongside color.

4. **Form** — A settings/form page with labeled inputs, toggles, radio buttons, a dropdown, a primary submit button, and a muted cancel link. Tests how the theme handles interactive-looking elements.

### Interaction Details

- Tab bar at top to switch scenes (default: Dashboard)
- The entire preview is rendered in a rounded container with `background` as the bg color
- All text uses the theme's font families (load from Google Fonts if not already loaded)
- A small "Full Width" toggle that expands the preview to full viewport width (for better immersion)

## Implementation Plan

### 1. Create `app/app/components/ThemePreviewPlayground.tsx`

- Props: `colors: ThemeColors`, `fonts: ThemeFonts`
- Internal state: `activeScene` (dashboard | chat | blog | form), `fullWidth` boolean
- Each scene is a sub-component (can be inline or separate functions within the file)
- All styling via inline styles using the passed colors/fonts — no Tailwind theme classes inside the preview area
- The outer container uses Tailwind for layout (rounded corners, border, padding)

### 2. Dashboard Scene

- Sidebar: dark-ish strip using `secondary`, with nav items using `muted` text, active item highlighted with `primary`
- Main area: `background` bg
- 3 stat cards across the top (revenue, users, orders) with `primary`/`accent` colored icons/numbers
- A simple CSS bar chart (5 bars of varying height using `primary` with opacity variants)
- A 4-row table with alternating `secondary`/`background` rows, `foreground` text, `muted` headers

### 3. Chat Scene

- Left sidebar: user list with avatar circles (colored with `primary`/`accent`), names in `foreground`, status dots
- Chat area: alternating message bubbles — outgoing uses `primary` bg with white text, incoming uses `secondary` bg with `foreground` text
- Input bar at bottom: `secondary` bg input with `muted` placeholder text, `primary` send button

### 4. Blog Scene

- Article title in heading font, large, `foreground` color
- Author line with `accent` link color
- Body paragraphs in body font, `foreground` color
- A `code` block in mono font, `secondary` bg, with `foreground` text
- A blockquote with left border in `accent`, italic text in `muted`
- A CTA button at the end: `primary` bg, white text

### 5. Form Scene

- Section header in heading font
- Labeled text inputs: `secondary` bg, `foreground` text, `muted` labels, `primary` focus ring (visual only)
- A toggle switch: `primary` when on, `muted` when off
- Radio button group: `primary` for selected dot
- A dropdown select: `secondary` bg
- Primary "Save" button and muted "Cancel" text link

### 6. Wire into theme detail page

- Import `ThemePreviewPlayground` in `app/app/routes/theme/$slug.tsx`
- Place it after the fonts display and before `<ThemeExport>`
- Pass `theme.colors` and `theme.fonts`

### 7. Google Fonts loading

- Use a `<link>` tag injected into `<head>` (via `useEffect`) to load the theme's heading, body, and mono fonts from Google Fonts if they aren't system fonts
- Deduplicate: only inject if not already present

## Out of Scope

- No backend changes needed
- No new Convex functions
- No mobile-specific responsive breakpoints inside the preview scenes (they're miniature mockups)
- No animation or interactivity inside the scenes (they're static visual previews)

## Testing

- Navigate to any theme detail page and verify the preview appears
- Switch between all 4 tabs and confirm colors/fonts are applied correctly
- Test with a light theme and a dark theme to ensure both render well
- Verify the "Full Width" toggle works
- Check that page load isn't noticeably slower (the component is pure rendering, no data fetching)
