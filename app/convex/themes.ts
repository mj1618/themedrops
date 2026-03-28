import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const list = query({
  args: {
    sortBy: v.optional(v.union(v.literal("stars"), v.literal("newest"))),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 24;
    const sortBy = args.sortBy ?? "stars";

    let themesQuery;
    if (sortBy === "newest") {
      themesQuery = ctx.db
        .query("themes")
        .withIndex("by_creation")
        .order("desc");
    } else {
      themesQuery = ctx.db
        .query("themes")
        .withIndex("by_stars")
        .order("desc");
    }

    const themes = await themesQuery
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(limit);

    const withAuthors = await Promise.all(
      themes.map(async (theme) => {
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

    return withAuthors;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!theme) return null;

    const author = await ctx.db.get(theme.authorId);
    const forkParent = theme.forkOf ? await ctx.db.get(theme.forkOf) : null;

    const forkCount = (
      await ctx.db.query("themes").filter((q) => q.eq(q.field("forkOf"), theme._id)).collect()
    ).length;

    const session = await auth.getSessionId(ctx);
    let isStarred = false;
    let isOwner = false;
    if (session) {
      const userId = (await ctx.db.query("authSessions").filter((q) => q.eq(q.field("_id"), session)).first())?.userId;
      if (userId) {
        isOwner = theme.authorId === userId;
        const star = await ctx.db
          .query("stars")
          .withIndex("by_user_theme", (q) => q.eq("userId", userId).eq("themeId", theme._id))
          .first();
        isStarred = !!star;
      }
    }

    return {
      ...theme,
      author: author
        ? {
            _id: author._id,
            username: author.username ?? "unknown",
            displayName: author.displayName ?? author.username ?? "Unknown",
            avatarUrl: author.avatarUrl,
          }
        : null,
      forkParent: forkParent
        ? { name: forkParent.name, slug: forkParent.slug }
        : null,
      forkCount,
      isStarred,
      isOwner,
    };
  },
});

export const getByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const results = await ctx.db
      .query("themes")
      .withSearchIndex("search_themes", (q) =>
        q.search("name", args.query).eq("isPublic", true)
      )
      .take(20);

    const withAuthors = await Promise.all(
      results.map(async (theme) => {
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

    return withAuthors;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    colors: v.object({
      background: v.string(),
      foreground: v.string(),
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      muted: v.string(),
    }),
    fonts: v.object({
      heading: v.string(),
      body: v.string(),
      mono: v.string(),
    }),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let slug = slugify(args.name);
    // Ensure unique slug
    const existing = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return await ctx.db.insert("themes", {
      name: args.name,
      slug,
      description: args.description,
      colors: args.colors,
      fonts: args.fonts,
      starCount: 0,
      authorId: userId,
      isPublic: args.isPublic,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("themes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    colors: v.optional(
      v.object({
        background: v.string(),
        foreground: v.string(),
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        muted: v.string(),
      })
    ),
    fonts: v.optional(
      v.object({
        heading: v.string(),
        body: v.string(),
        mono: v.string(),
      })
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const theme = await ctx.db.get(args.id);
    if (!theme) throw new Error("Theme not found");
    if (theme.authorId !== userId) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      updates.name = args.name;
      let newSlug = slugify(args.name);
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .first();
      if (existing && existing._id !== args.id) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      updates.slug = newSlug;
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.colors !== undefined) updates.colors = args.colors;
    if (args.fonts !== undefined) updates.fonts = args.fonts;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("themes") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const theme = await ctx.db.get(args.id);
    if (!theme) throw new Error("Theme not found");
    if (theme.authorId !== userId) throw new Error("Not authorized");

    // Cascade delete stars
    const stars = await ctx.db
      .query("stars")
      .withIndex("by_theme", (q) => q.eq("themeId", args.id))
      .collect();
    for (const star of stars) {
      await ctx.db.delete(star._id);
    }

    // Cascade delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_theme", (q) => q.eq("themeId", args.id))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const fork = mutation({
  args: {
    themeId: v.id("themes"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const original = await ctx.db.get(args.themeId);
    if (!original) throw new Error("Theme not found");

    let slug = slugify(args.name);
    const existing = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return await ctx.db.insert("themes", {
      name: args.name,
      slug,
      description: original.description,
      colors: { ...original.colors },
      fonts: { ...original.fonts },
      starCount: 0,
      forkOf: original._id,
      authorId: userId,
      isPublic: true,
    });
  },
});

export const toggleStar = mutation({
  args: { themeId: v.id("themes") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stars")
      .withIndex("by_user_theme", (q) =>
        q.eq("userId", userId).eq("themeId", args.themeId)
      )
      .first();

    const theme = await ctx.db.get(args.themeId);
    if (!theme) throw new Error("Theme not found");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.themeId, {
        starCount: Math.max(0, theme.starCount - 1),
      });
      return false;
    } else {
      await ctx.db.insert("stars", { userId, themeId: args.themeId });
      await ctx.db.patch(args.themeId, {
        starCount: theme.starCount + 1,
      });
      return true;
    }
  },
});

export const listPublicForApi = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_stars")
      .order("desc")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(100);
  },
});
