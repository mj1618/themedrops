type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  // Weighted Euclidean distance — gives more perceptual accuracy than plain RGB
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
  );
}

const COLOR_KEYS: (keyof ThemeColors)[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "muted",
];

export function themeSimilarity(
  colorsA: ThemeColors,
  colorsB: ThemeColors
): number {
  let total = 0;
  for (const key of COLOR_KEYS) {
    total += colorDistance(colorsA[key], colorsB[key]);
  }
  return total / COLOR_KEYS.length;
}
