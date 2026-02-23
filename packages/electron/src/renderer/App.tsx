import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { FileText, Upload, RefreshCw, Eye, EyeOff, Github, FileCode } from 'lucide-react';
import { MarkdownViewer, ThemeToggle, ThemedToaster } from '@mdviewer/core';
import type { FileHandle } from '@mdviewer/core';
import { RendererFileProvider, RendererFileWatcher } from './fileAdapter';
import type { OpenFileResult } from '../shared/types';

// Module-level singletons — stateless, safe to share across renders
const fileProvider = new RendererFileProvider();
const fileWatcher = new RendererFileWatcher();

function isValidMarkdownFile(name: string): boolean {
  return /\.(md|markdown|txt)$/i.test(name);
}

export default function App() {
  const [markdownContent, setMarkdownContent] = useState<string>(
    '# Welcome to MD Viewer\n\nClick "Open File" or use **File → Open** to load a markdown file from your computer.'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<FileHandle | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Auto-reload: RendererFileWatcher.watch() → chokidar in main process via IPC
  useEffect(() => {
    if (!isWatching || !fileHandle) return;
    const unwatch = fileWatcher.watch(fileHandle, (content) => {
      setMarkdownContent(content);
      toast.success('File updated automatically');
    });
    return unwatch;
  }, [isWatching, fileHandle]);

  // Listen for File > Open menu events pushed from the main process
  useEffect(() => {
    const unsubscribe = window.electronAPI.onMenuOpenFile((result: OpenFileResult) => {
      void loadFile(result.filePath, result.name);
    });
    return unsubscribe;
  }, []);

  async function loadFile(filePath: string, name: string): Promise<void> {
    setIsLoading(true);
    try {
      const content = await fileProvider.readFile(filePath);
      setFileHandle(filePath);
      setFileName(name);
      setMarkdownContent(content);
      setIsWatching(true);
      toast.success(`Opened ${name}`);
    } catch {
      toast.error('Failed to open file');
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenFile = async () => {
    try {
      const metadata = await fileProvider.openFilePicker();
      if (!metadata) return;
      await loadFile(metadata.handle as string, metadata.name);
    } catch {
      toast.error('Failed to open file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!isValidMarkdownFile(file.name)) {
      toast.error('Please drop a Markdown file (.md, .markdown, .txt)');
      return;
    }

    // Electron exposes .path on File objects in the renderer process
    const filePath = (file as any).path as string | undefined;
    if (filePath) {
      await loadFile(filePath, file.name);
    } else {
      // Fallback: read via FileReader (no auto-reload)
      try {
        setIsLoading(true);
        const text = await file.text();
        setFileName(file.name);
        setMarkdownContent(text);
        setFileHandle(null);
        setIsWatching(false);
        toast.success(`Opened ${file.name}`);
        toast.info('Auto-reload unavailable — file path not accessible');
      } catch {
        toast.error('Failed to read file');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleManualReload = async () => {
    if (!fileHandle) return;
    try {
      setIsLoading(true);
      const content = await fileProvider.readFile(fileHandle);
      setMarkdownContent(content);
      toast.success('Reloaded successfully');
    } catch {
      toast.error('Failed to reload. Try opening the file again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatch = () => {
    if (!fileHandle) return;
    const next = !isWatching;
    setIsWatching(next);
    toast.info(next ? 'Watch mode enabled' : 'Watch mode disabled');
  };

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TS2322 -- next-themes@0.4.6 + TypeScript 5.9 children typing issue
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div
        className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ThemedToaster />

        {/* Drag Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all duration-300">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce border-4 border-dashed border-blue-500">
              <Upload size={64} className="text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-white">
                Drop file to open
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">Release to view Markdown</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-1.5 rounded-lg transition-colors duration-300">
                <FileCode size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">MD Viewer</h1>
              {fileName && (
                <div className="flex items-center">
                  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700 mx-2">/</span>
                  <span
                    className="font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-[300px]"
                    title={fileName}
                  >
                    {fileName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {fileName && (
                <>
                  <button
                    onClick={toggleWatch}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isWatching
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    title={isWatching ? 'Stop watching for changes' : 'Watch for changes'}
                  >
                    {isWatching ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="hidden md:inline">
                      {isWatching ? 'Watching' : 'Watch Mode'}
                    </span>
                  </button>

                  <button
                    onClick={handleManualReload}
                    className="p-2 transition-colors rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Reload file"
                  >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </>
              )}

              <button
                onClick={handleOpenFile}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95 text-sm sm:text-base"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Open File</span>
                <span className="sm:hidden">Open</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {!fileName ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-inner">
                <FileText size={48} className="text-zinc-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                  No file loaded
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-md mt-2 mx-auto">
                  Open a local markdown file to start viewing. Changes you make locally will update
                  here automatically.
                </p>
              </div>
              <button
                onClick={handleOpenFile}
                className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-6 py-3 rounded-xl font-medium transition-all transform hover:-translate-y-1"
              >
                <Upload size={20} />
                Browse Files
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <MarkdownViewer content={markdownContent} />
            </div>
          )}
        </main>

        <footer className="py-6 text-center text-zinc-400 text-sm border-t border-zinc-200 dark:border-zinc-800 mt-auto bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Github size={16} />
            <span>GitHub Flavored Markdown Supported</span>
          </div>
          <p>Made with ❤️ by AC Labs</p>
        </footer>
      </div>
    </ThemeProvider>
  );
}
