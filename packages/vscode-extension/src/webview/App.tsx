import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';
import { MarkdownViewer } from '@mdviewer/core';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types';

// VS Code injects acquireVsCodeApi() into the webview context.
// It must be called exactly once — calling it again throws.
declare function acquireVsCodeApi(): {
  postMessage: (message: WebviewToExtensionMessage) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
};

const vscodeApi = acquireVsCodeApi();

const WELCOME_CONTENT = `# MD Viewer

Open a Markdown file in VS Code to preview it here.

Switch between open **.md** files and this panel updates automatically.

Use **Cmd+Shift+M** (Ctrl+Shift+M on Windows/Linux) to open the preview for
the current file, or click the preview button in the editor title bar.
`;

export function App() {
  const [content, setContent] = useState<string>(WELCOME_CONTENT);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data as ExtensionToWebviewMessage;
    switch (message.type) {
      case 'contentUpdate':
        setContent(message.content);
        setFileName(message.fileName);
        setIsWatching(message.isWatching);
        break;
      case 'themeChange':
        setTheme(message.theme);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    // Signal to the extension host that we are mounted and ready for content.
    vscodeApi.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleOpenFile = useCallback(() => {
    vscodeApi.postMessage({ type: 'openFilePicker' });
  }, []);

  return (
    // ThemeProvider is required because MarkdownViewer → MermaidDiagram uses useTheme() internally.
    // forcedTheme pins the theme to VS Code's active color theme — the user controls it via VS Code settings.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TS2322 -- next-themes ThemeProvider typing issue (environment-dependent, same as web app)
    <ThemeProvider attribute="class" forcedTheme={theme} enableSystem={false}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
        {/* Minimal header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 h-12 flex items-center justify-between">
          <span className="font-medium text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
            {fileName ?? 'No file loaded'}
          </span>
          <div className="flex items-center gap-3">
            {isWatching && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                LIVE
              </span>
            )}
            <button
              onClick={handleOpenFile}
              className="text-xs px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Open File
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          <MarkdownViewer content={content} />
        </main>
      </div>
    </ThemeProvider>
  );
}
