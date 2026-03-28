import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ConvexAuthProvider } from "../lib/ConvexAuthProvider";
import { ThemeProvider } from "../lib/ThemeProvider";
import { ToastProvider } from "../components/Toast";
import { Header } from "../components/Header";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "themedrops — discover and share color themes" },
      {
        name: "description",
        content:
          "Browse, create, and share beautiful color themes for your apps, VS Code, and more.",
      },
      { property: "og:title", content: "themedrops — discover and share color themes" },
      { property: "og:description", content: "Browse, create, and share beautiful color themes for your apps, VS Code, and more." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "themedrops" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "themedrops — discover and share color themes" },
      { name: "twitter:description", content: "Browse, create, and share beautiful color themes for your apps, VS Code, and more." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <ConvexAuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">
              <Outlet />
            </main>
          </ToastProvider>
        </ThemeProvider>
      </ConvexAuthProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
