import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../lib/ThemeProvider";
import { useState, useRef, useEffect } from "react";

export function ThemeSwitcher() {
  const themes = useQuery(api.themes.list, { sortBy: "stars", limit: 20 });
  const { siteTheme, applySiteTheme, clearSiteTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-white/10 text-td-muted hover:text-td-foreground hover:border-white/20 transition-colors"
      >
        <div className="flex gap-0.5">
          {siteTheme ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: siteTheme.colors.primary }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: siteTheme.colors.accent }} />
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-td-primary" />
              <div className="w-2.5 h-2.5 rounded-full bg-td-accent" />
            </>
          )}
        </div>
        <span className="hidden sm:inline">{siteTheme?.name ?? "Default"}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 py-2 rounded-xl border border-white/10 bg-td-secondary shadow-2xl z-50 max-h-80 overflow-y-auto">
          <button
            onClick={() => {
              clearSiteTheme();
              setOpen(false);
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-white/5 transition-colors ${!siteTheme ? "text-td-primary" : "text-td-foreground"}`}
          >
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-full bg-[#6d28d9]" />
              <div className="w-3 h-3 rounded-full bg-[#f472b6]" />
            </div>
            Default
          </button>
          {themes?.map((theme) => (
            <button
              key={theme._id}
              onClick={() => {
                applySiteTheme({
                  name: theme.name,
                  slug: theme.slug,
                  colors: theme.colors,
                  fonts: theme.fonts,
                });
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-white/5 transition-colors ${siteTheme?.slug === theme.slug ? "text-td-primary" : "text-td-foreground"}`}
            >
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
              </div>
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
