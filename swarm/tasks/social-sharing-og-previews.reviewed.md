# Social Sharing & OG Preview Meta Tags

## Review Notes

Reviewed by Claude. All four subtasks were implemented correctly. Browser-tested the share dropdown and meta tags on a live theme page (`/theme/ocean-breeze`). Found and fixed the following issues:

1. **Missing `og:url` meta tag** — The task spec required `og:url` with the canonical URL but it was omitted from the `head` function. Added `og:url` pointing to `https://themedrops.com/theme/${slug}`.

2. **OG SVG swatch labels used hardcoded colors** — The swatch name and hex labels in the OG image SVG used hardcoded `#999`/`#666` fills, which could be unreadable on certain theme backgrounds. Changed to use `colors.muted` from the theme itself, and added `escapeXml()` to the hex color values for safety.

3. **Share dropdown missing Escape key handler** — The dropdown only closed on click-outside. Added a `keydown` listener for Escape to close the menu, improving keyboard accessibility.

All fixes verified: TypeScript compiles cleanly, browser tests pass (dropdown opens/closes, meta tags render correctly in page source).

## Completion Notes

Implemented all four subtasks:

1. **Default OG meta tags** (`app/app/routes/__root.tsx`) — Added `og:title`, `og:description`, `og:type`, `og:site_name`, `twitter:card`, `twitter:title`, `twitter:description` as fallback meta tags in the root route.

2. **OG image SVG endpoint** (`app/convex/http.ts`) — Added `/api/og/:slug` HTTP endpoint that generates a 1200×630 SVG showing the theme name, author, star count, and all 6 color swatches with labels. Includes XML escaping and 1-hour cache headers.

3. **Dynamic per-theme OG meta tags** (`app/app/routes/theme/$slug.tsx`) — Added a `loader` using `ConvexHttpClient` to fetch theme data server-side, and a `head` function that sets `og:title`, `og:description`, `og:image`, `twitter:card` (summary_large_image), etc. based on the theme's actual name, description, and colors.

4. **Share dropdown** (`app/app/routes/theme/$slug.tsx`) — Replaced the single "copy link" share button with a dropdown menu offering: Copy link, Share on X (Twitter intent URL), Share on Reddit (submit URL), and Copy embed code (iframe snippet). Includes click-outside-to-close behavior.

## Problem

When users share theme links on social media (Twitter/X, Discord, Slack, etc.), the links show up as plain URLs with no rich preview. The site has no Open Graph or Twitter Card meta tags, so shared links lack titles, descriptions, and visual previews of the theme's color palette. The existing "Share" button only copies the URL to clipboard — there's no share dropdown or social-specific sharing.

For a design-oriented theme sharing site, rich link previews are critical for virality and discoverability.

## Goal

Add dynamic per-page Open Graph and Twitter Card meta tags so theme links render rich previews when shared. Improve the share UX with a dropdown offering multiple share targets.

## Tasks

### 1. Dynamic OG Meta Tags on Theme Detail Pages

Add `<meta>` tags to the theme detail page (`/theme/$slug`) that are set dynamically based on the theme data:

- `og:title` — Theme name + "on themedrops"
- `og:description` — Theme description, or a fallback like "A color theme featuring {primary}, {secondary}, {accent} colors"
- `og:type` — "website"
- `og:url` — Canonical URL for the theme
- `og:site_name` — "themedrops"
- `twitter:card` — "summary_large_image"
- `twitter:title` — Same as og:title
- `twitter:description` — Same as og:description

Use TanStack Start's `createFileRoute` meta or head configuration to inject these tags server-side so crawlers can read them.

**Files to modify:**
- `app/app/routes/theme/$slug.tsx` — Add meta/head tags using route meta configuration
- `app/app/routes/__root.tsx` — Ensure default OG tags exist as fallbacks for non-theme pages

### 2. OG Image Generation Endpoint

Create a Convex HTTP endpoint (or a server route) that renders a simple OG image (1200×630) for each theme showing:

- Theme name
- Color palette swatches (background, foreground, primary, secondary, accent, muted)
- Author name
- Star count

This can be done with an SVG-based approach:
- Create an HTTP endpoint at `/api/og/:slug` in `convex/http.ts`
- Generate an SVG string with the theme's colors rendered as swatches and text
- Return it with `Content-Type: image/svg+xml`
- Reference this URL in `og:image` meta tag

**Files to modify:**
- `app/convex/http.ts` — Add OG image endpoint

### 3. Improved Share Dropdown

Replace the single "copy link" share button on the theme detail page with a dropdown menu offering:

- **Copy link** — Current behavior, copies URL to clipboard
- **Share on X/Twitter** — Opens Twitter intent URL with pre-filled text: "{theme name} on themedrops {url}"
- **Share on Reddit** — Opens Reddit submit URL
- **Embed code** — Copies an `<iframe>` embed snippet to clipboard (pointing to a future `/embed/theme/$slug` route, or just a link for now)

Use a simple dropdown/popover — no new dependencies needed, just a button that toggles a positioned menu.

**Files to modify:**
- `app/app/routes/theme/$slug.tsx` — Replace share button with dropdown component

### 4. Default Meta Tags for Other Pages

Add sensible default OG tags to the root layout for pages that don't set their own:

- `og:title` — "themedrops — discover and share color themes"
- `og:description` — "Browse, create, and share beautiful color themes for your apps, VS Code, and more."
- `og:url` — Site root URL
- `og:site_name` — "themedrops"
- `twitter:card` — "summary"

**Files to modify:**
- `app/app/routes/__root.tsx` — Add default meta tags

## Acceptance Criteria

- [ ] Sharing a theme URL on Twitter/Discord/Slack shows: theme name, description, and color palette preview image
- [ ] The OG image endpoint returns a valid SVG showing the theme's colors
- [ ] The share button opens a dropdown with Copy Link, Share on X, Share on Reddit options
- [ ] Non-theme pages have sensible default OG tags
- [ ] All meta tags are rendered server-side (visible in page source)
- [ ] Existing share (copy link) functionality still works

## Technical Notes

- TanStack Start supports route-level `meta` or `head` exports for SSR meta tags — check the docs or existing patterns in the codebase
- The SVG OG image approach avoids needing headless browsers or canvas — it's fast and works in Convex HTTP endpoints
- Social platforms cache OG tags aggressively — during development, use Twitter's Card Validator or opengraph.xyz to test
- Keep the share dropdown simple — a `useState` toggle with absolute positioning, no external popover library needed
