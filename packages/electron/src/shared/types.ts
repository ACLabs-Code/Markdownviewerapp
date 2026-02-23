// Shared types — no runtime imports, types only.
// Used by: src/main/preload.ts (implementation) and src/renderer/ (ambient window type).

export interface FileChangedPayload {
  content: string;
  lastModified: number;
}

export interface OpenFileResult {
  filePath: string;
  name: string;
}

export interface ElectronAPI {
  openFilePicker: () => Promise<OpenFileResult | null>;
  readFile: (filePath: string) => Promise<string>;
  watchFile: (filePath: string) => void;
  unwatchFile: (filePath: string) => void;
  onFileChanged: (callback: (data: FileChangedPayload) => void) => () => void;
  onMenuOpenFile: (callback: (result: OpenFileResult) => void) => () => void;
  platform: NodeJS.Platform;
}
