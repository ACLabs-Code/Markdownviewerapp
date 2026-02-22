/**
 * Platform abstraction types for file handling across web, Electron, and VSCode.
 * These interfaces will be implemented in Phase 3 by platform-adapters package.
 */

/**
 * Metadata about an opened file
 */
export interface FileMetadata {
  name: string;
  path?: string;
  handle: FileHandle;
}

/**
 * Platform-specific file handle
 * - Web: FileSystemFileHandle (File System Access API)
 * - Electron: string (file path)
 * - VSCode: vscode.Uri
 */
export type FileHandle = FileSystemFileHandle | string | unknown;

/**
 * File provider interface - implemented per platform
 */
export interface IFileProvider {
  /**
   * Open file picker dialog
   * @returns FileMetadata if file selected, null if cancelled
   */
  openFilePicker(): Promise<FileMetadata | null>;

  /**
   * Read file contents
   * @param handle - Platform-specific file handle
   * @returns File contents as string
   */
  readFile(handle: FileHandle): Promise<string>;

  /**
   * Check if platform supports file watching
   */
  supportsWatching(): boolean;
}

/**
 * File watcher interface - implemented per platform
 */
export interface IFileWatcher {
  /**
   * Watch a file for changes
   * @param handle - Platform-specific file handle
   * @param onChanged - Callback when file changes (receives new content)
   * @returns Cleanup function to stop watching
   */
  watch(handle: FileHandle, onChanged: (content: string) => void): () => void;
}
