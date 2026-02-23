import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

// ─── Extension Host Bundle (Node.js CJS) ─────────────────────────────────────
// Runs in VS Code's Node.js extension host process.
// 'vscode' is a special external that VS Code injects at runtime.

const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.cjs',
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode'],
  sourcemap: !isProduction,
  minify: isProduction,
  alias: {
    '@mdviewer/core': path.resolve(__dirname, '../core/src/index.ts'),
    '@mdviewer/platform-adapters-vscode': path.resolve(
      __dirname,
      '../platform-adapters/src/vscode.ts'
    ),
  },
};

// ─── Webview Bundle (Browser IIFE) ───────────────────────────────────────────
// Runs inside VS Code's sandboxed webview iframe (Chromium).
// Must be fully self-contained — CSP blocks external scripts.

const webviewConfig = {
  entryPoints: ['src/webview/main.tsx'],
  bundle: true,
  outfile: 'dist/webview.js',
  format: 'iife',
  platform: 'browser',
  target: ['chrome108'], // VS Code 1.85+ uses Electron 27 / Chromium 118+
  external: [], // Bundle everything — no CDN allowed by CSP
  sourcemap: !isProduction,
  minify: isProduction,
  jsx: 'automatic',
  jsxImportSource: 'react',
  // Keeps Mermaid diagram registrations: they have /*#__PURE__*/ annotations
  // that tree-shaking would otherwise remove as "side-effect-free" calls.
  ignoreAnnotations: true,
  // IIFE format cannot be split into chunks.
  splitting: false,
  define: {
    // Neutralise Mermaid's web worker URL construction (new URL(..., import.meta.url)).
    // With import.meta.url = '' the URL constructor fails silently and Mermaid
    // falls back to main-thread rendering.
    'import.meta.url': JSON.stringify(''),
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  alias: {
    '@mdviewer/core': path.resolve(__dirname, '../core/src/index.ts'),
    '@mdviewer/core/styles': path.resolve(__dirname, '../core/src/styles/index.css'),
    '@mdviewer/platform-adapters': path.resolve(__dirname, '../platform-adapters/src/index.ts'),
  },
};

// ─── CSS (Tailwind v4 via CLI pre-step) ──────────────────────────────────────
// esbuild's CSS bundler cannot process Tailwind v4 directives (@source, @theme).
// The build script runs tailwindcss CLI before esbuild for the CSS output.
// In watch mode, tailwindcss --watch is handled by concurrently (see package.json).

function buildCss() {
  try {
    execSync('pnpm exec tailwindcss -i src/webview/styles.css -o dist/webview.css', {
      stdio: 'inherit',
      cwd: __dirname,
    });
  } catch (e) {
    console.error('CSS build failed:', e.message);
    process.exit(1);
  }
}

async function build() {
  // Ensure dist directory exists
  const { mkdirSync } = await import('fs');
  mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });

  if (isWatch) {
    // CSS is handled by tailwindcss --watch via concurrently in build:watch script
    const [extCtx, webCtx] = await Promise.all([
      esbuild.context(extensionConfig),
      esbuild.context(webviewConfig),
    ]);
    await Promise.all([extCtx.watch(), webCtx.watch()]);
    console.log('[esbuild] watching for changes...');
  } else {
    // Build CSS first, then both JS bundles in parallel
    buildCss();
    await Promise.all([esbuild.build(extensionConfig), esbuild.build(webviewConfig)]);
    console.log('[esbuild] build complete.');
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
