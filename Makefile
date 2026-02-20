.PHONY: setup dev build lint format check clean

# Default target
all: setup check build

# Install dependencies
setup:
	npm install

# Start the Vite development server
dev:
	npm run dev

# Build the production bundle
build:
	npm run build

# Run ESLint to catch errors
lint:
	npm run lint

# Format codebase with Prettier
format:
	npm run format

# Run TypeScript typechecking
typecheck:
	npm run typecheck

# Run all quality checks (lint, format validation, typecheck)
check: lint typecheck
	npx prettier --check .

# Clean build artifacts and node_modules
clean:
	rm -rf dist
	rm -rf node_modules
