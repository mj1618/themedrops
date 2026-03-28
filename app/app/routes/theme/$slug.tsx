import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, type FormEvent } from "react";
import { useTheme } from "../../lib/ThemeProvider";
import { AuthModal } from "../../components/AuthModal";

export const Route = createFileRoute("/theme/$slug")({
  component: ThemeDetailPage,
});

function ThemeDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const theme = useQuery(api.themes.getBySlug, { slug });
  const comments = useQuery(
    api.comments.listByTheme,
    theme ? { themeId: theme._id } : "skip"
  );
  const user = useQuery(api.users.currentUser);

  const toggleStar = useMutation(api.themes.toggleStar);
  const deleteTheme = useMutation(api.themes.remove);
  const forkTheme = useMutation(api.themes.fork);
  const addComment = useMutation(api.comments.create);
  const deleteComment = useMutation(api.comments.remove);

  const { applySiteTheme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [forkName, setForkName] = useState("");
  const [showFork, setShowFork] = useState(false);
  const [apiFormat, setApiFormat] = useState("hex");
  const [showApi, setShowApi] = useState(false);

  if (theme === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-64 rounded-2xl bg-td-secondary animate-pulse" />
      </div>
    );
  }

  if (theme === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-td-foreground">Theme not found</h1>
        <Link to="/" className="text-td-primary mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const handleStar = async () => {
    if (!user) return setShowAuth(true);
    await toggleStar({ themeId: theme._id });
  };

  const handleFork = async () => {
    if (!user) return setShowAuth(true);
    if (!forkName.trim()) return;
    const id = await forkTheme({ themeId: theme._id, name: forkName });
    if (id) navigate({ to: "/" });
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this theme?")) {
      await deleteTheme({ id: theme._id });
      navigate({ to: "/" });
    }
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return setShowAuth(true);
    if (!commentBody.trim()) return;
    await addComment({ themeId: theme._id, body: commentBody.trim() });
    setCommentBody("");
  };

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://themedrops.com";
  const apiUrl = `${siteUrl}/api/themes/${theme.slug}`;

  const exampleResponse = JSON.stringify(
    {
      name: theme.name,
      slug: theme.slug,
      colors:
        apiFormat === "hex"
          ? theme.colors
          : Object.fromEntries(
              Object.entries(theme.colors).map(([k, v]) => [
                k,
                apiFormat === "rgb"
                  ? `rgb(${parseInt(v.slice(1, 3), 16)}, ${parseInt(v.slice(3, 5), 16)}, ${parseInt(v.slice(5, 7), 16)})`
                  : `${apiFormat}(...)`,
              ])
            ),
      fonts: theme.fonts,
    },
    null,
    2
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Theme Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Color preview */}
        <div
          className="w-full md:w-80 shrink-0 rounded-2xl overflow-hidden border border-white/10"
          style={{ backgroundColor: theme.colors.background }}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: theme.colors.primary }} />
              <div className="space-y-1 flex-1">
                <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: theme.colors.foreground, opacity: 0.8 }} />
                <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: theme.colors.muted }} />
              </div>
            </div>
            <div className="space-y-2">
              {[1, 0.85, 0.65].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full" style={{ backgroundColor: theme.colors.secondary, width: `${w * 100}%` }} />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: theme.colors.primary }}>
                Primary
              </div>
              <div className="px-4 py-2 rounded-lg text-xs font-medium border" style={{ color: theme.colors.accent, borderColor: theme.colors.accent + "44" }}>
                Accent
              </div>
            </div>
          </div>
          <div className="flex h-2">
            {Object.values(theme.colors).map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-td-foreground">{theme.name}</h1>
            {theme.forkParent && (
              <p className="text-sm text-td-muted mt-1">
                Forked from{" "}
                <Link
                  to="/theme/$slug"
                  params={{ slug: theme.forkParent.slug }}
                  className="text-td-primary hover:underline"
                >
                  {theme.forkParent.name}
                </Link>
              </p>
            )}
            {theme.author && (
              <p className="text-sm text-td-muted mt-1">
                by{" "}
                <Link
                  to="/user/$username"
                  params={{ username: theme.author.username }}
                  className="text-td-accent hover:underline"
                >
                  {theme.author.displayName}
                </Link>
              </p>
            )}
          </div>

          {theme.description && (
            <p className="text-td-muted">{theme.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStar}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                theme.isStarred
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20"
              }`}
            >
              <svg className="w-4 h-4" fill={theme.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {theme.starCount} Stars
            </button>

            <button
              onClick={() => {
                if (!user) return setShowAuth(true);
                setShowFork(!showFork);
                setForkName(theme.name + " Fork");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Fork ({theme.forkCount})
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${siteUrl}/theme/${theme.slug}`);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>

            <button
              onClick={() => applySiteTheme({ name: theme.name, slug: theme.slug, colors: theme.colors, fonts: theme.fonts })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-primary/10 text-td-primary border border-td-primary/20 hover:bg-td-primary/20 transition-colors"
            >
              Apply to Site
            </button>

            {theme.isOwner && (
              <>
                <Link
                  to="/theme/$slug/edit"
                  params={{ slug: theme.slug }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-td-secondary text-td-foreground border border-white/10 hover:border-white/20 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Fork form */}
          {showFork && (
            <div className="flex gap-2">
              <input
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground text-sm focus:outline-none focus:ring-2 focus:ring-td-primary/30"
              />
              <button
                onClick={handleFork}
                className="px-4 py-2 rounded-lg bg-td-primary text-white text-sm font-medium"
              >
                Fork
              </button>
            </div>
          )}

          {/* Color swatches */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(theme.colors).map(([name, color]) => (
              <div key={name} className="space-y-1">
                <div
                  className="w-full aspect-square rounded-xl border border-white/10"
                  style={{ backgroundColor: color }}
                />
                <p className="text-[10px] text-td-muted text-center capitalize">
                  {name}
                </p>
                <p className="text-[10px] text-td-muted/70 text-center font-mono">
                  {color}
                </p>
              </div>
            ))}
          </div>

          {/* Fonts */}
          <div className="flex gap-4 text-sm text-td-muted">
            <span>Heading: <span className="text-td-foreground">{theme.fonts.heading}</span></span>
            <span>Body: <span className="text-td-foreground">{theme.fonts.body}</span></span>
            <span>Mono: <span className="text-td-foreground">{theme.fonts.mono}</span></span>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <section className="space-y-3">
        <button
          onClick={() => setShowApi(!showApi)}
          className="flex items-center gap-2 text-lg font-bold text-td-foreground"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showApi ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          API Documentation
        </button>
        {showApi && (
          <div className="rounded-xl border border-white/10 bg-td-secondary p-5 space-y-4">
            <div>
              <p className="text-sm text-td-muted mb-2">Endpoint URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-td-foreground bg-td-background rounded-lg px-3 py-2 border border-white/5 truncate">
                  {apiUrl}?format={apiFormat}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${apiUrl}?format=${apiFormat}`)}
                  className="px-3 py-2 rounded-lg bg-td-primary/10 text-td-primary text-sm hover:bg-td-primary/20 transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-td-muted mb-2">Format:</p>
              <div className="flex gap-1 p-1 rounded-lg bg-td-background w-fit">
                {["hex", "hsl", "rgb", "oklch"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setApiFormat(fmt)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      apiFormat === fmt
                        ? "bg-td-primary text-white"
                        : "text-td-muted hover:text-td-foreground"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-td-muted mb-2">Example response:</p>
              <pre className="text-xs font-mono text-td-foreground bg-td-background rounded-lg p-4 border border-white/5 overflow-x-auto">
                {exampleResponse}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* Comments */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-td-foreground">
          Comments {comments ? `(${comments.length})` : ""}
        </h2>

        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            className="flex-1 px-4 py-2 rounded-xl bg-td-secondary border border-white/5 text-td-foreground placeholder:text-td-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-td-primary/30"
            disabled={!user}
          />
          <button
            type="submit"
            disabled={!user || !commentBody.trim()}
            className="px-4 py-2 rounded-xl bg-td-primary text-white text-sm font-medium disabled:opacity-30 hover:bg-td-primary/90 transition-colors"
          >
            Post
          </button>
        </form>

        <div className="space-y-3">
          {comments?.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3 p-3 rounded-xl bg-td-secondary/50 border border-white/5">
              <div className="w-7 h-7 rounded-full bg-td-primary/20 flex items-center justify-center text-td-primary text-xs font-bold shrink-0">
                {comment.author.displayName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link
                    to="/user/$username"
                    params={{ username: comment.author.username }}
                    className="font-medium text-td-accent hover:underline"
                  >
                    {comment.author.displayName}
                  </Link>
                </p>
                <p className="text-sm text-td-muted mt-0.5">{comment.body}</p>
              </div>
              {comment.isOwner && (
                <button
                  onClick={() => deleteComment({ id: comment._id })}
                  className="text-td-muted hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
