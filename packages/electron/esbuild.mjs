import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

// ─── Main Process Bundle (Node.js CJS) ───────────────────────────────────────
// Runs in Electron's main process (Node.js).
// 'electron' is injected at runtime by the Electron runtime itself.

const mainConfig = {
  entryPoints: ['src/main/index.ts'],
  bundle: true,
  outfile: 'dist/main.cjs',
  format: 'cjs',
  platform: 'node',
  target: 'node22', // Electron 36 ships Node 22
  external: ['electron'],
  sourcemap: !isProduction,
  minify: isProduction,
  alias: {
    '@mdviewer/core': path.resolve(__dirname, '../core/src/index.ts'),
  },
};

// ─── Preload Bundle (Node.js CJS, contextBridge) ─────────────────────────────
// Runs in a privileged context with access to ipcRenderer.
// Exposes a narrow, typed API to the renderer via contextBridge.
// Must be CJS — Electron loads preload scripts via require().

const preloadConfig = {
  entryPoints: ['src/main/preload.ts'],
  bundle: true,
  outfile: 'dist/preload.cjs',
  format: 'cjs',
  platform: 'node',
  target: 'node22',
  external: ['electron'],
  sourcemap: !isProduction,
  minify: isProduction,
};

// ─── Renderer Bundle (Chromium IIFE) ─────────────────────────────────────────
// Runs inside Electron's renderer process (Chromium).
// Must be fully self-contained — no require(), no Node APIs.
// Communicates with the main process only via window.electronAPI (contextBridge).

const rendererConfig = {
  entryPoints: ['src/renderer/main.tsx'],
  bundle: true,
  outfile: 'dist/renderer.js',
  format: 'iife',
  platform: 'browser',
  target: ['chrome136'], // Electron 36 uses Chromium ~136
  external: [],
  sourcemap: !isProduction,
  minify: isProduction,
  jsx: 'automatic',
  jsxImportSource: 'react',
  // Keeps Mermaid diagram registrations that tree-shaking would otherwise remove.
  ignoreAnnotations: true,
  splitting: false,
  define: {
    // Neutralise Mermaid's web worker URL construction.
    'import.meta.url': JSON.stringify(''),
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  alias: {
    '@mdviewer/core': path.resolve(__dirname, '../core/src/index.ts'),
    '@mdviewer/core/styles': path.resolve(__dirname, '../core/src/styles/index.css'),
  },
};

// ─── CSS (Tailwind v4 via CLI pre-step) ──────────────────────────────────────
// esbuild cannot process Tailwind v4 directives (@source, @theme inline).
// In watch mode, tailwindcss --watch is handled by concurrently (see package.json).

function buildCss() {
  try {
    execSync('pnpm exec tailwindcss -i src/renderer/styles.css -o dist/renderer.css', {
      stdio: 'inherit',
      cwd: __dirname,
    });
  } catch (e) {
    console.error('CSS build failed:', e.message);
    process.exit(1);
  }
}

async function build() {
  const { mkdirSync } = await import('fs');
  mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });

  if (isWatch) {
    // CSS handled by tailwindcss --watch via concurrently in build:watch script
    const [mainCtx, preloadCtx, rendererCtx] = await Promise.all([
      esbuild.context(mainConfig),
      esbuild.context(preloadConfig),
      esbuild.context(rendererConfig),
    ]);
    await Promise.all([mainCtx.watch(), preloadCtx.watch(), rendererCtx.watch()]);
    console.log('[esbuild] watching for changes...');
  } else {
    // Build CSS first, then all three JS bundles in parallel
    buildCss();
    await Promise.all([
      esbuild.build(mainConfig),
      esbuild.build(preloadConfig),
      esbuild.build(rendererConfig),
    ]);
    console.log('[esbuild] build complete.');
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
