// Main process for n8n Desktop Assistant
const { app, BrowserWindow, Tray, Menu, ipcMain, desktopCapturer, dialog, shell } = require('electron');
const path = require('path');
const WebSocketServer = require('./websocket-server');
const Store = require('electron-store');
const keytar = require('keytar');

// Initialize store for persistent settings
const store = new Store();

// Global references
let mainWindow = null;
let tray = null;
let wsServer = null;
let isQuitting = false;

// App configuration
const config = {
    wsPort: store.get('wsPort', 8765),
    minimizeToTray: store.get('minimizeToTray', true),
    launchAtStartup: store.get('launchAtStartup', false),
    apiKeys: {
        openai: null,
        elevenLabs: null,
        google: null
    }
};

// Create main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: 'n8n Desktop Assistant',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.loadFile('renderer/index.html');

    // Handle window events
    mainWindow.on('ready-to-show', () => {
        if (!store.get('startMinimized', false)) {
            mainWindow.show();
        }
    });

    mainWindow.on('close', (event) => {
        if (!isQuitting && config.minimizeToTray) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create system tray
function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Assistant',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('navigate', '/settings');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'WebSocket Status',
            enabled: false,
            id: 'ws-status'
        },
        {
            label: wsServer?.isRunning() ? 'Stop Server' : 'Start Server',
            click: toggleWebSocketServer
        },
        { type: 'separator' },
        {
            label: 'Launch at Startup',
            type: 'checkbox',
            checked: config.launchAtStartup,
            click: (menuItem) => {
                config.launchAtStartup = menuItem.checked;
                store.set('launchAtStartup', config.launchAtStartup);
                setAutoLaunch(config.launchAtStartup);
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('n8n Desktop Assistant');
    tray.setContextMenu(contextMenu);

    // Double click to show window
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    updateTrayStatus();
}

// Update tray status indicator
function updateTrayStatus() {
    if (!tray) return;

    // Recreate the context menu with updated status
    const statusLabel = wsServer && wsServer.isRunning()
        ? `✓ Server running on port ${config.wsPort}`
        : '✗ Server not running';

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Assistant',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('navigate', '/settings');
                }
            }
        },
        { type: 'separator' },
        {
            label: statusLabel,
            enabled: false
        },
        {
            label: wsServer?.isRunning() ? 'Stop Server' : 'Start Server',
            click: toggleWebSocketServer
        },
        { type: 'separator' },
        {
            label: 'Launch at Startup',
            type: 'checkbox',
            checked: config.launchAtStartup,
            click: (menuItem) => {
                config.launchAtStartup = menuItem.checked;
                store.set('launchAtStartup', config.launchAtStartup);
                setAutoLaunch(config.launchAtStartup);
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip(wsServer && wsServer.isRunning()
        ? `n8n Desktop Assistant - Connected (Port ${config.wsPort})`
        : 'n8n Desktop Assistant - Disconnected');
}

// Toggle WebSocket server
function toggleWebSocketServer() {
    if (wsServer && wsServer.isRunning()) {
        wsServer.stop();
        updateTrayStatus();
    } else {
        startWebSocketServer();
    }
}

// Start WebSocket server
function startWebSocketServer() {
    if (!wsServer) {
        wsServer = new WebSocketServer(config.wsPort);
    }

    wsServer.start((error) => {
        if (error) {
            dialog.showErrorBox('Server Error', `Failed to start WebSocket server: ${error.message}`);
        } else {
            updateTrayStatus();
            if (mainWindow) {
                mainWindow.webContents.send('server-status', { running: true, port: config.wsPort });
            }
        }
    });
}

// Set auto-launch
function setAutoLaunch(enable) {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
    });
}

// Load API keys from secure storage
async function loadApiKeys() {
    try {
        config.apiKeys.openai = await keytar.getPassword('n8n-assistant', 'openai-key');
        config.apiKeys.elevenLabs = await keytar.getPassword('n8n-assistant', 'elevenlabs-key');
        config.apiKeys.google = await keytar.getPassword('n8n-assistant', 'google-key');
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

// Save API key to secure storage
async function saveApiKey(service, key) {
    try {
        await keytar.setPassword('n8n-assistant', `${service}-key`, key);
        config.apiKeys[service] = key;
        return true;
    } catch (error) {
        console.error('Error saving API key:', error);
        return false;
    }
}

// IPC handlers
ipcMain.handle('get-config', () => {
    return {
        wsPort: config.wsPort,
        minimizeToTray: config.minimizeToTray,
        launchAtStartup: config.launchAtStartup,
        hasApiKeys: {
            openai: !!config.apiKeys.openai,
            elevenLabs: !!config.apiKeys.elevenLabs,
            google: !!config.apiKeys.google
        }
    };
});

ipcMain.handle('save-config', async (event, newConfig) => {
    Object.assign(config, newConfig);
    store.set('wsPort', config.wsPort);
    store.set('minimizeToTray', config.minimizeToTray);
    store.set('launchAtStartup', config.launchAtStartup);

    if (newConfig.apiKeys) {
        for (const [service, key] of Object.entries(newConfig.apiKeys)) {
            if (key) {
                await saveApiKey(service, key);
            }
        }
    }

    // Restart WebSocket server if port changed
    if (wsServer && wsServer.port !== config.wsPort) {
        wsServer.stop();
        wsServer = new WebSocketServer(config.wsPort);
        startWebSocketServer();
    }

    return { success: true };
});

ipcMain.handle('capture-screen', async () => {
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length > 0) {
        return sources[0].thumbnail.toDataURL();
    }
    return null;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('open-external', async (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle('get-system-info', () => {
    const os = require('os');
    return {
        platform: os.platform(),
        version: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        memory: {
            total: os.totalmem(),
            free: os.freemem()
        }
    };
});

// App event handlers
app.whenReady().then(async () => {
    await loadApiKeys();
    createMainWindow();
    createTray();
    startWebSocketServer();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit on Windows/Linux when all windows are closed
        // Keep running in system tray
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    if (wsServer) {
        wsServer.stop();
    }
});

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('n8n-assistant');

// Handle deep link on Windows/Linux
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}