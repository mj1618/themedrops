import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { ThemeSwitcher } from "./ThemeSwitcher";

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
              <Link
                to="/user/$username"
                params={{ username: user.username ?? "" }}
                className="flex items-center gap-2 text-sm text-td-muted hover:text-td-foreground transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-td-primary/20 flex items-center justify-center text-td-primary text-xs font-bold">
                  {(user.displayName || user.username || "?")[0].toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.displayName || user.username}</span>
              </Link>
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
