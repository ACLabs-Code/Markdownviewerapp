// Shared message protocol between extension host and webview.
// No runtime imports — types only.

// ─── Extension → Webview ──────────────────────────────────────────────────────

export type ExtensionToWebviewMessage = ContentUpdateMessage | ThemeChangeMessage;

export interface ContentUpdateMessage {
  type: 'contentUpdate';
  content: string;
  fileName: string;
  filePath: string;
  isWatching: boolean;
}

export interface ThemeChangeMessage {
  type: 'themeChange';
  theme: 'light' | 'dark';
}

// ─── Webview → Extension ──────────────────────────────────────────────────────

export type WebviewToExtensionMessage = ReadyMessage | OpenFilePickerMessage;

export interface ReadyMessage {
  type: 'ready';
}

export interface OpenFilePickerMessage {
  type: 'openFilePicker';
}
