const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  callClaude: (prompt) => ipcRenderer.invoke('ai-call', prompt)
});
