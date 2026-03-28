import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const listByTheme = query({
  args: {
    themeId: v.id("themes"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("comments")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .paginate(args.paginationOpts);

    const session = await auth.getSessionId(ctx);
    let currentUserId: string | null = null;
    if (session) {
      const sessionDoc = await ctx.db.query("authSessions").filter((q) => q.eq(q.field("_id"), session)).first();
      currentUserId = sessionDoc?.userId ?? null;
    }

    const pageWithAuthors = await Promise.all(
      results.page.map(async (comment) => {
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

    return {
      ...results,
      page: pageWithAuthors,
    };
  },
});

export const listRecent = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("comments")
      .order("desc")
      .paginate(args.paginationOpts);

    const pageWithDetails = await Promise.all(
      results.page.map(async (comment) => {
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

    return {
      ...results,
      page: pageWithDetails,
    };
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

    const commentId = await ctx.db.insert("comments", {
      userId,
      themeId: args.themeId,
      body: args.body,
    });

    const theme = await ctx.db.get(args.themeId);
    if (theme) {
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: theme.authorId,
        type: "comment",
        actorId: userId,
        themeId: args.themeId,
      });
    }

    return commentId;
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
