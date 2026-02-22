// NOTE: This file is excluded from the platform-adapters tsconfig.
// It will be compiled as part of the packages/electron build in Phase 7.
// Requires: electron (ipcRenderer), fs/promises, path, chokidar

import type { FileHandle, FileMetadata, IFileProvider, IFileWatcher } from '@mdviewer/core';

// ─── ElectronFileProvider ────────────────────────────────────────────────────

export class ElectronFileProvider implements IFileProvider {
  async openFilePicker(): Promise<FileMetadata | null> {
    // Calls main process via IPC — main process uses Electron dialog.showOpenDialog
    const { ipcRenderer } = await import('electron');
    const result = await ipcRenderer.invoke('dialog:openFile', {
      properties: ['openFile'],
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }],
    }) as { filePath?: string };

    if (!result?.filePath) return null;

    const { basename } = await import('path');
    return {
      name: basename(result.filePath),
      path: result.filePath,
      handle: result.filePath,
    };
  }

  async readFile(handle: FileHandle): Promise<string> {
    const { readFile } = await import('fs/promises');
    return readFile(handle as string, 'utf-8');
  }

  supportsWatching(): boolean {
    return true;
  }

  async getFileMetadata(handle: FileHandle): Promise<{ name: string; path?: string; lastModified?: number }> {
    const { stat } = await import('fs/promises');
    const { basename } = await import('path');
    const filePath = handle as string;
    const stats = await stat(filePath);
    return { name: basename(filePath), path: filePath, lastModified: stats.mtimeMs };
  }

  async isFileAccessible(handle: FileHandle): Promise<boolean> {
    try {
      const { access } = await import('fs/promises');
      await access(handle as string);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── ElectronFileWatcher ─────────────────────────────────────────────────────

export class ElectronFileWatcher implements IFileWatcher {
  private watchers = new Map<string, { watcher: any; timer: ReturnType<typeof setTimeout> | null }>();

  watch(
    handle: FileHandle,
    onChanged: (content: string, metadata: { lastModified: number }) => void,
    options?: { debounceMs?: number }
  ): () => void {
    const filePath = handle as string;
    const debounceMs = options?.debounceMs ?? 300;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // chokidar watches for OS-level file system events (instant, vs 1s polling)
    import('chokidar').then(({ watch }) => {
      const watcher = watch(filePath, {
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 },
      });

      const handleChange = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            const { readFile, stat } = await import('fs/promises');
            const [content, stats] = await Promise.all([
              readFile(filePath, 'utf-8'),
              stat(filePath),
            ]);
            onChanged(content, { lastModified: stats.mtimeMs });
          } catch (error) {
            console.error('Error reading changed file:', error);
          }
        }, debounceMs);
      };

      watcher.on('change', handleChange);
      this.watchers.set(filePath, { watcher, timer });
    });

    return () => {
      if (timer) clearTimeout(timer);
      const entry = this.watchers.get(filePath);
      if (entry) {
        entry.watcher?.close();
        this.watchers.delete(filePath);
      }
    };
  }

  isWatching(handle: FileHandle): boolean {
    return this.watchers.has(handle as string);
  }
}
