import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ThemeCard } from "../../components/ThemeCard";

export const Route = createFileRoute("/user/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const user = useQuery(api.users.getByUsername, { username });
  const themes = useQuery(
    api.themes.getByAuthor,
    user ? { authorId: user._id } : "skip"
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
        <div className="w-20 h-20 rounded-2xl bg-td-primary/20 flex items-center justify-center text-td-primary text-3xl font-bold">
          {(user.displayName || user.username || "?")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-td-foreground">
            {user.displayName || user.username}
          </h1>
          <p className="text-td-muted">@{user.username}</p>
          {user.bio && (
            <p className="text-td-muted mt-1 text-sm">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Themes */}
      <div>
        <h2 className="text-lg font-bold text-td-foreground mb-4">
          Themes ({themes?.length ?? 0})
        </h2>
        {themes && themes.length > 0 ? (
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
        ) : (
          <p className="text-td-muted">No themes yet.</p>
        )}
      </div>
    </div>
  );
}
