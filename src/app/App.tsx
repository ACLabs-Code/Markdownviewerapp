import React, { useState, useEffect, useRef } from 'react';
import { MarkdownViewer } from './components/MarkdownViewer';
import { FileText, Upload, RefreshCw, Eye, EyeOff, Github, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemedToaster } from './components/ThemedToaster';

export default function App() {
  const [markdownContent, setMarkdownContent] = useState<string>('# Welcome to Markdown Viewer\n\nClick "Open File" to load a markdown file from your computer.');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHandle, setFileHandle] = useState<any>(null); // FileSystemFileHandle
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLegacyMode, setIsLegacyMode] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs to avoid restarting the interval constantly
  const lastModifiedRef = useRef<number>(0);
  const fileHandleRef = useRef<any>(null);

  // Sync state to ref
  useEffect(() => {
    fileHandleRef.current = fileHandle;
  }, [fileHandle]);

  // Poll for file changes
  useEffect(() => {
    let intervalId: any;

    if (isWatching && fileHandle && !isLegacyMode) {
      // toast.info('Auto-watch started');
      intervalId = setInterval(async () => {
        try {
          if (!fileHandleRef.current) return;
          
          const file = await fileHandleRef.current.getFile();
          if (file.lastModified > lastModifiedRef.current) {
            console.log('File changed, reloading...');
            const text = await file.text();
            setMarkdownContent(text);
            lastModifiedRef.current = file.lastModified;
            toast.success('File updated automatically');
          }
        } catch (error) {
          console.error('Error polling file:', error);
          // Don't stop watching immediately on transient errors, but maybe log it
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isWatching, fileHandle, isLegacyMode]);

  const handleOpenFile = async () => {
    try {
      // Check if API exists
      if (!('showOpenFilePicker' in window)) {
        throw new Error('FileSystemAccess API not supported');
      }

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

      setFileHandle(handle);
      setIsLegacyMode(false);
      setIsLoading(true);

      const file = await handle.getFile();
      const text = await file.text();

      setFileName(file.name);
      setMarkdownContent(text);
      lastModifiedRef.current = file.lastModified;
      
      setIsWatching(true); // Auto-enable watch on open
      setIsLoading(false);
      toast.success(`Opened ${file.name}`);

    } catch (error: any) {
      // AbortError means user cancelled the picker
      if (error.name === 'AbortError') return;

      console.warn('Falling back to legacy file input due to:', error);
      // Fallback to hidden input click
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleLegacyFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      setFileName(file.name);
      setMarkdownContent(text);
      setFileHandle(null);
      setIsLegacyMode(true);
      setIsWatching(false);
      setIsLoading(false);
      toast.success(`Opened ${file.name} (Read-only mode)`);
      toast.info('Auto-reload is unavailable in this environment');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
      setIsLoading(false);
    }
    // Reset value so we can select the same file again if needed
    event.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're actually leaving the window or just moving over a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Try to get file handle via experimental API for watching support
    const items = e.dataTransfer.items;
    let handled = false;

    if (items && items.length > 0) {
      const item = items[0];
      if (item.kind === 'file' && 'getAsFileSystemHandle' in item) {
        try {
          const handle = await (item as any).getAsFileSystemHandle();
          if (handle && handle.kind === 'file') {
            const file = await handle.getFile();
            
            // Check extension
            if (!file.name.toLowerCase().match(/\.(md|markdown|txt)$/)) {
               toast.error('Please drop a Markdown file (.md, .markdown, .txt)');
               return;
            }

            setFileHandle(handle);
            setIsLegacyMode(false);
            setIsLoading(true);

            const text = await file.text();
            setFileName(file.name);
            setMarkdownContent(text);
            lastModifiedRef.current = file.lastModified;
            
            setIsWatching(true);
            setIsLoading(false);
            toast.success(`Opened ${file.name}`);
            handled = true;
          }
        } catch (err) {
          console.warn('Failed to get file handle from drop, falling back to legacy', err);
        }
      }
    }

    if (handled) return;

    // Fallback to standard File API (Read-only)
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (!file.name.toLowerCase().match(/\.(md|markdown|txt)$/)) {
          toast.error('Please drop a Markdown file (.md, .markdown, .txt)');
          return;
      }

      try {
        setIsLoading(true);
        const text = await file.text();
        setFileName(file.name);
        setMarkdownContent(text);
        setFileHandle(null);
        setIsLegacyMode(true);
        setIsWatching(false);
        setIsLoading(false);
        toast.success(`Opened ${file.name} (Read-only mode)`);
        toast.info('Auto-reload is unavailable for dropped files in this browser');
      } catch (error) {
        console.error('Error reading dropped file:', error);
        toast.error('Failed to read file');
        setIsLoading(false);
      }
    }
  };

  const handleManualReload = async () => {
    if (isLegacyMode) {
       toast.info('Please open the file again to reload changes.');
       return;
    }

    if (!fileHandle) return;

    try {
      setIsLoading(true);
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      setMarkdownContent(text);
      lastModifiedRef.current = file.lastModified;
      
      setIsLoading(false);
      toast.success('Reloaded successfully');
    } catch (error) {
      console.error('Error reloading:', error);
      toast.error('Failed to reload. Try opening the file again.');
      setIsLoading(false);
    }
  };

  const toggleWatch = () => {
    if (isLegacyMode) {
      toast.error('Auto-watch is unavailable in this environment');
      return;
    }
    if (!fileHandle) return;
    setIsWatching(!isWatching);
    if (!isWatching) {
        toast.info('Watch mode enabled');
    } else {
        toast.info('Watch mode disabled');
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div 
        className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <ThemedToaster />
        
        {/* Drag Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all duration-300">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce border-4 border-dashed border-blue-500">
              <Upload size={64} className="text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-white">Drop file to open</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">Release to view Markdown</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLegacyFileSelect}
          accept=".md,.markdown,.txt"
          className="hidden"
        />
        
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
                  <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-[300px]" title={fileName}>
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
                    disabled={isLegacyMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isLegacyMode
                        ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                        : isWatching 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    title={isLegacyMode ? "Auto-watch unavailable in this environment" : (isWatching ? "Stop watching for changes" : "Watch for changes")}
                  >
                    {isWatching ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="hidden md:inline">{isWatching ? 'Watching' : 'Watch Mode'}</span>
                  </button>

                  <button
                    onClick={handleManualReload}
                    disabled={isLegacyMode}
                    className={`p-2 transition-colors rounded-full ${
                      isLegacyMode 
                        ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' 
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={isLegacyMode ? "Reload unavailable" : "Reload file"}
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
                  <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">No file loaded</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-md mt-2 mx-auto">
                    Open a local markdown file to start viewing. Changes you make locally will update here automatically.
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
