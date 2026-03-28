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

const EXTRA_THEMES = [
  {
    name: "Tokyo Night",
    slug: "tokyo-night",
    description: "Dark blues and purples inspired by Tokyo's nighttime cityscape",
    colors: {
      background: "#1a1b2e",
      foreground: "#c0caf5",
      primary: "#7aa2f7",
      secondary: "#24283b",
      accent: "#bb9af7",
      muted: "#565f89",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Gruvbox Dark",
    slug: "gruvbox-dark",
    description: "Retro groove colors with warm, earthy tones on dark background",
    colors: {
      background: "#282828",
      foreground: "#ebdbb2",
      primary: "#fabd2f",
      secondary: "#3c3836",
      accent: "#fe8019",
      muted: "#928374",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Catppuccin Mocha",
    slug: "catppuccin-mocha",
    description: "Pastel tones on a soft dark base for a cozy feel",
    colors: {
      background: "#1e1e2e",
      foreground: "#cdd6f4",
      primary: "#cba6f7",
      secondary: "#313244",
      accent: "#f38ba8",
      muted: "#6c7086",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Nord",
    slug: "nord",
    description: "An arctic, north-bluish color palette with calm, cool tones",
    colors: {
      background: "#2e3440",
      foreground: "#eceff4",
      primary: "#88c0d0",
      secondary: "#3b4252",
      accent: "#81a1c1",
      muted: "#4c566a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "One Dark Pro",
    slug: "one-dark-pro",
    description: "The iconic dark theme from Atom, refined for elegant coding",
    colors: {
      background: "#282c34",
      foreground: "#abb2bf",
      primary: "#61afef",
      secondary: "#31353f",
      accent: "#e06c75",
      muted: "#5c6370",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Monokai",
    slug: "monokai",
    description: "The classic Monokai color scheme beloved by developers everywhere",
    colors: {
      background: "#272822",
      foreground: "#f8f8f2",
      primary: "#a6e22e",
      secondary: "#3e3d32",
      accent: "#f92672",
      muted: "#75715e",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "GitHub Dark",
    slug: "github-dark",
    description: "GitHub's official dark mode palette for a familiar developer experience",
    colors: {
      background: "#0d1117",
      foreground: "#e6edf3",
      primary: "#58a6ff",
      secondary: "#161b22",
      accent: "#3fb950",
      muted: "#8b949e",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Everforest",
    slug: "everforest",
    description: "A green-based color scheme with warm, natural tones",
    colors: {
      background: "#2d353b",
      foreground: "#d3c6aa",
      primary: "#a7c080",
      secondary: "#3d484d",
      accent: "#e69875",
      muted: "#7a8478",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Ayu Mirage",
    slug: "ayu-mirage",
    description: "Smooth dark theme with amber highlights and soothing mid-tones",
    colors: {
      background: "#1f2430",
      foreground: "#cbccc6",
      primary: "#ffcc66",
      secondary: "#2a2f3f",
      accent: "#f28779",
      muted: "#5c6773",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Material Oceanic",
    slug: "material-oceanic",
    description: "Material Design meets deep ocean blues for a productive dark theme",
    colors: {
      background: "#0f111a",
      foreground: "#8f93a2",
      primary: "#89ddff",
      secondary: "#1a1c25",
      accent: "#c792ea",
      muted: "#464b5d",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Kanagawa",
    slug: "kanagawa",
    description: "Inspired by the famous woodblock print, blending ink blacks with samurai reds",
    colors: {
      background: "#1f1f28",
      foreground: "#dcd7ba",
      primary: "#7e9cd8",
      secondary: "#2a2a37",
      accent: "#e46876",
      muted: "#727169",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Rosé Pine",
    slug: "rose-pine",
    description: "Soho vibes with muted tones and a rosy glow",
    colors: {
      background: "#191724",
      foreground: "#e0def4",
      primary: "#c4a7e7",
      secondary: "#26233a",
      accent: "#ebbcba",
      muted: "#6e6a86",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Horizon",
    slug: "horizon",
    description: "Warm sunset hues meet dark backgrounds for a vivid, inspiring theme",
    colors: {
      background: "#1c1e26",
      foreground: "#d5d8da",
      primary: "#e95678",
      secondary: "#232530",
      accent: "#fab795",
      muted: "#6a6b83",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Alabaster",
    slug: "alabaster",
    description: "Minimal light theme using a clean white base with soft contrast",
    colors: {
      background: "#f7f7f7",
      foreground: "#1a1a1a",
      primary: "#007acc",
      secondary: "#e8e8e8",
      accent: "#0e7490",
      muted: "#999999",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Solarized Light",
    slug: "solarized-light",
    description: "The classic Solarized palette on a warm beige background",
    colors: {
      background: "#fdf6e3",
      foreground: "#657b83",
      primary: "#268bd2",
      secondary: "#eee8d5",
      accent: "#2aa198",
      muted: "#93a1a1",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Flex Light",
    slug: "flex-light",
    description: "Airy white theme with vivid indigo accents for creative workflows",
    colors: {
      background: "#ffffff",
      foreground: "#1e293b",
      primary: "#6366f1",
      secondary: "#f1f5f9",
      accent: "#8b5cf6",
      muted: "#94a3b8",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Panda Syntax",
    slug: "panda-syntax",
    description: "Superminimal dark theme with a dark teal base and coral accents",
    colors: {
      background: "#292a2b",
      foreground: "#e6e6e6",
      primary: "#19f9d8",
      secondary: "#363636",
      accent: "#ff75b5",
      muted: "#676b79",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Cobalt2",
    slug: "cobalt2",
    description: "Bold royal blues with bright yellow accents — high energy coding",
    colors: {
      background: "#193549",
      foreground: "#ffffff",
      primary: "#ffc600",
      secondary: "#0d3a58",
      accent: "#ff628c",
      muted: "#0088ff",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Night Owl",
    slug: "night-owl",
    description: "Refined syntax theme designed for those who prefer working late",
    colors: {
      background: "#011627",
      foreground: "#d6deeb",
      primary: "#82aaff",
      secondary: "#01121f",
      accent: "#c792ea",
      muted: "#637777",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Zenburn",
    slug: "zenburn",
    description: "Low-contrast dark theme that is easy on the eyes during long sessions",
    colors: {
      background: "#3f3f3f",
      foreground: "#dcdccc",
      primary: "#8cd0d3",
      secondary: "#4a4a4a",
      accent: "#f0dfaf",
      muted: "#7f9f7f",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Palenight",
    slug: "palenight",
    description: "Elegant dark theme with blue-purple hues from the Material family",
    colors: {
      background: "#292d3e",
      foreground: "#a6accd",
      primary: "#82aaff",
      secondary: "#34364e",
      accent: "#c792ea",
      muted: "#676e95",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Radical",
    slug: "radical",
    description: "Vivid dark theme with electric magenta and cyan bursting with energy",
    colors: {
      background: "#141221",
      foreground: "#f4f4f8",
      primary: "#ff857a",
      secondary: "#1e1b33",
      accent: "#25d7fd",
      muted: "#6b6b9a",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Flatland",
    slug: "flatland",
    description: "Flat, vivid colors on a deep dark background for a clean, modern look",
    colors: {
      background: "#1b2026",
      foreground: "#f0f0f0",
      primary: "#5af78e",
      secondary: "#252c35",
      accent: "#57c7ff",
      muted: "#4d5566",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Sandcastle",
    slug: "sandcastle",
    description: "Warm sandy tones evoking a sun-soaked beach afternoon",
    colors: {
      background: "#f5f0e8",
      foreground: "#3d3226",
      primary: "#c0854a",
      secondary: "#ede6d9",
      accent: "#e07b39",
      muted: "#a89880",
    },
    fonts: { heading: "Georgia", body: "Georgia", mono: "JetBrains Mono" },
  },
  {
    name: "Monochrome",
    slug: "monochrome",
    description: "Pure black and white design — zero distraction, maximum clarity",
    colors: {
      background: "#ffffff",
      foreground: "#000000",
      primary: "#000000",
      secondary: "#f0f0f0",
      accent: "#444444",
      muted: "#999999",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Ink Dark",
    slug: "ink-dark",
    description: "Absolute black background with off-white text — like ink on the void",
    colors: {
      background: "#000000",
      foreground: "#e8e8e8",
      primary: "#ffffff",
      secondary: "#111111",
      accent: "#cccccc",
      muted: "#555555",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Matcha Latte",
    slug: "matcha-latte",
    description: "Soft greens and creamy whites for a serene, café-inspired aesthetic",
    colors: {
      background: "#f4f7f0",
      foreground: "#2d3b2a",
      primary: "#5a8a50",
      secondary: "#e6eedf",
      accent: "#7aad6e",
      muted: "#8fa88c",
    },
    fonts: { heading: "Georgia", body: "Georgia", mono: "JetBrains Mono" },
  },
  {
    name: "Lavender Fields",
    slug: "lavender-fields",
    description: "Dreamy purples and soft whites reminiscent of Provençal lavender",
    colors: {
      background: "#f5f0ff",
      foreground: "#2d1f4e",
      primary: "#7c5cbf",
      secondary: "#ede5ff",
      accent: "#a480e0",
      muted: "#9e8fbf",
    },
    fonts: { heading: "Georgia", body: "Georgia", mono: "JetBrains Mono" },
  },
  {
    name: "Crimson Noir",
    slug: "crimson-noir",
    description: "Deep black and blood red — bold, dramatic, unapologetic",
    colors: {
      background: "#100a0a",
      foreground: "#f5e0e0",
      primary: "#cc1f1f",
      secondary: "#1e0f0f",
      accent: "#e84040",
      muted: "#6b4444",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
  {
    name: "Slate Blue",
    slug: "slate-blue",
    description: "Calm corporate blues with a professional, trustworthy feel",
    colors: {
      background: "#f8fafc",
      foreground: "#1e293b",
      primary: "#3b82f6",
      secondary: "#e2e8f0",
      accent: "#2563eb",
      muted: "#94a3b8",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  },
];

export const addSystemThemes = mutation({
  args: {},
  handler: async (ctx) => {
    // Find or create system user
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

    if (!systemUser) throw new Error("Failed to find or create system user");

    let added = 0;
    for (const theme of EXTRA_THEMES) {
      // Skip if slug already exists
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_slug", (q) => q.eq("slug", theme.slug))
        .first();
      if (existing) continue;

      await ctx.db.insert("themes", {
        ...theme,
        starCount: Math.floor(Math.random() * 80) + 5,
        forkCount: 0,
        authorId: systemUser._id,
        isPublic: true,
      });
      added++;
    }

    return `Added ${added} themes`;
  },
});

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
        forkCount: 0,
        authorId: systemUser._id,
        isPublic: true,
      });
    }

    return "Seeded " + SEED_THEMES.length + " themes";
  },
});
