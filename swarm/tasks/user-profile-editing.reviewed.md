# User Profile Editing

Users can sign up and view their profile, but there's no way to edit profile details (display name, bio, avatar). The `users.updateProfile` mutation already exists in `app/convex/users.ts:24` — this task adds the UI to use it.

## Context

- Schema fields: `displayName`, `bio`, `avatarUrl` (all optional strings) — `app/convex/schema.ts:15-18`
- Mutation: `users.updateProfile` accepts all three fields — `app/convex/users.ts:24-41`
- Current profile page: `app/app/routes/user/$username.tsx` — read-only, no edit link
- Header links to profile via username — `app/app/components/Header.tsx:41-50`

## Tasks

### 1. Create the settings route
- [x] Create `app/app/routes/settings.tsx` with a `createFileRoute("/settings")`
- [x] Auth guard: if no `currentUser`, redirect to home or show auth modal
- [x] Use `useQuery(api.users.currentUser)` to load current profile data
- [x] Show loading skeleton while user data loads

### 2. Build the profile edit form
- [x] Display name field (text input, prefilled from current value)
- [x] Bio field (textarea, prefilled, reasonable max length like 200 chars)
- [x] Avatar URL field (text input, prefilled) with a live preview of the avatar image (or fallback to initial letter)
- [x] Save button that calls `useMutation(api.users.updateProfile)`
- [x] Show saving/success/error states (disable button while saving, show brief success toast or message, show error if mutation fails)
- [x] Style consistently with existing forms (see `ThemeForm.tsx` for reference patterns — rounded inputs, td-* color classes, similar spacing)

### 3. Add navigation to settings
- [x] Add an "Edit Profile" button/link on the profile page (`/user/$username`) — only visible when viewing your own profile (compare `currentUser._id` or `currentUser.username` with the route param)
- [x] Add a "Settings" or "Edit Profile" link in the Header user menu area (next to the username link, or as a dropdown item)

### 4. Handle edge cases
- [x] Trim whitespace from display name and bio before saving
- [x] If display name is cleared, the profile and header should gracefully fall back to username (already handled in existing display logic)
- [x] Validate avatar URL is a valid URL format before saving (basic check), or allow empty to clear
- [x] After successful save, the profile page and header should reactively update (Convex queries auto-update, so just verify this works)

### 5. Test in browser
- [ ] Sign up or sign in as a user
- [ ] Navigate to settings from header and from profile page
- [ ] Edit display name, bio, and avatar URL — verify save works
- [ ] Verify profile page reflects changes immediately
- [ ] Verify header reflects display name change immediately
- [ ] Test with empty/cleared fields — graceful fallbacks
- [ ] Test unauthenticated access to /settings — should redirect or show auth prompt
- [ ] Test that one user cannot see another user's edit button on their profile

## Completion Notes

Implemented by adding:
- **`app/app/routes/settings.tsx`** — New settings page with profile edit form (display name, bio, avatar URL), auth guard, loading skeleton, URL validation, whitespace trimming, success/error feedback, and "Back to Profile" navigation
- **`app/app/routes/user/$username.tsx`** — Added `EditProfileButton` component that only renders when viewing your own profile, linking to `/settings`
- **`app/app/components/Header.tsx`** — Added gear icon link to `/settings` next to the user profile link

Browser testing tasks left unchecked as they require a running dev server and manual verification.

## Review Notes

Reviewed by code review agent on 2026-03-28. Found and fixed three issues:

### Bug fixes
1. **Avatar image not displayed on profile page** (`app/app/routes/user/$username.tsx`): The profile header only rendered the letter-fallback avatar, never the actual `avatarUrl` image. Added conditional rendering to show `<img>` when `user.avatarUrl` is set.

2. **Avatar image not displayed in header** (`app/app/components/Header.tsx`): Same issue — the header user link only showed the letter-fallback circle. Added conditional rendering to show the avatar image when available.

3. **Fragile DOM manipulation in avatar preview** (`app/app/routes/settings.tsx`): The settings form avatar preview used direct DOM manipulation (`style.display = "none"`, `classList.remove("hidden")`) in the `onError` handler to toggle between the image and letter fallback. This is non-idiomatic React and fragile (depends on DOM sibling order). Replaced with React state (`avatarError` + `useEffect` to reset on URL change).

### Code quality observations (no action needed)
- Bio has 200-char limit in UI but not server-side — acceptable for an MVP since the mutation is auth-gated.
- Form state initializes once from props; won't sync if data changes externally (e.g., another tab). Standard form behavior.
- Browser testing could not fully verify authenticated flows since no `.env.local` with a real Convex URL is configured in this checkout.
