import electron from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
const { app, BrowserWindow, ipcMain } = electron || {};
import path from 'path';
console.log("RUNNING IN:", process.versions);
console.log("ELECTRON MODULE IS:", electron);
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindowType | null;
let isQuitting = false;

function createWindow() {
  // In packaged asar builds, asarUnpacked files live at app.asar.unpacked/
  const preloadPath = app.isPackaged
    ? path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'preload.cjs')
    : path.join(__dirname, 'preload.cjs');
  console.log('[Main] Preload path:', preloadPath);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    webPreferences: {
      preload: preloadPath,
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

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.webContents.send('trigger-backup');
      
      // Safety timeout: if renderer doesn't respond in 3 seconds, quit anyway
      setTimeout(() => {
        isQuitting = true;
        app.quit();
      }, 3000);
    }
  });
}

// Global IPC Listeners
ipcMain.on('window-controls', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  switch (action) {
    case 'minimize':
      win.minimize();
      break;
    case 'maximize':
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      break;
    case 'close':
      win.close();
      break;
  }
});

ipcMain.handle('print-receipt', async (_event, saleData: any) => {
  return new Promise((resolve) => {
    try {
      // Build receipt HTML
      const itemRows = saleData.items.map((item: any) =>
        `<tr>
          <td>${item.name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">Rs.${item.price.toFixed(2)}</td>
          <td style="text-align:right">Rs.${item.total.toFixed(2)}</td>
        </tr>`
      ).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 8px; margin: 0 auto; }
          h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin: 4px 0; }
          th { font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; }
          td { padding: 2px 0; font-size: 11px; }
          .totals td { padding: 1px 0; }
          .grand { font-size: 14px; font-weight: bold; }
          .right { text-align: right; }
          .thanks { text-align: center; margin-top: 10px; font-size: 13px; }
        </style>
      </head><body>
        <h1>PARTH CLOTHING STORE</h1>
        <p class="center" style="font-size:10px">Receipt #${saleData.id}</p>
        <div class="divider"></div>
        <p>Customer: ${saleData.customer_name}</p>
        <p>Phone: ${saleData.customer_phone || '-'}</p>
        <p>Date: ${new Date(saleData.timestamp).toLocaleString('en-IN')}</p>
        <div class="divider"></div>
        <table>
          <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="divider"></div>
        <table class="totals">
          <tr><td>Subtotal</td><td class="right">Rs.${saleData.subtotal.toFixed(2)}</td></tr>
          ${saleData.tax > 0 ? `<tr><td>Tax</td><td class="right">Rs.${saleData.tax.toFixed(2)}</td></tr>` : ''}
          <tr class="grand"><td>Grand Total</td><td class="right">Rs.${saleData.grand_total.toFixed(2)}</td></tr>
          <tr><td>Payment</td><td class="right">${saleData.payment_mode}</td></tr>
        </table>
        <div class="divider"></div>
        <p class="thanks">Thank you for shopping!</p>
      </body></html>`;

      const printWin = new BrowserWindow({
        show: true,
        x: -2000,
        y: -2000,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      });

      const tempPath = path.join(os.tmpdir(), `receipt_${saleData.id}.html`);
      fs.writeFileSync(tempPath, html);
      printWin.loadFile(tempPath);

      printWin.webContents.once('did-finish-load', () => {
        printWin.webContents.print(
          { silent: false, printBackground: true },
          (success, reason) => {
            printWin.destroy();
            try { fs.unlinkSync(tempPath); } catch (e) {}
            if (success) {
              console.log('[Print] Completed successfully');
              resolve({ success: true });
            } else {
              console.error('[Print] Failed:', reason);
              resolve({ success: false, error: reason });
            }
          }
        );
      });

      printWin.webContents.once('did-fail-load', (_e: any, code: any, desc: any) => {
        printWin.destroy();
        try { fs.unlinkSync(tempPath); } catch (e) {}
        console.error('[Print] Page load failed:', code, desc);
        resolve({ success: false, error: desc });
      });

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Print] Error:', msg);
      resolve({ success: false, error: msg });
    }
  });
});

ipcMain.on('save-backup', (_event, payload) => {
  const isManual = payload?.isManual || false;
  const jsonData = payload?.data || payload;
  try {
    const documentsPath = path.join(os.homedir(), 'Documents', 'backups');
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    const filePath = path.join(documentsPath, `ParthStore_Backup_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    if (!isManual) {
      isQuitting = true;
      app.quit();
    }
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
