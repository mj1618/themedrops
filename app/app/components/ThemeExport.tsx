import { useState } from "react";
import { useToast } from "./Toast";
import {
  generateCSSVariables,
  generateTailwindConfig,
  generateThemeJSON,
  downloadFile,
} from "../lib/themeExport";

type Tab = "css" | "tailwind" | "json";

type Props = {
  name: string;
  slug: string;
  colors: Record<string, string>;
  fonts: { heading: string; body: string; mono: string };
};

export function ThemeExport({ name, slug, colors, fonts }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("css");
  const [colorFormat, setColorFormat] = useState("hex");

  const cssCode = generateCSSVariables(colors, fonts, name, colorFormat);
  const tailwindCode = generateTailwindConfig(colors, fonts, name);
  const jsonCode = generateThemeJSON({ name, slug, colors, fonts });

  const codeForTab = tab === "css" ? cssCode : tab === "tailwind" ? tailwindCode : jsonCode;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "css", label: "CSS Variables" },
    { key: "tailwind", label: "Tailwind" },
    { key: "json", label: "JSON" },
  ];

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-lg font-bold text-td-foreground"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Export Theme
      </button>

      {open && (
        <div className="rounded-xl border border-white/10 bg-td-secondary p-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-td-background w-fit overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "bg-td-primary text-white"
                    : "text-td-muted hover:text-td-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Color format selector for CSS tab */}
          {tab === "css" && (
            <div>
              <p className="text-sm text-td-muted mb-2">Color format:</p>
              <div className="flex gap-1 p-1 rounded-lg bg-td-background w-fit">
                {["hex", "rgb", "hsl", "oklch"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setColorFormat(fmt)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      colorFormat === fmt
                        ? "bg-td-primary text-white"
                        : "text-td-muted hover:text-td-foreground"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code preview */}
          <pre className="text-xs font-mono text-td-foreground bg-td-background rounded-lg p-4 border border-white/5 overflow-x-auto max-h-80">
            {codeForTab}
          </pre>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copyToClipboard(codeForTab)}
              className="px-3 py-2 rounded-lg bg-td-primary/10 text-td-primary text-sm hover:bg-td-primary/20 transition-colors"
            >
              Copy to Clipboard
            </button>

            {tab === "css" && (
              <button
                onClick={() => downloadFile(cssCode, `${slug}-theme.css`, "text/css")}
                className="px-3 py-2 rounded-lg bg-td-accent/10 text-td-accent text-sm hover:bg-td-accent/20 transition-colors"
              >
                Download .css
              </button>
            )}

            {tab === "json" && (
              <button
                onClick={() => downloadFile(jsonCode, `${slug}-theme.json`, "application/json")}
                className="px-3 py-2 rounded-lg bg-td-accent/10 text-td-accent text-sm hover:bg-td-accent/20 transition-colors"
              >
                Download .json
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
