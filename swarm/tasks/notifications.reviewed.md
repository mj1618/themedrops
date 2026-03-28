# Notifications System

Add an in-app notification system so users know when someone stars, comments on, or forks one of their themes.

## Schema

Add a `notifications` table to `app/convex/schema.ts`:

```
notifications: defineTable({
  userId: v.id("users"),          // recipient
  type: v.union(v.literal("star"), v.literal("comment"), v.literal("fork")),
  actorId: v.id("users"),         // who triggered it
  themeId: v.id("themes"),        // which theme
  read: v.boolean(),
})
  .index("by_user", ["userId", "_creationTime"])
  .index("by_user_unread", ["userId", "read"])
```

## Backend — `app/convex/notifications.ts`

- [ ] `list` — paginated query: fetch notifications for the current user, sorted newest first, enriched with actor displayName/username and theme name/slug
- [ ] `markAsRead` — mutation: mark a single notification as read
- [ ] `markAllAsRead` — mutation: mark all unread notifications for current user as read
- [ ] `unreadCount` — query: return count of unread notifications for current user (used for the badge)
- [ ] `internal.createNotification` — internal mutation: create a notification (called from other mutations). Skip if actor === theme author (don't notify yourself)

## Emit notifications from existing mutations

- [ ] In `app/convex/themes.ts` — `star` mutation: after starring, create a "star" notification for the theme author
- [ ] In `app/convex/comments.ts` — `create` mutation: after commenting, create a "comment" notification for the theme author
- [ ] In `app/convex/themes.ts` — `fork` mutation: after forking, create a "fork" notification for the original theme author

Use `ctx.runMutation(internal.notifications.createNotification, ...)` from each mutation.

## Frontend — Notification Bell in Header

- [ ] Add a `NotificationBell` component in `app/app/components/NotificationBell.tsx`
  - Bell icon in the header (next to existing nav items)
  - Red badge showing unread count (hidden when 0)
  - Clicking opens a dropdown panel
- [ ] Dropdown panel shows recent notifications:
  - Each notification shows: actor name, action text ("starred your theme", "commented on", "forked"), theme name as a link, and relative time
  - Unread notifications have a subtle highlight/dot
  - "Mark all as read" button at the top
  - Clicking a notification marks it as read and navigates to the theme
  - Empty state: "No notifications yet"
- [ ] Wire the `NotificationBell` into `app/app/components/Header.tsx` (only show when user is logged in)

## Styling

- Match the existing design system: use `td-*` CSS variables, same border/rounded styles as the rest of the app
- Dropdown should have a max-height with scroll, backdrop blur consistent with other overlays
- Close dropdown when clicking outside

## Testing

- [ ] Open browser, create two users
- [ ] With user B, star/comment/fork a theme by user A
- [ ] Switch to user A — verify bell shows unread count, dropdown shows correct notifications
- [ ] Click a notification — verify it navigates to the theme and marks as read
- [ ] Click "Mark all as read" — verify badge clears

## Completion Notes

All items implemented:

- **Schema**: Added `notifications` table with `by_user` and `by_user_unread` indexes to `schema.ts`
- **Backend** (`convex/notifications.ts`): `list` (paginated, enriched), `unreadCount`, `markAsRead`, `markAllAsRead`, `createNotification` (internal, skips self-notifications)
- **Emitters**: Wired `createNotification` into `toggleStar` (star only, not unstar), `fork` in `themes.ts`, and `create` in `comments.ts`
- **Frontend** (`NotificationBell.tsx`): Bell icon with unread badge, dropdown with notification list, mark-as-read on click, mark-all-as-read button, outside-click/Escape to close, load-more pagination, empty state
- **Header**: NotificationBell added next to settings icon, only visible when logged in
- **Generated types**: Updated `api.d.ts` to include notifications module
