# Markdown Viewer App

A modern, browser-based markdown viewer designed for local development and reading of markdown files.

Edit your markdown files in your favorite editor while MarkdownViewer automatically refreshes in your browser, giving you instant visual feedback as you write. Perfect for drafting documentation, README files, or any markdown content. Also serves as a clean, distraction-free way to read rendered markdown files.

## Live Demo

🚀 **[Try the app online](https://aclabs-code.github.io/Markdownviewerapp)** - No installation required!

## Features

- **Preview Markdown files** with GitHub Flavored Markdown support
- **Auto-reload** - automatically refreshes when your markdown file changes (Chrome/Edge)
- **Mermaid diagrams** - renders flowcharts, sequence diagrams, and more
- **Syntax highlighting** - beautiful code blocks with syntax coloring
- **Light/dark themes** - matches your system preference or toggle manually

## Quick Start

```bash
# Install dependencies
npm i

# Start the development server
npm run dev

# Open http://localhost:5173 in your browser
# Click "Open Markdown File" and select a .md file to preview
```

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.
