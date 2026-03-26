import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { convertColors, isValidFormat, type ColorFormat } from "./lib/colors";

const http = httpRouter();

auth.addHttpRoutes(http);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function parseFormat(url: URL): ColorFormat | null {
  const formatParam = url.searchParams.get("format") || "hex";
  if (!isValidFormat(formatParam)) return null;
  return formatParam;
}

// GET /api/themes - list public themes
http.route({
  path: "/api/themes",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const format = parseFormat(url);
    if (!format) {
      return jsonResponse(
        { error: "Invalid format. Must be one of: hex, hsl, rgb, oklch" },
        400,
      );
    }

    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") || null;
    const limit = Math.min(
      Math.max(parseInt(limitParam || "20", 10) || 20, 1),
      100,
    );

    const result = await ctx.runQuery(internal.themeApi.listPublic, {
      limit,
      cursor,
    });

    const themes = result.themes.map(
      (theme: { colors: Record<string, string | undefined> }) => ({
        ...theme,
        colors: convertColors(theme.colors, format),
      }),
    );

    return jsonResponse({
      themes,
      cursor: result.isDone ? null : result.continueCursor,
      hasMore: !result.isDone,
    });
  }),
});

// GET /api/themes/<slug> - get a single public theme by slug
http.route({
  pathPrefix: "/api/themes/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const slug = url.pathname.replace(/^\/api\/themes\//, "");

    if (!slug) {
      return jsonResponse({ error: "Missing theme slug in URL" }, 400);
    }

    const format = parseFormat(url);
    if (!format) {
      return jsonResponse(
        { error: "Invalid format. Must be one of: hex, hsl, rgb, oklch" },
        400,
      );
    }

    const theme = await ctx.runQuery(internal.themeApi.getPublicBySlug, {
      slug,
    });

    if (!theme) {
      return jsonResponse({ error: "Theme not found" }, 404);
    }

    return jsonResponse({
      ...theme,
      colors: convertColors(
        theme.colors as Record<string, string | undefined>,
        format,
      ),
    });
  }),
});

// CORS preflight for /api/themes
http.route({
  path: "/api/themes",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// CORS preflight for /api/themes/<slug>
http.route({
  pathPrefix: "/api/themes/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

export default http;
