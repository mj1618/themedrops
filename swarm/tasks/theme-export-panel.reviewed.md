# Theme Export Panel ✅

## Completion Notes

Implemented the theme export panel with all required formats:
- **CSS Variables** — with color format selector (hex/rgb/hsl/oklch), copy and `.css` download
- **Tailwind Config** — generates `theme.extend.colors` and `fontFamily`, copy to clipboard
- **JSON** — full theme object, copy and `.json` download

Created files:
- `app/app/lib/themeExport.ts` — utility functions for generating export formats and triggering downloads
- `app/app/components/ThemeExport.tsx` — collapsible tabbed export panel component

Modified:
- `app/app/routes/theme/$slug.tsx` — integrated `<ThemeExport />` between color swatches and API Documentation

## Review Notes

Reviewed by: Claude (code review agent)

### Issues Found & Fixed

1. **Bug: clipboard copy showed success on failure** — `copyToClipboard` in `ThemeExport.tsx` called `navigator.clipboard.writeText()` without awaiting the promise. If the clipboard API failed (e.g. permissions denied, insecure context), the success toast would still show. Fixed by making the function async with try/catch and showing an error toast on failure.

2. **Bug: file download URL revoked too early** — `downloadFile` in `themeExport.ts` called `URL.revokeObjectURL()` synchronously right after `a.click()`. This could revoke the blob URL before the browser finished initiating the download, causing a broken download. Fixed by deferring the revoke with `setTimeout`.

### Code Quality

- Export format generation (`themeExport.ts`) is clean and well-structured
- Component structure and styling are consistent with the rest of the app
- Color format conversion correctly delegates to existing `colorConvert.ts` utility
- Collapsible panel matches the existing API Documentation pattern
- TypeScript types are clean, no compile errors

---

Add an "Export Theme" section to the theme detail page (`/theme/:slug`) that lets users copy or download theme configurations in multiple formats, making it easy to use ThemeDrops themes in real projects.

## Motivation

The PLAN.md says themes should be "designed to be used in all applications" and specifically mentions Tailwind integration. Currently the only way to consume a theme is through the JSON API. Users need one-click export to CSS variables, Tailwind config, and downloadable files.

## Requirements

### Export Formats

1. **CSS Variables** — Generate a `:root {}` block with all theme colors and fonts as CSS custom properties (e.g., `--td-background`, `--td-primary`, etc.) with color format selector (hex, rgb, hsl, oklch). Copy to clipboard button.

2. **Tailwind Config** — Generate a `tailwind.config.js` (or `.ts`) snippet that extends the theme's colors and fonts into a Tailwind config. Should produce a `theme.extend.colors` object and `theme.extend.fontFamily` object. Copy to clipboard button.

3. **JSON Download** — Download the full theme object as a `.json` file (name, colors, fonts). Should include a copy-to-clipboard option as well.

4. **CSS File Download** — Download a `.css` file containing the CSS variables block, ready to import into any project.

### UI Design

- Add an "Export" collapsible section on the theme detail page, similar to the existing "API Documentation" section.
- Use a tabbed interface to switch between export formats (CSS Variables | Tailwind | JSON | CSS File).
- Each tab shows a syntax-highlighted code preview and action buttons (Copy / Download where applicable).
- Style consistently with the existing API Documentation section (rounded-xl, bg-td-secondary, border-white/10, etc.).

### Implementation Details

- **New utility function** `app/app/lib/themeExport.ts`:
  - `generateCSSVariables(colors, fonts, format)` — returns a CSS `:root` block string
  - `generateTailwindConfig(colors, fonts)` — returns a Tailwind config snippet string
  - `generateThemeJSON(theme)` — returns formatted JSON string
  - `downloadFile(content, filename, mimeType)` — triggers a browser file download

- **New component** `app/app/components/ThemeExport.tsx`:
  - Accepts theme colors, fonts, name, slug as props
  - Renders the tabbed export panel
  - Handles copy-to-clipboard and download actions
  - Uses the existing `convertColors` util for format conversion
  - Shows a toast on copy success

- **Integration** in `app/app/routes/theme/$slug.tsx`:
  - Import and render `<ThemeExport />` between the color swatches and API Documentation sections (or replace/merge with API Documentation since they overlap in purpose)

### Example Output — CSS Variables

```css
:root {
  /* ThemeDrops: Midnight Ocean */
  --td-background: #0f172a;
  --td-foreground: #e2e8f0;
  --td-primary: #3b82f6;
  --td-secondary: #1e293b;
  --td-accent: #f59e0b;
  --td-muted: #64748b;

  --td-font-heading: 'Inter', sans-serif;
  --td-font-body: 'Inter', sans-serif;
  --td-font-mono: 'JetBrains Mono', monospace;
}
```

### Example Output — Tailwind Config

```js
// tailwind.config.js — ThemeDrops: Midnight Ocean
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        primary: '#3b82f6',
        secondary: '#1e293b',
        accent: '#f59e0b',
        muted: '#64748b',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

## Files to Create/Modify

- **Create**: `app/app/lib/themeExport.ts`
- **Create**: `app/app/components/ThemeExport.tsx`
- **Modify**: `app/app/routes/theme/$slug.tsx` — add the export panel

## Testing

- Verify all four export formats render correct output for multiple themes
- Verify copy-to-clipboard works and shows toast
- Verify file downloads produce valid CSS/JSON files
- Verify color format selector works for CSS Variables output
- Test on mobile — tabs should be scrollable or wrap gracefully
- Browser test the collapsible section open/close behavior
