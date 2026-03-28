# VS Code Extension for themedrops

Build a VS Code extension in `vscode-extension/` that lets users browse and apply any theme from themedrops.com directly inside VS Code.

## Context

The PLAN.md explicitly calls for: "There should be a VSCode extension built in a sub-folder that allows you to install the extension to vscode, and then to use any theme available on themedrops.com."

The site already has a working REST API:
- `GET /api/themes` — lists all public themes (supports `?format=hex|rgb|hsl|oklch`)
- `GET /api/themes/:slug` — single theme by slug

Theme schema has: background, foreground, primary, secondary, accent, muted colors + heading/body/mono fonts.

## Tasks

- [ ] Scaffold the VS Code extension project in `vscode-extension/` with package.json, tsconfig, and extension entry point
- [ ] Add a command `themedrops.browse` that fetches themes from the API and shows a QuickPick list
- [ ] Map themedrops color tokens (background, foreground, primary, secondary, accent, muted) to VS Code's workbench color customization keys (editor.background, editor.foreground, activityBar, statusBar, sideBar, tab colors, etc.)
- [ ] Apply the selected theme by writing `workbench.colorCustomizations` to the user's VS Code settings
- [ ] Add a command `themedrops.reset` that removes the color customizations
- [ ] Add a command `themedrops.search` that lets users search themes by name via the API
- [ ] Include a README.md with installation and usage instructions
- [ ] Add extension icon and metadata in package.json (publisher, displayName, description, categories, etc.)

## Acceptance Criteria

- Running `themedrops.browse` shows a list of themes fetched from the live API
- Selecting a theme applies its colors to the VS Code workbench immediately
- `themedrops.reset` cleanly reverts to the user's previous color settings
- The extension compiles without errors and can be installed locally via `code --install-extension`
- Works with the existing `/api/themes` endpoint without any backend changes

## Out of Scope

- Publishing to the VS Code marketplace (just local install for now)
- Token color / syntax highlighting customization (only workbench colors)
- Offline caching of themes
- Authentication or user-specific features (starring, creating themes)

## Completion Notes

All tasks completed. The extension is in `vscode-extension/` with:

- **3 commands**: `themedrops.browse`, `themedrops.search`, `themedrops.reset`
- **Color mapping**: Maps all 6 theme color tokens to 30+ VS Code workbench color keys (editor, sidebar, status bar, tabs, terminal, inputs, lists, buttons, panels, scrollbars)
- **Backup/restore**: Automatically backs up existing `workbench.colorCustomizations` before applying, restores on reset
- **Configurable API URL** via `themedrops.apiUrl` setting
- **Icon**: Generated 128x128 PNG icon
- **README**: Installation and usage docs
- Compiles cleanly with TypeScript, no backend changes needed

## Review Notes

Reviewed by Claude. The extension is well-structured, compiles cleanly, and meets all acceptance criteria. Three issues were found and fixed:

1. **Bug fix: Missing error handling in browse/search commands** — `browseThemes()` and `searchThemes()` had no try/catch around the API fetch. If the network request failed (server down, no internet), the error would propagate uncaught and VS Code would show a cryptic error dialog. Added proper error handling with user-friendly error messages.

2. **Bug fix: `applyTheme` overwrote all color customizations** — The original code replaced the entire `workbench.colorCustomizations` object with only the theme colors. Any existing user customizations not covered by the theme mapping (e.g., `errorForeground`, `gitDecoration.*`) would be silently lost. Fixed by merging the theme colors into the existing customizations instead of replacing them.

3. **Removed dead code** — `fetchThemeBySlug()` was defined but never called anywhere. Removed it to keep the codebase clean.
