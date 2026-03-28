import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import type { Id } from "../../convex/_generated/dataModel";

export function SimilarThemes({ themeId }: { themeId: Id<"themes"> }) {
  const themes = useQuery(api.themes.getSimilarThemes, { themeId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      return () => el.removeEventListener("scroll", updateScrollState);
    }
  }, [themes]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  // Loading skeleton
  if (themes === undefined) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-td-foreground">Similar Themes</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-56 shrink-0 h-48 rounded-2xl bg-td-secondary animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // Hide if fewer than 2 results
  if (!themes || themes.length < 2) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-td-foreground">Similar Themes</h2>
      <div className="relative group/scroll">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-td-background to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 text-td-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {themes.map((t) => (
            <Link
              key={t._id}
              to="/theme/$slug"
              params={{ slug: t.slug }}
              className="w-56 shrink-0 rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl snap-start"
              style={{ backgroundColor: t.colors.background }}
            >
              {/* Mini preview */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: t.colors.primary }} />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: t.colors.foreground, opacity: 0.8 }} />
                    <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: t.colors.muted }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: t.colors.secondary }} />
                  <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: t.colors.secondary }} />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-5 px-2 rounded-md flex items-center" style={{ backgroundColor: t.colors.primary }}>
                    <span className="text-[8px] font-medium text-white">Button</span>
                  </div>
                  <div className="h-5 px-2 rounded-md flex items-center border" style={{ borderColor: t.colors.accent + "44" }}>
                    <span className="text-[8px] font-medium" style={{ color: t.colors.accent }}>Accent</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-2.5 border-t" style={{ borderColor: t.colors.foreground + "10" }}>
                <h3 className="text-xs font-semibold truncate" style={{ color: t.colors.foreground }}>
                  {t.name}
                </h3>
                <p className="text-[10px] truncate" style={{ color: t.colors.muted }}>
                  by <span style={{ color: t.colors.accent }}>{t.author.displayName}</span>
                </p>
                <span className="flex items-center gap-1 text-[10px] mt-1" style={{ color: t.colors.muted }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {t.starCount}
                </span>
              </div>

              {/* Color bar */}
              <div className="flex h-1">
                {Object.values(t.colors).map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-td-background to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 text-td-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
