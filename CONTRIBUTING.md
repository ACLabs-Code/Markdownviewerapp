# Contributing to Markdown Viewer App

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 24.x or higher (project uses Node 24.x in CI)
- pnpm (`npm install -g pnpm`)
- Git

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR-USERNAME/Markdownviewerapp.git
   cd Markdownviewerapp
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Open http://localhost:5173 in your browser

## Development Workflow

### Making Changes

1. Create a new branch for your changes:

   ```bash
   git checkout -b your-feature-name
   ```

2. Make your changes and test them locally

3. Run pre-PR validation — mirrors all CI checks:

   ```bash
   make pre-pr
   ```

   This runs format check, lint, typecheck (all packages), and build in sequence.
   If the format check fails, run `make format` to auto-fix then re-run.

   Individual checks are also available:

   ```bash
   make format-check  # Validate Prettier formatting (read-only)
   make format        # Auto-fix formatting
   make lint          # ESLint
   make typecheck     # TypeScript across all packages
   make build         # Production build
   ```

4. Commit your changes following our commit message conventions (see below)

5. Push your branch to your fork:

   ```bash
   git push -u origin your-feature-name
   ```

6. Open a Pull Request on GitHub

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

**Examples:**

```
feat: add support for custom markdown themes
fix: resolve auto-reload issue in Firefox
docs: update README with installation steps
```

## Code Style

This project uses automated code formatting and linting:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

Before submitting a PR, run `make pre-pr` and ensure it passes cleanly.

**Note:** All PRs are automatically checked by CI. Your PR must pass all checks before it can be merged.

## Pull Request Process

1. **Keep PRs focused** - One feature or fix per PR
2. **Update documentation** - If you change functionality, update relevant docs
3. **Add tests** - When test infrastructure is available (Playwright is installed but not yet configured)
4. **Wait for CI** - All CI checks must pass before merge
5. **Respond to feedback** - Address any review comments promptly

### What to Include in Your PR

- Clear description of what changed and why
- Link to any related issues
- Screenshots or GIFs for UI changes
- Notes on any breaking changes

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description** - Clear description of the bug
- **Steps to reproduce** - How to trigger the bug
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment** - Browser, OS, Node.js version
- **Screenshots** - If applicable

### Feature Requests

When requesting features, please include:

- **Use case** - Why this feature would be useful
- **Proposed solution** - How you envision it working
- **Alternatives** - Other approaches you've considered

## Project Structure

Key directories and files:

- `packages/web/src/App.tsx` - Main application component
- `packages/core/src/components/` - Shared React components
- `packages/core/src/styles/` - Tailwind CSS v4 configuration
- `packages/platform-adapters/src/` - Platform-specific file handling
- `.github/workflows/` - CI/CD workflows
- `CLAUDE.md` - Detailed technical documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Questions?

If you have questions about contributing:

- Check existing issues and discussions
- Review the [CLAUDE.md](./CLAUDE.md) technical documentation
- Open a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
