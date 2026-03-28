# Add site-wide theme switcher

## Context
The PLAN.md explicitly states: "this website itself it should allow you to use and apply any theme, e.g. this site should have a theme switcher that allows you to select any theme from this website." Currently the site uses hardcoded Tailwind colors and has no mechanism to apply theme data to the site's own styling. This is a core part of the product identity — a theme-sharing site that doesn't use its own themes feels incomplete.

## Scope
Add a theme switcher UI and the underlying CSS custom property system so users can apply any theme from the site to the site itself. The selected theme should persist across page navigations and sessions (localStorage). Include a "Reset to default" option.

## Tasks

### 1. Set up CSS custom properties for theming
- **File:** `app/src/app/globals.css`
- Define CSS custom properties for all themeable values: `--td-bg`, `--td-fg`, `--td-primary`, `--td-secondary`, `--td-accent`, `--td-muted`, `--td-font-sans`, `--td-font-serif`, `--td-font-mono`
- Set sensible defaults (the current site colors) as the initial values on `:root`
- Update the existing Tailwind theme/config to reference these CSS variables instead of hardcoded colors where appropriate

### 2. Create a ThemeProvider context
- **File:** `app/src/app/components/ThemeProvider.tsx` (new)
- Create a React context that:
  - Reads the saved theme slug from `localStorage` on mount
  - Fetches the theme data from Convex when a theme is selected
  - Applies the theme's colors and fonts as CSS custom properties on `document.documentElement`
  - Provides `currentTheme`, `setTheme(slug)`, and `resetTheme()` to children
  - Persists the selected theme slug to `localStorage`
- Wrap the app layout in this provider

### 3. Update site styles to use CSS custom properties
- **Files:** `app/src/app/page.tsx`, `app/src/app/theme/[slug]/page.tsx`, `app/src/app/user/[username]/page.tsx`, `app/src/app/create/page.tsx`, `app/src/app/layout.tsx`
- Replace key hardcoded color classes (backgrounds, text colors, borders, buttons) with the CSS custom property equivalents
- Focus on the most visible elements: page backgrounds, nav/header, cards, buttons, text
- Don't need to convert every single class — focus on the elements that make the theme feel "applied"
- Ensure readability is maintained (proper contrast between bg/fg)

### 4. Add theme switcher UI in the header/nav
- **File:** `app/src/app/layout.tsx` or a new `app/src/app/components/ThemeSwitcher.tsx`
- Add a small dropdown/popover button in the site header (e.g. a paint palette icon)
- When opened, show a compact list/grid of available themes with small color previews
- Clicking a theme applies it immediately via the ThemeProvider
- Include a "Reset to default" option at the top
- Show which theme is currently active (checkmark or highlight)
- The dropdown should be scrollable if there are many themes
- Keep it visually compact — this is a utility control, not a full page

### 5. Add "Apply to site" button on theme detail page
- **File:** `app/src/app/theme/[slug]/page.tsx`
- Add a button in the action bar (near star/fork) that says "Apply theme" or "Use on site"
- Clicking it calls `setTheme(slug)` from the ThemeProvider context
- If this theme is already applied, show "Currently applied" or a checkmark instead
- This gives users a direct way to apply a theme they're viewing

### 6. Handle SSR/hydration correctly
- Since CSS custom properties are set via JavaScript and localStorage, ensure no flash of unstyled content (FOUC)
- Consider adding a small inline script in the `<head>` (via layout.tsx or a script component) that reads localStorage and sets the CSS variables before React hydrates
- Or use `suppressHydrationWarning` on the html element and accept a brief flash on first load

## Acceptance criteria
- [ ] Site has a theme switcher button visible in the header/navigation
- [ ] Clicking it opens a compact picker showing available themes with color previews
- [ ] Selecting a theme changes the site's background, text, accent colors, and fonts
- [ ] The selected theme persists across page navigations (client-side routing)
- [ ] The selected theme persists across page refreshes (localStorage)
- [ ] A "Reset to default" option restores the original site styling
- [ ] Theme detail page has an "Apply to site" button
- [ ] No flash of wrong theme on page load (or minimal, acceptable flash)
- [ ] The site remains readable and usable with any applied theme (reasonable contrast)
- [ ] Works on mobile and desktop

## Technical notes
- Use CSS custom properties (not Tailwind theme overrides) for runtime theming
- Theme data is already in Convex with colors (background, foreground, primary, secondary, accent, muted) and fonts (sans, serif, mono) — these map directly to CSS variables
- Tailwind v4 is in use
- Next.js app router with server components — ThemeProvider must be a client component
- Use `"use client"` directive on the ThemeProvider and ThemeSwitcher components
- For fonts, use CSS `font-family` with fallbacks since the theme fonts may not be loaded — consider loading Google Fonts dynamically or just setting the font-family and letting the browser fall back
- The Convex query `themes.list` already exists to fetch all public themes
