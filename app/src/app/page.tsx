"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import AuthControls from "./components/AuthControls";

const COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "muted",
] as const;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ThemeCard({
  theme,
  index,
}: {
  theme: Doc<"themes">;
  index: number;
}) {
  const author = useQuery(api.users.get, { id: theme.authorId });
  const colors = theme.colors;
  const primaryColor = colors.primary ?? colors.accent ?? "#6366f1";
  const bgColor = colors.background ?? "#ffffff";
  const fgColor = colors.foreground ?? "#000000";

  return (
    <Link
      href={`/theme/${theme.slug}`}
      className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-300/80"
      style={{
        animationDelay: `${index * 60}ms`,
        animation: "cardIn 0.5s ease-out both",
      }}
    >
      {/* Color bar — the hero of each card */}
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-0 flex">
          {COLOR_KEYS.map((key) => {
            const color = colors[key];
            if (!color) return null;
            return (
              <div
                key={key}
                className="flex-1 transition-all duration-300 group-hover:flex-[1.2]"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        {/* Subtle overlay fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 px-5 pb-5 pt-3">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors truncate">
          {theme.name}
        </h3>

        {author && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {author.displayName ?? author.username}
          </p>
        )}

        {theme.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {theme.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          {/* Mini swatch row */}
          <div className="flex gap-1">
            {COLOR_KEYS.map((key) => {
              const color = colors[key];
              if (!color) return null;
              return (
                <div
                  key={key}
                  className="w-4 h-4 rounded-full border border-gray-200/60 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`${key}: ${color}`}
                />
              );
            })}
          </div>

          {/* Star count */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="text-amber-400">&#9733;</span>
            <span>{theme.starCount}</span>
          </div>
        </div>

        {/* Preview strip at bottom */}
        <div
          className="mt-3 rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: bgColor }}
        >
          <span
            className="text-[10px] font-medium truncate"
            style={{ color: fgColor }}
          >
            Aa Preview
          </span>
          <div
            className="w-10 h-4 rounded"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-100" />
      <div className="px-5 pb-5 pt-3 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-50 rounded w-1/3" />
        <div className="h-3 bg-gray-50 rounded w-full mt-4" />
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-gray-100" />
            ))}
          </div>
          <div className="h-3 w-6 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const isSearching = debouncedSearch.length > 0;

  const {
    results: pagedThemes,
    status,
    loadMore,
  } = usePaginatedQuery(api.themes.list, {}, { initialNumItems: 20 });

  const searchResults = useQuery(
    api.themes.search,
    isSearching ? { name: debouncedSearch } : "skip"
  );

  const themes = isSearching ? searchResults : pagedThemes;
  const isLoading = themes === undefined;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes heroShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-gray-200 bg-white">
        {/* Animated gradient backdrop */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, #6366f1, transparent 50%), radial-gradient(ellipse at 80% 50%, #f59e0b, transparent 50%), radial-gradient(ellipse at 50% 0%, #ec4899, transparent 50%)",
            backgroundSize: "200% 200%",
            animation: "heroShift 20s ease-in-out infinite",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="absolute top-6 right-6">
            <AuthControls />
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Theme
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500">
                Drops
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-lg">
              Discover, share, and remix color and typography themes for any
              application.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-xl relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search themes by name..."
              className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all shadow-sm"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Status bar */}
        {isSearching && !isLoading && (
          <p className="text-sm text-gray-500 mb-6" style={{ animation: "fadeIn 0.3s ease-out" }}>
            {themes && themes.length > 0
              ? `${themes.length} result${themes.length === 1 ? "" : "s"} for "${debouncedSearch}"`
              : `No themes found for "${debouncedSearch}"`}
          </p>
        )}

        {/* Loading skeleton grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Theme grid */}
        {!isLoading && themes && themes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme, i) => (
              <ThemeCard
                key={theme._id}
                theme={theme}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Empty state (no themes at all) */}
        {!isLoading && !isSearching && themes && themes.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">&#127912;</div>
            <h2 className="text-xl font-semibold text-gray-800">
              No themes yet
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
              Be the first to create and share a theme with the community.
            </p>
          </div>
        )}

        {/* No search results */}
        {!isLoading && isSearching && themes && themes.length === 0 && (
          <div className="text-center py-20" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="text-4xl mb-3 opacity-60">&#128269;</div>
            <h2 className="text-lg font-semibold text-gray-700">
              No matches
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              Try a different search term.
            </p>
          </div>
        )}

        {/* Load more */}
        {!isSearching && status === "CanLoadMore" && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => loadMore(20)}
              className="px-8 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]"
            >
              Load more themes
            </button>
          </div>
        )}

        {!isSearching && status === "LoadingMore" && (
          <div className="flex justify-center mt-10">
            <div className="text-sm text-gray-400 animate-pulse">
              Loading more...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
