const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkForUpdates: () => ipcRenderer.invoke('electron-check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('electron-download-update'),
  installUpdate: () => ipcRenderer.invoke('electron-install-update'),
  onUpdaterEvent: (callback) => {
    const listener = (event, type, data) => callback(type, data);
    ipcRenderer.on('updater-event', listener);
    return () => ipcRenderer.removeListener('updater-event', listener);
  }
});

