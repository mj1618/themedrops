import { v } from "convex/values";
import { query, mutation, DatabaseReader } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_public_and_star_count", (q) => q.eq("isPublic", true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listNewest = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_public_and_creation_time", (q) => q.eq("isPublic", true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listRecentlyCommented = query({
  args: {},
  handler: async (ctx) => {
    // Get recent comments, then find the distinct public themes they belong to
    const recentComments = await ctx.db
      .query("comments")
      .order("desc")
      .take(200);

    const seenThemeIds = new Set<string>();
    const themes = [];
    for (const comment of recentComments) {
      if (seenThemeIds.has(comment.themeId)) continue;
      seenThemeIds.add(comment.themeId);
      const theme = await ctx.db.get(comment.themeId);
      if (theme && theme.isPublic) {
        themes.push(theme);
      }
      if (themes.length >= 20) break;
    }
    return themes;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!theme) return null;
    if (!theme.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (!user || theme.authorId !== user._id) return null;
    }
    return theme;
  },
});

export const getByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (user) currentUserId = user._id;
    }

    const themes = await ctx.db
      .query("themes")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .take(50);

    if (currentUserId === args.authorId) return themes;
    return themes.filter((t) => t.isPublic);
  },
});

export const getBasicInfo = query({
  args: { id: v.id("themes") },
  handler: async (ctx, args) => {
    const theme = await ctx.db.get(args.id);
    if (!theme) return null;
    if (!theme.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (!user || theme.authorId !== user._id) return null;
    }
    return { name: theme.name, slug: theme.slug };
  },
});

export const search = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("themes")
      .withSearchIndex("search_name", (q) => q.search("name", args.name))
      .take(40);
    return results.filter((t) => t.isPublic).slice(0, 20);
  },
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function uniqueSlug(
  db: DatabaseReader,
  name: string,
  excludeId?: import("./_generated/dataModel").Id<"themes">
): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let suffix = 2;
  let existing;
  while (
    (existing = await db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()) &&
    existing._id !== excludeId
  ) {
    slug = `${base}-${suffix}`;
    suffix++;
  }
  return slug;
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    colors: v.object({
      background: v.optional(v.string()),
      foreground: v.optional(v.string()),
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      accent: v.optional(v.string()),
      muted: v.optional(v.string()),
    }),
    fonts: v.optional(
      v.object({
        sans: v.optional(v.string()),
        serif: v.optional(v.string()),
        mono: v.optional(v.string()),
      })
    ),
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

    const slug = await uniqueSlug(ctx.db, args.name);

    const id = await ctx.db.insert("themes", {
      name: args.name,
      slug,
      description: args.description,
      authorId: user._id,
      isPublic: args.isPublic,
      starCount: 0,
      colors: args.colors,
      fonts: args.fonts,
    });

    return { id, slug };
  },
});

export const update = mutation({
  args: {
    id: v.id("themes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    colors: v.optional(
      v.object({
        background: v.optional(v.string()),
        foreground: v.optional(v.string()),
        primary: v.optional(v.string()),
        secondary: v.optional(v.string()),
        accent: v.optional(v.string()),
        muted: v.optional(v.string()),
      })
    ),
    fonts: v.optional(
      v.object({
        sans: v.optional(v.string()),
        serif: v.optional(v.string()),
        mono: v.optional(v.string()),
      })
    ),
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

    const theme = await ctx.db.get(args.id);
    if (!theme) throw new Error("Theme not found");
    if (theme.authorId !== user._id) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      updates.name = args.name;
      updates.slug = await uniqueSlug(ctx.db, args.name, args.id);
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.colors !== undefined) updates.colors = args.colors;
    if (args.fonts !== undefined) updates.fonts = args.fonts;

    await ctx.db.patch(args.id, updates);
    return { slug: (updates.slug as string) ?? theme.slug };
  },
});

export const remove = mutation({
  args: { id: v.id("themes") },
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

    const theme = await ctx.db.get(args.id);
    if (!theme) throw new Error("Theme not found");
    if (theme.authorId !== user._id) throw new Error("Not authorized");

    // Clean up all associated stars
    let stars;
    do {
      stars = await ctx.db
        .query("stars")
        .withIndex("by_theme", (q) => q.eq("themeId", args.id))
        .take(500);
      for (const star of stars) {
        await ctx.db.delete(star._id);
      }
    } while (stars.length === 500);

    // Clean up all associated comments
    let comments;
    do {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_theme", (q) => q.eq("themeId", args.id))
        .take(500);
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
    } while (comments.length === 500);

    await ctx.db.delete(args.id);
  },
});

export const fork = mutation({
  args: { id: v.id("themes") },
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

    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Theme not found");
    if (!original.isPublic && original.authorId !== user._id) {
      throw new Error("Not authorized");
    }

    const slug = await uniqueSlug(ctx.db, original.name + " fork");

    const id = await ctx.db.insert("themes", {
      name: original.name + " (fork)",
      slug,
      description: original.description,
      authorId: user._id,
      forkedFromId: original._id,
      isPublic: false,
      starCount: 0,
      colors: original.colors,
      fonts: original.fonts,
    });

    return { id, slug };
  },
});
