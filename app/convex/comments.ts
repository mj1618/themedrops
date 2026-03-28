import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const listByTheme = query({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .collect();

    const session = await auth.getSessionId(ctx);
    let currentUserId: string | null = null;
    if (session) {
      const sessionDoc = await ctx.db.query("authSessions").filter((q) => q.eq(q.field("_id"), session)).first();
      currentUserId = sessionDoc?.userId ?? null;
    }

    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          author: user
            ? {
                username: user.username ?? "unknown",
                displayName: user.displayName ?? user.username ?? "Unknown",
                avatarUrl: user.avatarUrl,
              }
            : { username: "unknown", displayName: "Unknown" },
          isOwner: currentUserId === comment.userId,
        };
      })
    );
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const comments = await ctx.db.query("comments").order("desc").take(limit);

    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const theme = await ctx.db.get(comment.themeId);
        return {
          ...comment,
          author: user
            ? {
                username: user.username ?? "unknown",
                displayName: user.displayName ?? user.username ?? "Unknown",
              }
            : { username: "unknown", displayName: "Unknown" },
          theme: theme
            ? { name: theme.name, slug: theme.slug }
            : { name: "Deleted", slug: "" },
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    themeId: v.id("themes"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("comments", {
      userId,
      themeId: args.themeId,
      body: args.body,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
