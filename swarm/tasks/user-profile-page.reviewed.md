# Build user profile page

## Completion Notes
- Created `/user/[username]` profile page with avatar (initial fallback), display name, username, bio, stats
- Added tabbed sections for user's themes and starred themes, reusing ThemeCard style
- Profile owner gets "Edit Profile" button for inline editing of display name and bio
- Added author name links on homepage ThemeCards (with stopPropagation) and theme detail page
- Handles loading and not-found states; consistent header with ThemeDrops logo, CreateThemeLink, AuthControls
- Build passes cleanly

## Review Notes
Reviewed by Claude on 2026-03-28. All acceptance criteria verified via code review and browser testing (Playwright).

### Issues found and fixed
- **Bug: could not clear display name or bio once set.** `handleSave` converted empty strings to `undefined` (`editDisplayName.trim() || undefined`), but the `updateProfile` mutation only patches fields that are not `undefined`. This meant once a user set a bio, clearing the field would leave the old value in place. Fixed by passing the trimmed string directly (empty string `""` is valid per schema).

### Verification
- Build passes cleanly (`next build`)
- Browser tests confirmed:
  - Homepage shows author links (11 found), clicking navigates to `/user/{username}` (not theme)
  - `/user/nonexistent_user_12345` shows "User not found" message with header
  - Profile page shows avatar (initial fallback), display name, @username, bio, stats, Themes/Starred tabs
  - Theme detail page shows clickable author link to `/user/{username}`
  - Consistent header with ThemeDrops logo and auth controls on all states (loading, not-found, profile)
- Only safe fields displayed from `getByUsername` (displayName, username, bio, avatarUrl)

## Context
The PLAN says "Users should have a profile page similar to like a youtube profile." The backend already has all the queries needed (`users.getByUsername`, `themes.getByAuthor`, `stars.getStarredThemes`, `users.updateProfile`), but there is no frontend page. Author names on the homepage gallery cards and theme detail page are plain text — not links. This is a critical MVP gap: users who create themes have no public presence on the site.

## Requirements

### 1. Create the profile page route at `app/src/app/user/[username]/page.tsx`
- Fetch user by username via `api.users.getByUsername`
- Show 404-style message if user not found
- Display: avatar (or initial fallback), display name, username, bio
- Show the user's public themes using `api.themes.getByAuthor` in a grid of ThemeCards (reuse the same card style as the homepage)
- Show the user's starred themes using `api.stars.getStarredThemes` in a separate tab or section
- Include theme count and star count stats
- If the viewer is the profile owner, show an "Edit Profile" button that allows editing displayName and bio via `api.users.updateProfile`

### 2. Make author names link to profiles
- **Homepage (`app/src/app/page.tsx`)**: The author name in `ThemeCard` should link to `/user/{username}`. The `useQuery(api.users.get, ...)` call already returns username — wrap the author name in a `<Link>`.
- **Theme detail page (`app/src/app/theme/[slug]/page.tsx`)**: The "by {author}" line should link to `/user/{username}`.
- Links should use `event.stopPropagation()` or be nested correctly so clicking the author name navigates to the profile, not the theme.

### 3. Include site header consistency
- Use the same header pattern as the theme detail page (ThemeDrops logo link, CreateThemeLink, AuthControls).

## Backend queries already available
- `users.getByUsername({ username })` — returns full user doc
- `users.getCurrentUser()` — returns current signed-in user
- `users.updateProfile({ displayName?, bio?, avatarUrl? })` — mutation
- `themes.getByAuthor({ authorId })` — returns user's themes (filters private unless viewer is owner)
- `stars.getStarredThemes({ userId })` — returns themes the user has starred

## Important notes
- `users.get` (used on homepage cards) returns `{ _id, username, displayName, avatarUrl }` — username is already available for building the link URL
- The `getByUsername` query returns the full user doc including `bio` — but does NOT filter sensitive fields. Only display: `_id`, `username`, `displayName`, `bio`, `avatarUrl`.
- Keep the design consistent with the existing pages (gray-50 bg, white cards, same typography scale)
- The profile page should look good even if the user has zero themes

## Acceptance criteria
- [x] `/user/{username}` renders a profile page with user info and their themes
- [x] Visiting a non-existent username shows a "User not found" message
- [x] Author names on homepage cards link to `/user/{username}`
- [x] Author name on theme detail page links to `/user/{username}`
- [x] Profile owner can edit their display name and bio inline
- [x] Page includes consistent site header with nav back to home
