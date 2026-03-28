import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    // Fields from authTables (required by @convex-dev/auth)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_username", ["username"])
    .index("by_token", ["tokenIdentifier"]),

  themes: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    authorId: v.id("users"),
    forkedFromId: v.optional(v.id("themes")),
    isPublic: v.boolean(),
    starCount: v.number(),
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
  })
    .index("by_slug", ["slug"])
    .index("by_author", ["authorId"])
    .index("by_star_count", ["starCount"])
    .index("by_public_and_star_count", ["isPublic", "starCount"])
    .index("by_public_and_creation_time", ["isPublic"])
    .searchIndex("search_name", { searchField: "name" }),

  stars: defineTable({
    userId: v.id("users"),
    themeId: v.id("themes"),
  })
    .index("by_user_and_theme", ["userId", "themeId"])
    .index("by_theme", ["themeId"]),

  comments: defineTable({
    userId: v.id("users"),
    themeId: v.id("themes"),
    body: v.string(),
  })
    .index("by_theme", ["themeId"])
    .index("by_user", ["userId"]),
});
