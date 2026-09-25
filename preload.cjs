const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppRole: () => ipcRenderer.invoke('get-app-role'),
  setAppRole: (role) => ipcRenderer.invoke('set-app-role', role),
});
