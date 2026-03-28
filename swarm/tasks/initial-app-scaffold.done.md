# Initial App Scaffold — Full MVP Foundation

The app directory was deleted and needs to be rebuilt from scratch. This task sets up the complete TanStack Start + Convex application with all core features needed for a shippable MVP.

## Tech Stack (from PLAN.md)

- TanStack Start (on Vercel)
- Tailwind CSS v4
- TypeScript
- Convex.dev (backend)
- Convex Username/Password Auth

## Acceptance Criteria

### 1. Project Setup
- [ ] Initialize TanStack Start app in `./app/` directory
- [ ] Configure Tailwind CSS v4
- [ ] Set up Convex with `npx convex dev` and wire up the provider
- [ ] Configure Convex Username/Password auth (`@convex-dev/auth`)

### 2. Convex Schema & Functions
- [ ] **users** table: username, displayName, bio, avatarUrl, plus auth fields. Index by username.
- [ ] **themes** table: name, slug, description, colors (background, foreground, primary, secondary, accent, muted), fonts (heading, body, mono), starCount, forkOf (optional ref to parent theme), authorId, isPublic. Indexes by slug, authorId, starCount. Search index on name+description.
- [ ] **stars** table: userId, themeId. Unique index on (userId, themeId).
- [ ] **comments** table: userId, themeId, body. Indexes by themeId, userId.
- [ ] Theme CRUD mutations: create (with slug generation), update (owner only), delete (owner only, cascade stars/comments)
- [ ] Theme queries: list (by stars), listNewest, getBySlug, getByAuthor, search, countForks
- [ ] Fork mutation: duplicate theme with new name, set forkOf reference
- [ ] Star toggle mutation with optimistic starCount
- [ ] Comment create/delete mutations (delete = author only)
- [ ] Seed mutation: create a "system" user and at least 8 diverse starter themes

### 3. HTTP API
- [ ] `GET /api/themes` — list public themes, supports `?format=hex|hsl|rgb|oklch` and pagination
- [ ] `GET /api/themes/:slug` — single theme by slug, supports format conversion
- [ ] CORS enabled for all origins
- [ ] Color conversion utilities (hex to/from hsl, rgb, oklch)

### 4. Auth UI
- [ ] Sign up form (username + password)
- [ ] Sign in form
- [ ] Sign out button
- [ ] Auth modal that can be triggered from anywhere
- [ ] Protect create/edit/delete/star/comment/fork actions behind auth

### 5. Homepage
- [ ] Hero section introducing themedrops
- [ ] Sort tabs: Popular (by stars), Newest, Recently Active
- [ ] Search bar for themes
- [ ] Theme card grid — each card is a **live preview of the theme** (use the theme's own colors as the card's background/text/accent colors)
- [ ] Each card shows: name, author, star count, color palette bar, share button
- [ ] Clicking a card navigates to `/theme/[slug]`
- [ ] Pagination (load more or infinite scroll)
- [ ] Recent activity feed showing latest comments

### 6. Theme Detail Page (`/theme/[slug]`)
- [ ] Full theme display with all colors and fonts rendered
- [ ] Star button with count (auth-gated)
- [ ] Fork button with fork count (auth-gated)
- [ ] Share/copy-link button
- [ ] Edit/Delete buttons (visible only to theme owner)
- [ ] Comments section with add/delete
- [ ] Collapsible API documentation section showing:
  - The endpoint URL for this theme
  - Format selector (hex/hsl/rgb/oklch) with live example JSON response
  - Copy button for the endpoint URL
- [ ] If forked, show "Forked from [parent theme]" link

### 7. Theme Create/Edit Page (`/create`, `/theme/[slug]/edit`)
- [ ] Form with: name, description, 6 color pickers, 3 font selectors, public/private toggle
- [ ] Live preview panel showing how the theme looks
- [ ] Validation (name required, unique slug)
- [ ] Edit page pre-fills existing values

### 8. User Profile Page (`/user/[username]`)
- [ ] Display name, username, bio, avatar
- [ ] Grid of user's themes
- [ ] Theme count
- [ ] Author names throughout the app link to profile pages

### 9. Site Theme Switcher
- [ ] CSS custom properties for all theme values (--td-background, --td-foreground, --td-primary, etc.)
- [ ] The site's own styles use these custom properties
- [ ] ThemeProvider context that sets custom properties on `<html>`
- [ ] Theme switcher dropdown in the site header (pick any theme from the gallery)
- [ ] "Apply to site" button on theme detail page
- [ ] Persist selected theme to localStorage
- [ ] Handle SSR/hydration (default theme on server, apply saved theme on client)

### 10. Design Quality
- [ ] The site should look polished and professional — this is a design-oriented project
- [ ] Smooth transitions and animations on cards and interactions
- [ ] Responsive design (mobile + desktop)
- [ ] Consistent spacing, typography, and visual hierarchy
- [ ] Dark default theme that looks great out of the box

## Dependencies
None — this is the foundational task.

## Notes
- Run `npx convex dev` during development to keep the backend in sync
- Seed data should be run on first deploy
- All theme preview cards must use the theme's own colors — this is a core UX requirement from PLAN.md
- The API documentation on the detail page should make it clear how to use themes programmatically

## Completion Notes

Completed on 2026-03-28. Built the full MVP scaffold:

- **TanStack Start** app in `./app/` with Vite, Tailwind CSS v4, TypeScript
- **Convex schema**: users, themes, stars, comments tables with proper indexes and search
- **Convex auth**: Username/password auth via `@convex-dev/auth`
- **Theme CRUD**: create, update, delete, fork, toggle star mutations
- **Theme queries**: list (by stars/newest), getBySlug, getByAuthor, search
- **HTTP API**: `GET /api/themes` and `GET /api/themes/:slug` with `?format=hex|hsl|rgb|oklch` and CORS
- **Color conversion**: hex to RGB, HSL, OKLCH utilities
- **Auth UI**: Sign in/up modal with form validation
- **Homepage**: Hero, sort tabs (Popular/Newest), search bar, theme card grid with live previews, loading skeletons, recent activity feed
- **Theme Detail page**: Full display, star/fork/share buttons, API docs section with format selector, comments section
- **Create/Edit pages**: Form with name, description, 6 color pickers, 3 font selectors, public toggle, and live preview panel
- **User Profile page**: Display name, username, bio, theme grid
- **Site Theme Switcher**: CSS custom properties, ThemeProvider context, dropdown in header, localStorage persistence, SSR-safe
- **Seed mutation**: 10 diverse starter themes under a "themedrops" system user
- **Dark default theme**: Polished dark design with purple accents

The app renders correctly on both server and client. Convex provider gracefully handles missing config (placeholder URL) for development without a connected backend.
