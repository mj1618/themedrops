import { Link } from "@tanstack/react-router";

type CollectionCardProps = {
  collection: {
    _id: string;
    name: string;
    description?: string;
    themeCount: number;
    previewColors: Array<{
      background: string;
      foreground: string;
      primary: string;
      secondary: string;
      accent: string;
      muted: string;
    }>;
  };
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      to="/collection/$collectionId"
      params={{ collectionId: collection._id }}
      className="group block rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-td-secondary"
    >
      {/* Color preview strip */}
      <div className="h-24 relative overflow-hidden">
        {collection.previewColors.length > 0 ? (
          <div className="flex h-full">
            {collection.previewColors.map((colors, i) => (
              <div key={i} className="flex-1 flex flex-col">
                {Object.values(colors).map((color, j) => (
                  <div
                    key={j}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full bg-td-background/50 flex items-center justify-center">
            <span className="text-td-muted text-sm">No themes yet</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-td-foreground truncate">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs text-td-muted mt-0.5 line-clamp-2">
            {collection.description}
          </p>
        )}
        <p className="text-xs text-td-muted mt-2">
          {collection.themeCount} {collection.themeCount === 1 ? "theme" : "themes"}
        </p>
      </div>
    </Link>
  );
}
