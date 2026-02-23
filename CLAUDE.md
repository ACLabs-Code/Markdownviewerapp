# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ IMPORTANT: Keep this file updated!**
When you make changes to the project (new features, configuration changes, architectural decisions, workflow updates, etc.), update the relevant sections in this file. This ensures future development sessions have accurate context.

## Development Commands

```bash
pnpm install          # Install all workspace dependencies
pnpm run dev          # Start the web app dev server (packages/web → localhost:5173)
pnpm run build        # Build the web app (packages/web/dist/)
pnpm run build:all    # Build all packages (core → platform-adapters → web)
pnpm run lint         # Run ESLint across the workspace
pnpm run format       # Format all code with Prettier
pnpm run typecheck    # Type-check all packages in dependency order
```

Makefile shortcuts (call the same pnpm commands):

```bash
make dev          # pnpm run dev
make build        # pnpm run build
make build-all    # pnpm run build:all
make lint         # pnpm run lint
make format       # pnpm run format
make typecheck    # pnpm run typecheck (includes vscode-extension)
make pre-pr       # Full pre-PR check: format-check + lint + typecheck + build
```

## Monorepo Architecture

This is a pnpm workspace monorepo (`pnpm-workspace.yaml`) with four packages:

```
packages/
  core/               # @mdviewer/core — shared React components, styles, types
  platform-adapters/  # @mdviewer/platform-adapters — platform-specific file I/O
  web/                # @mdviewer/web — the web application (Vite + React)
  vscode-extension/   # mdviewer-vscode — VS Code webview extension
```

### Package: `@mdviewer/core`

Location: `packages/core/`

Exports shared UI components consumed by all platforms:

- `MarkdownViewer` — renders markdown with GFM + Mermaid support
- `MermaidDiagram` — Mermaid diagram renderer with theme sync
- `ThemeToggle` — light/dark/system theme switcher
- `ThemedToaster` — Sonner toast notifications synced to app theme
- Platform interface types: `FileMetadata`, `FileHandle`, `IFileProvider`, `IFileWatcher`

CSS styles are a separate export: `import '@mdviewer/core/styles'`

Build: `pnpm --filter @mdviewer/core build` (tsc composite build, outputs to `packages/core/dist/`)

### Package: `@mdviewer/platform-adapters`

Location: `packages/platform-adapters/`

Platform-specific implementations of `IFileProvider` and `IFileWatcher`:

- `WebFileProvider` / `WebFileWatcher` — File System Access API with legacy `<input>` fallback
- Electron and VS Code adapters (future)

Depends on `@mdviewer/core` for interface types. Requires core to be built before typechecking.

### Package: `@mdviewer/web`

Location: `packages/web/`

The deployable web application. Entry point: `packages/web/src/main.tsx`. Vite config: `packages/web/vite.config.ts`.

Depends on `@mdviewer/core` and `@mdviewer/platform-adapters` via workspace aliases.

### Package: `mdviewer-vscode`

Location: `packages/vscode-extension/`

VS Code webview extension that renders markdown beside the active editor. Key behaviours:
- Singleton panel auto-updates when switching between `.md` files
- Streams unsaved edits via `onDidChangeTextDocument` in real time
- Theme forced to match VS Code's active color theme (no independent toggle)
- Mermaid diagrams supported

**Build system** — `esbuild.mjs` produces two bundles:
- `dist/extension.cjs` — extension host (CJS/Node, `external: ['vscode']`)
- `dist/webview.js` — webview React app (browser IIFE, fully self-contained)
- `dist/webview.css` — Tailwind v4 via `@tailwindcss/cli` pre-step

**Two tsconfigs** (both typecheck-only, `noEmit: true` — esbuild handles compilation):
- `tsconfig.json` — extension host (CommonJS, node module resolution)
- `tsconfig.webview.json` — webview (ESNext, bundler resolution, DOM lib)

**Makefile targets:**
```bash
make vsce-build    # build extension + webview bundles + CSS
make vsce-dev      # watch mode (tailwind + esbuild in parallel)
make vsce-package  # produce .vsix for local install
make vsce-install  # install .vsix into VS Code
```

**F5 debug workflow:** `.vscode/launch.json` + `.vscode/tasks.json` at repo root. Press F5 in VS Code to launch Extension Development Host with the extension loaded.

**Known follow-up items:**
- `webview.js` is ~12MB (Mermaid bundled as IIFE). Only loaded inside the webview panel so doesn't affect activation time, but could be slimmed by lazy-loading Mermaid after initial render.
- The import alias `@mdviewer/platform-adapters-vscode` (hyphen, not `/`) is a workaround for `moduleResolution: "node"` not supporting subpath imports in `paths`. Fix: change `moduleResolution` to `"bundler"` in `tsconfig.json` and restore `@mdviewer/platform-adapters/vscode`.

## Build Configuration

### Base Path for Deployments

`packages/web/vite.config.ts` reads the `BASE_PATH` environment variable:

```bash
# Local dev / default (root path)
pnpm run dev

# GitHub Pages (subdirectory deployment)
BASE_PATH=/Markdownviewerapp/ pnpm run build
```

The `deploy.yml` workflow sets `BASE_PATH=/Markdownviewerapp/` automatically.

### Build Ordering Constraint

`platform-adapters/tsconfig.json` resolves `@mdviewer/core` to `../core/dist/index.d.ts`. Core must be compiled before platform-adapters can typecheck. The root `typecheck` script handles this:

```bash
pnpm --filter @mdviewer/core build && \
pnpm --filter @mdviewer/platform-adapters typecheck && \
pnpm --filter @mdviewer/web typecheck
```

## Architecture Overview

### Dual-Mode File Loading Pattern

`packages/web/src/App.tsx` implements progressive enhancement with two modes:

**Modern Mode (File System Access API):**

- `WebFileProvider.openFilePicker()` uses `showOpenFilePicker()` — Chrome/Edge 86+ only
- Returns a `FileSystemFileHandle` that `WebFileWatcher` can poll for changes
- Supports drag-and-drop via `getAsFileSystemHandle()`

**Legacy Fallback Mode:**

- Activates when `showOpenFilePicker` is not available (Safari, Firefox)
- Falls back to hidden `<input type="file">` with FileReader
- Read-only mode (no auto-reload capability)

### Auto-Reload Implementation

`WebFileWatcher.watch()` polls at 1000ms intervals using `file.lastModified` comparison. Returns an `unwatch` cleanup function wired to `useEffect` cleanup in `App.tsx`.

Toggle auto-reload on/off via Eye/EyeOff button in the UI.

### Theme System Integration

`next-themes` `ThemeProvider` wraps the app in `packages/web/src/App.tsx`. Applies `.dark` class to root element via `attribute="class"`. Supports light, dark, and system modes.

**CSS Variables:**

- Defined in `packages/core/src/styles/theme.css` using OKLCH color space
- Tailwind v4 maps these via `@theme inline` directive
- Custom variant: `@custom-variant dark (&:is(.dark *))`

**Toast Integration:**

`ThemedToaster` component (`packages/core/src/components/ThemedToaster.tsx`) syncs Sonner toast theme with app theme via `useTheme()` hook.

### Markdown Rendering Configuration

Location: `packages/core/src/components/MarkdownViewer.tsx`

- `react-markdown` with `remark-gfm` plugin for GitHub Flavored Markdown
- `react-syntax-highlighter` with `vscDarkPlus` theme for code blocks
- Custom component renderers for all markdown elements
- Inline code styled with pink accent colors
- Dark theme always used for code blocks regardless of app theme

**Mermaid Diagram Support:**

- Code blocks with `language-mermaid` are rendered as diagrams
- `MermaidDiagram` component (`packages/core/src/components/MermaidDiagram.tsx`) handles rendering
- Automatically syncs with app theme (light/dark) via `useTheme()` hook
- `htmlLabels: true`, security level `'loose'`, theme mapped light→`'default'` dark→`'dark'`
- Error handling shows user-friendly messages with collapsible raw code for debugging
- CSS overrides in `packages/core/src/styles/index.css` prevent SVG text clipping

## Key Technical Details

### Workspace Dependency Resolution

In dev, Vite resolves `@mdviewer/core` and `@mdviewer/platform-adapters` directly to their `src/` directories via aliases in `packages/web/vite.config.ts` — giving full HMR across packages without a build step.

### Tailwind CSS v4 Usage

Uses newer CSS-based config syntax (no `tailwind.config.js`):

- Main config: `packages/core/src/styles/tailwind.css`
- `@source`, `@theme inline`, `@custom-variant` directives

### Browser Compatibility

File System Access API: Chrome/Edge 86+ only, not Safari/Firefox as of 2025. App gracefully degrades to legacy file input mode.

### Tooling Configuration

**TypeScript:**

- `tsconfig.json` (root) — base config extended by all packages; `"include": []` (no files of its own)
- `tsconfig.node.json` (root) — covers `eslint.config.js` for type-aware linting
- `packages/*/tsconfig.json` — package-level configs that extend root

**Code Quality:**

- `eslint.config.js` — ESLint 9.x flat config with typescript-eslint, react-hooks, react-refresh rules; type-aware linting via `parserOptions.project` referencing all package tsconfigs
- `.prettierrc` — Prettier configuration

**Testing:**

- Playwright (`@playwright/test` v1.58.2) installed as dev dependency
- `test-mermaid.spec.js` exists for manual runs
- Not yet integrated into CI

### Project Origin

Generated from Figma Make (design-to-code tool). Explains why there are 48+ UI components in `packages/web/src/components/ui/`, most unused — these are shadcn/ui components (MIT licensed) from the generation template.

## CI/CD Pipeline

Location: `.github/workflows/`

All workflows use pnpm exclusively (Node.js 24.x, pnpm cache).

### `ci.yml` — Pull Request Checks

Triggers on pull requests. Four parallel jobs:

1. **lint** — `pnpm run lint`
2. **format-check** — `pnpm exec prettier --check .`
3. **typecheck** — `pnpm run typecheck`
4. **build** — `pnpm run build`

### `deploy.yml` — GitHub Pages Deployment

Triggers on push to `main` or manual dispatch. Builds `packages/web` with `BASE_PATH=/Markdownviewerapp/`, deploys `packages/web/dist/` to `gh-pages` branch.

URL: `https://aclabs-code.github.io/Markdownviewerapp`

### `security.yml` — Security Audit

Weekly (Mondays 9am UTC), on PRs, and manual. Runs `pnpm audit --audit-level=moderate --prod` (production deps only). Uploads `pnpm-lock.yaml` as artifact.

### `bundle-size.yml` — Bundle Size Monitoring

On PRs and push to `main`. Uses `preactjs/compressed-size-action@v2`. Monitors `packages/web/dist/**/*.{js,css,html}`. Comments on PRs with size changes vs base branch.

## File Organization

```
packages/core/src/
  index.ts                    # Package exports
  components/
    MarkdownViewer.tsx         # Markdown renderer (react-markdown + remark-gfm)
    MermaidDiagram.tsx         # Mermaid diagram renderer with theme sync
    ThemeToggle.tsx            # Theme switcher component
    ThemedToaster.tsx          # Sonner toast with theme sync
  styles/
    index.css                  # Main CSS entry (imports fonts, tailwind, theme)
    fonts.css
    tailwind.css               # Tailwind v4 config (@source, @theme inline)
    theme.css                  # OKLCH color variables
  types/
    platform.ts                # IFileProvider, IFileWatcher, FileHandle interfaces

packages/platform-adapters/src/
  index.ts                    # Package exports
  web.ts                      # WebFileProvider + WebFileWatcher
  electron.ts                 # (future)
  vscode.ts                   # VSCodeFileProvider + VSCodeFileWatcher

packages/web/src/
  main.tsx                    # App entry point
  App.tsx                     # Main component (file handling, state, UI layout)
  components/
    ui/                       # shadcn/ui components (mostly unused template boilerplate)

packages/vscode-extension/
  esbuild.mjs                 # Two-target build script (extension host + webview)
  tsconfig.json               # Extension host typecheck (CJS/Node)
  tsconfig.webview.json       # Webview typecheck (browser/DOM)
  src/
    extension.ts              # activate(), commands, subscriptions
    MdViewerPanel.ts          # Panel lifecycle, HTML/CSP template, messaging, file watching
    webview/
      types.ts                # Message protocol (ExtensionToWebviewMessage, WebviewToExtensionMessage)
      main.tsx                # createRoot() entry point
      App.tsx                 # postMessage-driven React app (no file I/O — extension host handles it)
      styles.css              # @import core CSS + webview body overrides

.vscode/                      # Tracked — F5 debug workflow
  launch.json                 # "Launch MD Viewer Extension" config
  tasks.json                  # "build-extension" pre-launch task
```
