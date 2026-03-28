import { useState } from "react";
import { contrastRatio, wcagLevel, wcagLevelLargeText } from "../lib/colorConvert";

type Colors = Record<string, string>;

type ColorPair = {
  label: string;
  fg: string;
  bg: string;
  fgKey: string;
  bgKey: string;
};

function getColorPairs(colors: Colors): ColorPair[] {
  return [
    { label: "Foreground / Background", fg: colors.foreground, bg: colors.background, fgKey: "foreground", bgKey: "background" },
    { label: "Primary / Background", fg: colors.primary, bg: colors.background, fgKey: "primary", bgKey: "background" },
    { label: "Secondary / Background", fg: colors.secondary, bg: colors.background, fgKey: "secondary", bgKey: "background" },
    { label: "Accent / Background", fg: colors.accent, bg: colors.background, fgKey: "accent", bgKey: "background" },
    { label: "Muted / Background", fg: colors.muted, bg: colors.background, fgKey: "muted", bgKey: "background" },
    { label: "Foreground / Muted", fg: colors.foreground, bg: colors.muted, fgKey: "foreground", bgKey: "muted" },
    { label: "Primary / Foreground", fg: colors.primary, bg: colors.foreground, fgKey: "primary", bgKey: "foreground" },
  ];
}

function Badge({ level }: { level: "AAA" | "AA" | "Fail" }) {
  const cls =
    level === "Fail"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-green-500/20 text-green-400 border-green-500/30";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>
      {level}
    </span>
  );
}

type Props = {
  colors: Colors;
};

export function ContrastChecker({ colors }: Props) {
  const [open, setOpen] = useState(false);
  const pairs = getColorPairs(colors);

  const passCount = pairs.filter((p) => wcagLevel(contrastRatio(p.fg, p.bg)) !== "Fail").length;

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
        Accessibility
      </button>

      {open && (
        <div className="rounded-xl border border-white/10 bg-td-secondary p-5 space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <p className="text-sm text-td-foreground font-medium">
              {passCount}/{pairs.length} pairs pass AA
            </p>
            <div className="h-2 rounded-full bg-td-background overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(passCount / pairs.length) * 100}%`,
                  backgroundColor: passCount === pairs.length ? "#22c55e" : passCount >= pairs.length / 2 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Pair rows */}
          <div className="space-y-2">
            {pairs.map((pair) => {
              const ratio = contrastRatio(pair.fg, pair.bg);
              const normalLevel = wcagLevel(ratio);
              const largeLevel = wcagLevelLargeText(ratio);

              return (
                <div
                  key={pair.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-td-background/50 border border-white/5"
                >
                  {/* Swatches */}
                  <div className="flex shrink-0">
                    <div
                      className="w-7 h-7 rounded-l border border-white/10"
                      style={{ backgroundColor: pair.fg }}
                      title={pair.fgKey}
                    />
                    <div
                      className="w-7 h-7 rounded-r border border-white/10 border-l-0"
                      style={{ backgroundColor: pair.bg }}
                      title={pair.bgKey}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-xs text-td-muted flex-1 min-w-0 truncate">
                    {pair.label}
                  </span>

                  {/* Ratio */}
                  <span className="text-xs font-mono text-td-foreground shrink-0">
                    {ratio.toFixed(1)}:1
                  </span>

                  {/* Badges */}
                  <div className="flex gap-1 shrink-0">
                    <Badge level={normalLevel} />
                    {largeLevel !== normalLevel && (
                      <span className="flex items-center gap-0.5">
                        <Badge level={largeLevel} />
                        <span className="text-[9px] text-td-muted">lg</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-td-muted">
            AA requires 4.5:1 for normal text, 3:1 for large text. AAA requires 7:1 / 4.5:1.
          </p>
        </div>
      )}
    </section>
  );
}
