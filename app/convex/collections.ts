import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("collections", {
      name: args.name,
      description: args.description,
      userId,
      isPublic: args.isPublic ?? true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.id);
    if (!collection) throw new Error("Collection not found");
    if (collection.userId !== userId) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.id);
    if (!collection) throw new Error("Collection not found");
    if (collection.userId !== userId) throw new Error("Not authorized");

    // Cascade delete items
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const addTheme = mutation({
  args: {
    collectionId: v.id("collections"),
    themeId: v.id("themes"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) throw new Error("Collection not found");
    if (collection.userId !== userId) throw new Error("Not authorized");

    // Prevent duplicates
    const existing = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_theme", (q) =>
        q.eq("collectionId", args.collectionId).eq("themeId", args.themeId)
      )
      .first();
    if (existing) throw new Error("Theme already in collection");

    // Get the next order value
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();
    const order = items.length;

    return await ctx.db.insert("collectionItems", {
      collectionId: args.collectionId,
      themeId: args.themeId,
      order,
    });
  },
});

export const removeTheme = mutation({
  args: {
    collectionId: v.id("collections"),
    themeId: v.id("themes"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) throw new Error("Collection not found");
    if (collection.userId !== userId) throw new Error("Not authorized");

    const item = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_theme", (q) =>
        q.eq("collectionId", args.collectionId).eq("themeId", args.themeId)
      )
      .first();
    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});

export const get = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);
    if (!collection) return null;

    // Resolve current user once
    const session = await auth.getSessionId(ctx);
    let currentUserId = null;
    if (session) {
      const sessionDoc = await ctx.db.get(session);
      currentUserId = sessionDoc?.userId ?? null;
    }
    const isOwner = currentUserId === collection.userId;

    // Check visibility — private collections only visible to owner
    if (!collection.isPublic && !isOwner) return null;

    const owner = await ctx.db.get(collection.userId);

    // Get items with themes
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.id))
      .collect();
    items.sort((a, b) => a.order - b.order);

    const themes = await Promise.all(
      items.map(async (item) => {
        const theme = await ctx.db.get(item.themeId);
        if (!theme || !theme.isPublic) return null;
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
      ...collection,
      owner: owner
        ? {
            username: owner.username ?? "unknown",
            displayName: owner.displayName ?? owner.username ?? "Unknown",
            avatarUrl: owner.avatarUrl,
          }
        : null,
      themes: themes.filter(Boolean),
      isOwner,
    };
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await auth.getSessionId(ctx);
    let currentUserId = null;
    if (session) {
      const sessionDoc = await ctx.db.get(session);
      currentUserId = sessionDoc?.userId ?? null;
    }

    const isOwner = currentUserId === args.userId;

    let collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (!isOwner) {
      collections = collections.filter((c) => c.isPublic);
    }

    // Attach theme count and preview colors
    const withDetails = await Promise.all(
      collections.map(async (collection) => {
        const items = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
          .collect();
        items.sort((a, b) => a.order - b.order);

        // Get first 4 themes for preview colors
        const previewThemes = await Promise.all(
          items.slice(0, 4).map(async (item) => {
            const theme = await ctx.db.get(item.themeId);
            return theme?.isPublic ? theme : null;
          })
        );

        return {
          ...collection,
          themeCount: items.length,
          previewColors: previewThemes
            .filter(Boolean)
            .map((t) => t!.colors),
        };
      })
    );

    return withDetails;
  },
});

export const listMyCollections = query({
  args: { themeId: v.optional(v.id("themes")) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (!args.themeId) return collections.map((c) => ({ ...c, hasTheme: false }));

    // Check which collections contain this theme
    const withStatus = await Promise.all(
      collections.map(async (collection) => {
        const item = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection_and_theme", (q) =>
            q.eq("collectionId", collection._id).eq("themeId", args.themeId!)
          )
          .first();
        return { ...collection, hasTheme: !!item };
      })
    );

    return withStatus;
  },
});
