import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  // Simplified conversion via linear sRGB -> OKLab -> OKLCH
  const linearize = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 10) / 10,
  };
}

type Colors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

function convertColors(colors: Colors, format: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, hex] of Object.entries(colors)) {
    const rgb = hexToRgb(hex);
    switch (format) {
      case "rgb":
        result[key] = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        break;
      case "hsl": {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        result[key] = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        break;
      }
      case "oklch": {
        const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
        result[key] = `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
        break;
      }
      default:
        result[key] = hex;
    }
  }
  return result;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/api/themes",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "hex";

    const themes = await ctx.runQuery(api.themes.listPublicForApi, {});

    const formatted = themes.map((t) => ({
      name: t.name,
      slug: t.slug,
      description: t.description,
      colors: convertColors(t.colors, format),
      fonts: t.fonts,
      starCount: t.starCount,
    }));

    return new Response(JSON.stringify(formatted, null, 2), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  }),
});

http.route({
  path: "/api/themes",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

// Theme by slug uses pathPrefix + parsing
http.route({
  pathPrefix: "/api/themes/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname.replace("/api/themes/", "").replace(/\/$/, "");
    const format = url.searchParams.get("format") ?? "hex";

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const theme = await ctx.runQuery(api.themes.getBySlug, { slug });

    if (!theme) {
      return new Response(JSON.stringify({ error: "Theme not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const formatted = {
      name: theme.name,
      slug: theme.slug,
      description: theme.description,
      colors: convertColors(theme.colors, format),
      fonts: theme.fonts,
      starCount: theme.starCount,
    };

    return new Response(JSON.stringify(formatted, null, 2), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  }),
});

http.route({
  pathPrefix: "/api/themes/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }),
});

// OG image endpoint — returns an SVG showing the theme's color palette
http.route({
  pathPrefix: "/api/og/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname.replace("/api/og/", "").replace(/\/$/, "");

    if (!slug) {
      return new Response("Slug required", { status: 400 });
    }

    const theme = await ctx.runQuery(api.themes.getBySlug, { slug });

    if (!theme) {
      return new Response("Theme not found", { status: 404 });
    }

    const colors = theme.colors;
    const colorEntries = Object.entries(colors) as [string, string][];
    const authorName = theme.author?.displayName ?? "Unknown";

    const swatchWidth = 160;
    const swatchGap = 20;
    const totalSwatchWidth = colorEntries.length * swatchWidth + (colorEntries.length - 1) * swatchGap;
    const swatchStartX = (1200 - totalSwatchWidth) / 2;

    const swatches = colorEntries
      .map(([name, color], i) => {
        const x = swatchStartX + i * (swatchWidth + swatchGap);
        return `
          <rect x="${x}" y="260" width="${swatchWidth}" height="${swatchWidth}" rx="16" fill="${color}" />
          <text x="${x + swatchWidth / 2}" y="${260 + swatchWidth + 30}" text-anchor="middle" fill="${colors.muted}" font-size="18" font-family="system-ui, sans-serif">${name}</text>
          <text x="${x + swatchWidth / 2}" y="${260 + swatchWidth + 55}" text-anchor="middle" fill="${colors.muted}" font-size="14" font-family="monospace">${escapeXml(color)}</text>
        `;
      })
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${colors.background}" />
  <rect width="1200" height="630" fill="rgba(0,0,0,0.3)" />

  <text x="600" y="100" text-anchor="middle" fill="${colors.foreground}" font-size="48" font-weight="bold" font-family="system-ui, sans-serif">${escapeXml(theme.name)}</text>
  <text x="600" y="150" text-anchor="middle" fill="${colors.muted}" font-size="22" font-family="system-ui, sans-serif">by ${escapeXml(authorName)}</text>

  <text x="600" y="200" text-anchor="middle" fill="${colors.accent}" font-size="18" font-family="system-ui, sans-serif">${theme.starCount} ★</text>

  ${swatches}

  <text x="600" y="600" text-anchor="middle" fill="${colors.muted}" font-size="20" font-family="system-ui, sans-serif" opacity="0.7">themedrops</text>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders(),
      },
    });
  }),
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default http;
