import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const convexSiteUrl = env.VITE_CONVEX_SITE_URL;

  return {
    plugins: [
      tailwindcss(),
      tanstackStart({
        srcDirectory: "app",
      }),
      nitroV2Plugin({
        preset: "vercel",
        routeRules: {
          "/api/**": { proxy: `${convexSiteUrl}/api/**` },
        },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
