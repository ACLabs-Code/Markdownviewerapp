.PHONY: setup dev build build-all lint format format-check typecheck check pre-pr clean electron-build electron-dev electron-run electron-package

# Default target
all: setup check build

# Install all workspace dependencies
setup:
	pnpm install

# Start the Vite development server
dev:
	pnpm run dev

# Build the web app (packages/web → packages/web/dist)
build:
	pnpm run build

# Build all packages
build-all:
	pnpm run build:all

# Run ESLint across the workspace
lint:
	pnpm run lint

# Format codebase with Prettier (rewrites files)
format:
	pnpm run format

# Validate formatting without writing — mirrors CI format-check job
format-check:
	pnpm exec prettier --check .

# Run TypeScript typechecks across all packages (including vscode + electron)
typecheck:
	pnpm run typecheck && pnpm --filter mdviewer-vscode typecheck

# Run all quality checks without building — mirrors CI lint/format/typecheck jobs
check: format-check lint typecheck

# Full pre-PR validation — run this before every push
# Mirrors all CI checks. Fix failures here before opening a PR.
# If format-check fails: run 'make format' to auto-fix, then re-run.
pre-pr: check build

# ─── VS Code Extension ────────────────────────────────────────────────────────

# Build the extension (extension host + webview bundles + CSS)
vsce-build:
	pnpm --filter mdviewer-vscode build

# Watch mode — run alongside the "Launch MD Viewer Extension (Watch Mode)" F5 config
vsce-dev:
	pnpm --filter mdviewer-vscode build:watch

# Package into a .vsix for local install
vsce-package:
	pnpm --filter mdviewer-vscode package

# Install the packaged .vsix into your VS Code installation
vsce-install:
	code --install-extension packages/vscode-extension/mdviewer-vscode-*.vsix

# ─── Electron App ─────────────────────────────────────────────────────────────

# Build the electron app (main + preload + renderer bundles + CSS)
electron-build:
	pnpm --filter mdviewer-electron build

# Watch mode — rebuilds on source changes (run 'make electron-run' separately)
electron-dev:
	pnpm --filter mdviewer-electron build:watch

# Run the built electron app
electron-run:
	pnpm --filter mdviewer-electron start

# Package into a distributable (.dmg / .exe / .AppImage)
electron-package:
	pnpm --filter mdviewer-electron package

# ─── Utilities ────────────────────────────────────────────────────────────────

# Clean all build artifacts
clean:
	rm -rf dist packages/*/dist node_modules packages/*/node_modules
