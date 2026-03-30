import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.maximize();
  mainWindow.show();

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  ipcMain.on('window-controls', (_event, action) => {
    switch (action) {
      case 'minimize':
        mainWindow?.minimize();
        break;
      case 'maximize':
        if (mainWindow?.isMaximized()) {
          mainWindow?.unmaximize();
        } else {
          mainWindow?.maximize();
        }
        break;
      case 'close':
        mainWindow?.close();
        break;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // TODO: Implement auto-backup logic here
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
