# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm i              # Install dependencies
npm run dev        # Start Vite development server
npm run build      # Build production bundle
```

## Architecture Overview

### Dual-Mode File Loading Pattern

The app implements progressive enhancement for file access with two modes:

**Modern Mode (File System Access API):**

- Uses `showOpenFilePicker()` API (src/app/App.tsx:61-103)
- Provides persistent file handles that enable auto-reload
- Supports drag-and-drop with `getAsFileSystemHandle()`
- Only available in Chrome/Edge 86+ (not Safari/Firefox as of 2025)

**Legacy Fallback Mode:**

- Uses traditional `<input type="file">` with FileReader (src/app/App.tsx:105-127)
- Read-only mode (no auto-reload capability)
- Activates when `!('showOpenFilePicker' in window)`

The mode is detected on first file open and users are notified via toast messages.

### Auto-Reload Implementation

**Polling-based file watching** (src/app/App.tsx:28-56):

- Uses `setInterval` at 1000ms intervals
- Compares `file.lastModified` timestamps to detect changes
- Stores last modified time in `lastModifiedRef` to avoid unnecessary updates
- Uses `fileHandleRef` to access latest handle without restarting interval
- Only works in modern File System Access API mode

Toggle auto-reload on/off via Eye/EyeOff button in the UI.

### Theme System Integration

**Provider:** `next-themes` library (not Next.js specific)

- Wraps entire app in `<ThemeProvider>` (src/app/App.tsx:260)
- Supports light, dark, and system modes
- Uses `attribute="class"` to apply `.dark` class to root

**CSS Variables:**

- Defined in src/styles/theme.css using OKLCH color space
- Tailwind v4 maps these via `@theme inline` directive
- Custom variant: `@custom-variant dark (&:is(.dark *))`

**Toast Integration:**

- `ThemedToaster` component (src/app/components/ThemedToaster.tsx) syncs Sonner toast theme with app theme
- Uses `useTheme()` hook to read current theme

### Markdown Rendering Configuration

**Location:** src/app/components/MarkdownViewer.tsx

**Setup:**

- `react-markdown` with `remark-gfm` plugin for GitHub Flavored Markdown
- `react-syntax-highlighter` with `vscDarkPlus` theme for code blocks
- Custom component renderers for all markdown elements (h1-h4, p, ul, ol, blockquote, table, etc.)
- Inline code styled with pink accent colors
- Dark theme always used for code blocks regardless of app theme

**Mermaid Diagram Support:**

- Code blocks with `language-mermaid` are rendered as diagrams
- `MermaidDiagram` component (src/app/components/MermaidDiagram.tsx) handles rendering
- Automatically syncs with app theme (light/dark) via `useTheme()` hook
- Client-side only rendering to prevent SSR issues (uses `mounted` state)
- Error handling shows user-friendly messages with proper text wrapping for invalid syntax
- Supports all Mermaid diagram types: flowchart, sequence, class, state, git graph, etc.

**Mermaid Configuration:**

- Uses `htmlLabels: true` for proper text measurement and rendering
- Security level: `'loose'` to enable HTML labels
- Theme mapping: `dark` mode → `'dark'`, light mode → `'default'`
- Font family: `'ui-sans-serif, system-ui, sans-serif'` for consistent rendering
- CSS overrides in src/styles/index.css prevent SVG text clipping

**Error Component:**

- Displays red error box with AlertCircle icon for invalid Mermaid syntax
- Error message uses inline styles for guaranteed text wrapping (`wordBreak`, `overflowWrap`, `whiteSpace`)
- Collapsible `<details>` section shows raw diagram code for debugging
- Styled to match app's design system (zinc colors, rounded corners)
- DOM cleanup removes Mermaid's error footer ("Syntax error in text mermaid version X.X.X") from page bottom

## Key Technical Details

### Project Origin

- Generated from Figma Make (design-to-code tool)
- Explains why there are 48+ UI components in src/app/components/ui/, most unused
- These are shadcn/ui components (MIT licensed) from the generation template

### Tailwind CSS v4 Usage

- Uses newer syntax: `@source`, `@theme inline`, `@custom-variant`
- Different from Tailwind v3 - config is in CSS files, not tailwind.config.js
- Main config in src/styles/tailwind.css

### Component Patterns

- `cn()` utility (src/app/components/ui/utils.ts) combines clsx + tailwind-merge
- Used throughout UI components for conditional className merging
- Pattern: `className={cn("base-classes", conditionalClasses, className)}`

### Browser Compatibility

- File System Access API only works in Chrome/Edge 86+, not Safari/Firefox
- App gracefully degrades to legacy file input mode
- Test modern features with: `if ('showOpenFilePicker' in window)`

### Missing Configurations

- No tsconfig.json (TypeScript files present but no config)
- No ESLint or Prettier setup
- No testing framework configured
- Consider adding these for better developer experience

### File Organization

- `src/main.tsx` - Entry point
- `src/app/App.tsx` - Main component (395 lines, file handling, state management, UI layout)
- `src/app/components/MarkdownViewer.tsx` - Pure presentational component for rendering markdown
- `src/app/components/MermaidDiagram.tsx` - Mermaid diagram renderer with theme support
- `src/app/components/ThemeToggle.tsx` - Theme switcher component
- `src/app/components/ThemedToaster.tsx` - Toast notifications with theme sync
- `src/app/components/ui/` - shadcn/ui components (mostly unused boilerplate)
- `src/styles/` - Tailwind v4 config and theme variables
