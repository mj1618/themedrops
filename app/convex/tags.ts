import { v } from "convex/values";
import { query, MutationCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const listPopular = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tags")
      .withIndex("by_count")
      .order("desc")
      .take(30);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const q = args.query.toLowerCase().trim();
    if (!q) return [];

    // Use the by_name index with range queries for prefix matching
    const matchingTags = await ctx.db
      .query("tags")
      .withIndex("by_name", (idx) =>
        idx.gte("name", q).lt("name", q.slice(0, -1) + String.fromCharCode(q.charCodeAt(q.length - 1) + 1))
      )
      .take(10);

    // Sort by count descending so most popular matches appear first
    return matchingTags.sort((a, b) => b.count - a.count);
  },
});

export const getThemesByTag = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const tag = args.tag.toLowerCase().trim();

    // Pagination with post-filter on array field is unreliable (pages can be
    // empty even when more results exist). Instead, scan a generous batch of
    // public themes and filter for the tag, then return a synthetic paginated
    // result so the frontend usePaginatedQuery still works.
    const SCAN_LIMIT = 500;
    const allThemes = await ctx.db
      .query("themes")
      .withIndex("by_stars")
      .order("desc")
      .take(SCAN_LIMIT);

    const matching = allThemes.filter(
      (theme) => theme.isPublic && theme.tags && theme.tags.includes(tag)
    );

    // Manual pagination over the filtered results
    const numItems = args.paginationOpts.numItems;
    const cursorIdx =
      args.paginationOpts.cursor !== null && args.paginationOpts.cursor !== ""
        ? parseInt(args.paginationOpts.cursor, 10)
        : 0;
    const page = matching.slice(cursorIdx, cursorIdx + numItems);
    const nextIdx = cursorIdx + numItems;
    const isDone = nextIdx >= matching.length;

    const pageWithAuthors = await Promise.all(
      page.map(async (theme) => {
        const author = await ctx.db.get(theme.authorId);
        return {
          ...theme,
          author: author
            ? {
                username: author.username ?? "unknown",
                displayName: author.displayName ?? author.username ?? "Unknown",
              }
            : { username: "unknown", displayName: "Unknown" },
        };
      })
    );

    return {
      page: pageWithAuthors,
      isDone,
      continueCursor: isDone ? "" : String(nextIdx),
    };
  },
});

// Helper functions for tag count management (used by theme mutations)

export async function incrementTagCounts(
  ctx: MutationCtx,
  tags: string[]
) {
  for (const tag of tags) {
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", tag))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("tags", { name: tag, count: 1 });
    }
  }
}

export async function decrementTagCounts(
  ctx: MutationCtx,
  tags: string[]
) {
  for (const tag of tags) {
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", tag))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        count: Math.max(0, existing.count - 1),
      });
    }
  }
}
