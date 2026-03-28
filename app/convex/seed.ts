import { mutation } from "./_generated/server";

const SEED_THEMES = [
  {
    name: "Midnight Purple",
    slug: "midnight-purple",
    description: "A deep, immersive dark theme with rich purple accents",
    colors: {
      background: "#0a0a1a",
      foreground: "#e4e4f0",
      primary: "#7c3aed",
      secondary: "#1e1b4b",
      accent: "#c084fc",
      muted: "#6b6b8a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Ocean Breeze",
    slug: "ocean-breeze",
    description: "Cool, calming tones inspired by the sea",
    colors: {
      background: "#0c1222",
      foreground: "#e0f2fe",
      primary: "#0ea5e9",
      secondary: "#0c4a6e",
      accent: "#38bdf8",
      muted: "#64748b",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Forest Canopy",
    slug: "forest-canopy",
    description: "Earthy greens and warm browns inspired by nature",
    colors: {
      background: "#0a1208",
      foreground: "#e8f5e2",
      primary: "#22c55e",
      secondary: "#14532d",
      accent: "#4ade80",
      muted: "#6b7c6a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Sunset Glow",
    slug: "sunset-glow",
    description: "Warm oranges and soft pinks evoking a golden hour sky",
    colors: {
      background: "#1a0a0a",
      foreground: "#fef2e8",
      primary: "#f97316",
      secondary: "#7c2d12",
      accent: "#fb923c",
      muted: "#92716a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Rose Gold",
    slug: "rose-gold",
    description: "Elegant pinks and golds for a luxurious feel",
    colors: {
      background: "#1a0f14",
      foreground: "#fce7f3",
      primary: "#ec4899",
      secondary: "#831843",
      accent: "#f472b6",
      muted: "#8b6b7a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Arctic Frost",
    slug: "arctic-frost",
    description: "Clean and icy with cool grays and bright blues",
    colors: {
      background: "#f0f4f8",
      foreground: "#1a202c",
      primary: "#3b82f6",
      secondary: "#dbeafe",
      accent: "#60a5fa",
      muted: "#94a3b8",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Warm Paper",
    slug: "warm-paper",
    description: "A cozy light theme that's easy on the eyes",
    colors: {
      background: "#faf8f5",
      foreground: "#2c2420",
      primary: "#b45309",
      secondary: "#fef3c7",
      accent: "#d97706",
      muted: "#a8a29e",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Neon Cyberpunk",
    slug: "neon-cyberpunk",
    description: "High contrast neon colors on dark backgrounds",
    colors: {
      background: "#0a0a0a",
      foreground: "#00ff88",
      primary: "#ff0080",
      secondary: "#1a1a2e",
      accent: "#00ffff",
      muted: "#555577",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Dracula Pro",
    slug: "dracula-pro",
    description: "Inspired by the popular Dracula color scheme",
    colors: {
      background: "#282a36",
      foreground: "#f8f8f2",
      primary: "#bd93f9",
      secondary: "#44475a",
      accent: "#ff79c6",
      muted: "#6272a4",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Solarized Dark",
    slug: "solarized-dark",
    description: "The classic Solarized color scheme for dark backgrounds",
    colors: {
      background: "#002b36",
      foreground: "#839496",
      primary: "#268bd2",
      secondary: "#073642",
      accent: "#2aa198",
      muted: "#586e75",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
];

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingThemes = await ctx.db.query("themes").first();
    if (existingThemes) {
      return "Already seeded";
    }

    // Check if system user exists
    let systemUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "themedrops"))
      .first();

    if (!systemUser) {
      const systemUserId = await ctx.db.insert("users", {
        username: "themedrops",
        displayName: "themedrops",
        bio: "Official themedrops system account. These are the starter themes.",
        avatarUrl: undefined,
      });
      systemUser = await ctx.db.get(systemUserId);
    }

    if (!systemUser) throw new Error("Failed to create system user");

    for (const theme of SEED_THEMES) {
      await ctx.db.insert("themes", {
        ...theme,
        starCount: Math.floor(Math.random() * 50) + 5,
        authorId: systemUser._id,
        isPublic: true,
      });
    }

    return "Seeded " + SEED_THEMES.length + " themes";
  },
});
