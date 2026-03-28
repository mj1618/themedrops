import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_username", ["username"]),

  themes: defineTable({
    name: v.string(),
    slug: v.string(),
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
    starCount: v.number(),
    forkCount: v.optional(v.number()),
    forkOf: v.optional(v.id("themes")),
    authorId: v.id("users"),
    isPublic: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_author", ["authorId"])
    .index("by_stars", ["starCount"])
    .index("by_creation", ["isPublic"])
    .index("by_forks", ["forkCount"])
    .searchIndex("search_themes", {
      searchField: "name",
      filterFields: ["isPublic"],
    })
    .searchIndex("search_themes_description", {
      searchField: "description",
      filterFields: ["isPublic"],
    }),

  stars: defineTable({
    userId: v.id("users"),
    themeId: v.id("themes"),
  })
    .index("by_user_theme", ["userId", "themeId"])
    .index("by_theme", ["themeId"]),

  comments: defineTable({
    userId: v.id("users"),
    themeId: v.id("themes"),
    body: v.string(),
  })
    .index("by_theme", ["themeId"])
    .index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("star"), v.literal("comment"), v.literal("fork")),
    actorId: v.id("users"),
    themeId: v.id("themes"),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
    isPublic: v.boolean(),
  }).index("by_user", ["userId"]),

  collectionItems: defineTable({
    collectionId: v.id("collections"),
    themeId: v.id("themes"),
    order: v.number(),
  })
    .index("by_collection", ["collectionId"])
    .index("by_collection_and_theme", ["collectionId", "themeId"])
    .index("by_theme", ["themeId"]),
});
