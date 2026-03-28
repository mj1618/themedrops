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

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: auth.openIdConfiguration,
});

http.route({
  path: "/oauth/authorize",
  method: "GET",
  handler: auth.authorize,
});

http.route({
  path: "/oauth/token",
  method: "POST",
  handler: auth.token,
});

http.route({
  path: "/oauth/revoke",
  method: "POST",
  handler: auth.revoke,
});

http.route({
  pathPrefix: "/api/auth/",
  method: "GET",
  handler: auth.handleRedirectCallback,
});

http.route({
  pathPrefix: "/api/auth/",
  method: "POST",
  handler: auth.handleRedirectCallback,
});

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

export default http;
