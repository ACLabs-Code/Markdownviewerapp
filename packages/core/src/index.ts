// Export all components
export { MarkdownViewer } from './components/MarkdownViewer';
export { MermaidDiagram } from './components/MermaidDiagram';
export { ThemeToggle } from './components/ThemeToggle';
export { ThemedToaster } from './components/ThemedToaster';

// Export platform abstraction types (for Phase 3)
export type { FileMetadata, FileHandle, IFileProvider, IFileWatcher } from './types/platform';

// Note: Styles should be imported separately in consuming packages:
// import '@mdviewer/core/styles'
