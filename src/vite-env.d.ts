/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    windowControls: (action: 'minimize' | 'maximize' | 'close') => void;
    printReceipt: (data: any) => Promise<any>;
    saveBackup: (data: any) => void;
    onTriggerBackup: (callback: () => void) => void;
  }
}
