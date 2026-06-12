const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// Configure Electron autoUpdater behavior
autoUpdater.autoDownload = false;
autoUpdater.logger = console;

try {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'rommel-exe',
    repo: 'Student-Productivity'
  });
} catch (e) {
  console.error("Failed to set active updater FeedURL:", e);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Frameless design option typical of premium macOS/Windows builds
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0d0e',
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    // If running in development inside our workspace
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Register updater forwarding events once window is ready
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'checking-for-update');
  });
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'update-available', info);
  });
  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'update-not-available', info);
  });
  autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'error', err instanceof Error ? err.message : String(err));
  });
  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'download-progress', progressObj);
  });
  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('updater-event', 'update-downloaded', info);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock to prevent duplicate windows launching
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler hooks for desktop actions and updater manifests
ipcMain.handle('get-app-version', () => {
  return app.getVersion() || "0.0.18";
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-external-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (err) {
    console.error("Failed to open URL in external browser:", err);
    return false;
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Electron Authorized Auto-Updater IPC interfaces
ipcMain.handle('electron-check-for-updates', async () => {
  try {
    if (!app.isPackaged) {
      // High-fidelity local simulation for development testing
      return { 
        available: true, 
        version: "0.0.19", 
        notes: "Premium Development Simulation: The Electron system architecture is fully integrated. This manifest was retrieved and validated by the Electron mainframe process.",
        simulated: true 
      };
    }
    const updateCheckResult = await autoUpdater.checkForUpdates();
    const updateInfo = updateCheckResult ? updateCheckResult.updateInfo : null;
    const currentVersion = app.getVersion();
    const isNewer = updateInfo && updateInfo.version !== currentVersion;
    
    return {
      available: !!isNewer,
      version: updateInfo ? updateInfo.version : "latest",
      notes: updateInfo ? (typeof updateInfo.releaseNotes === "string" ? updateInfo.releaseNotes : "New Release") : "",
    };
  } catch (error) {
    console.error("Electron updater check failed, falling back to local fallback:", error);
    return {
      available: false,
      error: error.message || String(error)
    };
  }
});

ipcMain.handle('electron-download-update', async () => {
  try {
    if (!app.isPackaged) {
      // High-fidelity progress simulator sending actual renderer IPC callbacks
      for (let i = 20; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 250));
        if (mainWindow) {
          mainWindow.webContents.send('updater-event', 'download-progress', { percent: i });
        }
      }
      if (mainWindow) {
        mainWindow.webContents.send('updater-event', 'update-downloaded', { version: "0.0.19" });
      }
      return { success: true };
    }
    const result = await autoUpdater.downloadUpdate();
    return { success: true, result };
  } catch (error) {
    console.error("Electron download update failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('electron-install-update', () => {
  try {
    if (!app.isPackaged) {
      app.relaunch();
      app.exit(0);
      return { success: true };
    }
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

