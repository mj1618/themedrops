import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

type ThemeFonts = {
  heading: string;
  body: string;
  mono: string;
};

type SiteTheme = {
  name: string;
  slug: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
} | null;

type ThemeContextValue = {
  siteTheme: SiteTheme;
  applySiteTheme: (theme: SiteTheme) => void;
  clearSiteTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  siteTheme: null,
  applySiteTheme: () => {},
  clearSiteTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "themedrops-site-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSiteTheme(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!siteTheme) {
      // Reset to defaults
      const root = document.documentElement;
      root.style.removeProperty("--td-background");
      root.style.removeProperty("--td-foreground");
      root.style.removeProperty("--td-primary");
      root.style.removeProperty("--td-secondary");
      root.style.removeProperty("--td-accent");
      root.style.removeProperty("--td-muted");
      root.style.removeProperty("--td-font-heading");
      root.style.removeProperty("--td-font-body");
      root.style.removeProperty("--td-font-mono");
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--td-background", siteTheme.colors.background);
    root.style.setProperty("--td-foreground", siteTheme.colors.foreground);
    root.style.setProperty("--td-primary", siteTheme.colors.primary);
    root.style.setProperty("--td-secondary", siteTheme.colors.secondary);
    root.style.setProperty("--td-accent", siteTheme.colors.accent);
    root.style.setProperty("--td-muted", siteTheme.colors.muted);
    root.style.setProperty("--td-font-heading", siteTheme.fonts.heading);
    root.style.setProperty("--td-font-body", siteTheme.fonts.body);
    root.style.setProperty("--td-font-mono", siteTheme.fonts.mono);
  }, [siteTheme]);

  const applySiteTheme = (theme: SiteTheme) => {
    setSiteTheme(theme);
    if (theme) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    }
  };

  const clearSiteTheme = () => {
    setSiteTheme(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ThemeContext.Provider value={{ siteTheme, applySiteTheme, clearSiteTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
