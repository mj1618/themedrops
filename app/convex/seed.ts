import { internalMutation } from "./_generated/server";

const SYSTEM_TOKEN = "system:themedrops";

const STARTER_THEMES = [
  {
    name: "Midnight",
    description: "A deep, dark theme for late-night coding sessions",
    colors: {
      background: "#0f172a",
      foreground: "#e2e8f0",
      primary: "#3b82f6",
      secondary: "#1e293b",
      accent: "#8b5cf6",
      muted: "#475569",
    },
    fonts: { sans: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Sunset Glow",
    description: "Warm oranges and pinks inspired by golden hour",
    colors: {
      background: "#fff7ed",
      foreground: "#431407",
      primary: "#ea580c",
      secondary: "#fed7aa",
      accent: "#db2777",
      muted: "#9a3412",
    },
    fonts: { sans: "Nunito", mono: "Fira Code" },
  },
  {
    name: "Ocean Breeze",
    description: "Cool blues and teals evoking calm coastal vibes",
    colors: {
      background: "#ecfeff",
      foreground: "#164e63",
      primary: "#0891b2",
      secondary: "#cffafe",
      accent: "#2dd4bf",
      muted: "#67e8f9",
    },
    fonts: { sans: "Source Sans 3", mono: "Source Code Pro" },
  },
  {
    name: "Forest Canopy",
    description: "Rich greens and earth tones for a natural feel",
    colors: {
      background: "#052e16",
      foreground: "#dcfce7",
      primary: "#22c55e",
      secondary: "#14532d",
      accent: "#a3e635",
      muted: "#4ade80",
    },
    fonts: { sans: "Merriweather Sans", mono: "IBM Plex Mono" },
  },
  {
    name: "Nordic Frost",
    description: "Crisp whites and icy blues for a clean, minimal look",
    colors: {
      background: "#f8fafc",
      foreground: "#0f172a",
      primary: "#0ea5e9",
      secondary: "#e0f2fe",
      accent: "#6366f1",
      muted: "#94a3b8",
    },
    fonts: { sans: "DM Sans", mono: "DM Mono" },
  },
  {
    name: "Warm Ember",
    description: "Cozy ambers and deep reds like a fireside evening",
    colors: {
      background: "#1c1917",
      foreground: "#fafaf9",
      primary: "#f59e0b",
      secondary: "#292524",
      accent: "#ef4444",
      muted: "#78716c",
    },
    fonts: { sans: "Lora", mono: "Inconsolata" },
  },
  {
    name: "Lavender Dreams",
    description: "Soft purples and pastels for a gentle, creative mood",
    colors: {
      background: "#faf5ff",
      foreground: "#3b0764",
      primary: "#a855f7",
      secondary: "#f3e8ff",
      accent: "#ec4899",
      muted: "#c084fc",
    },
    fonts: { sans: "Poppins", mono: "Space Mono" },
  },
  {
    name: "Cyber Neon",
    description: "Electric highlights on dark backgrounds for a futuristic edge",
    colors: {
      background: "#09090b",
      foreground: "#fafafa",
      primary: "#06b6d4",
      secondary: "#18181b",
      accent: "#f0abfc",
      muted: "#52525b",
    },
    fonts: { sans: "Rajdhani", mono: "Share Tech Mono" },
  },
  {
    name: "Minimalist Mono",
    description: "Pure black and white with grey accents — distraction-free",
    colors: {
      background: "#ffffff",
      foreground: "#171717",
      primary: "#171717",
      secondary: "#f5f5f5",
      accent: "#525252",
      muted: "#a3a3a3",
    },
    fonts: { sans: "IBM Plex Sans", mono: "IBM Plex Mono" },
  },
  {
    name: "Desert Sand",
    description: "Warm neutrals and terracotta inspired by arid landscapes",
    colors: {
      background: "#fef3c7",
      foreground: "#451a03",
      primary: "#d97706",
      secondary: "#fde68a",
      accent: "#dc2626",
      muted: "#92400e",
    },
    fonts: { sans: "Work Sans", mono: "Roboto Mono" },
  },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const seedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create system user if not exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", SYSTEM_TOKEN))
      .unique();

    const userId =
      existingUser?._id ??
      (await ctx.db.insert("users", {
        username: "themedrops",
        displayName: "ThemeDrops",
        tokenIdentifier: SYSTEM_TOKEN,
        bio: "Official ThemeDrops curated themes",
      }));

    // 2. Create starter themes, skipping any that already exist by slug
    let created = 0;
    for (const theme of STARTER_THEMES) {
      const slug = generateSlug(theme.name);
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (existing) continue;

      await ctx.db.insert("themes", {
        name: theme.name,
        slug,
        description: theme.description,
        authorId: userId,
        isPublic: true,
        starCount: 0,
        colors: theme.colors,
        fonts: theme.fonts,
      });
      created++;
    }

    return { userId, themesCreated: created };
  },
});
