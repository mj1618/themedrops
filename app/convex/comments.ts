import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByTheme = query({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .order("asc")
      .take(100);
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
