import type { FileHandle, FileMetadata, IFileProvider, IFileWatcher } from '@mdviewer/core';
import type { FileChangedPayload } from '../shared/types';

export class RendererFileProvider implements IFileProvider {
  async openFilePicker(): Promise<FileMetadata | null> {
    const result = await window.electronAPI.openFilePicker();
    if (!result) return null;
    return {
      name: result.name,
      path: result.filePath,
      handle: result.filePath,
    };
  }

  async readFile(handle: FileHandle): Promise<string> {
    return window.electronAPI.readFile(handle as string);
  }

  supportsWatching(): boolean {
    return true;
  }

  async getFileMetadata(
    handle: FileHandle
  ): Promise<{ name: string; path?: string; lastModified?: number }> {
    const filePath = handle as string;
    const name = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? filePath;
    return { name, path: filePath };
  }

  async isFileAccessible(handle: FileHandle): Promise<boolean> {
    try {
      await window.electronAPI.readFile(handle as string);
      return true;
    } catch {
      return false;
    }
  }
}

export class RendererFileWatcher implements IFileWatcher {
  private activeHandles = new Set<string>();
  private ipcCleanup: (() => void) | null = null;
  private currentCallback: ((content: string, metadata: { lastModified: number }) => void) | null =
    null;

  watch(
    handle: FileHandle,
    onChanged: (content: string, metadata: { lastModified: number }) => void,
    _options?: { debounceMs?: number; pollInterval?: number }
  ): () => void {
    const filePath = handle as string;
    this.activeHandles.add(filePath);
    this.currentCallback = onChanged;
    window.electronAPI.watchFile(filePath);

    // Register the IPC listener once; reuse across watch() calls
    if (!this.ipcCleanup) {
      this.ipcCleanup = window.electronAPI.onFileChanged((data: FileChangedPayload) => {
        this.currentCallback?.(data.content, { lastModified: data.lastModified });
      });
    }

    return () => {
      window.electronAPI.unwatchFile(filePath);
      this.activeHandles.delete(filePath);
      if (this.activeHandles.size === 0 && this.ipcCleanup) {
        this.ipcCleanup();
        this.ipcCleanup = null;
        this.currentCallback = null;
      }
    };
  }

  isWatching(handle: FileHandle): boolean {
    return this.activeHandles.has(handle as string);
  }
}
