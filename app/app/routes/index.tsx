import { createFileRoute } from "@tanstack/react-router";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThemeCard } from "../components/ThemeCard";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const PAGE_SIZE = 24;
const SEARCH_PAGE_SIZE = 24;
const ACTIVITY_PAGE_SIZE = 6;

function HomePage() {
  const [sortBy, setSortBy] = useState<"stars" | "newest">("stars");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDisplayCount, setSearchDisplayCount] = useState(SEARCH_PAGE_SIZE);

  const {
    results: themes,
    status: themesStatus,
    loadMore: loadMoreThemes,
  } = usePaginatedQuery(
    api.themes.list,
    { sortBy },
    { initialNumItems: PAGE_SIZE }
  );

  const searchResults = useQuery(
    api.themes.search,
    searchQuery.trim() ? { query: searchQuery, limit: 50 } : "skip"
  );

  const {
    results: recentComments,
    status: activityStatus,
    loadMore: loadMoreActivity,
  } = usePaginatedQuery(
    api.comments.listRecent,
    {},
    { initialNumItems: ACTIVITY_PAGE_SIZE }
  );

  const isSearching = !!searchQuery.trim();
  const displayedSearchResults = searchResults?.slice(0, searchDisplayCount);
  const hasMoreSearchResults = searchResults ? searchResults.length > searchDisplayCount : false;
  const displayedThemes = isSearching ? displayedSearchResults : themes;

  const handleSortChange = (tab: "stars" | "newest") => {
    setSortBy(tab);
    setSearchQuery("");
    setSearchDisplayCount(SEARCH_PAGE_SIZE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchDisplayCount(SEARCH_PAGE_SIZE);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-td-foreground">
          theme<span className="text-td-primary">drops</span>
        </h1>
        <p className="text-lg md:text-xl text-td-muted max-w-2xl mx-auto">
          Discover, create, and share beautiful color themes.
          <br className="hidden md:block" />
          Use them anywhere via API — in VS Code, Discord, your website, and more.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            to="/create"
            className="px-6 py-2.5 rounded-xl bg-td-primary text-white font-medium hover:bg-td-primary/90 transition-colors"
          >
            Create a Theme
          </Link>
          <a
            href="#gallery"
            className="px-6 py-2.5 rounded-xl border border-white/10 text-td-foreground font-medium hover:bg-white/5 transition-colors"
          >
            Browse Gallery
          </a>
        </div>
      </section>

      {/* Search & Filters */}
      <section id="gallery" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-1 p-1 rounded-xl bg-td-secondary">
            {(["stars", "newest"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleSortChange(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === tab && !searchQuery
                    ? "bg-td-primary text-white"
                    : "text-td-muted hover:text-td-foreground"
                }`}
              >
                {tab === "stars" ? "Popular" : "Newest"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-td-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search themes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-td-secondary border border-white/5 text-td-foreground placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/30 text-sm"
            />
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedThemes?.map((theme) => (
            <ThemeCard key={theme._id} theme={theme} />
          ))}
        </div>

        {displayedThemes && displayedThemes.length === 0 && (
          <div className="text-center py-16 text-td-muted">
            {searchQuery ? "No themes match your search." : "No themes yet. Be the first to create one!"}
          </div>
        )}

        {!displayedThemes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-td-secondary animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Load More button */}
        {!isSearching && themesStatus === "CanLoadMore" && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => loadMoreThemes(PAGE_SIZE)}
              className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-foreground font-medium border border-white/10 hover:border-white/20 transition-colors"
            >
              Load more
            </button>
          </div>
        )}

        {!isSearching && themesStatus === "LoadingMore" && (
          <div className="flex justify-center pt-4">
            <button
              disabled
              className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-muted font-medium border border-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </span>
            </button>
          </div>
        )}

        {/* Search Load More (client-side pagination) */}
        {isSearching && hasMoreSearchResults && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setSearchDisplayCount((c) => c + SEARCH_PAGE_SIZE)}
              className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-foreground font-medium border border-white/10 hover:border-white/20 transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentComments && recentComments.length > 0 && (
        <section className="mt-16 space-y-4">
          <h2 className="text-xl font-bold text-td-foreground">Recent Activity</h2>
          <div className="space-y-2">
            {recentComments.map((comment) => (
              <div
                key={comment._id}
                className="flex items-start gap-3 p-3 rounded-xl bg-td-secondary/50 border border-white/5"
              >
                <div className="w-7 h-7 rounded-full bg-td-primary/20 flex items-center justify-center text-td-primary text-xs font-bold shrink-0">
                  {(comment.author.displayName || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-td-foreground">
                    <Link
                      to="/user/$username"
                      params={{ username: comment.author.username }}
                      className="font-medium text-td-accent hover:underline"
                    >
                      {comment.author.displayName}
                    </Link>{" "}
                    commented on{" "}
                    {comment.theme.slug ? (
                      <Link
                        to="/theme/$slug"
                        params={{ slug: comment.theme.slug }}
                        className="font-medium text-td-primary hover:underline"
                      >
                        {comment.theme.name}
                      </Link>
                    ) : (
                      <span className="text-td-muted">{comment.theme.name}</span>
                    )}
                  </p>
                  <p className="text-sm text-td-muted truncate">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>

          {activityStatus === "CanLoadMore" && (
            <div className="flex justify-center">
              <button
                onClick={() => loadMoreActivity(ACTIVITY_PAGE_SIZE)}
                className="text-sm text-td-primary hover:underline"
              >
                View more activity
              </button>
            </div>
          )}
          {activityStatus === "LoadingMore" && (
            <div className="flex justify-center">
              <span className="text-sm text-td-muted">Loading...</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
