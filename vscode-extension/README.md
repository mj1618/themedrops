# ThemeDrops for VS Code

Browse and apply color themes from [themedrops.com](https://themedrops.com) directly in VS Code.

## Features

- **Browse** — Pick from all public themes on ThemeDrops
- **Search** — Filter themes by name or description
- **Reset** — Revert to your previous color settings

## Commands

| Command | Description |
|---------|-------------|
| `ThemeDrops: Browse Themes` | Fetch and pick from all available themes |
| `ThemeDrops: Search Themes` | Search themes by keyword |
| `ThemeDrops: Reset Colors` | Remove ThemeDrops color customizations |

## Install from Source

```bash
cd vscode-extension
npm install
npm run compile
npm run package
code --install-extension themedrops-0.1.0.vsix
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `themedrops.apiUrl` | `https://themedrops.com` | Base URL for the ThemeDrops API |

## How It Works

The extension fetches themes from the ThemeDrops API and maps theme colors (background, foreground, primary, secondary, accent, muted) to VS Code's `workbench.colorCustomizations` setting. This affects the editor, sidebar, status bar, tabs, terminal, and more.

Your previous color customizations are backed up automatically and restored when you run the Reset command.
