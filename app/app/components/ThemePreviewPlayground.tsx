import { useState, useEffect } from "react";

type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

type ThemeFonts = {
  heading: string;
  body: string;
  mono: string;
};

type Scene = "dashboard" | "chat" | "blog" | "form";

const SCENES: { key: Scene; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "chat", label: "Chat" },
  { key: "blog", label: "Blog" },
  { key: "form", label: "Form" },
];

const SYSTEM_FONTS = [
  "system-ui",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "monospace",
  "sans-serif",
  "serif",
];

function useGoogleFonts(fonts: ThemeFonts) {
  useEffect(() => {
    const fontsToLoad = [fonts.heading, fonts.body, fonts.mono].filter(
      (f) => !SYSTEM_FONTS.some((sf) => f.toLowerCase() === sf.toLowerCase())
    );
    if (fontsToLoad.length === 0) return;

    const families = [...new Set(fontsToLoad)]
      .map((f) => f.replace(/ /g, "+") + ":wght@400;600;700")
      .join("&family=");
    const id = "theme-preview-fonts";
    if (document.getElementById(id)) {
      const existing = document.getElementById(id) as HTMLLinkElement;
      if (existing.href.includes(families)) return;
      existing.remove();
    }
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
  }, [fonts.heading, fonts.body, fonts.mono]);
}

function withOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return hex + alpha;
}

function DashboardScene({
  colors,
  fonts,
}: {
  colors: ThemeColors;
  fonts: ThemeFonts;
}) {
  const navItems = ["Overview", "Analytics", "Users", "Settings"];
  const stats = [
    { label: "Revenue", value: "$12,480", change: "+14%" },
    { label: "Users", value: "1,248", change: "+7%" },
    { label: "Orders", value: "384", change: "+22%" },
  ];
  const chartData = [65, 40, 80, 55, 90];
  const tableRows = [
    { name: "Widget Pro", status: "Active", amount: "$249" },
    { name: "Dashboard Kit", status: "Pending", amount: "$129" },
    { name: "Icon Pack", status: "Active", amount: "$79" },
    { name: "Theme Bundle", status: "Inactive", amount: "$199" },
  ];

  return (
    <div style={{ display: "flex", minHeight: 320, fontFamily: fonts.body }}>
      {/* Sidebar */}
      <div
        style={{
          width: 140,
          backgroundColor: colors.secondary,
          padding: "16px 0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "0 12px 16px",
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 13,
            color: colors.foreground,
          }}
        >
          Acme Inc
        </div>
        {navItems.map((item, i) => (
          <div
            key={item}
            style={{
              padding: "8px 12px",
              fontSize: 12,
              color: i === 0 ? colors.primary : colors.muted,
              backgroundColor: i === 0 ? withOpacity(colors.primary, 0.1) : "transparent",
              borderLeft: i === 0 ? `2px solid ${colors.primary}` : "2px solid transparent",
              cursor: "default",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
        {/* Stat cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: colors.secondary,
              }}
            >
              <div style={{ fontSize: 10, color: colors.muted }}>{s.label}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: i === 0 ? colors.primary : colors.foreground,
                  fontFamily: fonts.heading,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: colors.accent }}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 80,
            marginBottom: 16,
            padding: "0 4px",
          }}
        >
          {chartData.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: "4px 4px 0 0",
                backgroundColor: colors.primary,
                opacity: 0.4 + i * 0.15,
              }}
            />
          ))}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${withOpacity(colors.foreground, 0.08)}` }}>
          <div
            style={{
              display: "flex",
              padding: "6px 10px",
              fontSize: 10,
              color: colors.muted,
              backgroundColor: colors.secondary,
              fontWeight: 600,
            }}
          >
            <span style={{ flex: 2 }}>Product</span>
            <span style={{ flex: 1 }}>Status</span>
            <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
          </div>
          {tableRows.map((row, i) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                padding: "6px 10px",
                fontSize: 11,
                color: colors.foreground,
                backgroundColor: i % 2 === 0 ? colors.background : colors.secondary,
              }}
            >
              <span style={{ flex: 2 }}>{row.name}</span>
              <span
                style={{
                  flex: 1,
                  color:
                    row.status === "Active"
                      ? colors.accent
                      : row.status === "Pending"
                        ? colors.primary
                        : colors.muted,
                }}
              >
                {row.status}
              </span>
              <span style={{ flex: 1, textAlign: "right" }}>{row.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatScene({
  colors,
  fonts,
}: {
  colors: ThemeColors;
  fonts: ThemeFonts;
}) {
  const users = [
    { name: "Alice", online: true },
    { name: "Bob", online: true },
    { name: "Carol", online: false },
    { name: "Dave", online: false },
  ];
  const messages = [
    { from: "them", text: "Hey, have you seen the new design?" },
    { from: "me", text: "Yes! The colors look great." },
    { from: "them", text: "Should we ship it this week?" },
    { from: "me", text: "Definitely. Let me push the final changes." },
    { from: "them", text: "Awesome, I'll update the docs." },
  ];

  return (
    <div style={{ display: "flex", minHeight: 300, fontFamily: fonts.body }}>
      {/* User list */}
      <div
        style={{
          width: 120,
          backgroundColor: colors.secondary,
          padding: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: colors.muted,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Online
        </div>
        {users.map((u) => (
          <div
            key={u.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              fontSize: 12,
              color: colors.foreground,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: withOpacity(colors.primary, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              {u.name[0]}
            </div>
            <span style={{ flex: 1 }}>{u.name}</span>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: u.online ? colors.accent : colors.muted,
              }}
            />
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: 12, overflow: "hidden" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.from === "me" ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  fontSize: 12,
                  lineHeight: 1.4,
                  backgroundColor: m.from === "me" ? colors.primary : colors.secondary,
                  color: m.from === "me" ? "#ffffff" : colors.foreground,
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 10,
            borderTop: `1px solid ${withOpacity(colors.foreground, 0.08)}`,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: colors.secondary,
              fontSize: 12,
              color: colors.muted,
            }}
          >
            Type a message...
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              backgroundColor: colors.primary,
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "default",
            }}
          >
            Send
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogScene({
  colors,
  fonts,
}: {
  colors: ThemeColors;
  fonts: ThemeFonts;
}) {
  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto", fontFamily: fonts.body }}>
      <h2
        style={{
          fontFamily: fonts.heading,
          fontSize: 24,
          fontWeight: 700,
          color: colors.foreground,
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        Building Beautiful Interfaces
      </h2>
      <p style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
        by{" "}
        <span style={{ color: colors.accent, cursor: "default" }}>Jane Doe</span>{" "}
        &middot; March 15, 2026
      </p>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: colors.foreground,
          marginBottom: 14,
        }}
      >
        Good design is about more than aesthetics. It shapes how users feel when
        they interact with your product. A well-chosen color palette can guide
        attention, establish hierarchy, and create emotional resonance.
      </p>

      <blockquote
        style={{
          borderLeft: `3px solid ${colors.accent}`,
          paddingLeft: 16,
          margin: "16px 0",
          fontStyle: "italic",
          color: colors.muted,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        "Design is not just what it looks like and feels like. Design is how it
        works." — Steve Jobs
      </blockquote>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: colors.foreground,
          marginBottom: 14,
        }}
      >
        When building a theme system, consider the semantic meaning of each color
        token. Here is a simple configuration:
      </p>

      <pre
        style={{
          backgroundColor: colors.secondary,
          borderRadius: 8,
          padding: 14,
          fontSize: 11,
          fontFamily: fonts.mono,
          color: colors.foreground,
          lineHeight: 1.6,
          overflowX: "auto",
          marginBottom: 20,
        }}
      >
        {`const theme = {
  primary: "${colors.primary}",
  accent: "${colors.accent}",
  background: "${colors.background}",
};`}
      </pre>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: colors.foreground,
          marginBottom: 20,
        }}
      >
        Start with intention, iterate with feedback, and always keep the user at
        the center of your decisions.
      </p>

      <div
        style={{
          display: "inline-block",
          padding: "10px 24px",
          borderRadius: 8,
          backgroundColor: colors.primary,
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "default",
        }}
      >
        Read More Articles
      </div>
    </div>
  );
}

function FormScene({
  colors,
  fonts,
}: {
  colors: ThemeColors;
  fonts: ThemeFonts;
}) {
  return (
    <div style={{ padding: 24, maxWidth: 440, margin: "0 auto", fontFamily: fonts.body }}>
      <h2
        style={{
          fontFamily: fonts.heading,
          fontSize: 18,
          fontWeight: 700,
          color: colors.foreground,
          marginBottom: 20,
        }}
      >
        Account Settings
      </h2>

      {/* Text inputs */}
      {[
        { label: "Display Name", value: "Jane Doe" },
        { label: "Email", value: "jane@example.com" },
      ].map((field) => (
        <div key={field.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: colors.muted,
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            {field.label}
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              backgroundColor: colors.secondary,
              color: colors.foreground,
              fontSize: 13,
              border: `1px solid ${withOpacity(colors.foreground, 0.08)}`,
            }}
          >
            {field.value}
          </div>
        </div>
      ))}

      {/* Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          padding: "8px 0",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: colors.foreground, fontWeight: 500 }}>
            Email Notifications
          </div>
          <div style={{ fontSize: 11, color: colors.muted }}>
            Receive updates via email
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            padding: 2,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
            }}
          />
        </div>
      </div>

      {/* Radio buttons */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: colors.muted,
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Theme Preference
        </div>
        {["Light", "Dark", "System"].map((opt, i) => (
          <div
            key={opt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0",
              fontSize: 13,
              color: colors.foreground,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `2px solid ${i === 1 ? colors.primary : colors.muted}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i === 1 && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </div>
            {opt}
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            color: colors.muted,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          Language
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: colors.secondary,
            color: colors.foreground,
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: `1px solid ${withOpacity(colors.foreground, 0.08)}`,
          }}
        >
          <span>English (US)</span>
          <span style={{ fontSize: 10, color: colors.muted }}>&#9662;</span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            backgroundColor: colors.primary,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "default",
          }}
        >
          Save Changes
        </div>
        <span
          style={{
            fontSize: 13,
            color: colors.muted,
            cursor: "default",
          }}
        >
          Cancel
        </span>
      </div>
    </div>
  );
}

export function ThemePreviewPlayground({
  colors,
  fonts,
}: {
  colors: ThemeColors;
  fonts: ThemeFonts;
}) {
  const [activeScene, setActiveScene] = useState<Scene>("dashboard");
  const [fullWidth, setFullWidth] = useState(false);

  useGoogleFonts(fonts);

  return (
    <section className={fullWidth ? "w-screen relative -ml-[50vw] left-1/2" : ""}>
      <div className={fullWidth ? "px-4" : ""}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-td-foreground">Preview Playground</h2>
          <button
            onClick={() => setFullWidth(!fullWidth)}
            className="flex items-center gap-1.5 text-xs text-td-muted hover:text-td-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {fullWidth ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              )}
            </svg>
            {fullWidth ? "Collapse" : "Full Width"}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-lg bg-td-secondary w-fit mb-3">
          {SCENES.map((scene) => (
            <button
              key={scene.key}
              onClick={() => setActiveScene(scene.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeScene === scene.key
                  ? "bg-td-primary text-white"
                  : "text-td-muted hover:text-td-foreground"
              }`}
            >
              {scene.label}
            </button>
          ))}
        </div>

        {/* Preview container */}
        <div
          className="rounded-xl border border-white/10 overflow-hidden"
          style={{ backgroundColor: colors.background }}
        >
          {activeScene === "dashboard" && (
            <DashboardScene colors={colors} fonts={fonts} />
          )}
          {activeScene === "chat" && (
            <ChatScene colors={colors} fonts={fonts} />
          )}
          {activeScene === "blog" && (
            <BlogScene colors={colors} fonts={fonts} />
          )}
          {activeScene === "form" && (
            <FormScene colors={colors} fonts={fonts} />
          )}
        </div>
      </div>
    </section>
  );
}
