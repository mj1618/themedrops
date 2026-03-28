import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByTheme = query({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    const theme = await ctx.db.get(args.themeId);
    if (!theme) return [];
    if (!theme.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
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
            ? {
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    // Get recent comments across all themes, filter to public themes
    const allRecent = await ctx.db
      .query("comments")
      .order("desc")
      .take(50);

    const results = [];
    for (const comment of allRecent) {
      const theme = await ctx.db.get(comment.themeId);
      if (!theme || !theme.isPublic) continue;
      const user = await ctx.db.get(comment.userId);
      results.push({
        _id: comment._id,
        _creationTime: comment._creationTime,
        body: comment.body.length > 100 ? comment.body.slice(0, 100) + "..." : comment.body,
        author: user
          ? {
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            }
          : null,
        theme: { name: theme.name, slug: theme.slug },
      });
      if (results.length >= 10) break;
    }
    return results;
  },
});

export const create = mutation({
  args: {
    themeId: v.id("themes"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const theme = await ctx.db.get(args.themeId);
    if (!theme) throw new Error("Theme not found");
    if (!theme.isPublic && theme.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    return await ctx.db.insert("comments", {
      userId: user._id,
      themeId: args.themeId,
      body: args.body,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
