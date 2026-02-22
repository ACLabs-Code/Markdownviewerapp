.PHONY: setup dev build build-all lint format format-check typecheck check pre-pr clean

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
	pnpm run build:web

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

# Run TypeScript typechecks across all packages
# Core must be compiled first so platform-adapters can resolve @mdviewer/core types
typecheck:
	pnpm run typecheck
	pnpm --filter @mdviewer/core build
	pnpm --filter @mdviewer/platform-adapters typecheck
	pnpm --filter @mdviewer/web typecheck

# Run all quality checks without building — mirrors CI lint/format/typecheck jobs
check: format-check lint typecheck

# Full pre-PR validation — run this before every push
# Mirrors all CI checks. Fix failures here before opening a PR.
# If format-check fails: run 'make format' to auto-fix, then re-run.
pre-pr: check build

# Clean all build artifacts
clean:
	rm -rf dist packages/*/dist node_modules packages/*/node_modules
