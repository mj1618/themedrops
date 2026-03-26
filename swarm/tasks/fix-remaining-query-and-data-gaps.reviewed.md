# Fix remaining query performance, privacy, and data integrity gaps

## Completion Notes
All three fixes applied and type-checked successfully (`npx convex dev --typecheck=enable --once` passed):

1. **`themes.list`** — Replaced `.withIndex("by_star_count").filter()` with `.withIndex("by_public_and_star_count", (q) => q.eq("isPublic", true))` to use the compound index properly.
2. **`comments.listByTheme`** — Added theme accessibility check: fetches the theme, returns `[]` if it's private and the viewer isn't the author (or isn't authenticated).
3. **`themes.remove`** — Wrapped star and comment cleanup in `do...while` loops that continue until fewer than 500 records are returned, ensuring all associated records are deleted.

## Context
Previous review tasks fixed privacy leaks in most queries and corrected `themeApi.listPublic` to use the compound `by_public_and_star_count` index instead of `.filter()`. However, three gaps in existing functions were missed:

1. `themes.list` (the main client-facing query) still uses `.filter()` — the exact bug fixed in `themeApi.listPublic` during the theme-api-endpoint review.
2. `comments.listByTheme` returns comments for any theme without checking if the theme is accessible — leaking activity on private themes.
3. `themes.remove` uses `.take(500)` when cleaning up stars and comments — if a popular theme has >500 of either, orphaned records will remain after deletion.

## Tasks

### 1. `themes.list` uses `.filter()` instead of compound index
**File:** `app/convex/themes.ts`, `list` query (line ~5)

Currently:
```ts
return await ctx.db
  .query("themes")
  .withIndex("by_star_count")
  .order("desc")
  .filter((q) => q.eq(q.field("isPublic"), true))
  .paginate(args.paginationOpts);
```

This scans all themes in the `by_star_count` index and post-filters, which Convex guidelines explicitly prohibit. The compound index `by_public_and_star_count` already exists (added during the theme-api-endpoint review) but this query wasn't updated.

**Fix:** Switch to the compound index:
```ts
return await ctx.db
  .query("themes")
  .withIndex("by_public_and_star_count", (q) => q.eq("isPublic", true))
  .order("desc")
  .paginate(args.paginationOpts);
```

### 2. `comments.listByTheme` doesn't check theme accessibility
**File:** `app/convex/comments.ts`, `listByTheme` query (line ~4)

Anyone can call `listByTheme` with any `themeId` and get all comments, even for private themes they don't own. While comments on private themes can only be created by the author (the `create` mutation checks access), this still leaks information about private theme activity and existence.

**Fix:** Fetch the theme and check accessibility before returning comments. If the theme is private and the viewer isn't the author, return an empty array.

```ts
handler: async (ctx, args) => {
  const theme = await ctx.db.get(args.themeId);
  if (!theme) return [];
  if (!theme.isPublic) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || theme.authorId !== user._id) return [];
  }

  const comments = await ctx.db
    .query("comments")
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

### 3. `themes.remove` can orphan stars and comments
**File:** `app/convex/themes.ts`, `remove` mutation (line ~201)

Uses `.take(500)` for both stars and comments cleanup. If a theme has more than 500 stars or 500 comments, the excess records become orphaned — referencing a deleted theme. This causes:
- `stars.getStarredThemes` to silently skip orphaned stars (the `db.get` returns null), wasting reads
- Potential confusion if the themeId is ever reused (unlikely with Convex IDs but still unclean)

**Fix:** Use a loop to delete all records, not just the first 500:

```ts
// Clean up all associated stars
let stars;
do {
  stars = await ctx.db
    .query("stars")
    .withIndex("by_theme", (q) => q.eq("themeId", args.id))
    .take(500);
  for (const star of stars) {
    await ctx.db.delete(star._id);
  }
} while (stars.length === 500);

// Clean up all associated comments
let comments;
do {
  comments = await ctx.db
    .query("comments")
    .withIndex("by_theme", (q) => q.eq("themeId", args.id))
    .take(500);
  for (const comment of comments) {
    await ctx.db.delete(comment._id);
  }
} while (comments.length === 500);
```

Note: For very popular themes this could hit Convex transaction limits. If that's a concern, an alternative is to use a scheduled function for cleanup. But for MVP, the loop is sufficient since themes are unlikely to have thousands of stars/comments.

## Review Notes

**Reviewed 2026-03-26. All three fixes verified correct.**

1. `themes.list` (line 10) — confirmed using `by_public_and_star_count` compound index with `.eq("isPublic", true)`. No `.filter()` call present.
2. `comments.listByTheme` (lines 7-18) — confirmed theme accessibility check: fetches theme, returns `[]` for missing themes, private themes with no auth, and private themes where viewer isn't the author.
3. `themes.remove` (lines 218-240) — confirmed `do...while` loops for both stars and comments that continue until batch size < 500.
4. Typecheck passes: `npx convex dev --typecheck=enable --once` succeeded.
5. No bugs, logic errors, or missing edge cases found.

No fixes needed.

## Acceptance criteria
- `themes.list` uses `by_public_and_star_count` index with `.eq("isPublic", true)` — no `.filter()` call
- `comments.listByTheme` returns `[]` for private themes the viewer doesn't own, and `[]` for unauthenticated viewers on private themes
- `themes.remove` deletes all associated stars and comments, not just the first 500
- All functions still type-check: `npx convex dev --typecheck=enable --once`
