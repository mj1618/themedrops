import { convertColor } from "./colorConvert";

export function generateCSSVariables(
  colors: Record<string, string>,
  fonts: { heading: string; body: string; mono: string },
  themeName: string,
  format: string
): string {
  const lines = [`:root {`, `  /* ThemeDrops: ${themeName} */`];
  for (const [name, hex] of Object.entries(colors)) {
    lines.push(`  --td-${name}: ${convertColor(hex, format)};`);
  }
  lines.push("");
  lines.push(`  --td-font-heading: '${fonts.heading}', sans-serif;`);
  lines.push(`  --td-font-body: '${fonts.body}', sans-serif;`);
  lines.push(`  --td-font-mono: '${fonts.mono}', monospace;`);
  lines.push("}");
  return lines.join("\n");
}

export function generateTailwindConfig(
  colors: Record<string, string>,
  fonts: { heading: string; body: string; mono: string },
  themeName: string
): string {
  const colorEntries = Object.entries(colors)
    .map(([name, hex]) => `        ${name}: '${hex}',`)
    .join("\n");

  return `// tailwind.config.js — ThemeDrops: ${themeName}
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorEntries}
      },
      fontFamily: {
        heading: ['${fonts.heading}', 'sans-serif'],
        body: ['${fonts.body}', 'sans-serif'],
        mono: ['${fonts.mono}', 'monospace'],
      },
    },
  },
};`;
}

export function generateThemeJSON(theme: {
  name: string;
  slug: string;
  colors: Record<string, string>;
  fonts: { heading: string; body: string; mono: string };
}): string {
  return JSON.stringify(
    { name: theme.name, slug: theme.slug, colors: theme.colors, fonts: theme.fonts },
    null,
    2
  );
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
