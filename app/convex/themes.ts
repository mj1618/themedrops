import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { incrementTagCounts, decrementTagCounts } from "./tags";

function validateAndNormalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 0 && t.length <= 24 && /^[a-z0-9-]+$/.test(t));
  // Deduplicate
  const unique = [...new Set(normalized)];
  if (unique.length > 5) {
    throw new Error("Maximum 5 tags per theme");
  }
  return unique;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const list = query({
  args: {
    sortBy: v.optional(v.union(v.literal("stars"), v.literal("newest"), v.literal("forks"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "stars";

    let themesQuery;
    if (sortBy === "newest") {
      themesQuery = ctx.db
        .query("themes")
        .withIndex("by_creation")
        .order("desc");
    } else if (sortBy === "forks") {
      themesQuery = ctx.db
        .query("themes")
        .withIndex("by_forks")
        .order("desc");
    } else {
      themesQuery = ctx.db
        .query("themes")
        .withIndex("by_stars")
        .order("desc");
    }

    const results = await themesQuery
      .filter((q) => q.eq(q.field("isPublic"), true))
      .paginate(args.paginationOpts);

    const pageWithAuthors = await Promise.all(
      results.page.map(async (theme) => {
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
      ...results,
      page: pageWithAuthors,
    };
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
  args: {
    authorId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("themes")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .paginate(args.paginationOpts);
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const limit = args.limit ?? 50;

    // Search both name and description indexes, then merge & dedupe
    const [byName, byDescription] = await Promise.all([
      ctx.db
        .query("themes")
        .withSearchIndex("search_themes", (q) =>
          q.search("name", args.query).eq("isPublic", true)
        )
        .take(limit),
      ctx.db
        .query("themes")
        .withSearchIndex("search_themes_description", (q) =>
          q.search("description", args.query).eq("isPublic", true)
        )
        .take(limit),
    ]);

    // Dedupe: name matches first, then description-only matches
    const seen = new Set(byName.map((t) => t._id));
    const merged = [...byName];
    for (const t of byDescription) {
      if (!seen.has(t._id)) {
        seen.add(t._id);
        merged.push(t);
      }
    }
    const results = merged.slice(0, limit);

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

const vscodeValidator = v.optional(v.object({
  keyword: v.string(),
  string: v.string(),
  comment: v.string(),
  function: v.string(),
  variable: v.string(),
  type: v.string(),
  number: v.string(),
  operator: v.string(),
  punctuation: v.string(),
}));

const discordValidator = v.optional(v.object({
  backgroundPrimary: v.string(),
  backgroundSecondary: v.string(),
  backgroundTertiary: v.string(),
  backgroundFloating: v.string(),
  textNormal: v.string(),
  textMuted: v.string(),
  textLink: v.string(),
  interactiveNormal: v.string(),
  interactiveHover: v.string(),
  interactiveActive: v.string(),
  statusOnline: v.string(),
  statusIdle: v.string(),
  statusDnd: v.string(),
  statusOffline: v.string(),
  brand: v.string(),
}));

const tailwindValidator = v.optional(v.object({
  primaryForeground: v.string(),
  secondaryForeground: v.string(),
  accentForeground: v.string(),
  mutedForeground: v.string(),
  card: v.string(),
  cardForeground: v.string(),
  popover: v.string(),
  popoverForeground: v.string(),
  border: v.string(),
  input: v.string(),
  ring: v.string(),
  destructive: v.string(),
  destructiveForeground: v.string(),
  radius: v.string(),
}));

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
    vscode: vscodeValidator,
    discord: discordValidator,
    tailwind: tailwindValidator,
    tags: v.optional(v.array(v.string())),
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

    const tags = args.tags ? validateAndNormalizeTags(args.tags) : undefined;

    const themeId = await ctx.db.insert("themes", {
      name: args.name,
      slug,
      description: args.description,
      colors: args.colors,
      fonts: args.fonts,
      vscode: args.vscode,
      discord: args.discord,
      tailwind: args.tailwind,
      tags,
      starCount: 0,
      forkCount: 0,
      authorId: userId,
      isPublic: args.isPublic,
    });

    if (tags && tags.length > 0 && args.isPublic) {
      await incrementTagCounts(ctx, tags);
    }

    return themeId;
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
    vscode: vscodeValidator,
    discord: discordValidator,
    tailwind: tailwindValidator,
    tags: v.optional(v.array(v.string())),
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
    if (args.vscode !== undefined) updates.vscode = args.vscode;
    if (args.discord !== undefined) updates.discord = args.discord;
    if (args.tailwind !== undefined) updates.tailwind = args.tailwind;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    if (args.tags !== undefined) {
      const newTags = validateAndNormalizeTags(args.tags);
      const oldTags = theme.tags ?? [];
      const wasPublic = theme.isPublic;
      const isPublic = args.isPublic ?? theme.isPublic;

      if (wasPublic && isPublic) {
        // Both public: diff tags normally
        const added = newTags.filter((t) => !oldTags.includes(t));
        const removed = oldTags.filter((t) => !newTags.includes(t));
        if (added.length > 0) await incrementTagCounts(ctx, added);
        if (removed.length > 0) await decrementTagCounts(ctx, removed);
      } else if (wasPublic && !isPublic) {
        // Going private: decrement all old tags
        if (oldTags.length > 0) await decrementTagCounts(ctx, oldTags);
      } else if (!wasPublic && isPublic) {
        // Going public: increment all new tags
        if (newTags.length > 0) await incrementTagCounts(ctx, newTags);
      }
      // If both private, no count changes needed

      updates.tags = newTags;
    } else if (args.isPublic !== undefined && args.isPublic !== theme.isPublic) {
      // Visibility changed but tags didn't — still need to adjust counts
      const tags = theme.tags ?? [];
      if (tags.length > 0) {
        if (theme.isPublic && !args.isPublic) {
          await decrementTagCounts(ctx, tags);
        } else if (!theme.isPublic && args.isPublic) {
          await incrementTagCounts(ctx, tags);
        }
      }
    }

    await ctx.db.patch(args.id, updates);
    return (updates.slug as string) ?? theme.slug;
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

    // Decrement tag counts
    if (theme.tags && theme.tags.length > 0 && theme.isPublic) {
      await decrementTagCounts(ctx, theme.tags);
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

    const forkedId = await ctx.db.insert("themes", {
      name: args.name,
      slug,
      description: original.description,
      colors: { ...original.colors },
      fonts: { ...original.fonts },
      starCount: 0,
      forkCount: 0,
      forkOf: original._id,
      authorId: userId,
      isPublic: true,
    });

    // Increment fork count on original theme
    await ctx.db.patch(original._id, {
      forkCount: (original.forkCount ?? 0) + 1,
    });

    await ctx.runMutation(internal.notifications.createNotification, {
      userId: original.authorId,
      type: "fork",
      actorId: userId,
      themeId: args.themeId,
    });

    return forkedId;
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
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: theme.authorId,
        type: "star",
        actorId: userId,
        themeId: args.themeId,
      });
      return true;
    }
  },
});

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDist(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
  );
}

const COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "muted",
] as const;

function themeSimilarity(
  a: Record<string, string>,
  b: Record<string, string>
): number {
  let total = 0;
  for (const key of COLOR_KEYS) {
    total += colorDist(a[key], b[key]);
  }
  return total / COLOR_KEYS.length;
}

export const getSimilarThemes = query({
  args: {
    themeId: v.id("themes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const theme = await ctx.db.get(args.themeId);
    if (!theme) return [];

    // Build candidate pool: top-starred + recent public themes
    const [byStars, byRecent] = await Promise.all([
      ctx.db
        .query("themes")
        .withIndex("by_stars")
        .order("desc")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .take(50),
      ctx.db
        .query("themes")
        .withIndex("by_creation")
        .order("desc")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .take(50),
    ]);

    // Dedupe and exclude current theme + direct forks of it
    const seen = new Set<string>();
    const candidates = [];
    for (const t of [...byStars, ...byRecent]) {
      if (seen.has(t._id) || t._id === args.themeId || t.forkOf === args.themeId) continue;
      seen.add(t._id);
      candidates.push(t);
    }

    // Score and sort by similarity
    const scored = candidates.map((t) => ({
      theme: t,
      score: themeSimilarity(theme.colors, t.colors),
    }));
    scored.sort((a, b) => a.score - b.score);

    const top = scored.slice(0, limit);

    // Attach author info
    const results = await Promise.all(
      top.map(async ({ theme: t }) => {
        const author = await ctx.db.get(t.authorId);
        return {
          _id: t._id,
          name: t.name,
          slug: t.slug,
          colors: t.colors,
          starCount: t.starCount,
          author: author
            ? {
                username: author.username ?? "unknown",
                displayName: author.displayName ?? author.username ?? "Unknown",
              }
            : { username: "unknown", displayName: "Unknown" },
        };
      })
    );

    return results;
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
