export type ColorFormat = "hex" | "hsl" | "rgb" | "oklch";

const VALID_FORMATS = new Set<ColorFormat>(["hex", "hsl", "rgb", "oklch"]);

export function isValidFormat(format: string): format is ColorFormat {
  return VALID_FORMATS.has(format as ColorFormat);
}

function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b];
}

function hexToRgbString(hex: string): string {
  const [r, g, b] = parseHex(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHslString(hex: string): string {
  const [r, g, b] = parseHex(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) {
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    } else if (max === gn) {
      h = ((bn - rn) / d + 2) / 6;
    } else {
      h = ((rn - gn) / d + 4) / 6;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToOklchString(hex: string): string {
  const [r, g, b] = parseHex(hex);
  // sRGB -> linear sRGB
  const lr = linearize(r / 255);
  const lg = linearize(g / 255);
  const lb = linearize(b / 255);

  // linear sRGB -> OKLab via LMS
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_c = Math.cbrt(l_);
  const m_c = Math.cbrt(m_);
  const s_c = Math.cbrt(s_);

  const L = 0.2104542553 * l_c + 0.7936177850 * m_c - 0.0040720468 * s_c;
  const a = 1.9779984951 * l_c - 2.4285922050 * m_c + 0.4505937099 * s_c;
  const bOk = 0.0259040371 * l_c + 0.7827717662 * m_c - 0.8086757660 * s_c;

  const C = Math.sqrt(a * a + bOk * bOk);
  let h = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(4)} ${h.toFixed(1)})`;
}

export function convertColor(hex: string, format: ColorFormat): string {
  if (format === "hex") return hex;
  if (format === "rgb") return hexToRgbString(hex);
  if (format === "hsl") return hexToHslString(hex);
  if (format === "oklch") return hexToOklchString(hex);
  return hex;
}

export function convertColors(
  colors: Record<string, string | undefined>,
  format: ColorFormat,
): Record<string, string | undefined> {
  if (format === "hex") return colors;
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(colors)) {
    result[key] = value && /^#[0-9a-fA-F]{6}$/.test(value)
      ? convertColor(value, format)
      : value;
  }
  return result;
}
