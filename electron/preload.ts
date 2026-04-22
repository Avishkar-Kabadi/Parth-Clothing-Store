import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  windowControls: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.send('window-controls', action),
  printReceipt: (data: any) => ipcRenderer.invoke('print-receipt', data),
  saveBackup: (data: any) => ipcRenderer.send('save-backup', data),
  onTriggerBackup: (callback: () => void) => {
    ipcRenderer.on('trigger-backup', callback);
  }
});
