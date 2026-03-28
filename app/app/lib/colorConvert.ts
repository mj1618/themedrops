function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const linearize = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 10) / 10,
  };
}

export function convertColor(hex: string, format: string): string {
  if (format === "hex") return hex;
  const rgb = hexToRgb(hex);
  switch (format) {
    case "rgb":
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    case "hsl": {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    case "oklch": {
      const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
      return `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
    }
    default:
      return hex;
  }
}

export function convertColors(
  colors: Record<string, string>,
  format: string
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colors).map(([k, v]) => [k, convertColor(v, format)])
  );
}

/** Relative luminance per WCAG 2.0 (0 = black, 1 = white) */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export type ColorFamily =
  | "Red"
  | "Orange"
  | "Yellow"
  | "Green"
  | "Blue"
  | "Purple"
  | "Pink"
  | "Neutral";

/** Map a hex color to a broad color family based on hue and saturation. */
export function hexToColorFamily(hex: string): ColorFamily {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r, g, b);
  if (s < 10) return "Neutral";
  if (h >= 345 || h < 10) return "Red";
  if (h >= 10 && h < 40) return "Orange";
  if (h >= 40 && h < 70) return "Yellow";
  if (h >= 70 && h < 170) return "Green";
  if (h >= 170 && h < 260) return "Blue";
  if (h >= 260 && h < 310) return "Purple";
  return "Pink"; // 310-345
}
