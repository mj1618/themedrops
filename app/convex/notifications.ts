import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const results = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const enriched = await Promise.all(
      results.page.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId);
        const theme = await ctx.db.get(notification.themeId);
        return {
          ...notification,
          actor: actor
            ? {
                username: actor.username ?? "unknown",
                displayName: actor.displayName ?? actor.username ?? "Unknown",
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
      page: enriched,
    };
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("star"), v.literal("comment"), v.literal("fork")),
    actorId: v.id("users"),
    themeId: v.id("themes"),
  },
  handler: async (ctx, args) => {
    // Don't notify yourself
    if (args.actorId === args.userId) return;

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      actorId: args.actorId,
      themeId: args.themeId,
      read: false,
    });
  },
});
