import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Base path for deployment - defaults to '/' for root deployments
  // Set BASE_PATH env var for subdirectory deployments (e.g., GitHub Pages)
  base: process.env.BASE_PATH || '/',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // Specific sub-path exports must come before the package alias
      '@mdviewer/core/styles': path.resolve(__dirname, '../core/src/styles/index.css'),
      // Resolve workspace packages to their src/ directories for HMR support
      '@mdviewer/core': path.resolve(__dirname, '../core/src'),
      '@mdviewer/platform-adapters': path.resolve(__dirname, '../platform-adapters/src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
});
