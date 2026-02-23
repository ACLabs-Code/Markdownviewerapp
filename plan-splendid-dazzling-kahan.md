# Phase 5: CI/CD Backward Compatibility

## Goal

Update all 4 GitHub Actions workflows to support both the legacy npm path (`src/` app) and the
monorepo pnpm path. Detection is pure shell — no external action required. The legacy path remains
fully functional throughout.

## Git Workflow

1. Branch: `feature/monorepo-phase5` from `feature/monorepo`
2. Commit all changes
3. PR: `feature/monorepo-phase5` → `feature/monorepo`

---

## Common Patterns

### Monorepo Detection (ci.yml, deploy.yml, bundle-size.yml)

```yaml
- name: Detect repo type
  id: detect
  run: |
    if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
      echo "monorepo=true" >> $GITHUB_OUTPUT
    else
      echo "monorepo=false" >> $GITHUB_OUTPUT
    fi
```

### pnpm Setup + Node (all workflows)

`pnpm/action-setup@v4` MUST precede `actions/setup-node@v6` for cache to register correctly:

```yaml
- name: Setup pnpm
  if: steps.detect.outputs.monorepo == 'true'
  uses: pnpm/action-setup@v4
  with:
    version: latest

- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: '24'
    cache: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm' || 'npm' }}

- name: Install dependencies
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm install' || 'npm ci' }}
```

---

## Files to Modify

### 1. `.github/workflows/ci.yml`

All 4 jobs follow the same structural pattern. The detect/setup/install steps are identical across jobs.

**lint job:**

```yaml
- name: Run ESLint
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm run lint' || 'npm run lint' }}
```

Both paths run the same root `eslint .` script.

**format-check job:**

```yaml
- name: Check formatting
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm run format -- --check' || 'npm run format -- --check' }}
```

**typecheck job:**

```yaml
- name: Run type check
  run: |
    if [ "${{ steps.detect.outputs.monorepo }}" = "true" ]; then
      pnpm run typecheck
      pnpm --filter @mdviewer/platform-adapters typecheck
      pnpm --filter @mdviewer/web typecheck
    else
      npm run typecheck
    fi
```

**build job:**

```yaml
- name: Build project
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm run build:web' || 'npm run build' }}
```

`build:web` is already defined in root `package.json`: `"build:web": "pnpm --filter @mdviewer/web build"`.

---

### 2. `.github/workflows/deploy.yml`

Detection also outputs `dist_path` used by the deploy step:

```yaml
- name: Detect repo type
  id: detect
  run: |
    if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
      echo "monorepo=true" >> $GITHUB_OUTPUT
      echo "dist_path=./packages/web/dist" >> $GITHUB_OUTPUT
    else
      echo "monorepo=false" >> $GITHUB_OUTPUT
      echo "dist_path=./dist" >> $GITHUB_OUTPUT
    fi
```

Build step:

```yaml
- name: Build project
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm --filter @mdviewer/web build' || 'npm run build' }}
  env:
    BASE_PATH: /Markdownviewerapp/
```

Deploy step uses dynamic `publish_dir`:

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ${{ steps.detect.outputs.dist_path }}
    cname: false
```

---

### 3. `.github/workflows/bundle-size.yml`

Detection outputs both `monorepo` and `build_script` (npm script name used by the action):

```yaml
- name: Detect repo type
  id: detect
  run: |
    if [ -f "pnpm-workspace.yaml" ] && [ -d "packages/web/src" ]; then
      echo "monorepo=true" >> $GITHUB_OUTPUT
      echo "build_script=build:web" >> $GITHUB_OUTPUT
      echo "pattern=./packages/web/dist/**/*.{js,css,html}" >> $GITHUB_OUTPUT
    else
      echo "monorepo=false" >> $GITHUB_OUTPUT
      echo "build_script=build" >> $GITHUB_OUTPUT
      echo "pattern=./dist/**/*.{js,css,html}" >> $GITHUB_OUTPUT
    fi
```

Remove the explicit "Build project" step (the action handles building both branches). Update the
`compressed-size-action` step to use dynamic inputs:

```yaml
- name: Check compressed size
  uses: preactjs/compressed-size-action@v2
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    pattern: ${{ steps.detect.outputs.pattern }}
    exclude: '{./dist/**/*.map,./dist/**/node_modules/**}'
    build-script: ${{ steps.detect.outputs.build_script }}
```

The `build-script` input is an npm script name. In monorepo mode, `build:web` maps to
`pnpm --filter @mdviewer/web build` via root `package.json`. The action runs `npm run build:web`,
which delegates to pnpm (pnpm is installed in the environment from the earlier setup step).

---

### 4. `.github/workflows/security.yml`

Simpler detection — only needs to know if pnpm is in use (no `packages/web/src` check):

```yaml
- name: Detect repo type
  id: detect
  run: |
    if [ -f "pnpm-workspace.yaml" ]; then
      echo "monorepo=true" >> $GITHUB_OUTPUT
    else
      echo "monorepo=false" >> $GITHUB_OUTPUT
    fi
```

Audit command — `pnpm audit` does not support `--production`:

```yaml
- name: Run security audit
  run: ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm audit --audit-level=moderate' || 'npm audit --production --audit-level=moderate' }}
```

Artifact upload — use the correct lockfile:

```yaml
- name: Upload audit results
  if: always()
  uses: actions/upload-artifact@v6
  with:
    name: security-audit-results
    path: |
      ${{ steps.detect.outputs.monorepo == 'true' && 'pnpm-lock.yaml' || 'package-lock.json' }}
    retention-days: 30
```

---

## Success Criteria

✅ All 4 `ci.yml` jobs pass with monorepo detection firing `true`
✅ `deploy.yml` builds from `packages/web/` and publishes `./packages/web/dist`
✅ `bundle-size.yml` reports sizes from `packages/web/dist`
✅ `security.yml` uses `pnpm audit` in monorepo mode
✅ Legacy `npm ci` / `npm run build` path remains reachable by detection (non-breaking)
✅ No changes to `src/`, `packages/`, or any non-workflow files
