import type { FileHandle, FileMetadata, IFileProvider, IFileWatcher } from '@mdviewer/core';

// ─── WebFileProvider ────────────────────────────────────────────────────────

export class WebFileProvider implements IFileProvider {
  async openFilePicker(): Promise<FileMetadata | null> {
    if (!('showOpenFilePicker' in window)) {
      throw new Error('FileSystemAccess API not supported');
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Markdown Files',
            accept: {
              'text/markdown': ['.md', '.markdown'],
              'text/plain': ['.txt'],
            },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      return { name: file.name, handle };
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      throw error;
    }
  }

  async readFile(handle: FileHandle): Promise<string> {
    const file = await (handle as FileSystemFileHandle).getFile();
    return file.text();
  }

  supportsWatching(): boolean {
    return 'showOpenFilePicker' in window;
  }

  async getFileMetadata(
    handle: FileHandle
  ): Promise<{ name: string; path?: string; lastModified?: number }> {
    const file = await (handle as FileSystemFileHandle).getFile();
    return { name: file.name, lastModified: file.lastModified };
  }

  async isFileAccessible(handle: FileHandle): Promise<boolean> {
    try {
      await (handle as FileSystemFileHandle).getFile();
      return true;
    } catch {
      return false;
    }
  }
}

// ─── WebFileWatcher ─────────────────────────────────────────────────────────

type WatcherEntry = { intervalId: ReturnType<typeof setInterval>; lastModified: number };

export class WebFileWatcher implements IFileWatcher {
  private watchers = new Map<FileHandle, WatcherEntry>();

  watch(
    handle: FileHandle,
    onChanged: (content: string, metadata: { lastModified: number }) => void,
    options?: { pollInterval?: number }
  ): () => void {
    const pollInterval = options?.pollInterval ?? 1000;
    let lastModified = 0;

    const intervalId = setInterval(async () => {
      try {
        if (!this.watchers.has(handle)) return;
        const file = await (handle as FileSystemFileHandle).getFile();
        if (file.lastModified > lastModified) {
          lastModified = file.lastModified;
          const content = await file.text();
          onChanged(content, { lastModified });
        }
      } catch (error) {
        console.error('Error polling file:', error);
      }
    }, pollInterval);

    this.watchers.set(handle, { intervalId, lastModified });

    return () => {
      clearInterval(intervalId);
      this.watchers.delete(handle);
    };
  }

  isWatching(handle: FileHandle): boolean {
    return this.watchers.has(handle);
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window;
}
