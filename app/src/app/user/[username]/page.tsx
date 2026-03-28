"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import AuthControls from "../../components/AuthControls";
import CreateThemeLink from "../../components/CreateThemeLink";

const COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "muted",
] as const;

function ThemeCard({ theme }: { theme: Doc<"themes"> }) {
  const colors = theme.colors;
  const primaryColor = colors.primary ?? colors.accent ?? "#6366f1";
  const bgColor = colors.background ?? "#ffffff";
  const fgColor = colors.foreground ?? "#000000";

  return (
    <Link
      href={`/theme/${theme.slug}`}
      className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-300/80"
    >
      <div className="relative h-28 overflow-hidden">
        <div className="absolute inset-0 flex">
          {COLOR_KEYS.map((key) => {
            const color = colors[key];
            if (!color) return null;
            return (
              <div
                key={key}
                className="flex-1 transition-all duration-300 group-hover:flex-[1.2]"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="flex flex-col flex-1 px-5 pb-5 pt-3">
        <h3 className="text-base font-semibold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors truncate">
          {theme.name}
        </h3>

        {theme.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {theme.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {COLOR_KEYS.map((key) => {
              const color = colors[key];
              if (!color) return null;
              return (
                <div
                  key={key}
                  className="w-4 h-4 rounded-full border border-gray-200/60 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`${key}: ${color}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="text-amber-400">&#9733;</span>
            <span>{theme.starCount}</span>
          </div>
        </div>

        <div
          className="mt-3 rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: bgColor }}
        >
          <span
            className="text-[10px] font-medium truncate"
            style={{ color: fgColor }}
          >
            Aa Preview
          </span>
          <div
            className="w-10 h-4 rounded"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const user = useQuery(api.users.getByUsername, { username });
  const currentUser = useQuery(api.users.getCurrentUser);
  const userThemes = useQuery(
    api.themes.getByAuthor,
    user ? { authorId: user._id } : "skip"
  );
  const starredThemes = useQuery(
    api.stars.getStarredThemes,
    user ? { userId: user._id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  const isOwner = !!(currentUser && user && currentUser._id === user._id);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"themes" | "starred">("themes");

  function enterEditMode() {
    if (!user) return;
    setEditDisplayName(user.displayName ?? "");
    setEditBio(user.bio ?? "");
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Loading
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
            >
              ThemeDrops
            </Link>
            <div className="flex items-center gap-3">
              <CreateThemeLink />
              <AuthControls />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-gray-400 text-lg">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (user === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
            >
              ThemeDrops
            </Link>
            <div className="flex items-center gap-3">
              <CreateThemeLink />
              <AuthControls />
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">User not found</h1>
          <p className="text-gray-500">
            The user &quot;{username}&quot; doesn&apos;t exist.
          </p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const themeCount = userThemes?.length ?? 0;
  const starCount = starredThemes?.length ?? 0;
  const initial = (user.displayName ?? user.username ?? "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
          >
            ThemeDrops
          </Link>
          <div className="flex items-center gap-3">
            <CreateThemeLink />
            <AuthControls />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName ?? user.username}
                className="w-20 h-20 rounded-full border border-gray-200 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {initial}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Display name"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {saveError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {saveError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
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
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {user.displayName ?? user.username}
                    </h1>
                    {isOwner && (
                      <button
                        onClick={enterEditMode}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {!editing && (
            <div className="flex gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {themeCount}
                </div>
                <div className="text-xs text-gray-500">
                  {themeCount === 1 ? "Theme" : "Themes"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {starCount}
                </div>
                <div className="text-xs text-gray-500">
                  {starCount === 1 ? "Star" : "Stars"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("themes")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "themes"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Themes {themeCount > 0 && `(${themeCount})`}
          </button>
          <button
            onClick={() => setActiveTab("starred")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "starred"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Starred {starCount > 0 && `(${starCount})`}
          </button>
        </div>

        {/* Theme grid */}
        {activeTab === "themes" && (
          <>
            {userThemes === undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse"
                  >
                    <div className="h-28 bg-gray-100" />
                    <div className="px-5 pb-5 pt-3 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-50 rounded w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {userThemes && userThemes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userThemes.map((theme) => (
                  <ThemeCard key={theme._id} theme={theme} />
                ))}
              </div>
            )}

            {userThemes && userThemes.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-60">&#127912;</div>
                <h2 className="text-lg font-semibold text-gray-700">
                  No themes yet
                </h2>
                <p className="text-gray-400 mt-1 text-sm">
                  {isOwner
                    ? "Create your first theme to get started!"
                    : "This user hasn't created any themes yet."}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "starred" && (
          <>
            {starredThemes === undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse"
                  >
                    <div className="h-28 bg-gray-100" />
                    <div className="px-5 pb-5 pt-3 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-50 rounded w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {starredThemes && starredThemes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {starredThemes.map((theme) => (
                  <ThemeCard key={theme._id} theme={theme} />
                ))}
              </div>
            )}

            {starredThemes && starredThemes.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-60">&#9734;</div>
                <h2 className="text-lg font-semibold text-gray-700">
                  No starred themes
                </h2>
                <p className="text-gray-400 mt-1 text-sm">
                  {isOwner
                    ? "Star themes you like and they'll show up here."
                    : "This user hasn't starred any themes yet."}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
