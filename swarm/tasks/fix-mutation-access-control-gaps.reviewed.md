# Fix access control gaps in mutations and remaining queries

## Context
The query privacy fixes (fix-query-privacy-and-data-gaps.reviewed.md) addressed read-side leaks but left write-side and one read-side gap untouched. Several mutations allow actions on private themes that the user doesn't own, and one query leaks private themes through starred-themes lists.

The review notes explicitly flagged: "`themes.fork` still allows forking private themes by ID (no `isPublic` check)."

## Tasks

### 1. `themes.fork` allows forking private themes
**File:** `app/convex/themes.ts`, `fork` mutation (~line 239)

Currently fetches the original theme by ID and copies it without checking `isPublic` or ownership. Any authenticated user who knows (or guesses) a theme ID can fork someone else's private theme, effectively leaking its colors, fonts, and description.

**Fix:** After fetching the original theme, verify it's either public or owned by the requesting user. Throw an error otherwise.

```ts
const original = await ctx.db.get(args.id);
if (!original) throw new Error("Theme not found");
if (!original.isPublic && original.authorId !== user._id) {
  throw new Error("Not authorized");
}
```

### 2. `stars.toggle` allows starring private themes
**File:** `app/convex/stars.ts`, `toggle` mutation (~line 29)

Fetches the theme to update `starCount` but never checks `isPublic`. A user can star a private theme they don't own — the star is silently recorded and the `starCount` is incremented, which also leaks information about the theme's existence.

**Fix:** After fetching the theme, check that it's public or owned by the user. Throw otherwise.

```ts
const theme = await ctx.db.get(args.themeId);
if (!theme) throw new Error("Theme not found");
if (!theme.isPublic && theme.authorId !== user._id) {
  throw new Error("Not authorized");
}
```

### 3. `comments.create` allows commenting on private themes
**File:** `app/convex/comments.ts`, `create` mutation (~line 31)

Inserts a comment referencing a `themeId` without verifying the theme exists or is accessible. A user can comment on a private theme they don't own, or even on a deleted theme (dangling reference).

**Fix:** Fetch the theme and verify it exists and is accessible before inserting the comment.

```ts
const theme = await ctx.db.get(args.themeId);
if (!theme) throw new Error("Theme not found");
if (!theme.isPublic && theme.authorId !== user._id) {
  throw new Error("Not authorized");
}
```

### 4. `stars.getStarredThemes` leaks private themes
**File:** `app/convex/stars.ts`, `getStarredThemes` query (~line 72)

Returns all themes a user has starred, including private themes owned by others. If a theme was public when starred and later made private, it would still show up. Also exposes private themes to any caller viewing another user's starred list.

**Fix:** Filter out private themes that aren't owned by the viewer (the requesting user, not the profile user). If unauthenticated, only return public themes.

```ts
handler: async (ctx, args) => {
  const identity = await ctx.auth.getUserIdentity();
  let currentUserId = null;
  if (identity) {
    const viewer = await ctx.db.query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (viewer) currentUserId = viewer._id;
  }

  const stars = await ctx.db.query("stars")
    .withIndex("by_user_and_theme", (q) => q.eq("userId", args.userId))
    .take(50);

  const themes = [];
  for (const star of stars) {
    const theme = await ctx.db.get(star.themeId);
    if (theme && (theme.isPublic || theme.authorId === currentUserId)) {
      themes.push(theme);
    }
  }
  return themes;
}
```

## Acceptance criteria
- `themes.fork` throws "Not authorized" when forking a private theme the user doesn't own
- `stars.toggle` throws "Not authorized" when starring a private theme the user doesn't own
- `comments.create` throws "Theme not found" for deleted themes and "Not authorized" for inaccessible private themes
- `stars.getStarredThemes` never returns private themes unless the viewer is the theme's author
- All functions still type-check: `npx convex dev --typecheck=enable --once`

## Completion notes

All four fixes applied and verified with `npx convex dev --typecheck=enable --once`:

1. **`themes.fork`** — Added `isPublic`/ownership check after fetching the original theme. Throws "Not authorized" for private themes the user doesn't own.
2. **`stars.toggle`** — Added `isPublic`/ownership check after fetching the theme. Throws "Not authorized" for private themes the user doesn't own.
3. **`comments.create`** — Added theme fetch + existence check + `isPublic`/ownership check before inserting. Throws "Theme not found" for missing themes and "Not authorized" for inaccessible private themes.
4. **`stars.getStarredThemes`** — Added viewer identity resolution and filtered results to only include public themes or themes authored by the viewer.

## Review notes

Reviewed 2026-03-26. All four access control fixes verified:

- **Code correctness**: Each fix uses the consistent pattern `!theme.isPublic && theme.authorId !== user._id` for access checks. Guard placement is correct (before any writes or data returns).
- **Edge cases**: `getStarredThemes` correctly handles unauthenticated viewers (currentUserId stays null, so only public themes pass the filter). `comments.create` correctly differentiates "Theme not found" vs "Not authorized".
- **Typecheck**: `npx convex dev --typecheck=enable --once` passes cleanly.
- **No issues found** — all changes match the task requirements and acceptance criteria.
