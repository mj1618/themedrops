"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import AuthControls from "../components/AuthControls";

const COLOR_FIELDS = [
  { key: "background", label: "Background", default: "#ffffff" },
  { key: "foreground", label: "Foreground", default: "#111111" },
  { key: "primary", label: "Primary", default: "#3b82f6" },
  { key: "secondary", label: "Secondary", default: "#6366f1" },
  { key: "accent", label: "Accent", default: "#f59e0b" },
  { key: "muted", label: "Muted", default: "#6b7280" },
] as const;

function LivePreview({
  colors,
}: {
  colors: Record<string, string>;
}) {
  return (
    <div
      className="rounded-xl border p-6 space-y-4"
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        borderColor: colors.muted,
      }}
    >
      <h3 className="text-lg font-semibold">Live Preview</h3>
      <p style={{ color: colors.muted }} className="text-sm">
        This is how the theme looks when applied to a card.
      </p>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: colors.primary }}
        >
          Primary
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: colors.secondary }}
        >
          Secondary
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{
            backgroundColor: colors.accent,
            borderColor: colors.muted,
          }}
        >
          Accent
        </button>
      </div>
    </div>
  );
}

export default function CreateThemePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const createTheme = useMutation(api.themes.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [colors, setColors] = useState<Record<string, string>>(
    Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, f.default]))
  );
  const [fonts, setFonts] = useState({ sans: "", serif: "", mono: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateColor(key: string, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const fontsArg =
        fonts.sans || fonts.serif || fonts.mono
          ? {
              ...(fonts.sans ? { sans: fonts.sans } : {}),
              ...(fonts.serif ? { serif: fonts.serif } : {}),
              ...(fonts.mono ? { mono: fonts.mono } : {}),
            }
          : undefined;

      const result = await createTheme({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        colors,
        fonts: fontsArg,
      });

      if (result) {
        router.push(`/theme/${result.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create theme");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
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
          <AuthControls />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {!isAuthenticated ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">&#128274;</div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sign in to create a theme
            </h1>
            <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
              You need to be signed in to create and share themes with the
              community.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Create a Theme
              </h1>
              <p className="text-gray-500 text-sm">
                Pick your colors, choose your fonts, and share it with the
                world.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name & Description */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome Theme"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A brief description of your theme..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Visibility toggle */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Visibility
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isPublic
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      !isPublic
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Private
                  </button>
                </div>
              </section>

              {/* Colors */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Colors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <input
                        type="color"
                        value={colors[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          {label}
                        </p>
                        <input
                          type="text"
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="w-full text-xs font-mono text-gray-500 bg-transparent border-none p-0 focus:outline-none focus:text-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Live Preview */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Preview
                </h2>
                <LivePreview colors={colors} />
              </section>

              {/* Fonts */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Fonts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["sans", "serif", "mono"] as const).map((fontKey) => (
                    <div key={fontKey}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {fontKey}
                      </label>
                      <input
                        type="text"
                        value={fonts[fontKey]}
                        onChange={(e) =>
                          setFonts((prev) => ({
                            ...prev,
                            [fontKey]: e.target.value,
                          }))
                        }
                        placeholder={
                          fontKey === "sans"
                            ? "Inter"
                            : fontKey === "serif"
                              ? "Georgia"
                              : "Fira Code"
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Theme"}
                </button>
                <a
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
