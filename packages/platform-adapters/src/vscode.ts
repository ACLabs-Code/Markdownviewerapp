// NOTE: This file is excluded from the platform-adapters tsconfig.
// It will be compiled as part of the packages/vscode-extension build in Phase 8.
// Requires: vscode (available only in extension host context)

import type { FileHandle, FileMetadata, IFileProvider, IFileWatcher } from '@mdviewer/core';

// ─── VSCodeFileProvider ──────────────────────────────────────────────────────

export class VSCodeFileProvider implements IFileProvider {
  async openFilePicker(): Promise<FileMetadata | null> {
    const vscode = await import('vscode');
    const uri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { 'Markdown Files': ['md', 'markdown', 'txt'] },
    });

    if (!uri || uri.length === 0) return null;

    const fileUri = uri[0];
    const { basename } = await import('path');
    return {
      name: basename(fileUri.fsPath),
      path: fileUri.fsPath,
      handle: fileUri,
    };
  }

  async readFile(handle: FileHandle): Promise<string> {
    const vscode = await import('vscode');
    const buffer = await vscode.workspace.fs.readFile(handle as any);
    return new TextDecoder().decode(buffer);
  }

  supportsWatching(): boolean {
    return true;
  }

  async getFileMetadata(
    handle: FileHandle
  ): Promise<{ name: string; path?: string; lastModified?: number }> {
    const vscode = await import('vscode');
    const { basename } = await import('path');
    const fileUri = handle as any;
    const stats = await vscode.workspace.fs.stat(fileUri);
    return {
      name: basename(fileUri.fsPath),
      path: fileUri.fsPath,
      lastModified: stats.mtime,
    };
  }

  async isFileAccessible(handle: FileHandle): Promise<boolean> {
    try {
      const vscode = await import('vscode');
      await vscode.workspace.fs.stat(handle as any);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── VSCodeFileWatcher ───────────────────────────────────────────────────────

export class VSCodeFileWatcher implements IFileWatcher {
  private watchers = new Map<
    string,
    { watcher: any; timer: ReturnType<typeof setTimeout> | null }
  >();

  watch(
    handle: FileHandle,
    onChanged: (content: string, metadata: { lastModified: number }) => void,
    options?: { debounceMs?: number }
  ): () => void {
    const fileUri = handle as any;
    const filePath = fileUri.fsPath as string;
    const debounceMs = options?.debounceMs ?? 300;
    let timer: ReturnType<typeof setTimeout> | null = null;

    import('vscode').then((vscode) => {
      const fileWatcher = vscode.workspace.createFileSystemWatcher(filePath);

      const handleChange = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            const buffer = await vscode.workspace.fs.readFile(fileUri);
            const stats = await vscode.workspace.fs.stat(fileUri);
            const content = new TextDecoder().decode(buffer);
            onChanged(content, { lastModified: stats.mtime });
          } catch (error) {
            console.error('Error reading changed file:', error);
          }
        }, debounceMs);
      };

      fileWatcher.onDidChange(handleChange);
      this.watchers.set(filePath, { watcher: fileWatcher, timer });
    });

    return () => {
      if (timer) clearTimeout(timer);
      const entry = this.watchers.get(filePath);
      if (entry) {
        entry.watcher?.dispose();
        this.watchers.delete(filePath);
      }
    };
  }

  isWatching(handle: FileHandle): boolean {
    return this.watchers.has((handle as any).fsPath);
  }
}
