import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ThemeCard } from "../../components/ThemeCard";

export const Route = createFileRoute("/tags/$tagName")({
  component: TagPage,
});

const PAGE_SIZE = 24;

function TagPage() {
  const { tagName } = Route.useParams();

  const {
    results: themes,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.tags.getThemesByTag,
    { tag: tagName },
    { initialNumItems: PAGE_SIZE }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tags" className="text-td-muted hover:text-td-foreground transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-td-foreground">
            <span className="text-td-muted">#</span>{tagName}
          </h1>
          <p className="text-sm text-td-muted mt-1">
            Themes tagged with "{tagName}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes?.map((theme) => (
          <ThemeCard key={theme._id} theme={theme} />
        ))}
      </div>

      {themes && themes.length === 0 && (
        <div className="text-center py-16 text-td-muted">
          No themes found with this tag.
        </div>
      )}

      {!themes && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-td-secondary animate-pulse" />
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => loadMore(PAGE_SIZE)}
            className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-foreground font-medium border border-white/10 hover:border-white/20 transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {status === "LoadingMore" && (
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
    </div>
  );
}
