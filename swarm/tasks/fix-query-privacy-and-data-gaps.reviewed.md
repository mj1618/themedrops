# Fix private theme leaks in queries and comment user info gap

## Context
The reviewed CRUD task (convex-crud-functions.reviewed.md) fixed `themes.list` to filter by `isPublic`, but three other theme queries still return private themes to any caller. Additionally, `comments.listByTheme` returns raw `userId` fields without resolving user info, making it impossible for the frontend to display commenter names/avatars. Finally, `users.ensureUser` doesn't guarantee username uniqueness.

These are all bugs in existing functions — no new features, just making what's already built actually work correctly.

## Tasks

### 1. `themes.getBySlug` leaks private themes
**File:** `app/convex/themes.ts`, `getBySlug` (line ~17)

Currently returns any theme by slug regardless of `isPublic`. A user who guesses or knows a slug can view someone else's private theme.

**Fix:** After fetching the theme, check `isPublic`. If the theme is private, only return it if the requesting user is the author. Otherwise return `null`.

```ts
const theme = await ctx.db.query("themes")
  .withIndex("by_slug", (q) => q.eq("slug", args.slug))
  .unique();
if (!theme) return null;
if (!theme.isPublic) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db.query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user || theme.authorId !== user._id) return null;
}
return theme;
```

### 2. `themes.getByAuthor` leaks private themes
**File:** `app/convex/themes.ts`, `getByAuthor` (line ~27)

Returns all themes for an author, including private ones, to any caller. A profile page would show themes the viewer shouldn't see.

**Fix:** Check if the requesting user is the author. If so, return all themes. Otherwise, filter to only public themes.

```ts
handler: async (ctx, args) => {
  const identity = await ctx.auth.getUserIdentity();
  let currentUserId = null;
  if (identity) {
    const user = await ctx.db.query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (user) currentUserId = user._id;
  }

  const themes = await ctx.db.query("themes")
    .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
    .take(50);

  if (currentUserId === args.authorId) return themes;
  return themes.filter((t) => t.isPublic);
}
```

### 3. `themes.search` leaks private themes
**File:** `app/convex/themes.ts`, `search` (line ~37)

Search results include private themes. Anyone can discover private themes by searching for their name.

**Fix:** Filter results to only public themes after the search query. (Convex search indexes don't support compound filters, so post-filter is the only option here.)

```ts
handler: async (ctx, args) => {
  const results = await ctx.db.query("themes")
    .withSearchIndex("search_name", (q) => q.search("name", args.name))
    .take(40); // fetch extra to compensate for filtering
  return results.filter((t) => t.isPublic).slice(0, 20);
}
```

### 4. `comments.listByTheme` doesn't include user info
**File:** `app/convex/comments.ts`, `listByTheme` (line ~4)

Returns comment documents with `userId` as an opaque ID. The frontend needs username, displayName, and avatarUrl to render comments. Without this, the frontend would need to make N additional queries (one per commenter) which is inefficient and awkward.

**Fix:** Join user data onto each comment before returning.

```ts
handler: async (ctx, args) => {
  const comments = await ctx.db.query("comments")
    .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
    .order("asc")
    .take(100);

  return Promise.all(
    comments.map(async (comment) => {
      const user = await ctx.db.get(comment.userId);
      return {
        ...comment,
        author: user
          ? { username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl }
          : null,
      };
    })
  );
}
```

### 5. `users.ensureUser` doesn't guarantee unique usernames
**File:** `app/convex/users.ts`, `ensureUser` (line ~56)

The username is derived from `identity.nickname` or email prefix with no uniqueness check. If two users share the same email prefix (e.g. `matt@gmail.com` and `matt@yahoo.com`), the second insert may create a duplicate. Since `getByUsername` uses `.unique()`, this could cause runtime errors when looking up profiles.

**Fix:** After deriving the base username, check for collisions and append a suffix if needed, similar to the `uniqueSlug` pattern in themes.ts.

```ts
let baseUsername = identity.nickname ?? identity.email?.split("@")[0] ?? "user";
let username = baseUsername;
let suffix = 2;
while (
  await ctx.db.query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique()
) {
  username = `${baseUsername}-${suffix}`;
  suffix++;
}
```

## Acceptance criteria
- `themes.getBySlug` returns `null` for private themes unless the requester is the author
- `themes.getByAuthor` only includes private themes when the requester is the author
- `themes.search` never returns private themes
- `comments.listByTheme` returns comments with `author: { username, displayName, avatarUrl }` joined
- `users.ensureUser` never creates a user with a duplicate username
- All functions still type-check: `npx convex dev --typecheck=enable --once`

## Completion notes

All five fixes implemented and type-checked successfully:

1. **`themes.getBySlug`** — now checks `isPublic`; private themes only returned to the author.
2. **`themes.getByAuthor`** — resolves the requesting user; returns all themes to the author, only public themes to others.
3. **`themes.search`** — post-filters to `isPublic` only (fetches 40, filters, slices to 20).
4. **`comments.listByTheme`** — joins user data (`username`, `displayName`, `avatarUrl`) onto each comment via `Promise.all`.
5. **`users.ensureUser`** — loops with `by_username` index to find a unique username, appending `-2`, `-3`, etc. on collision.

Typecheck passed: `npx convex dev --typecheck=enable --once` ✔

## Review notes

**Reviewer:** Claude Code (automated review)
**Date:** 2026-03-26
**Result:** Approved — all 5 fixes correctly implemented.

### Verification

- All five changes match the acceptance criteria.
- `npx convex dev --typecheck=enable --once` passes cleanly.
- Code patterns follow Convex guidelines (proper index usage, correct validator types).

### Per-fix assessment

1. **`getBySlug` privacy** — Correctly guards private themes; only the author (resolved via `by_token` index) can see them.
2. **`getByAuthor` privacy** — Correctly resolves requesting user and compares IDs; returns all themes only when requester === author.
3. **`search` privacy** — Post-filter approach is the right pattern since Convex search indexes don't support compound filters. Over-fetching 40 to get 20 after filtering is reasonable.
4. **`comments.listByTheme` user join** — Uses `db.get` by ID (O(1)), handles missing users gracefully with `null` author.
5. **`ensureUser` username uniqueness** — Loop with suffix correctly prevents duplicates using the existing `by_username` index.

### Out-of-scope note

`themes.fork` still allows forking private themes by ID (no `isPublic` check). This is pre-existing and was not part of this task, but should be addressed in a follow-up.
