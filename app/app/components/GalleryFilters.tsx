import { useState, useRef, useEffect } from "react";
import type { ColorFamily } from "../lib/colorConvert";

export type Tone = "all" | "light" | "dark";

export type FilterState = {
  tone: Tone;
  colorFamily: ColorFamily | null;
  headingFont: string | null;
  hasDescription: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  tone: "all",
  colorFamily: null,
  headingFont: null,
  hasDescription: false,
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.tone !== "all" ||
    f.colorFamily !== null ||
    f.headingFont !== null ||
    f.hasDescription
  );
}

const COLOR_FAMILIES: { label: ColorFamily; dot: string }[] = [
  { label: "Red", dot: "#ef4444" },
  { label: "Orange", dot: "#f97316" },
  { label: "Yellow", dot: "#eab308" },
  { label: "Green", dot: "#22c55e" },
  { label: "Blue", dot: "#3b82f6" },
  { label: "Purple", dot: "#8b5cf6" },
  { label: "Pink", dot: "#ec4899" },
  { label: "Neutral", dot: "#9ca3af" },
];

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableFonts: string[];
  totalCount: number;
  filteredCount: number;
};

export function GalleryFilters({
  filters,
  onChange,
  availableFonts,
  totalCount,
  filteredCount,
}: Props) {
  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Tone */}
        <FilterChip
          label={filters.tone === "all" ? "Tone" : filters.tone === "light" ? "Light" : "Dark"}
          active={filters.tone !== "all"}
          onClear={() => onChange({ ...filters, tone: "all" })}
        >
          <div className="flex flex-col gap-1 p-1">
            {(["all", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => onChange({ ...filters, tone: t })}
                className={`px-3 py-1.5 text-sm rounded-lg text-left capitalize transition-colors ${
                  filters.tone === t
                    ? "bg-td-primary text-white"
                    : "text-td-foreground hover:bg-white/5"
                }`}
              >
                {t === "all" ? "All tones" : t}
              </button>
            ))}
          </div>
        </FilterChip>

        {/* Color Family */}
        <FilterChip
          label={filters.colorFamily ?? "Color"}
          active={filters.colorFamily !== null}
          onClear={() => onChange({ ...filters, colorFamily: null })}
        >
          <div className="flex flex-col gap-1 p-1 max-h-64 overflow-y-auto">
            {COLOR_FAMILIES.map(({ label, dot }) => (
              <button
                key={label}
                onClick={() =>
                  onChange({
                    ...filters,
                    colorFamily: filters.colorFamily === label ? null : label,
                  })
                }
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-left transition-colors ${
                  filters.colorFamily === label
                    ? "bg-td-primary text-white"
                    : "text-td-foreground hover:bg-white/5"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: dot }}
                />
                {label}
              </button>
            ))}
          </div>
        </FilterChip>

        {/* Font */}
        {availableFonts.length > 0 && (
          <FilterChip
            label={filters.headingFont ?? "Font"}
            active={filters.headingFont !== null}
            onClear={() => onChange({ ...filters, headingFont: null })}
          >
            <div className="flex flex-col gap-1 p-1 max-h-64 overflow-y-auto">
              {availableFonts.map((font) => (
                <button
                  key={font}
                  onClick={() =>
                    onChange({
                      ...filters,
                      headingFont: filters.headingFont === font ? null : font,
                    })
                  }
                  className={`px-3 py-1.5 text-sm rounded-lg text-left transition-colors ${
                    filters.headingFont === font
                      ? "bg-td-primary text-white"
                      : "text-td-foreground hover:bg-white/5"
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          </FilterChip>
        )}

        {/* Has Description */}
        <button
          onClick={() => onChange({ ...filters, hasDescription: !filters.hasDescription })}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border transition-colors ${
            filters.hasDescription
              ? "bg-td-primary text-white border-td-primary"
              : "bg-td-secondary border-white/5 text-td-muted hover:text-td-foreground hover:border-white/10"
          }`}
        >
          Has description
          {filters.hasDescription && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Clear all */}
        {active && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="px-3 py-1.5 text-sm text-td-muted hover:text-td-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter count */}
      {active && (
        <p className="text-sm text-td-muted">
          Showing {filteredCount} of {totalCount} themes
        </p>
      )}
    </div>
  );
}

/** A chip that opens a dropdown popover when clicked. */
function FilterChip({
  label,
  active,
  onClear,
  children,
}: {
  label: string;
  active: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border transition-colors ${
          active
            ? "bg-td-primary text-white border-td-primary"
            : "bg-td-secondary border-white/5 text-td-muted hover:text-td-foreground hover:border-white/10"
        }`}
      >
        {label}
        {active ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[160px] rounded-xl bg-td-secondary border border-white/10 shadow-xl">
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}
