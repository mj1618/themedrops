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

    // Get tags by count (most popular first) and filter by prefix
    const allTags = await ctx.db
      .query("tags")
      .withIndex("by_count")
      .order("desc")
      .take(200);

    return allTags.filter((tag) => tag.name.startsWith(q)).slice(0, 10);
  },
});

export const getThemesByTag = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const tag = args.tag.toLowerCase().trim();

    // We need to scan public themes and filter by tag presence
    // Using by_stars index for a reasonable ordering
    const results = await ctx.db
      .query("themes")
      .withIndex("by_stars")
      .order("desc")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .paginate(args.paginationOpts);

    // Filter to only themes containing this tag
    const filteredPage = results.page.filter(
      (theme) => theme.tags && theme.tags.includes(tag)
    );

    const pageWithAuthors = await Promise.all(
      filteredPage.map(async (theme) => {
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
      ...results,
      page: pageWithAuthors,
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
