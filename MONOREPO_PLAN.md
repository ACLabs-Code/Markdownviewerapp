# Monorepo Migration Plan: Web + Electron + VSCode Extension

## Overview

Migrate the current markdown viewer web app to a **pnpm workspaces-based monorepo** supporting three platforms while maintaining 85% code sharing. This plan prioritizes incremental, safe migration with backward compatibility.

## Architecture Summary

```
Markdownviewerapp/
├── packages/
│   ├── core/                    # Shared components & styles (~600 LOC)
│   │   ├── components/          # MarkdownViewer, MermaidDiagram, ThemeToggle
│   │   ├── styles/              # Tailwind v4 config, theme CSS variables
│   │   └── types/               # Platform abstraction interfaces
│   │
│   ├── platform-adapters/       # Platform abstraction layer (~300 LOC)
│   │   ├── web.ts               # FileSystemAccess API implementation
│   │   ├── electron.ts          # Node.js fs + chokidar implementation
│   │   └── vscode.ts            # VSCode workspace API implementation
│   │
│   ├── web/                     # Web app (~200 LOC simplified App.tsx)
│   ├── electron/                # Desktop app (~400 LOC new)
│   └── vscode-extension/        # VSCode extension (~300 LOC new)
│
├── pnpm-workspace.yaml
└── package.json                 # Root with workspace scripts
```

**Tooling Choice**: pnpm Workspaces (fast, simple, excellent TypeScript support)

---

## Platform Abstraction Layer

All platforms implement these interfaces:

### IFileProvider

```typescript
interface IFileProvider {
  openFilePicker(): Promise<FileMetadata | null>;
  readFile(handle: FileHandle): Promise<string>;
  supportsWatching(): boolean;
}
```

### IFileWatcher

```typescript
interface IFileWatcher {
  watch(handle: FileHandle, onChanged: (content: string) => void): () => void;
}
```

**Implementations**:

- **Web**: FileSystemAccess API + polling (current behavior)
- **Electron**: Node.js `fs` + chokidar file watching
- **VSCode**: VSCode workspace API + native file system watchers

---

## Migration Strategy: Incremental with Zero Downtime

**Approach**: Migrate incrementally on main (or short-lived branches) with backward-compatible CI/CD that supports both old and new structures simultaneously.

**Key Principle**: The existing `src/` structure and GitHub Pages deployment continue working throughout Phases 1-4. Only switch to monorepo builds once fully validated.

---

## Migration Phases

### Phase 1: Setup Monorepo Infrastructure (2 days)

**Goal**: Establish new structure alongside existing app without breaking anything

1. ✅ pnpm already installed at `/usr/local/bin/pnpm` (version 10.30.1)

2. Create directory structure (alongside existing `src/`):

   ```bash
   mkdir -p packages/{core,platform-adapters,web}
   ```

3. Create `pnpm-workspace.yaml`:

   ```yaml
   packages:
     - 'packages/*'
   ```

4. Create root `package.json` with workspace scripts (don't delete existing dependencies yet):

   ```json
   {
     "name": "markdown-viewer-monorepo",
     "private": true,
     "scripts": {
       "dev": "vite",
       "build": "tsc -b && vite build",
       "dev:web": "pnpm --filter @mdviewer/web dev",
       "build:all": "pnpm -r --filter './packages/*' build",
       "lint": "pnpm -r --parallel lint",
       "typecheck": "pnpm -r --parallel typecheck"
     }
   }
   ```

   Note: Keep existing `dev` and `build` scripts for CI/CD compatibility

5. Set up TypeScript project references in root `tsconfig.json`

6. Create PR: `"chore: initialize monorepo structure"`
   - This PR adds `packages/` folders (empty) alongside existing `src/`
   - CI/CD continues using existing scripts
   - Merge to main once validated

**Validation**:

- `pnpm install` completes successfully
- Existing CI/CD still works (builds from `src/`)
- GitHub Pages deployment unaffected

---

### Phase 2: Extract Core Package (3 days)

**Goal**: Build `@mdviewer/core` with shared components (keep `src/` untouched for now)

1. Create `packages/core/package.json` with dependencies:
   - react-markdown, remark-gfm, mermaid, next-themes, sonner, lucide-react
   - peerDependencies: react ^19.0.0, react-dom ^19.0.0

2. Create `packages/core/tsconfig.json` with `composite: true`

3. **Copy** (not move) components to new location:

   ```bash
   cp src/app/components/MarkdownViewer.tsx packages/core/src/components/
   cp src/app/components/MermaidDiagram.tsx packages/core/src/components/
   cp src/app/components/ThemeToggle.tsx packages/core/src/components/
   cp src/app/components/ThemedToaster.tsx packages/core/src/components/
   ```

   **Important**: Use `cp` not `mv` - keep originals in `src/` for now

4. **Copy** styles:

   ```bash
   cp -r src/styles packages/core/src/
   ```

5. Create `packages/core/src/index.ts`:

   ```typescript
   export { MarkdownViewer } from './components/MarkdownViewer';
   export { MermaidDiagram } from './components/MermaidDiagram';
   export { ThemeToggle } from './components/ThemeToggle';
   export { ThemedToaster } from './components/ThemedToaster';
   export type { FileMetadata, FileHandle, IFileProvider, IFileWatcher } from './types/platform';
   ```

6. Add build script to `packages/core/package.json`:

   ```json
   "scripts": {
     "build": "tsc -b",
     "typecheck": "tsc --noEmit"
   }
   ```

7. Test build: `pnpm --filter @mdviewer/core build`

8. Create PR: `"refactor: extract core package with shared components"`
   - Both `src/` and `packages/core/` exist now
   - CI/CD still builds from `src/` (no changes needed)
   - Merge to main once validated

**Validation**:

- Core package builds without errors
- Existing app still builds and deploys from `src/`

---

### Phase 3: Create Platform Adapters (2 days)

**Goal**: Implement platform abstraction layer (new package, no impact on existing app)

1. Create `packages/platform-adapters/package.json` with chokidar dependency

2. Create interface definitions in `packages/platform-adapters/src/types.ts`:
   - `IFileProvider` interface
   - `IFileWatcher` interface
   - `FileMetadata` type
   - `FileHandle` union type

3. Implement `packages/platform-adapters/src/web.ts`:
   - `WebFileProvider` - uses FileSystemAccess API (`showOpenFilePicker`)
   - `WebFileWatcher` - polling implementation (1000ms interval)

4. Implement `packages/platform-adapters/src/electron.ts`:
   - `ElectronFileProvider` - uses Node.js `fs` module
   - `ElectronFileWatcher` - uses chokidar for native file watching

5. Implement `packages/platform-adapters/src/vscode.ts`:
   - `VSCodeFileProvider` - uses `vscode.workspace.fs` API
   - `VSCodeFileWatcher` - uses VSCode's file system watcher

6. Create barrel export `packages/platform-adapters/src/index.ts`

7. Test build: `pnpm --filter @mdviewer/platform-adapters build`

8. Create PR: `"feat: add platform abstraction layer"`
   - New package added to monorepo
   - Existing app unchanged
   - Merge to main once validated

**Validation**:

- Platform adapters package builds successfully
- Existing app still builds and deploys from `src/`

---

### Phase 4: Migrate Web App (4 days)

**Goal**: Build `packages/web` using core + adapters, validate it matches existing app

1. Create `packages/web/package.json`:
   - Dependencies: `@mdviewer/core: workspace:*`, `@mdviewer/platform-adapters: workspace:*`
   - React 19, Vite, Tailwind (devDependencies)

2. Copy build configuration:

   ```bash
   cp -r public packages/web/
   cp index.html packages/web/
   cp vite.config.ts packages/web/
   ```

3. Update `packages/web/vite.config.ts` with workspace aliases:

   ```typescript
   resolve: {
     alias: {
       '@mdviewer/core': path.resolve(__dirname, '../core/src'),
       '@mdviewer/platform-adapters': path.resolve(__dirname, '../platform-adapters/src'),
     },
   }
   ```

4. Create `packages/web/src/main.tsx` (copy from `src/main.tsx`)

5. Create **refactored `packages/web/src/App.tsx`** (411 lines → ~150 lines):
   - Import components from `@mdviewer/core`
   - Replace file handling logic with `WebFileProvider` and `WebFileWatcher`
   - Remove redundant code now handled by platform adapters

   Example:

   ```typescript
   import { MarkdownViewer, ThemeToggle, ThemedToaster } from '@mdviewer/core';
   import { WebFileProvider, WebFileWatcher } from '@mdviewer/platform-adapters';

   const fileProvider = new WebFileProvider();
   const fileWatcher = new WebFileWatcher();

   const handleOpenFile = async () => {
     const metadata = await fileProvider.openFilePicker();
     if (!metadata) return;

     const content = await fileProvider.readFile(metadata.handle);
     setMarkdownContent(content);

     if (fileProvider.supportsWatching()) {
       const unwatch = fileWatcher.watch(metadata.handle, (newContent) => {
         setMarkdownContent(newContent);
         toast.success('File updated automatically');
       });
     }
   };
   ```

6. Test locally: `pnpm --filter @mdviewer/web dev`

7. Test build: `pnpm --filter @mdviewer/web build`

8. **Thoroughly test all features** (compare side-by-side with existing app):
   - File opening with FileSystemAccess API
   - Legacy file input fallback in Safari
   - Drag-and-drop
   - Auto-reload in Chrome
   - Theme switching (light/dark/system)
   - Mermaid diagrams
   - All markdown rendering (headings, lists, tables, code blocks, etc.)

9. **Do NOT commit yet** - packages/web is ready but not deployed yet

**Validation**:

- `packages/web` runs identically to current `src/` version
- All features work perfectly
- Build output is equivalent (check bundle size)
- Existing app from `src/` still deploys to GitHub Pages

---

### Phase 5: Update CI/CD with Backward Compatibility (2 days)

**Goal**: Add dual-path CI/CD that works with both old and new structures

This is the critical phase for zero-downtime migration. CI/CD will automatically detect which structure exists and build accordingly.

#### Step 1: Update `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm install --frozen-lockfile

      - name: Install dependencies (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm ci

      - name: Lint (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm lint

      - name: Lint (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm install --frozen-lockfile

      - name: Install dependencies (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm ci

      - name: Type check (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm typecheck

      - name: Type check (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm run typecheck

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm install --frozen-lockfile

      - name: Install dependencies (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm ci

      - name: Build (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm build:all

      - name: Build (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm run build
```

#### Step 2: Update `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
            echo "dist_path=./packages/web/dist" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
            echo "dist_path=./dist" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install and build (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: |
          pnpm install --frozen-lockfile
          pnpm --filter @mdviewer/web build
        env:
          BASE_PATH: /Markdownviewerapp/

      - name: Install and build (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: |
          npm ci
          npm run build
        env:
          BASE_PATH: /Markdownviewerapp/

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ${{ steps.check-monorepo.outputs.dist_path }}
```

#### Step 3: Update `.github/workflows/bundle-size.yml`

```yaml
name: Bundle Size

on:
  pull_request:
  push:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
            echo "pattern=./packages/web/dist/**/*.{js,css}" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
            echo "pattern=./dist/**/*.{js,css}" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install and build (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: |
          pnpm install --frozen-lockfile
          pnpm --filter @mdviewer/web build

      - name: Install and build (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: |
          npm ci
          npm run build

      - name: Check bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          build-script: false
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pattern: ${{ steps.check-monorepo.outputs.pattern }}
```

#### Step 4: Update `.github/workflows/security.yml`

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 9 * * 1'
  pull_request:
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Check for monorepo structure
        id: check-monorepo
        run: |
          if [ -f "pnpm-workspace.yaml" ]; then
            echo "monorepo=true" >> $GITHUB_OUTPUT
          else
            echo "monorepo=false" >> $GITHUB_OUTPUT
          fi

      - name: Install pnpm
        if: steps.check-monorepo.outputs.monorepo == 'true'
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Run audit (monorepo)
        if: steps.check-monorepo.outputs.monorepo == 'true'
        run: pnpm audit --audit-level=moderate

      - name: Run audit (legacy)
        if: steps.check-monorepo.outputs.monorepo == 'false'
        run: npm audit --audit-level=moderate
```

#### Step 5: Test and Deploy

1. Create PR with CI/CD updates: `"ci: add backward-compatible monorepo support"`
   - CI should run legacy path (build from `src/`)
   - Merge to main once validated

2. Create PR with packages/web fully implemented: `"feat: add monorepo web package"`
   - CI should now run monorepo path (build from `packages/web`)
   - **Critically test**: Verify GitHub Pages deploys from `packages/web/dist` successfully
   - Compare deployed app with previous version - should be identical
   - Merge to main once validated

**Validation**:

- All CI checks pass with monorepo structure
- GitHub Pages deploys successfully from `packages/web/dist`
- Deployed app is identical to previous version (same features, same UX)
- Can rollback easily if issues arise

---

### Phase 6: Clean Up Old Structure (1 day)

**Goal**: Remove old single-package files and simplify CI/CD

Now that monorepo is validated and deploying successfully, we can remove the old structure.

1. Delete old files:

   ```bash
   rm -rf src/
   rm index.html
   rm vite.config.ts
   ```

2. Update root `package.json`:
   - Remove old `dev` and `build` scripts (use `dev:web` and `build:all`)
   - Remove dependencies that are now in workspace packages
   - Keep only: workspace scripts, devDependencies (TypeScript, ESLint, Prettier)

3. Simplify `.github/workflows/ci.yml`:
   - Remove conditional logic (always use monorepo path)
   - Simplify to just: install pnpm → pnpm install → pnpm lint/typecheck/build:all

4. Simplify `.github/workflows/deploy.yml`:
   - Remove conditional logic
   - Always deploy from `./packages/web/dist`

5. Simplify `.github/workflows/bundle-size.yml`:
   - Remove conditional logic
   - Always track `./packages/web/dist/**/*.{js,css}`

6. Simplify `.github/workflows/security.yml`:
   - Remove conditional logic
   - Always use `pnpm audit`

7. Update `CLAUDE.md`:
   - Add monorepo architecture section
   - Document workspace commands (`pnpm dev:web`, `pnpm build:all`)
   - Update development workflow
   - Document platform abstraction layer

8. Update `README.md`:
   - Add monorepo structure diagram
   - Update installation: mention pnpm requirement
   - Update development commands
   - Note future Electron/VSCode releases

9. Create PR: `"chore: remove legacy structure and simplify CI/CD"`
   - Test that simplified CI/CD still works
   - Merge to main once validated

**Validation**:

- `pnpm install && pnpm build:all` completes successfully
- All CI checks pass
- GitHub Pages still deploys correctly
- Only monorepo structure remains

---

### Phase 7: Build Electron App (5 days) - Optional

**Goal**: Create desktop app with native file watching

1. Create `packages/electron/package.json`:
   - Dependencies: `@mdviewer/core`, `@mdviewer/platform-adapters`, electron, chokidar
   - Scripts: `dev`, `build`, `package`

2. Implement main process (`src/main/index.ts`):
   - Create BrowserWindow
   - Load renderer HTML
   - Handle IPC for file dialogs
   - Set up application menu

3. Implement renderer (`src/renderer/App.tsx`):
   - Import components from `@mdviewer/core`
   - Use `ElectronFileProvider` via IPC bridge
   - Use `ElectronFileWatcher` for native file watching

4. Configure `electron-builder.yml`:

   ```yaml
   appId: com.aclabs.mdviewer
   productName: Markdown Viewer
   directories:
     output: dist-electron
   files:
     - dist/**/*
   mac:
     target: dmg
   win:
     target: nsis
   linux:
     target: AppImage
   ```

5. Create `.github/workflows/deploy-electron.yml`:
   - Build for macOS, Windows, Linux
   - Upload artifacts to GitHub Releases on git tags

6. Test locally: `pnpm --filter @mdviewer/electron dev`

7. Commit: `"feat: add Electron desktop app"`

**Validation**:

- Electron app launches successfully
- Native file watching works with chokidar
- All markdown features work identically to web app

---

### Phase 8: Build VSCode Extension (5 days) - Optional

**Goal**: Create extension with webview-based viewer

1. Create `packages/vscode-extension/package.json`:

   ```json
   {
     "name": "markdown-viewer-vscode",
     "displayName": "Markdown Viewer",
     "version": "1.0.0",
     "engines": { "vscode": "^1.80.0" },
     "activationEvents": ["onCommand:mdviewer.open"],
     "main": "./dist/extension.js",
     "contributes": {
       "commands": [
         {
           "command": "mdviewer.open",
           "title": "Open Markdown Viewer"
         }
       ]
     }
   }
   ```

2. Implement extension entry (`src/extension.ts`):
   - Register command to open preview
   - Create webview panel
   - Use `VSCodeFileProvider` and `VSCodeFileWatcher`
   - Handle message passing between webview and extension

3. Implement webview (`src/webview/App.tsx`):
   - Import components from `@mdviewer/core`
   - Communicate with extension via `vscode.postMessage`
   - Render markdown with auto-updates

4. Configure Webpack (`webpack.config.js`):
   - Bundle extension code
   - Bundle webview separately
   - Set up aliases for workspace packages

5. Test locally:

   ```bash
   pnpm --filter @mdviewer/vscode-extension build
   code --extensionDevelopmentPath=./packages/vscode-extension
   ```

6. Publish to VSCode Marketplace:

   ```bash
   vsce package
   vsce publish
   ```

7. Commit: `"feat: add VSCode extension"`

**Validation**:

- Extension loads in VSCode
- Webview renders markdown correctly
- Live updates work when editing files

---

## Development Workflow

### Daily Commands

```bash
# Start web dev server
pnpm dev:web

# Build all packages
pnpm build:all

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format code
pnpm format
```

### Adding Dependencies

```bash
# To specific package
pnpm --filter @mdviewer/core add some-package

# To root (dev dependencies)
pnpm add -D -w some-dev-tool

# To all packages
pnpm -r add some-package
```

---

## Key Architectural Decisions

### 1. pnpm Workspaces vs Turborepo

**Choice**: pnpm Workspaces

**Rationale**: Simpler setup, sufficient for 3-5 packages, excellent performance. Can add Turborepo later if caching becomes critical.

### 2. Platform Abstraction Layer

**Choice**: Explicit `IFileProvider`/`IFileWatcher` interfaces

**Rationale**: Clear contracts, easy to test with mocks, prevents tight coupling to platform APIs.

### 3. Shared Core Package

**Choice**: Single `@mdviewer/core` used by all platforms

**Rationale**: DRY principle, 85% code reuse, single source of truth for markdown rendering.

### 4. Incremental Migration

**Choice**: Phased approach with backward compatibility

**Rationale**: Safer, allows rollback at any phase, GitHub Pages deployment continues working throughout migration.

---

## Critical Files to Modify

| File                                    | Current LOC | Action                                   | New LOC                       |
| --------------------------------------- | ----------- | ---------------------------------------- | ----------------------------- |
| `src/app/App.tsx`                       | 411         | Refactor and split                       | ~150 (web), extracted to core |
| `src/app/components/MarkdownViewer.tsx` | 117         | Move to core unchanged                   | 117                           |
| `src/app/components/MermaidDiagram.tsx` | 128         | Move to core unchanged                   | 128                           |
| `src/app/components/ThemeToggle.tsx`    | 63          | Move to core unchanged                   | 63                            |
| `package.json`                          | -           | Split dependencies to workspace packages | -                             |
| `vite.config.ts`                        | -           | Adapt for web package with aliases       | -                             |
| `.github/workflows/ci.yml`              | -           | Update for pnpm workspaces               | -                             |
| `.github/workflows/deploy.yml`          | -           | Update build paths                       | -                             |

---

## Timeline Estimate

| Phase                         | Duration    | Complexity |
| ----------------------------- | ----------- | ---------- |
| Phase 1: Monorepo Setup       | 2 days      | Low        |
| Phase 2: Extract Core         | 3 days      | Medium     |
| Phase 3: Platform Adapters    | 2 days      | Medium     |
| Phase 4: Migrate Web App      | 4 days      | Medium     |
| Phase 5: Update CI/CD         | 2 days      | Low        |
| Phase 6: Clean Up             | 1 day       | Low        |
| **Total (Monorepo Refactor)** | **14 days** |            |
| Phase 7: Electron App         | 5 days      | High       |
| Phase 8: VSCode Extension     | 5 days      | High       |
| **Total (All Platforms)**     | **24 days** |            |

---

## Success Criteria

### Monorepo Migration (Phases 1-6)

- ✅ All CI checks pass on monorepo branch
- ✅ GitHub Pages deployment works identically
- ✅ Web app functionality unchanged (file opening, drag-drop, auto-reload, themes)
- ✅ Bundle size within 5% of current app
- ✅ Zero runtime errors in production

### Platform Expansion (Phases 7-8)

- ✅ Electron app launches in <2 seconds
- ✅ Native file watching latency <100ms
- ✅ VSCode extension loads in <1 second
- ✅ All platforms pass smoke tests

---

## Risks & Mitigation

| Risk                                      | Mitigation                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Breaking current web app during migration | Incremental migration with testing at each phase, feature branch isolation |
| GitHub Pages deployment fails             | Test deploy workflow on feature branch before merging to main              |
| TypeScript project references issues      | Use `pnpm -r typecheck` to validate, extensive local testing               |
| pnpm adoption learning curve              | Provide documentation, pnpm CLI similar to npm                             |

---

## Next Steps

1. **Review this plan** and ask any clarifying questions
2. **Create GitHub issue** to track monorepo migration progress
3. **Install pnpm**: `npm install -g pnpm`
4. **Create feature branch**: `git checkout -b refactor/monorepo-setup`
5. **Begin Phase 1**: Initialize monorepo structure
