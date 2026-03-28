import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { convertColors } from "../lib/colorConvert";

export const Route = createFileRoute("/api")({
  component: ApiDocsPage,
});

type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

const COLOR_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "oklch"];

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard", "success");
      }}
      className="px-3 py-1.5 rounded-lg bg-td-primary/10 text-td-primary text-xs font-medium hover:bg-td-primary/20 transition-colors shrink-0"
    >
      {label ?? "Copy"}
    </button>
  );
}

function FormatPicker({
  value,
  onChange,
}: {
  value: ColorFormat;
  onChange: (f: ColorFormat) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-td-background w-fit">
      {COLOR_FORMATS.map((fmt) => (
        <button
          key={fmt}
          onClick={() => onChange(fmt)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === fmt
              ? "bg-td-primary text-white"
              : "text-td-muted hover:text-td-foreground"
          }`}
        >
          {fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function CodeBlock({
  code,
  copyLabel,
}: {
  code: string;
  copyLabel?: string;
}) {
  return (
    <div className="relative group">
      <pre className="text-xs font-mono text-td-foreground bg-td-background rounded-lg p-4 border border-white/5 overflow-x-auto">
        {code}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} label={copyLabel} />
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
      {method}
    </span>
  );
}

function EndpointCard({
  method,
  path,
  description,
  params,
  baseUrl,
  selectedSlug,
  selectedFormat,
  exampleResponse,
}: {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
  baseUrl: string;
  selectedSlug: string;
  selectedFormat: ColorFormat;
  exampleResponse: string;
}) {
  const fullUrl =
    path === "/api/themes"
      ? `${baseUrl}/api/themes?format=${selectedFormat}`
      : `${baseUrl}/api/themes/${selectedSlug}?format=${selectedFormat}`;

  const curlCmd = `curl "${fullUrl}"`;

  return (
    <div className="rounded-xl border border-white/10 bg-td-secondary p-6 space-y-5">
      <div className="flex items-center gap-3">
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-td-foreground">{path}</code>
      </div>
      <p className="text-sm text-td-muted">{description}</p>

      {params && params.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-td-foreground uppercase tracking-wider mb-2">
            Query Parameters
          </h4>
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-td-background/50">
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Name
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Type
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.name} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-td-accent">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-td-muted">
                      {p.type}
                    </td>
                    <td className="px-3 py-2 text-xs text-td-muted">
                      {p.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-td-foreground uppercase tracking-wider">
          Request
        </h4>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-td-foreground bg-td-background rounded-lg px-3 py-2 border border-white/5 truncate">
            {curlCmd}
          </code>
          <CopyButton text={curlCmd} label="Copy curl" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-td-foreground uppercase tracking-wider">
          Response
        </h4>
        <CodeBlock code={exampleResponse} />
      </div>
    </div>
  );
}

type SnippetTab = "fetch" | "curl" | "python";

function CodeSnippets({
  baseUrl,
  selectedSlug,
  selectedFormat,
}: {
  baseUrl: string;
  selectedSlug: string;
  selectedFormat: ColorFormat;
}) {
  const [tab, setTab] = useState<SnippetTab>("fetch");
  const url = `${baseUrl}/api/themes/${selectedSlug}?format=${selectedFormat}`;

  const snippets: Record<SnippetTab, { label: string; code: string }> = {
    fetch: {
      label: "JavaScript",
      code: `const response = await fetch("${url}");
const theme = await response.json();

console.log(theme.name);
console.log(theme.colors);`,
    },
    curl: {
      label: "curl",
      code: `curl "${url}"`,
    },
    python: {
      label: "Python",
      code: `import requests

response = requests.get("${url}")
theme = response.json()

print(theme["name"])
print(theme["colors"])`,
    },
  };

  const tabs: SnippetTab[] = ["fetch", "curl", "python"];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-lg bg-td-background w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              tab === t
                ? "bg-td-primary text-white"
                : "text-td-muted hover:text-td-foreground"
            }`}
          >
            {snippets[t].label}
          </button>
        ))}
      </div>
      <CodeBlock code={snippets[tab].code} />
    </div>
  );
}

function ApiDocsPage() {
  const searchTheme =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("theme")
      : null;
  const themes = useQuery(api.themes.listPublicForApi, {});
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ColorFormat>("hex");
  const [liveResponse, setLiveResponse] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const { toast } = useToast();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://themedrops.com";

  // Set default slug once themes load (prefer search param)
  useEffect(() => {
    if (themes && themes.length > 0 && !selectedSlug) {
      const fromSearch = searchTheme && themes.find((t) => t.slug === searchTheme);
      setSelectedSlug(fromSearch ? fromSearch.slug : themes[0].slug);
    }
  }, [themes, selectedSlug, searchTheme]);

  // Build example responses
  const selectedTheme = themes?.find((t) => t.slug === selectedSlug);

  const singleResponse = selectedTheme
    ? JSON.stringify(
        {
          name: selectedTheme.name,
          slug: selectedTheme.slug,
          description: selectedTheme.description ?? null,
          colors: convertColors(selectedTheme.colors, selectedFormat),
          fonts: selectedTheme.fonts,
          starCount: selectedTheme.starCount,
        },
        null,
        2
      )
    : "{}";

  const listResponse = themes
    ? JSON.stringify(
        themes.slice(0, 2).map((t) => ({
          name: t.name,
          slug: t.slug,
          description: t.description ?? null,
          colors: convertColors(t.colors, selectedFormat),
          fonts: t.fonts,
          starCount: t.starCount,
        })),
        null,
        2
      )
    : "[]";

  const fetchLive = async () => {
    setLiveLoading(true);
    setLiveResponse(null);
    try {
      const res = await fetch(
        `${baseUrl}/api/themes/${selectedSlug}?format=${selectedFormat}`
      );
      const data = await res.json();
      setLiveResponse(JSON.stringify(data, null, 2));
    } catch {
      toast("Failed to fetch from API", "error");
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-td-foreground tracking-tight">
          Build with themedrops
        </h1>
        <p className="text-lg text-td-muted max-w-2xl">
          Access the full theme library programmatically. Fetch themes as JSON
          with colors in any format — hex, RGB, HSL, or OKLCH. No
          authentication required.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-td-muted uppercase tracking-wider font-medium">
            Base URL
          </span>
          <code className="text-sm font-mono text-td-primary bg-td-primary/10 px-3 py-1 rounded-lg">
            {baseUrl}/api
          </code>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-td-foreground">Endpoints</h2>

        <EndpointCard
          method="GET"
          path="/api/themes"
          description="Returns all public themes, sorted by star count. Supports color format conversion via query parameter."
          params={[
            {
              name: "format",
              type: "string",
              description:
                'Color format: "hex" (default), "rgb", "hsl", or "oklch"',
            },
          ]}
          baseUrl={baseUrl}
          selectedSlug={selectedSlug}
          selectedFormat={selectedFormat}
          exampleResponse={listResponse}
        />

        <EndpointCard
          method="GET"
          path="/api/themes/:slug"
          description="Returns a single theme by its URL slug. Returns 404 if not found."
          params={[
            {
              name: "format",
              type: "string",
              description:
                'Color format: "hex" (default), "rgb", "hsl", or "oklch"',
            },
          ]}
          baseUrl={baseUrl}
          selectedSlug={selectedSlug}
          selectedFormat={selectedFormat}
          exampleResponse={singleResponse}
        />
      </section>

      {/* Try It */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-td-foreground">Try It</h2>
        <div className="rounded-xl border border-white/10 bg-td-secondary p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-medium text-td-muted uppercase tracking-wider">
                Theme
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-td-background border border-white/10 text-td-foreground text-sm focus:outline-none focus:ring-2 focus:ring-td-primary/30"
              >
                {themes?.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-td-muted uppercase tracking-wider">
                Format
              </label>
              <FormatPicker value={selectedFormat} onChange={setSelectedFormat} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-td-muted uppercase tracking-wider block mb-2">
              URL
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-td-foreground bg-td-background rounded-lg px-3 py-2 border border-white/5 truncate">
                {baseUrl}/api/themes/{selectedSlug}?format={selectedFormat}
              </code>
              <CopyButton
                text={`${baseUrl}/api/themes/${selectedSlug}?format=${selectedFormat}`}
                label="Copy URL"
              />
              <CopyButton
                text={`curl "${baseUrl}/api/themes/${selectedSlug}?format=${selectedFormat}"`}
                label="Copy curl"
              />
            </div>
          </div>

          <button
            onClick={fetchLive}
            disabled={liveLoading || !selectedSlug}
            className="px-4 py-2 rounded-xl bg-td-primary text-white text-sm font-medium hover:bg-td-primary/90 transition-colors disabled:opacity-50"
          >
            {liveLoading ? "Fetching..." : "Send Request"}
          </button>

          {liveResponse && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-td-foreground uppercase tracking-wider">
                Live Response
              </h4>
              <CodeBlock code={liveResponse} />
            </div>
          )}
        </div>
      </section>

      {/* Quick-start code snippets */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-td-foreground">
          Quick Start
        </h2>
        <CodeSnippets
          baseUrl={baseUrl}
          selectedSlug={selectedSlug}
          selectedFormat={selectedFormat}
        />
      </section>

      {/* Response Schema Reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-td-foreground">
          Response Schema
        </h2>
        <div className="rounded-xl border border-white/10 bg-td-secondary p-6 space-y-4">
          <p className="text-sm text-td-muted">
            Both endpoints return themes with the same shape. The list endpoint
            returns an array of these objects.
          </p>
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-td-background/50">
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Field
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Type
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    field: "name",
                    type: "string",
                    desc: "Theme display name",
                    always: true,
                  },
                  {
                    field: "slug",
                    type: "string",
                    desc: "URL-safe identifier",
                    always: true,
                  },
                  {
                    field: "description",
                    type: "string | null",
                    desc: "Optional theme description",
                    always: false,
                  },
                  {
                    field: "colors",
                    type: "object",
                    desc: "Color tokens: background, foreground, primary, secondary, accent, muted",
                    always: true,
                  },
                  {
                    field: "fonts",
                    type: "object",
                    desc: "Font families: heading, body, mono",
                    always: true,
                  },
                  {
                    field: "starCount",
                    type: "number",
                    desc: "Number of stars received",
                    always: true,
                  },
                ].map((row) => (
                  <tr key={row.field} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-td-accent">
                      {row.field}
                    </td>
                    <td className="px-3 py-2 text-xs text-td-muted">
                      {row.type}
                    </td>
                    <td className="px-3 py-2 text-xs text-td-muted">
                      {row.desc}
                      {!row.always && (
                        <span className="ml-1 text-td-muted/50">(optional)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-td-foreground uppercase tracking-wider">
              Color Format Values
            </h4>
            <div className="rounded-lg border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-td-background/50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                      ?format=
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-td-muted">
                      Example Output
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { format: "hex", example: "#6d28d9" },
                    { format: "rgb", example: "rgb(109, 40, 217)" },
                    { format: "hsl", example: "hsl(263, 69%, 50%)" },
                    { format: "oklch", example: "oklch(0.442 0.225 292.8)" },
                  ].map((row) => (
                    <tr key={row.format} className="border-t border-white/5">
                      <td className="px-3 py-2 font-mono text-xs text-td-accent">
                        {row.format}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-td-muted">
                        {row.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
