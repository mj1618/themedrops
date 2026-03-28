import { Link } from "@tanstack/react-router";

type ThemeCardProps = {
  theme: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    colors: {
      background: string;
      foreground: string;
      primary: string;
      secondary: string;
      accent: string;
      muted: string;
    };
    starCount: number;
    author: {
      username: string;
      displayName: string;
    };
  };
};

export function ThemeCard({ theme }: ThemeCardProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/theme/${theme.slug}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <Link
      to="/theme/$slug"
      params={{ slug: theme.slug }}
      className="group block rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Preview area */}
      <div className="p-5 space-y-3">
        {/* Mock UI elements using theme colors */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div className="flex-1 space-y-1">
            <div
              className="h-2.5 rounded-full w-3/4"
              style={{ backgroundColor: theme.colors.foreground, opacity: 0.8 }}
            />
            <div
              className="h-2 rounded-full w-1/2"
              style={{ backgroundColor: theme.colors.muted }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div
            className="h-2 rounded-full w-full"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="h-2 rounded-full w-5/6"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="h-2 rounded-full w-2/3"
            style={{ backgroundColor: theme.colors.secondary }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <div
            className="h-7 px-3 rounded-lg flex items-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <span className="text-[10px] font-medium" style={{ color: "#fff" }}>
              Button
            </span>
          </div>
          <div
            className="h-7 px-3 rounded-lg flex items-center border"
            style={{ borderColor: theme.colors.accent + "44" }}
          >
            <span className="text-[10px] font-medium" style={{ color: theme.colors.accent }}>
              Accent
            </span>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div
        className="px-5 py-3 border-t flex items-center justify-between"
        style={{ borderColor: theme.colors.foreground + "10" }}
      >
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold truncate"
            style={{ color: theme.colors.foreground }}
          >
            {theme.name}
          </h3>
          <p className="text-xs truncate" style={{ color: theme.colors.muted }}>
            by{" "}
            <span style={{ color: theme.colors.accent }}>
              {theme.author.displayName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: theme.colors.muted }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {theme.starCount}
          </span>
          <button
            onClick={handleShare}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: theme.colors.muted }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color palette bar */}
      <div className="flex h-1.5">
        {Object.values(theme.colors).map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </Link>
  );
}
