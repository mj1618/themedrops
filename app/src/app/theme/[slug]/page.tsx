"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
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

const FONT_KEYS = ["sans", "serif", "mono"] as const;

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

function EditableColorSwatch({
  color,
  label,
  onChange,
}: {
  color: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="relative w-16 h-16 rounded-xl border border-gray-200 shadow-sm cursor-pointer overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-mono text-gray-600 w-20 text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
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
  const removeComment = useMutation(api.comments.remove);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Share
  const [copied, setCopied] = useState(false);

  // Fork
  const forkTheme = useMutation(api.themes.fork);
  const [forking, setForking] = useState(false);

  // Forked-from theme info (for link)
  const forkedFrom = useQuery(
    api.themes.getBasicInfo,
    theme?.forkedFromId ? { id: theme.forkedFromId } : "skip"
  );

  // Edit/Delete mutations
  const updateTheme = useMutation(api.themes.update);
  const removeTheme = useMutation(api.themes.remove);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editColors, setEditColors] = useState<Record<string, string>>({});
  const [editFonts, setEditFonts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Owner detection
  const isOwner = !!(currentUser && theme && currentUser._id === theme.authorId);

  function enterEditMode() {
    if (!theme) return;
    setEditName(theme.name);
    setEditDescription(theme.description ?? "");
    setEditIsPublic(theme.isPublic);
    const c: Record<string, string> = {};
    const themeColors = theme.colors as Record<string, string | undefined>;
    for (const { key } of COLOR_LABELS) {
      if (themeColors[key]) c[key] = themeColors[key]!;
    }
    setEditColors(c);
    const f: Record<string, string> = {};
    if (theme.fonts) {
      for (const k of FONT_KEYS) {
        if (theme.fonts[k]) f[k] = theme.fonts[k]!;
      }
    }
    setEditFonts(f);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!theme) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates: Record<string, unknown> = { id: theme._id };
      if (editName !== theme.name) updates.name = editName;
      if (editDescription !== (theme.description ?? ""))
        updates.description = editDescription;
      if (editIsPublic !== theme.isPublic) updates.isPublic = editIsPublic;

      // Colors: always send all edited colors
      const origColors = theme.colors as Record<string, string | undefined>;
      const colorsChanged = COLOR_LABELS.some(
        ({ key }) => (editColors[key] ?? "") !== (origColors[key] ?? "")
      );
      if (colorsChanged) updates.colors = editColors;

      // Fonts: send if changed
      const origFonts = (theme.fonts ?? {}) as Record<string, string | undefined>;
      const fontsChanged = FONT_KEYS.some(
        (k) => (editFonts[k] ?? "") !== (origFonts[k] ?? "")
      );
      if (fontsChanged) {
        const fontPayload: Record<string, string> = {};
        for (const k of FONT_KEYS) {
          if (editFonts[k]?.trim()) fontPayload[k] = editFonts[k];
        }
        updates.fonts = fontPayload;
      }

      const result = await updateTheme(updates as Parameters<typeof updateTheme>[0]);
      setEditing(false);

      // If name changed, the slug changed server-side — redirect using the returned slug
      if (editName !== theme.name && result?.slug) {
        router.push(`/theme/${result.slug}`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!theme) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeTheme({ id: theme._id });
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

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

  const colors = editing
    ? (editColors as Record<string, string | undefined>)
    : (theme.colors as Record<string, string | undefined>);

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

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      await removeComment({ id: commentId as Parameters<typeof removeComment>[0]["id"] });
    } finally {
      setDeletingCommentId(null);
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
            <div className="space-y-1 flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-3xl font-bold text-gray-900 w-full border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">
                  {theme.name}
                </h1>
              )}
              {author && (
                <p className="text-sm text-gray-500">
                  by{" "}
                  <Link
                    href={`/user/${author.username}`}
                    className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {author.displayName ?? author.username}
                  </Link>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Owner controls */}
              {isOwner && !editing && (
                <>
                  <button
                    onClick={enterEditMode}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  {!confirmingDelete ? (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="px-4 py-2 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span className="text-sm text-red-700">Delete this theme?</span>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmingDelete(false);
                          setDeleteError(null);
                        }}
                        disabled={deleting}
                        className="px-3 py-1 rounded border border-red-200 text-sm text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Edit mode controls */}
              {editing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editName.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Star button */}
              {!editing && (
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
                  <span className="text-lg">
                    {isStarred ? "\u2605" : "\u2606"}
                  </span>
                  <span>{theme.starCount}</span>
                </button>
              )}

              {/* Share button */}
              {!editing && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>{copied ? "Copied!" : "Share"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Delete error */}
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {deleteError}
            </p>
          )}

          {/* Save error */}
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          {/* Description */}
          {editing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Theme description..."
              rows={3}
              className="w-full text-gray-600 leading-relaxed border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            theme.description && (
              <p className="text-gray-600 leading-relaxed">
                {theme.description}
              </p>
            )
          )}

          {/* Visibility toggle */}
          {editing && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Visibility:</span>
              <button
                onClick={() => setEditIsPublic(!editIsPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editIsPublic ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    editIsPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-500">
                {editIsPublic ? "Public" : "Private"}
              </span>
            </div>
          )}

          {theme.forkedFromId && forkedFrom && (
            <p className="text-sm text-gray-400 italic">
              Forked from{" "}
              <a
                href={`/theme/${forkedFrom.slug}`}
                className="text-blue-500 hover:underline"
              >
                {forkedFrom.name}
              </a>
            </p>
          )}

          {!editing && (
            <p className="text-xs text-gray-400 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
              API: /api/themes/{theme.slug}
            </p>
          )}
        </div>

        {/* Color palette */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Color Palette</h2>
          <div className="flex flex-wrap gap-6">
            {editing
              ? COLOR_LABELS.map(({ key, label }) => (
                  <EditableColorSwatch
                    key={key}
                    color={editColors[key] ?? "#000000"}
                    label={label}
                    onChange={(value) =>
                      setEditColors((prev) => ({ ...prev, [key]: value }))
                    }
                  />
                ))
              : COLOR_LABELS.map(({ key, label }) => {
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
        {editing ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Fonts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FONT_KEYS.map((k) => (
                <div
                  key={k}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {k}
                  </p>
                  <input
                    type="text"
                    value={editFonts[k] ?? ""}
                    onChange={(e) =>
                      setEditFonts((prev) => ({ ...prev, [k]: e.target.value }))
                    }
                    placeholder={`${k} font name`}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {editFonts[k] && (
                    <p
                      className="text-sm text-gray-500 mt-2"
                      style={{ fontFamily: editFonts[k] }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          theme.fonts &&
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
          )
        )}

        {/* Fork button */}
        {currentUser && !editing && (
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
        {!editing && (
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
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
                      {currentUser?._id === comment.userId && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingCommentId === comment._id}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingCommentId === comment._id ? "Deleting..." : "Delete"}
                        </button>
                      )}
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
        )}
      </main>
    </div>
  );
}
