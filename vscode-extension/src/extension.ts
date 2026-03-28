import * as vscode from "vscode";

interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

interface ThemeData {
  name: string;
  slug: string;
  description?: string;
  colors: ThemeColors;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  starCount: number;
}

const BACKUP_KEY = "themedrops.previousColorCustomizations";

function getApiUrl(): string {
  const config = vscode.workspace.getConfiguration("themedrops");
  return config.get<string>("apiUrl", "https://themedrops.com");
}

async function fetchThemes(): Promise<ThemeData[]> {
  const url = `${getApiUrl()}/api/themes?format=hex`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch themes: ${response.statusText}`);
  }
  return response.json() as Promise<ThemeData[]>;
}

async function fetchThemeBySlug(slug: string): Promise<ThemeData> {
  const url = `${getApiUrl()}/api/themes/${encodeURIComponent(slug)}?format=hex`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.statusText}`);
  }
  return response.json() as Promise<ThemeData>;
}

function mapThemeToVSCodeColors(
  colors: ThemeColors
): Record<string, string> {
  const { background, foreground, primary, secondary, accent, muted } = colors;

  return {
    // Editor
    "editor.background": background,
    "editor.foreground": foreground,
    "editorCursor.foreground": accent,
    "editor.selectionBackground": `${primary}40`,
    "editor.lineHighlightBackground": `${muted}20`,
    "editorLineNumber.foreground": muted,
    "editorLineNumber.activeForeground": foreground,

    // Activity Bar
    "activityBar.background": background,
    "activityBar.foreground": primary,
    "activityBar.inactiveForeground": muted,
    "activityBarBadge.background": accent,
    "activityBarBadge.foreground": background,

    // Side Bar
    "sideBar.background": `${background}`,
    "sideBar.foreground": foreground,
    "sideBarTitle.foreground": primary,
    "sideBarSectionHeader.background": `${muted}15`,
    "sideBarSectionHeader.foreground": foreground,

    // Status Bar
    "statusBar.background": primary,
    "statusBar.foreground": background,
    "statusBar.debuggingBackground": accent,
    "statusBar.noFolderBackground": secondary,

    // Title Bar
    "titleBar.activeBackground": background,
    "titleBar.activeForeground": foreground,
    "titleBar.inactiveBackground": background,
    "titleBar.inactiveForeground": muted,

    // Tabs
    "tab.activeBackground": background,
    "tab.activeForeground": foreground,
    "tab.inactiveBackground": `${muted}10`,
    "tab.inactiveForeground": muted,
    "tab.activeBorderTop": primary,

    // Terminal
    "terminal.background": background,
    "terminal.foreground": foreground,
    "terminalCursor.foreground": accent,

    // Input
    "input.background": `${muted}15`,
    "input.foreground": foreground,
    "input.border": `${muted}40`,
    "input.placeholderForeground": muted,
    "focusBorder": primary,

    // Lists
    "list.activeSelectionBackground": `${primary}30`,
    "list.activeSelectionForeground": foreground,
    "list.hoverBackground": `${muted}15`,
    "list.inactiveSelectionBackground": `${muted}20`,

    // Buttons
    "button.background": primary,
    "button.foreground": background,
    "button.hoverBackground": accent,

    // Panel
    "panel.background": background,
    "panel.border": `${muted}30`,
    "panelTitle.activeForeground": primary,

    // Badges
    "badge.background": accent,
    "badge.foreground": background,

    // Scrollbar
    "scrollbarSlider.background": `${muted}30`,
    "scrollbarSlider.hoverBackground": `${muted}50`,
    "scrollbarSlider.activeBackground": `${primary}50`,
  };
}

function themeToQuickPickItem(
  theme: ThemeData
): vscode.QuickPickItem & { slug: string } {
  return {
    label: theme.name,
    description: `${theme.starCount} stars`,
    detail: theme.description || undefined,
    slug: theme.slug,
  };
}

async function applyTheme(
  context: vscode.ExtensionContext,
  theme: ThemeData
): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const currentColors = config.get<Record<string, string>>(
    "workbench.colorCustomizations"
  );

  // Back up current colors if we haven't already
  const existingBackup = context.globalState.get<Record<string, string>>(
    BACKUP_KEY
  );
  if (!existingBackup) {
    await context.globalState.update(BACKUP_KEY, currentColors || {});
  }

  const newColors = mapThemeToVSCodeColors(theme.colors);
  await config.update(
    "workbench.colorCustomizations",
    newColors,
    vscode.ConfigurationTarget.Global
  );

  vscode.window.showInformationMessage(
    `ThemeDrops: Applied "${theme.name}"`
  );
}

async function browseThemes(context: vscode.ExtensionContext): Promise<void> {
  const themes = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "ThemeDrops: Fetching themes...",
    },
    () => fetchThemes()
  );

  if (!themes.length) {
    vscode.window.showWarningMessage("ThemeDrops: No themes found.");
    return;
  }

  const items = themes.map(themeToQuickPickItem);
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a theme to apply",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) {
    return;
  }

  const theme = themes.find((t) => t.slug === selected.slug);
  if (theme) {
    await applyTheme(context, theme);
  }
}

async function searchThemes(context: vscode.ExtensionContext): Promise<void> {
  const query = await vscode.window.showInputBox({
    placeHolder: "Search themes by name...",
    prompt: "Enter a search term",
  });

  if (!query) {
    return;
  }

  const themes = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "ThemeDrops: Searching themes...",
    },
    () => fetchThemes()
  );

  const lowerQuery = query.toLowerCase();
  const filtered = themes.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery))
  );

  if (!filtered.length) {
    vscode.window.showWarningMessage(
      `ThemeDrops: No themes matching "${query}".`
    );
    return;
  }

  const items = filtered.map(themeToQuickPickItem);
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: `${filtered.length} theme(s) matching "${query}"`,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) {
    return;
  }

  const theme = filtered.find((t) => t.slug === selected.slug);
  if (theme) {
    await applyTheme(context, theme);
  }
}

async function resetColors(context: vscode.ExtensionContext): Promise<void> {
  const backup = context.globalState.get<Record<string, string>>(BACKUP_KEY);
  const config = vscode.workspace.getConfiguration();

  await config.update(
    "workbench.colorCustomizations",
    backup && Object.keys(backup).length > 0 ? backup : undefined,
    vscode.ConfigurationTarget.Global
  );

  await context.globalState.update(BACKUP_KEY, undefined);

  vscode.window.showInformationMessage(
    "ThemeDrops: Color customizations reset."
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("themedrops.browse", () =>
      browseThemes(context)
    ),
    vscode.commands.registerCommand("themedrops.search", () =>
      searchThemes(context)
    ),
    vscode.commands.registerCommand("themedrops.reset", () =>
      resetColors(context)
    )
  );
}

export function deactivate(): void {}
