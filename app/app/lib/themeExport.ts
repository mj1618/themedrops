import { convertColor } from "./colorConvert";

type BaseColors = {
  background: string; foreground: string; primary: string;
  secondary: string; accent: string; muted: string;
};

type VscodeColors = {
  keyword: string; string: string; comment: string; function: string;
  variable: string; type: string; number: string; operator: string; punctuation: string;
};

type DiscordColors = {
  backgroundPrimary: string; backgroundSecondary: string;
  backgroundTertiary: string; backgroundFloating: string;
  textNormal: string; textMuted: string; textLink: string;
  interactiveNormal: string; interactiveHover: string; interactiveActive: string;
  statusOnline: string; statusIdle: string; statusDnd: string; statusOffline: string;
  brand: string;
};

type TailwindColors = {
  primaryForeground: string; secondaryForeground: string;
  accentForeground: string; mutedForeground: string;
  card: string; cardForeground: string; popover: string; popoverForeground: string;
  border: string; input: string; ring: string;
  destructive: string; destructiveForeground: string; radius: string;
};

// ── Existing generators ───────────────────────────────────────────────────────

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

// ── VS Code theme.json ────────────────────────────────────────────────────────

function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function alpha(hex: string, opacity: number): string {
  return hex + Math.round(opacity * 255).toString(16).padStart(2, "0");
}

export function generateVSCodeTheme(
  name: string,
  colors: BaseColors,
  vscode: VscodeColors
): string {
  const dark = isColorDark(colors.background);

  const theme = {
    name,
    type: dark ? "dark" : "light",
    colors: {
      "editor.background": colors.background,
      "editor.foreground": colors.foreground,
      "editorCursor.foreground": colors.primary,
      "editor.lineHighlightBackground": alpha(colors.secondary, 0.5),
      "editor.selectionBackground": alpha(colors.primary, 0.25),
      "editor.wordHighlightBackground": alpha(colors.primary, 0.15),
      "editorLineNumber.foreground": colors.muted,
      "editorLineNumber.activeForeground": colors.foreground,
      "editorIndentGuide.background": alpha(colors.muted, 0.3),
      "editorIndentGuide.activeBackground": alpha(colors.muted, 0.6),
      "sideBar.background": colors.secondary,
      "sideBar.foreground": colors.foreground,
      "sideBar.border": alpha(colors.foreground, 0.08),
      "sideBarSectionHeader.background": alpha(colors.background, 0.8),
      "activityBar.background": colors.background,
      "activityBar.foreground": colors.foreground,
      "activityBar.inactiveForeground": colors.muted,
      "activityBar.border": alpha(colors.foreground, 0.06),
      "activityBarBadge.background": colors.primary,
      "activityBarBadge.foreground": "#ffffff",
      "statusBar.background": colors.primary,
      "statusBar.foreground": "#ffffff",
      "statusBar.noFolderBackground": colors.muted,
      "statusBar.border": alpha(colors.primary, 0.4),
      "tab.activeBackground": colors.background,
      "tab.inactiveBackground": colors.secondary,
      "tab.activeForeground": colors.foreground,
      "tab.inactiveForeground": colors.muted,
      "tab.border": alpha(colors.foreground, 0.06),
      "tab.activeBorderTop": colors.primary,
      "titleBar.activeBackground": colors.secondary,
      "titleBar.activeForeground": colors.foreground,
      "titleBar.inactiveBackground": colors.secondary,
      "titleBar.inactiveForeground": colors.muted,
      "titleBar.border": alpha(colors.foreground, 0.06),
      "panel.background": colors.secondary,
      "panel.border": alpha(colors.foreground, 0.1),
      "panelTitle.activeForeground": colors.foreground,
      "panelTitle.inactiveForeground": colors.muted,
      "terminal.background": colors.background,
      "terminal.foreground": colors.foreground,
      "terminal.ansiBlack": colors.secondary,
      "terminal.ansiRed": vscode.keyword,
      "terminal.ansiGreen": vscode.string,
      "terminal.ansiYellow": vscode.type,
      "terminal.ansiBlue": vscode.function,
      "terminal.ansiMagenta": vscode.number,
      "terminal.ansiCyan": vscode.operator,
      "terminal.ansiWhite": colors.foreground,
      "terminal.ansiBrightBlack": colors.muted,
      "terminal.ansiBrightRed": vscode.keyword,
      "terminal.ansiBrightGreen": vscode.string,
      "terminal.ansiBrightYellow": vscode.type,
      "terminal.ansiBrightBlue": vscode.function,
      "terminal.ansiBrightMagenta": vscode.number,
      "terminal.ansiBrightCyan": vscode.operator,
      "terminal.ansiBrightWhite": "#ffffff",
      "input.background": colors.secondary,
      "input.foreground": colors.foreground,
      "input.border": alpha(colors.foreground, 0.12),
      "input.placeholderForeground": colors.muted,
      "focusBorder": alpha(colors.primary, 0.6),
      "list.hoverBackground": alpha(colors.primary, 0.1),
      "list.activeSelectionBackground": alpha(colors.primary, 0.2),
      "list.activeSelectionForeground": colors.foreground,
      "list.inactiveSelectionBackground": alpha(colors.secondary, 0.8),
      "list.highlightForeground": colors.primary,
      "dropdown.background": colors.secondary,
      "dropdown.foreground": colors.foreground,
      "button.background": colors.primary,
      "button.foreground": "#ffffff",
      "button.hoverBackground": alpha(colors.primary, 0.9),
      "badge.background": colors.primary,
      "badge.foreground": "#ffffff",
      "progressBar.background": colors.primary,
      "editorWidget.background": colors.secondary,
      "editorWidget.border": alpha(colors.foreground, 0.1),
      "editorSuggestWidget.background": colors.secondary,
      "editorSuggestWidget.border": alpha(colors.foreground, 0.1),
      "editorSuggestWidget.selectedBackground": alpha(colors.primary, 0.2),
      "editorSuggestWidget.highlightForeground": colors.primary,
      "notifications.background": colors.secondary,
      "notificationCenterHeader.background": colors.secondary,
      "scrollbarSlider.background": alpha(colors.muted, 0.3),
      "scrollbarSlider.hoverBackground": alpha(colors.muted, 0.5),
      "scrollbarSlider.activeBackground": alpha(colors.primary, 0.4),
      "gitDecoration.addedResourceForeground": vscode.string,
      "gitDecoration.modifiedResourceForeground": vscode.type,
      "gitDecoration.deletedResourceForeground": vscode.keyword,
      "gitDecoration.untrackedResourceForeground": vscode.string,
    },
    tokenColors: [
      {
        name: "Keywords",
        scope: ["keyword", "storage.type", "storage.modifier", "keyword.control"],
        settings: { foreground: vscode.keyword },
      },
      {
        name: "Strings",
        scope: ["string", "string.quoted", "string.template", "string.regexp"],
        settings: { foreground: vscode.string },
      },
      {
        name: "Comments",
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: vscode.comment, fontStyle: "italic" },
      },
      {
        name: "Functions",
        scope: [
          "entity.name.function", "support.function",
          "meta.function-call entity.name.function",
        ],
        settings: { foreground: vscode.function },
      },
      {
        name: "Variables",
        scope: ["variable", "variable.other", "support.variable"],
        settings: { foreground: vscode.variable },
      },
      {
        name: "Types & Classes",
        scope: [
          "entity.name.type", "entity.name.class", "support.class",
          "support.type", "entity.name.interface",
        ],
        settings: { foreground: vscode.type },
      },
      {
        name: "Numbers",
        scope: ["constant.numeric", "constant.language", "constant.character"],
        settings: { foreground: vscode.number },
      },
      {
        name: "Operators",
        scope: ["keyword.operator"],
        settings: { foreground: vscode.operator },
      },
      {
        name: "Punctuation",
        scope: ["punctuation", "meta.brace", "meta.bracket", "meta.separator"],
        settings: { foreground: vscode.punctuation },
      },
    ],
    semanticHighlighting: true,
    semanticTokenColors: {
      "function": vscode.function,
      "function.declaration": vscode.function,
      "method": vscode.function,
      "type": vscode.type,
      "class": vscode.type,
      "interface": vscode.type,
      "variable.readonly": vscode.variable,
      "parameter": vscode.variable,
      "keyword": vscode.keyword,
      "string": vscode.string,
      "number": vscode.number,
      "comment": vscode.comment,
      "operator": vscode.operator,
    },
  };

  return JSON.stringify(theme, null, 2);
}

// ── Discord CSS (BetterDiscord / Vencord) ─────────────────────────────────────

export function generateDiscordCSS(
  name: string,
  slug: string,
  description: string,
  discord: DiscordColors
): string {
  return `/**
 * @name ${name}
 * @description ${description || `${name} — from ThemeDrops`}
 * @version 1.0.0
 * @source https://themedrops.com/theme/${slug}
 * @website https://themedrops.com
 */

:root {
  /* ── Backgrounds ─────────────────────────────── */
  --background-primary:             ${discord.backgroundPrimary};
  --background-secondary:           ${discord.backgroundSecondary};
  --background-secondary-alt:       ${discord.backgroundSecondary};
  --background-tertiary:            ${discord.backgroundTertiary};
  --background-accent:              ${discord.backgroundTertiary};
  --background-floating:            ${discord.backgroundFloating};
  --background-modifier-hover:      ${discord.interactiveNormal}18;
  --background-modifier-active:     ${discord.interactiveNormal}28;
  --background-modifier-selected:   ${discord.interactiveNormal}38;
  --background-modifier-accent:     ${discord.interactiveNormal}10;

  /* ── Text ────────────────────────────────────── */
  --text-normal:                    ${discord.textNormal};
  --text-muted:                     ${discord.textMuted};
  --text-link:                      ${discord.textLink};
  --text-positive:                  ${discord.statusOnline};
  --text-warning:                   ${discord.statusIdle};
  --text-danger:                    ${discord.statusDnd};

  /* ── Interactive ─────────────────────────────── */
  --interactive-normal:             ${discord.interactiveNormal};
  --interactive-hover:              ${discord.interactiveHover};
  --interactive-active:             ${discord.interactiveActive};
  --interactive-muted:              ${discord.textMuted};

  /* ── Status ──────────────────────────────────── */
  --status-positive-background:     ${discord.statusOnline}22;
  --status-positive-text:           ${discord.statusOnline};
  --status-warning-background:      ${discord.statusIdle}22;
  --status-warning-text:            ${discord.statusIdle};
  --status-danger-background:       ${discord.statusDnd}22;
  --status-danger-text:             ${discord.statusDnd};

  /* ── Brand ───────────────────────────────────── */
  --brand-experiment:               ${discord.brand};
  --brand-experiment-560:           ${discord.brand};
  --brand-500:                      ${discord.brand};
  --brand-360:                      ${discord.brand};
}`;
}

// ── shadcn/ui CSS variables ───────────────────────────────────────────────────

export function generateShadcnCSS(
  name: string,
  colors: BaseColors,
  fonts: { heading: string; body: string; mono: string },
  tailwind: TailwindColors
): string {
  return `/* ThemeDrops: ${name} — shadcn/ui CSS variables */
/* Paste into your app's globals.css (Tailwind v4 / shadcn/ui) */

@layer base {
  :root {
    --background:             ${colors.background};
    --foreground:             ${colors.foreground};

    --primary:                ${colors.primary};
    --primary-foreground:     ${tailwind.primaryForeground};

    --secondary:              ${colors.secondary};
    --secondary-foreground:   ${tailwind.secondaryForeground};

    --accent:                 ${colors.accent};
    --accent-foreground:      ${tailwind.accentForeground};

    --muted:                  ${colors.muted};
    --muted-foreground:       ${tailwind.mutedForeground};

    --card:                   ${tailwind.card};
    --card-foreground:        ${tailwind.cardForeground};

    --popover:                ${tailwind.popover};
    --popover-foreground:     ${tailwind.popoverForeground};

    --border:                 ${tailwind.border};
    --input:                  ${tailwind.input};
    --ring:                   ${tailwind.ring};

    --destructive:            ${tailwind.destructive};
    --destructive-foreground: ${tailwind.destructiveForeground};

    --radius:                 ${tailwind.radius};

    --font-heading:           '${fonts.heading}', sans-serif;
    --font-body:              '${fonts.body}', sans-serif;
    --font-mono:              '${fonts.mono}', monospace;
  }
}`;
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
