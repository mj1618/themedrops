import { useState, useRef, useEffect, type FormEvent } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type BaseColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

export type VscodeColors = {
  keyword: string; string: string; comment: string; function: string;
  variable: string; type: string; number: string; operator: string; punctuation: string;
};

export type DiscordColors = {
  backgroundPrimary: string; backgroundSecondary: string;
  backgroundTertiary: string; backgroundFloating: string;
  textNormal: string; textMuted: string; textLink: string;
  interactiveNormal: string; interactiveHover: string; interactiveActive: string;
  statusOnline: string; statusIdle: string; statusDnd: string; statusOffline: string;
  brand: string;
};

export type TailwindColors = {
  primaryForeground: string; secondaryForeground: string;
  accentForeground: string; mutedForeground: string;
  card: string; cardForeground: string; popover: string; popoverForeground: string;
  border: string; input: string; ring: string;
  destructive: string; destructiveForeground: string; radius: string;
};

export type ThemeFormValues = {
  name: string;
  description: string;
  colors: BaseColors;
  fonts: { heading: string; body: string; mono: string };
  vscode?: VscodeColors;
  discord?: DiscordColors;
  tailwind?: TailwindColors;
  tags: string[];
  isPublic: boolean;
};

// ── Color derivation ──────────────────────────────────────────────────────────

function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function blendHex(a: string, b: string, t: number): string {
  const parse = (s: string, o: number) => parseInt(s.slice(o, o + 2), 16);
  const r = Math.round(parse(a, 1) + (parse(b, 1) - parse(a, 1)) * t).toString(16).padStart(2, "0");
  const g = Math.round(parse(a, 3) + (parse(b, 3) - parse(a, 3)) * t).toString(16).padStart(2, "0");
  const bl = Math.round(parse(a, 5) + (parse(b, 5) - parse(a, 5)) * t).toString(16).padStart(2, "0");
  return `#${r}${g}${bl}`;
}

function deriveVSCode(c: BaseColors): VscodeColors {
  const dark = isColorDark(c.background);
  return {
    keyword: c.accent, string: dark ? "#a3e635" : "#16a34a",
    comment: c.muted, function: c.primary, variable: c.foreground,
    type: dark ? "#fbbf24" : "#d97706", number: dark ? "#f472b6" : "#db2777",
    operator: blendHex(c.foreground, c.muted, 0.5), punctuation: c.muted,
  };
}

function deriveDiscord(c: BaseColors): DiscordColors {
  const dark = isColorDark(c.background);
  return dark ? {
    backgroundPrimary: blendHex(c.background, "#ffffff", 0.08),
    backgroundSecondary: blendHex(c.background, "#ffffff", 0.04),
    backgroundTertiary: c.background,
    backgroundFloating: blendHex(c.background, "#000000", 0.2),
    textNormal: c.foreground, textMuted: c.muted, textLink: c.primary,
    interactiveNormal: blendHex(c.foreground, c.muted, 0.4),
    interactiveHover: c.foreground, interactiveActive: "#ffffff",
    statusOnline: "#3ba55d", statusIdle: "#faa61a",
    statusDnd: "#ed4245", statusOffline: "#747f8d", brand: c.primary,
  } : {
    backgroundPrimary: c.background,
    backgroundSecondary: blendHex(c.background, "#000000", 0.05),
    backgroundTertiary: blendHex(c.background, "#000000", 0.1),
    backgroundFloating: "#ffffff",
    textNormal: c.foreground, textMuted: c.muted, textLink: c.primary,
    interactiveNormal: blendHex(c.foreground, c.background, 0.3),
    interactiveHover: c.foreground, interactiveActive: blendHex(c.foreground, "#000000", 0.15),
    statusOnline: "#3ba55d", statusIdle: "#faa61a",
    statusDnd: "#ed4245", statusOffline: "#747f8d", brand: c.primary,
  };
}

function deriveTailwind(c: BaseColors): TailwindColors {
  const dark = isColorDark(c.background);
  const fg = (hex: string) => (isColorDark(hex) ? "#ffffff" : "#0f172a");
  return {
    primaryForeground: fg(c.primary), secondaryForeground: fg(c.secondary),
    accentForeground: fg(c.accent), mutedForeground: c.foreground,
    card: dark ? blendHex(c.background, "#ffffff", 0.05) : "#ffffff",
    cardForeground: c.foreground,
    popover: dark ? blendHex(c.background, "#ffffff", 0.05) : "#ffffff",
    popoverForeground: c.foreground,
    border: dark ? blendHex(c.background, "#ffffff", 0.15) : blendHex(c.background, "#000000", 0.1),
    input: dark ? blendHex(c.background, "#ffffff", 0.15) : blendHex(c.background, "#000000", 0.1),
    ring: c.primary, destructive: dark ? "#ef4444" : "#dc2626",
    destructiveForeground: "#ffffff", radius: "0.5rem",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ColorRow({ label, value, onChange, isText }: {
  label: string; value: string; onChange: (v: string) => void; isText?: boolean;
}) {
  if (isText) {
    return (
      <div className="space-y-1">
        <label className="text-xs text-td-muted truncate block">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs font-mono rounded bg-td-background border border-white/10 text-td-foreground focus:outline-none disabled:opacity-50" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <label className="text-xs text-td-muted truncate block">{label}</label>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent disabled:opacity-50 flex-shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 text-xs font-mono rounded bg-td-background border border-white/10 text-td-foreground focus:outline-none disabled:opacity-50" />
      </div>
    </div>
  );
}

function PlatformSection({ title, icon, open, onToggle, onAutoFill, hasValues, onClear, children }: {
  title: string; icon: string; open: boolean; onToggle: () => void;
  onAutoFill: () => void; hasValues: boolean; onClear: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-td-secondary/50">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="text-base flex-shrink-0">{icon}</span>
          <span className="text-sm font-medium text-td-foreground truncate">{title}</span>
          {hasValues && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-td-primary/20 text-td-primary flex-shrink-0">set</span>
          )}
          <svg className={`w-4 h-4 text-td-muted ml-auto flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button type="button" onClick={onAutoFill}
          className="text-xs px-2 py-1 rounded bg-td-primary/10 text-td-primary hover:bg-td-primary/20 transition-colors flex-shrink-0">
          Auto-fill
        </button>
        {hasValues && (
          <button type="button" onClick={onClear}
            className="text-xs px-2 py-1 rounded bg-white/5 text-td-muted hover:text-td-foreground transition-colors flex-shrink-0">
            Clear
          </button>
        )}
      </div>
      {open && <div className="p-3 border-t border-white/10">{children}</div>}
    </div>
  );
}

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

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 24;
const TAG_PATTERN = /^[a-z0-9-]+$/;

function TagInput({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchQuery = input.trim().toLowerCase();
  const suggestions = useQuery(
    api.tags.search,
    searchQuery.length > 0 ? { query: searchQuery } : "skip"
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (
      !normalized ||
      normalized.length > MAX_TAG_LENGTH ||
      !TAG_PATTERN.test(normalized) ||
      tags.includes(normalized) ||
      tags.length >= MAX_TAGS
    ) {
      return;
    }
    onChange([...tags, normalized]);
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions?.filter((s) => !tags.includes(s.name)) ?? [];

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="block text-sm font-medium text-td-foreground mb-1">
        Tags
        <span className="text-xs text-td-muted ml-2">
          {tags.length}/{MAX_TAGS}
        </span>
      </label>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-td-primary/15 text-td-primary border border-td-primary/20"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {tags.length >= MAX_TAGS ? (
        <p className="text-xs text-td-muted">Maximum {MAX_TAGS} tags reached</p>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a tag and press Enter..."
            className="w-full px-3 py-2 rounded-lg bg-td-secondary border border-white/10 text-td-foreground text-sm focus:outline-none focus:ring-2 focus:ring-td-primary/50 disabled:opacity-50 placeholder:text-td-muted/50"
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg bg-td-secondary border border-white/10 shadow-lg overflow-hidden">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion._id}
                  type="button"
                  onClick={() => addTag(suggestion.name)}
                  className="w-full text-left px-3 py-2 text-sm text-td-foreground hover:bg-td-primary/10 transition-colors flex items-center justify-between"
                >
                  <span>{suggestion.name}</span>
                  <span className="text-xs text-td-muted">{suggestion.count} themes</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-td-muted">
        Lowercase letters, numbers, and hyphens only. Press Enter or comma to add.
      </p>
    </div>
  );
}

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
  const [openSections, setOpenSections] = useState({
    vscode: !!initialValues.vscode,
    discord: !!initialValues.discord,
    tailwind: !!initialValues.tailwind,
  });

  const setColor = (key: keyof BaseColors, value: string) =>
    setValues((v) => ({ ...v, colors: { ...v.colors, [key]: value } }));

  const setFont = (key: keyof ThemeFormValues["fonts"], value: string) =>
    setValues((v) => ({ ...v, fonts: { ...v.fonts, [key]: value } }));

  const setVSCode = (key: keyof VscodeColors, value: string) =>
    setValues((v) => ({ ...v, vscode: { ...v.vscode!, [key]: value } }));

  const setDiscord = (key: keyof DiscordColors, value: string) =>
    setValues((v) => ({ ...v, discord: { ...v.discord!, [key]: value } }));

  const setTailwind = (key: keyof TailwindColors, value: string) =>
    setValues((v) => ({ ...v, tailwind: { ...v.tailwind!, [key]: value } }));

  const toggleSection = (section: "vscode" | "discord" | "tailwind") => {
    const opening = !openSections[section];
    if (opening && !values[section]) {
      if (section === "vscode") setValues((v) => ({ ...v, vscode: deriveVSCode(v.colors) }));
      if (section === "discord") setValues((v) => ({ ...v, discord: deriveDiscord(v.colors) }));
      if (section === "tailwind") setValues((v) => ({ ...v, tailwind: deriveTailwind(v.colors) }));
    }
    setOpenSections((s) => ({ ...s, [section]: opening }));
  };

  const autoFill = (section: "vscode" | "discord" | "tailwind") => {
    if (section === "vscode") setValues((v) => ({ ...v, vscode: deriveVSCode(v.colors) }));
    if (section === "discord") setValues((v) => ({ ...v, discord: deriveDiscord(v.colors) }));
    if (section === "tailwind") setValues((v) => ({ ...v, tailwind: deriveTailwind(v.colors) }));
    setOpenSections((s) => ({ ...s, [section]: true }));
  };

  const clearSection = (section: "vscode" | "discord" | "tailwind") => {
    setValues((v) => ({ ...v, [section]: undefined }));
    setOpenSections((s) => ({ ...s, [section]: false }));
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

          <TagInput
            tags={values.tags}
            onChange={(tags) => setValues((v) => ({ ...v, tags }))}
            disabled={loading}
          />

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

          {/* Platform colors — optional expandable sections */}
          <div className="space-y-2">
            <p className="text-xs text-td-muted uppercase tracking-wide font-medium">Platform colors — optional</p>

            <PlatformSection title="VS Code Syntax" icon="⌨️"
              open={openSections.vscode} onToggle={() => toggleSection("vscode")}
              onAutoFill={() => autoFill("vscode")}
              hasValues={!!values.vscode} onClear={() => clearSection("vscode")}>
              {values.vscode && (
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(values.vscode) as Array<keyof VscodeColors>).map((key) => (
                    <ColorRow key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={values.vscode![key]} onChange={(v) => setVSCode(key, v)} />
                  ))}
                </div>
              )}
            </PlatformSection>

            <PlatformSection title="Discord" icon="💬"
              open={openSections.discord} onToggle={() => toggleSection("discord")}
              onAutoFill={() => autoFill("discord")}
              hasValues={!!values.discord} onClear={() => clearSection("discord")}>
              {values.discord && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-td-muted mb-2">Backgrounds</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["backgroundPrimary", "backgroundSecondary", "backgroundTertiary", "backgroundFloating"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("background", "").replace(/([A-Z])/g, " $1").trim() || "Primary"}
                          value={values.discord![k]} onChange={(v) => setDiscord(k, v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-td-muted mb-2">Text & Brand</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["textNormal", "textMuted", "textLink", "brand"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace(/([A-Z])/g, " $1").trim()}
                          value={values.discord![k]} onChange={(v) => setDiscord(k, v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-td-muted mb-2">Interactive</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["interactiveNormal", "interactiveHover", "interactiveActive"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("interactive", "").replace(/([A-Z])/g, " $1").trim()}
                          value={values.discord![k]} onChange={(v) => setDiscord(k, v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-td-muted mb-2">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["statusOnline", "statusIdle", "statusDnd", "statusOffline"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("status", "").replace(/([A-Z])/g, " $1").trim()}
                          value={values.discord![k]} onChange={(v) => setDiscord(k, v)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </PlatformSection>

            <PlatformSection title="Tailwind / shadcn" icon="🎨"
              open={openSections.tailwind} onToggle={() => toggleSection("tailwind")}
              onAutoFill={() => autoFill("tailwind")}
              hasValues={!!values.tailwind} onClear={() => clearSection("tailwind")}>
              {values.tailwind && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-td-muted mb-2">Foreground variants</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["primaryForeground", "secondaryForeground", "accentForeground", "mutedForeground"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("Foreground", " FG")}
                          value={values.tailwind![k]} onChange={(v) => setTailwind(k, v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-td-muted mb-2">Surfaces</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["card", "cardForeground", "popover", "popoverForeground"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("Foreground", " FG").replace(/([A-Z])/g, " $1").trim()}
                          value={values.tailwind![k]} onChange={(v) => setTailwind(k, v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-td-muted mb-2">Borders & Destructive</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["border", "input", "ring", "destructive", "destructiveForeground"] as const).map((k) => (
                        <ColorRow key={k} label={k.replace("Foreground", " FG").replace(/([A-Z])/g, " $1").trim()}
                          value={values.tailwind![k]} onChange={(v) => setTailwind(k, v)} />
                      ))}
                      <ColorRow label="Border Radius" value={values.tailwind.radius}
                        onChange={(v) => setTailwind("radius", v)} isText />
                    </div>
                  </div>
                </div>
              )}
            </PlatformSection>
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

              {values.vscode ? (
                <pre style={{ backgroundColor: values.colors.secondary, fontFamily: values.fonts.mono }} className="text-xs rounded-lg p-3">
                  <span style={{ color: values.vscode.keyword }}>const </span>
                  <span style={{ color: values.vscode.variable }}>theme </span>
                  <span style={{ color: values.vscode.operator }}>= </span>
                  <span style={{ color: values.vscode.string }}>"{values.name || "untitled"}"</span>
                  <span style={{ color: values.vscode.punctuation }}>;</span>
                  {"\n"}
                  <span style={{ color: values.vscode.comment }}>// syntax highlighting preview</span>
                </pre>
              ) : (
                <pre style={{ color: values.colors.foreground, backgroundColor: values.colors.secondary, fontFamily: values.fonts.mono }} className="text-xs rounded-lg p-3">
                  {`const theme = "${values.name || "untitled"}";`}
                </pre>
              )}
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
