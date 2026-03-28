import { useState, type FormEvent } from "react";

type ThemeFormValues = {
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  isPublic: boolean;
};

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Source Sans 3",
  "Playfair Display",
  "Merriweather",
  "DM Sans",
];

const MONO_FONT_OPTIONS = [
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "IBM Plex Mono",
  "Roboto Mono",
];

export function ThemeForm({
  initialValues,
  onSubmit,
  submitLabel,
}: {
  initialValues: ThemeFormValues;
  onSubmit: (values: ThemeFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setColor = (key: keyof ThemeFormValues["colors"], value: string) => {
    setValues((v) => ({ ...v, colors: { ...v.colors, [key]: value } }));
  };

  const setFont = (key: keyof ThemeFormValues["fonts"], value: string) => {
    setValues((v) => ({ ...v, fonts: { ...v.fonts, [key]: value } }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-3 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <fieldset disabled={loading} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-td-foreground mb-1">Name</label>
            <input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground focus:outline-none focus:ring-2 focus:ring-td-primary/50 disabled:opacity-50"
              placeholder="My Awesome Theme"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-td-foreground mb-1">Description</label>
            <textarea
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground focus:outline-none focus:ring-2 focus:ring-td-primary/50 resize-none disabled:opacity-50"
              placeholder="Describe your theme..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-td-foreground mb-3">Colors</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(values.colors) as Array<keyof ThemeFormValues["colors"]>).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-td-muted capitalize">{key}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={values.colors[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={values.colors[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="flex-1 px-2 py-1 text-xs font-mono rounded bg-td-background border border-white/10 text-td-foreground focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-td-foreground mb-3">Fonts</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["heading", "body"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-td-muted capitalize">{key}</label>
                  <select
                    value={values.fonts[key]}
                    onChange={(e) => setFont(key, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded bg-td-secondary border border-white/10 text-td-foreground focus:outline-none disabled:opacity-50"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs text-td-muted">Mono</label>
                <select
                  value={values.fonts.mono}
                  onChange={(e) => setFont("mono", e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded bg-td-secondary border border-white/10 text-td-foreground focus:outline-none disabled:opacity-50"
                >
                  {MONO_FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={values.isPublic}
              onChange={(e) => setValues((v) => ({ ...v, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded disabled:opacity-50"
            />
            <span className="text-sm text-td-foreground">Public (visible in gallery)</span>
          </label>

          <button
            type="submit"
            disabled={loading || !values.name.trim()}
            className="w-full py-2.5 rounded-xl bg-td-primary text-white font-medium hover:bg-td-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? "Saving..." : submitLabel}
          </button>
        </fieldset>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-td-foreground">Live Preview</h3>
          <div
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: values.colors.background }}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: values.colors.primary }} />
                <div className="space-y-1 flex-1">
                  <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: values.colors.foreground, opacity: 0.8 }} />
                  <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: values.colors.muted }} />
                </div>
              </div>

              <h2 style={{ color: values.colors.foreground, fontFamily: values.fonts.heading }} className="text-lg font-bold">
                {values.name || "Theme Preview"}
              </h2>

              <p style={{ color: values.colors.muted, fontFamily: values.fonts.body }} className="text-sm">
                {values.description || "This is what your theme looks like in practice."}
              </p>

              <div className="space-y-2">
                {[1, 0.85, 0.65].map((w, i) => (
                  <div key={i} className="h-2.5 rounded-full" style={{ backgroundColor: values.colors.secondary, width: `${w * 100}%` }} />
                ))}
              </div>

              <div className="flex gap-2">
                <div className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: values.colors.primary }}>
                  Primary
                </div>
                <div className="px-4 py-2 rounded-lg text-xs font-medium border" style={{ color: values.colors.accent, borderColor: values.colors.accent + "44" }}>
                  Accent
                </div>
              </div>

              <pre
                style={{ color: values.colors.foreground, backgroundColor: values.colors.secondary, fontFamily: values.fonts.mono }}
                className="text-xs rounded-lg p-3"
              >
                {`const theme = "${values.name || "untitled"}";`}
              </pre>
            </div>

            <div className="flex h-2">
              {Object.values(values.colors).map((color, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
