import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ThemeCard } from "../../components/ThemeCard";

function EditProfileButton({ username }: { username: string }) {
  const currentUser = useQuery(api.users.currentUser);
  if (!currentUser || currentUser.username !== username) return null;
  return (
    <Link
      to="/settings"
      className="px-4 py-1.5 text-sm font-medium rounded-lg bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
    >
      Edit Profile
    </Link>
  );
}

export const Route = createFileRoute("/user/$username")({
  component: UserProfilePage,
});

const PAGE_SIZE = 24;

function UserProfilePage() {
  const { username } = Route.useParams();
  const user = useQuery(api.users.getByUsername, { username });
  const {
    results: themes,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.themes.getByAuthor,
    user ? { authorId: user._id } : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  if (user === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-32 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-td-foreground">User not found</h1>
        <Link to="/" className="text-td-primary mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-5">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName || user.username || "Avatar"}
            className="w-20 h-20 rounded-2xl object-cover bg-td-secondary"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-td-primary/20 flex items-center justify-center text-td-primary text-3xl font-bold">
            {(user.displayName || user.username || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-td-foreground">
              {user.displayName || user.username}
            </h1>
            <EditProfileButton username={username} />
          </div>
          <p className="text-td-muted">@{user.username}</p>
          {user.bio && (
            <p className="text-td-muted mt-1 text-sm">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Themes */}
      <div>
        <h2 className="text-lg font-bold text-td-foreground mb-4">
          Themes
        </h2>
        {themes && themes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme._id}
                  theme={{
                    ...theme,
                    author: {
                      username: user.username ?? "unknown",
                      displayName: user.displayName ?? user.username ?? "Unknown",
                    },
                  }}
                />
              ))}
            </div>

            {status === "CanLoadMore" && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => loadMore(PAGE_SIZE)}
                  className="px-6 py-2.5 rounded-xl bg-td-secondary text-td-foreground font-medium border border-white/10 hover:border-white/20 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
            {status === "LoadingMore" && (
              <div className="flex justify-center pt-6">
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
          </>
        ) : themes ? (
          <p className="text-td-muted">No themes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-td-secondary animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
