import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, FileChangedPayload, OpenFileResult } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  openFilePicker: (): Promise<OpenFileResult | null> => ipcRenderer.invoke('dialog:openFile'),

  readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:readFile', filePath),

  watchFile: (filePath: string): void => {
    ipcRenderer.send('watch:start', filePath);
  },

  unwatchFile: (filePath: string): void => {
    ipcRenderer.send('watch:stop', filePath);
  },

  onFileChanged: (callback: (data: FileChangedPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: FileChangedPayload) => {
      callback(data);
    };
    ipcRenderer.on('file:changed', handler);
    return () => {
      ipcRenderer.removeListener('file:changed', handler);
    };
  },

  onMenuOpenFile: (callback: (result: OpenFileResult) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: OpenFileResult) => {
      callback(data);
    };
    ipcRenderer.on('menu:openFile', handler);
    return () => {
      ipcRenderer.removeListener('menu:openFile', handler);
    };
  },

  platform: process.platform,
} satisfies ElectronAPI);
