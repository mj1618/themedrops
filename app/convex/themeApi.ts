import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getPublicBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!theme || !theme.isPublic) return null;

    const author = await ctx.db.get(theme.authorId);

    return {
      name: theme.name,
      slug: theme.slug,
      description: theme.description,
      author: author?.username ?? null,
      forkedFromId: theme.forkedFromId ?? null,
      isPublic: theme.isPublic,
      starCount: theme.starCount,
      colors: theme.colors,
      fonts: theme.fonts ?? null,
    };
  },
});

export const listPublic = internalQuery({
  args: { limit: v.number(), cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("themes")
      .withIndex("by_public_and_star_count", (q) => q.eq("isPublic", true))
      .order("desc")
      .paginate({ numItems: args.limit, cursor: args.cursor });

    const themes = [];
    for (const theme of result.page) {
      const author = await ctx.db.get(theme.authorId);
      themes.push({
        name: theme.name,
        slug: theme.slug,
        description: theme.description,
        author: author?.username ?? null,
        starCount: theme.starCount,
        colors: theme.colors,
      });
    }

    return {
      themes,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});
