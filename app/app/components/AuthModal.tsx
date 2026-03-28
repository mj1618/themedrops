import { useState, type FormEvent } from "react";
import { useAuthActions } from "../lib/useAuthActions";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthActions();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signUp") {
        await signIn("password", {
          email,
          password,
          username,
          displayName: displayName || username,
          flow: "signUp",
        });
      } else {
        await signIn("password", {
          email,
          password,
          flow: "signIn",
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 bg-td-secondary rounded-2xl border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-bold text-td-foreground mb-1">
          {mode === "signIn" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-td-muted text-sm mb-6">
          {mode === "signIn"
            ? "Sign in to create and share themes"
            : "Join the community and start creating"}
        </p>

        {error && (
          <div className="mb-4 p-3 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <>
              <div>
                <label className="block text-sm font-medium text-td-foreground mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/50"
                  placeholder="cooldesigner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-td-foreground mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/50"
                  placeholder="Cool Designer"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-td-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-td-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground placeholder:text-td-muted/50 focus:outline-none focus:ring-2 focus:ring-td-primary/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-td-primary text-white font-medium hover:bg-td-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "signIn"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-td-muted">
          {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError("");
            }}
            className="text-td-primary hover:underline font-medium"
          >
            {mode === "signIn" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
