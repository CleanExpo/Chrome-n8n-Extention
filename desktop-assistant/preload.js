// Preload script for secure context bridge
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Config management
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),

    // Screen capture
    captureScreen: () => ipcRenderer.invoke('capture-screen'),

    // File operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // System operations
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

    // IPC communication
    send: (channel, data) => {
        const validChannels = ['navigate', 'minimize', 'maximize', 'close'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    on: (channel, callback) => {
        const validChannels = ['server-status', 'navigate', 'ai-response', 'voice-transcription'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },

    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});