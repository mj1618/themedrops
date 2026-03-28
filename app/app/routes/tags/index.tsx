import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/tags/")({
  component: TagsIndexPage,
});

function TagsIndexPage() {
  const tags = useQuery(api.tags.listPopular);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-td-foreground">Tags</h1>
        <p className="text-td-muted mt-2">Browse themes by tag</p>
      </div>

      {tags === undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-td-secondary animate-pulse" />
          ))}
        </div>
      )}

      {tags && tags.length === 0 && (
        <p className="text-td-muted text-center py-16">No tags yet.</p>
      )}

      {tags && tags.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <Link
              key={tag._id}
              to="/tags/$tagName"
              params={{ tagName: tag.name }}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-td-secondary border border-white/5 hover:border-td-primary/30 hover:bg-td-primary/5 transition-colors group"
            >
              <span className="text-sm font-medium text-td-foreground group-hover:text-td-primary transition-colors">
                {tag.name}
              </span>
              <span className="text-xs text-td-muted">
                {tag.count} {tag.count === 1 ? "theme" : "themes"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
