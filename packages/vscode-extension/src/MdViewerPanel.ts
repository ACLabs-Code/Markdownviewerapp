import * as vscode from 'vscode';
import * as path from 'path';
import { VSCodeFileWatcher } from '@mdviewer/platform-adapters-vscode';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './webview/types';

export class MdViewerPanel {
  public static readonly viewType = 'mdviewer.panel';
  public static instance: MdViewerPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _currentDocumentUri: vscode.Uri | undefined;
  private _unwatchCurrent: (() => void) | undefined;
  private readonly _fileWatcher: VSCodeFileWatcher;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._fileWatcher = new VSCodeFileWatcher();

    this._panel.webview.html = this._buildHtml();

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => this._handleWebviewMessage(message),
      undefined,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), undefined, this._disposables);

    // Re-send content when the panel tab becomes visible again
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible && this._currentDocumentUri) {
          void this._sendCurrentContent();
        }
      },
      undefined,
      this._disposables
    );

    // Sync theme when VS Code's color theme changes
    vscode.window.onDidChangeActiveColorTheme(
      () => {
        this._postMessage({ type: 'themeChange', theme: this._resolveTheme() });
      },
      undefined,
      this._disposables
    );
  }

  // ─── Static factory ───────────────────────────────────────────────────────

  public static createOrShow(context: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (MdViewerPanel.instance) {
      MdViewerPanel.instance._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(MdViewerPanel.viewType, 'MD Viewer', column, {
      enableScripts: true,
      // Keeps React state alive when the user switches away from the panel tab.
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'dist'),
        vscode.Uri.joinPath(context.extensionUri, 'assets'),
      ],
    });

    MdViewerPanel.instance = new MdViewerPanel(panel, context);
  }

  public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
    MdViewerPanel.instance = new MdViewerPanel(panel, context);
  }

  // ─── Public API (called from extension.ts) ────────────────────────────────

  public loadDocument(document: vscode.TextDocument): void {
    const uri = document.uri;
    const isSameFile = this._currentDocumentUri?.toString() === uri.toString();

    if (!isSameFile) {
      this._stopWatching();
      this._currentDocumentUri = uri;
      this._panel.title = `MD Viewer — ${path.basename(uri.fsPath)}`;
    }

    this._postMessage({
      type: 'contentUpdate',
      content: document.getText(),
      fileName: path.basename(uri.fsPath),
      filePath: uri.fsPath,
      isWatching: true,
    });

    if (!isSameFile) {
      this._startWatching(uri);
    }
  }

  public onDocumentChange(document: vscode.TextDocument): void {
    if (this._currentDocumentUri?.toString() !== document.uri.toString()) return;
    this._postMessage({
      type: 'contentUpdate',
      content: document.getText(),
      fileName: path.basename(document.uri.fsPath),
      filePath: document.uri.fsPath,
      isWatching: true,
    });
  }

  public dispose(): void {
    MdViewerPanel.instance = undefined;
    this._stopWatching();
    this._panel.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
    this._disposables = [];
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _startWatching(uri: vscode.Uri): void {
    this._unwatchCurrent = this._fileWatcher.watch(
      uri as any,
      (_content: string, _metadata: { lastModified: number }) => {
        // Guard: if VS Code has this document open, onDidChangeTextDocument already
        // notified us — skip to avoid sending duplicate updates.
        const openDoc = vscode.workspace.textDocuments.find(
          (d) => d.uri.toString() === uri.toString()
        );
        if (openDoc) return;

        void this._sendCurrentContent();
      },
      { debounceMs: 300 }
    );
  }

  private _stopWatching(): void {
    this._unwatchCurrent?.();
    this._unwatchCurrent = undefined;
  }

  private async _sendCurrentContent(): Promise<void> {
    if (!this._currentDocumentUri) return;

    // Prefer in-memory version (captures unsaved edits)
    const openDoc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === this._currentDocumentUri?.toString()
    );
    if (openDoc) {
      this.loadDocument(openDoc);
      return;
    }

    // Fallback: read from disk
    try {
      const buffer = await vscode.workspace.fs.readFile(this._currentDocumentUri);
      const content = new TextDecoder().decode(buffer);
      this._postMessage({
        type: 'contentUpdate',
        content,
        fileName: path.basename(this._currentDocumentUri.fsPath),
        filePath: this._currentDocumentUri.fsPath,
        isWatching: true,
      });
    } catch {
      // File may have been deleted — ignore
    }
  }

  private _handleWebviewMessage(message: WebviewToExtensionMessage): void {
    switch (message.type) {
      case 'ready':
        // Webview React app has mounted — send current content and theme
        if (this._currentDocumentUri) {
          void this._sendCurrentContent();
        }
        this._postMessage({ type: 'themeChange', theme: this._resolveTheme() });
        break;

      case 'openFilePicker':
        void this._openFilePicker();
        break;
    }
  }

  private async _openFilePicker(): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { 'Markdown Files': ['md', 'markdown', 'txt'] },
    });
    if (!uris || uris.length === 0) return;

    const doc = await vscode.workspace.openTextDocument(uris[0]);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    this.loadDocument(doc);
  }

  private _postMessage(message: ExtensionToWebviewMessage): void {
    void this._panel.webview.postMessage(message);
  }

  private _resolveTheme(): 'light' | 'dark' {
    const kind = vscode.window.activeColorTheme.kind;
    return kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast
      ? 'dark'
      : 'light';
  }

  private _buildHtml(): string {
    const webview = this._panel.webview;

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview.css')
    );

    const nonce = this._generateNonce();

    // CSP notes:
    // - script-src uses nonce to allow only our bundled webview.js
    // - style-src allows 'unsafe-inline' because Mermaid injects <style> tags into its SVG output
    // - img-src allows data: (Mermaid SVG icons) and https: (remote images in markdown)
    const csp = [
      `default-src 'none'`,
      `script-src 'nonce-${nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data: https:`,
      `font-src ${webview.cspSource} data:`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>MD Viewer</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }
}
