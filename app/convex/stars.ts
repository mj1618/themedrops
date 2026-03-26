import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const isStarred = query({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return false;

    const star = await ctx.db
      .query("stars")
      .withIndex("by_user_and_theme", (q) =>
        q.eq("userId", user._id).eq("themeId", args.themeId)
      )
      .unique();

    return star !== null;
  },
});

export const toggle = mutation({
  args: { themeId: v.id("themes") },
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

    const existing = await ctx.db
      .query("stars")
      .withIndex("by_user_and_theme", (q) =>
        q.eq("userId", user._id).eq("themeId", args.themeId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.themeId, {
        starCount: Math.max(0, theme.starCount - 1),
      });
      return false;
    } else {
      await ctx.db.insert("stars", {
        userId: user._id,
        themeId: args.themeId,
      });
      await ctx.db.patch(args.themeId, {
        starCount: theme.starCount + 1,
      });
      return true;
    }
  },
});

export const getStarredThemes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId = null;
    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (viewer) currentUserId = viewer._id;
    }

    const stars = await ctx.db
      .query("stars")
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
  },
});
