import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const user = useQuery(api.users.currentUser);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-td-background/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-td-foreground hover:text-td-primary transition-colors">
              theme<span className="text-td-primary">drops</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm text-td-muted hover:text-td-foreground transition-colors"
              >
                Browse
              </Link>
              {user && (
                <Link
                  to="/create"
                  className="text-sm text-td-muted hover:text-td-foreground transition-colors"
                >
                  Create
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Link
                  to="/settings"
                  className="text-sm text-td-muted hover:text-td-foreground transition-colors"
                  title="Edit Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                  to="/user/$username"
                  params={{ username: user.username ?? "" }}
                  className="flex items-center gap-2 text-sm text-td-muted hover:text-td-foreground transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover bg-td-secondary"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-td-primary/20 flex items-center justify-center text-td-primary text-xs font-bold">
                      {(user.displayName || user.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline">{user.displayName || user.username}</span>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-td-primary text-white hover:bg-td-primary/90 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
