# Markdown Viewer App

A modern, browser-based markdown viewer designed for local development and reading of markdown files.

Edit your markdown files in your favorite editor while MarkdownViewer automatically refreshes in your browser, giving you instant visual feedback as you write. Perfect for drafting documentation, README files, or any markdown content. Also serves as a clean, distraction-free way to read rendered markdown files.

## Live Demo

🚀 **[Try the app online](https://aclabs-code.github.io/Markdownviewerapp)** - No installation required!

## Features

- **Preview Markdown files** with GitHub Flavored Markdown support
- **Auto-reload** - automatically refreshes when your markdown file changes (Chrome/Edge)
- **Mermaid diagrams** - renders flowcharts, sequence diagrams, and more
- **Syntax highlighting** - beautiful code blocks with syntax coloring
- **Light/dark themes** - matches your system preference or toggle manually

## Quick Start

This is a pnpm workspace monorepo. Install [pnpm](https://pnpm.io/) first if you don't have it.

```bash
# Install dependencies
pnpm install

# Start the web app development server
pnpm run dev

# Open http://localhost:5173 in your browser
# Click "Open Markdown File" and select a .md file to preview
```

## Build for Production

```bash
# Build the web app only
pnpm run build

# Build all packages (core, platform-adapters, web, vscode-extension, electron)
pnpm run build:all
```

The web app production build will be in `packages/web/dist/`.

---

## Desktop App (Electron)

A native desktop application (`mdviewer-electron`) with the same features as the web app, plus native file watching via chokidar. Not yet published — build and run from source.

### Build and run

Requires the monorepo dependencies to be installed first (`pnpm install` from the repo root).

```bash
# Build the app
make electron-build

# Run the app
make electron-run

# Watch mode for development
make electron-dev

# Package into distributable (.dmg / .exe / .AppImage)
make electron-package
```

The packaged app will be in `packages/electron/dist-package/`.

---

## VS Code Extension

A companion VS Code extension (`mdviewer-vscode`) renders markdown in a panel beside your editor. It is not yet published to the VS Code Marketplace and has no formal versioning — build and install it manually from source.

### Usage

- Open a `.md` file in VS Code
- Press `Cmd+Shift+M` (macOS) / `Ctrl+Shift+M` (Windows/Linux), or click the preview icon in the editor title bar, or run **MD Viewer: Preview Current File** from the command palette
- The panel opens beside your editor and updates automatically as you switch between `.md` files or make unsaved edits
- Theme follows VS Code's active color theme (light/dark)

### Build and install

Requires the monorepo dependencies to be installed first (`pnpm install` from the repo root).

```bash
# Build the extension bundles
make vsce-build

# Package into a .vsix file
make vsce-package

# Install into your VS Code
make vsce-install
```

Reload VS Code after installing. To uninstall, find **MD Viewer** in the Extensions sidebar and click Uninstall.
