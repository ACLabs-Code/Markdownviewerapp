import * as vscode from 'vscode';
import { MdViewerPanel } from './MdViewerPanel';

export function activate(context: vscode.ExtensionContext): void {
  // ─── Command: Open blank panel ───────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('mdviewer.openPanel', () => {
      MdViewerPanel.createOrShow(context);
      // If a markdown file is already active, load it immediately
      const active = vscode.window.activeTextEditor;
      if (active && isMarkdownDocument(active.document)) {
        MdViewerPanel.instance?.loadDocument(active.document);
      }
    })
  );

  // ─── Command: Preview current file ──────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('mdviewer.openCurrentFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !isMarkdownDocument(editor.document)) {
        void vscode.window.showInformationMessage('MD Viewer: No active Markdown file.');
        return;
      }
      MdViewerPanel.createOrShow(context);
      MdViewerPanel.instance?.loadDocument(editor.document);
    })
  );

  // ─── Auto-update: switch active editor → update panel ───────────────────
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!MdViewerPanel.instance) return;
      if (editor && isMarkdownDocument(editor.document)) {
        MdViewerPanel.instance.loadDocument(editor.document);
      }
    })
  );

  // ─── Real-time: stream unsaved edits to the panel ───────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!MdViewerPanel.instance) return;
      if (!isMarkdownDocument(event.document)) return;
      MdViewerPanel.instance.onDocumentChange(event.document);
    })
  );

  // ─── Restore panel across window reloads ────────────────────────────────
  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(MdViewerPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        MdViewerPanel.revive(webviewPanel, context);
      },
    });
  }
}

export function deactivate(): void {
  // MdViewerPanel disposes itself via its onDidDispose handler
}

function isMarkdownDocument(doc: vscode.TextDocument): boolean {
  return doc.languageId === 'markdown' || /\.(md|markdown)$/i.test(doc.uri.fsPath);
}
