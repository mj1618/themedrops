"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import AuthControls from "../../components/AuthControls";
import CreateThemeLink from "../../components/CreateThemeLink";
const COLOR_LABELS: { key: string; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Muted" },
];

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-16 h-16 rounded-xl border border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-xs font-mono text-gray-400">{color}</span>
    </div>
  );
}

function LivePreview({
  colors,
}: {
  colors: Record<string, string | undefined>;
}) {
  return (
    <div
      className="rounded-xl border p-6 space-y-4"
      style={{
        backgroundColor: colors.background ?? "#ffffff",
        color: colors.foreground ?? "#000000",
        borderColor: colors.muted ?? "#e5e7eb",
      }}
    >
      <h3 className="text-lg font-semibold">Live Preview</h3>
      <p style={{ color: colors.muted ?? "#6b7280" }} className="text-sm">
        This is how the theme looks when applied to a card.
      </p>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: colors.primary ?? "#3b82f6" }}
        >
          Primary
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: colors.secondary ?? "#6366f1" }}
        >
          Secondary
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{
            backgroundColor: colors.accent ?? "#f59e0b",
            borderColor: colors.muted ?? "#e5e7eb",
          }}
        >
          Accent
        </button>
      </div>
    </div>
  );
}

export default function ThemeDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const theme = useQuery(api.themes.getBySlug, { slug });
  const author = useQuery(
    api.users.get,
    theme ? { id: theme.authorId } : "skip"
  );
  const currentUser = useQuery(api.users.getCurrentUser);

  // Stars
  const isStarred = useQuery(
    api.stars.isStarred,
    theme ? { themeId: theme._id } : "skip"
  );
  const toggleStar = useMutation(api.stars.toggle);

  // Comments
  const comments = useQuery(
    api.comments.listByTheme,
    theme ? { themeId: theme._id } : "skip"
  );
  const createComment = useMutation(api.comments.create);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fork
  const forkTheme = useMutation(api.themes.fork);
  const [forking, setForking] = useState(false);

  // Forked-from theme info (for link)
  const forkedFrom = useQuery(
    api.themes.getBasicInfo,
    theme?.forkedFromId ? { id: theme.forkedFromId } : "skip"
  );

  // Loading state
  if (theme === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">
          Loading theme...
        </div>
      </div>
    );
  }

  // Not found
  if (theme === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Theme not found</h1>
        <p className="text-gray-500">
          This theme doesn&apos;t exist or is private.
        </p>
        <a href="/" className="text-blue-600 hover:underline text-sm">
          Back to gallery
        </a>
      </div>
    );
  }

  const colors = theme.colors as Record<string, string | undefined>;

  async function handleToggleStar() {
    if (!theme || !currentUser) return;
    await toggleStar({ themeId: theme._id });
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!theme || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      await createComment({ themeId: theme._id, body: commentBody.trim() });
      setCommentBody("");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleFork() {
    if (!theme) return;
    setForking(true);
    try {
      const result = await forkTheme({ id: theme._id });
      if (result) {
        router.push(`/theme/${result.slug}`);
      }
    } catch {
      // Fork may fail if not authenticated
    } finally {
      setForking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
          >
            ThemeDrops
          </a>
          <div className="flex items-center gap-3">
            <CreateThemeLink />
            <AuthControls />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Theme header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">{theme.name}</h1>
              {author && (
                <p className="text-sm text-gray-500">
                  by{" "}
                  <span className="font-medium text-gray-700">
                    {author.displayName ?? author.username}
                  </span>
                </p>
              )}
            </div>

            {/* Star button */}
            <button
              onClick={handleToggleStar}
              disabled={!currentUser}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isStarred
                  ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              } ${!currentUser ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={!currentUser ? "Sign in to star themes" : undefined}
            >
              <span className="text-lg">{isStarred ? "\u2605" : "\u2606"}</span>
              <span>{theme.starCount}</span>
            </button>
          </div>

          {theme.description && (
            <p className="text-gray-600 leading-relaxed">{theme.description}</p>
          )}

          {theme.forkedFromId && forkedFrom && (
            <p className="text-sm text-gray-400 italic">
              Forked from <a href={`/theme/${forkedFrom.slug}`} className="text-blue-500 hover:underline">{forkedFrom.name}</a>
            </p>
          )}

          <p className="text-xs text-gray-400 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
            API: /api/theme/{theme.slug}
          </p>
        </div>

        {/* Color palette */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Color Palette</h2>
          <div className="flex flex-wrap gap-6">
            {COLOR_LABELS.map(({ key, label }) => {
              const color = colors[key];
              if (!color) return null;
              return <ColorSwatch key={key} color={color} label={label} />;
            })}
          </div>
        </section>

        {/* Live preview */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
          <LivePreview colors={colors} />
        </section>

        {/* Fonts */}
        {theme.fonts &&
          (theme.fonts.sans || theme.fonts.serif || theme.fonts.mono) && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Fonts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {theme.fonts.sans && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Sans
                    </p>
                    <p
                      className="text-lg"
                      style={{ fontFamily: theme.fonts.sans }}
                    >
                      {theme.fonts.sans}
                    </p>
                    <p
                      className="text-sm text-gray-500 mt-1"
                      style={{ fontFamily: theme.fonts.sans }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                )}
                {theme.fonts.serif && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Serif
                    </p>
                    <p
                      className="text-lg"
                      style={{ fontFamily: theme.fonts.serif }}
                    >
                      {theme.fonts.serif}
                    </p>
                    <p
                      className="text-sm text-gray-500 mt-1"
                      style={{ fontFamily: theme.fonts.serif }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                )}
                {theme.fonts.mono && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Mono
                    </p>
                    <p
                      className="text-lg font-mono"
                      style={{ fontFamily: theme.fonts.mono }}
                    >
                      {theme.fonts.mono}
                    </p>
                    <p
                      className="text-sm text-gray-500 mt-1"
                      style={{ fontFamily: theme.fonts.mono }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* Fork button */}
        {currentUser && (
          <div>
            <button
              onClick={handleFork}
              disabled={forking}
              className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {forking ? "Forking..." : "Fork this theme"}
            </button>
          </div>
        )}

        {/* Comments */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Comments{" "}
            {comments && comments.length > 0 && (
              <span className="text-gray-400 font-normal">
                ({comments.length})
              </span>
            )}
          </h2>

          {comments === undefined && (
            <p className="text-gray-400 text-sm animate-pulse">
              Loading comments...
            </p>
          )}

          {comments && comments.length === 0 && (
            <p className="text-gray-400 text-sm">No comments yet.</p>
          )}

          {comments && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {comment.author?.avatarUrl && (
                      <img
                        src={comment.author.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {comment.author?.displayName ??
                        comment.author?.username ??
                        "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          {currentUser && (
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!commentBody.trim() || submittingComment}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {submittingComment ? "Posting..." : "Post"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
