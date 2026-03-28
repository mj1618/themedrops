import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ConvexAuthProvider } from "../lib/ConvexAuthProvider";
import { ThemeProvider } from "../lib/ThemeProvider";
import { Header } from "../components/Header";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "themedrops — Share & Discover Themes" },
      {
        name: "description",
        content:
          "A community gallery for color and typography themes. Create, fork, star, and use themes via API.",
      },
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
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
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
