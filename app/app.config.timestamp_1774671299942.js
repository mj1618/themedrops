// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
var app_config_default = defineConfig({
  tsr: {
    appDirectory: "app"
  },
  vite: {
    plugins: () => [tailwindcss()]
  }
});
export {
  app_config_default as default
};
