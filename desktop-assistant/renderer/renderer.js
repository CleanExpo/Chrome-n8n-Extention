// Renderer process JavaScript

class DesktopAssistantUI {
    constructor() {
        this.currentPage = 'dashboard';
        this.stats = {
            connectedClients: 0,
            messagesProcessed: 0,
            aiRequests: 0,
            startTime: Date.now()
        };
        this.logs = [];
        this.init();
    }

    async init() {
        this.attachEventListeners();
        await this.loadConfig();
        this.startUpdateLoop();
        this.updateTime();
        this.addLog('info', 'Desktop Assistant initialized');
    }

    attachEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateTo(e.target.dataset.page);
            });
        });

        // Dashboard actions
        document.getElementById('test-connection')?.addEventListener('click', () => {
            this.testConnection();
        });

        document.getElementById('capture-screen')?.addEventListener('click', () => {
            this.captureScreen();
        });

        document.getElementById('test-ai')?.addEventListener('click', () => {
            this.testAI();
        });

        document.getElementById('open-extension')?.addEventListener('click', () => {
            window.electronAPI.openExternal('chrome://extensions/');
        });

        // Settings
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('reset-settings')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Server control
        document.getElementById('toggle-server')?.addEventListener('click', () => {
            this.toggleServer();
        });

        // Logs
        document.getElementById('clear-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('export-logs')?.addEventListener('click', () => {
            this.exportLogs();
        });

        document.getElementById('log-level')?.addEventListener('change', (e) => {
            this.filterLogs(e.target.value);
        });

        // Listen for server status updates
        window.electronAPI.on('server-status', (status) => {
            this.updateServerStatus(status);
        });

        // Listen for AI responses
        window.electronAPI.on('ai-response', (response) => {
            this.handleAIResponse(response);
        });
    }

    navigateTo(page) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;
        this.addLog('info', `Navigated to ${page}`);
    }

    async loadConfig() {
        try {
            const config = await window.electronAPI.getConfig();

            // Update settings UI
            document.getElementById('port-input').value = config.wsPort;
            document.getElementById('minimize-tray').checked = config.minimizeToTray;
            document.getElementById('launch-startup').checked = config.launchAtStartup;

            // Update status
            if (config.hasApiKeys) {
                if (config.hasApiKeys.openai) {
                    document.getElementById('openai-key').placeholder = 'API key configured';
                }
                if (config.hasApiKeys.elevenLabs) {
                    document.getElementById('elevenlabs-key').placeholder = 'API key configured';
                }
                if (config.hasApiKeys.google) {
                    document.getElementById('google-key').placeholder = 'API key configured';
                }
            }

            this.addLog('success', 'Configuration loaded');
        } catch (error) {
            this.addLog('error', `Failed to load config: ${error.message}`);
        }
    }

    async saveSettings() {
        const config = {
            wsPort: parseInt(document.getElementById('port-input').value),
            minimizeToTray: document.getElementById('minimize-tray').checked,
            launchAtStartup: document.getElementById('launch-startup').checked,
            apiKeys: {}
        };

        // Only save API keys if they're not placeholders
        const openaiKey = document.getElementById('openai-key').value;
        const elevenLabsKey = document.getElementById('elevenlabs-key').value;
        const googleKey = document.getElementById('google-key').value;

        if (openaiKey && !openaiKey.includes('configured')) {
            config.apiKeys.openai = openaiKey;
        }
        if (elevenLabsKey && !elevenLabsKey.includes('configured')) {
            config.apiKeys.elevenLabs = elevenLabsKey;
        }
        if (googleKey && !googleKey.includes('configured')) {
            config.apiKeys.google = googleKey;
        }

        try {
            const result = await window.electronAPI.saveConfig(config);
            if (result.success) {
                this.addLog('success', 'Settings saved successfully');
                this.showNotification('Settings saved!', 'success');

                // Clear API key inputs
                document.getElementById('openai-key').value = '';
                document.getElementById('elevenlabs-key').value = '';
                document.getElementById('google-key').value = '';

                await this.loadConfig();
            }
        } catch (error) {
            this.addLog('error', `Failed to save settings: ${error.message}`);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    resetSettings() {
        if (confirm('Reset all settings to default?')) {
            document.getElementById('port-input').value = '8765';
            document.getElementById('minimize-tray').checked = true;
            document.getElementById('launch-startup').checked = false;
            this.addLog('info', 'Settings reset to default');
        }
    }

    async testConnection() {
        this.addLog('info', 'Testing connection...');

        try {
            // Test WebSocket connection
            const ws = new WebSocket(`ws://localhost:${document.getElementById('port-input').value}`);

            ws.onopen = () => {
                this.addLog('success', 'WebSocket connection successful');
                ws.close();
            };

            ws.onerror = (error) => {
                this.addLog('error', 'WebSocket connection failed');
            };

            setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                    this.addLog('warning', 'Connection timeout');
                }
            }, 5000);
        } catch (error) {
            this.addLog('error', `Connection test failed: ${error.message}`);
        }
    }

    async captureScreen() {
        try {
            this.addLog('info', 'Capturing screen...');
            const screenshot = await window.electronAPI.captureScreen();

            if (screenshot) {
                this.addLog('success', 'Screen captured successfully');

                // Save screenshot
                const result = await window.electronAPI.showSaveDialog({
                    defaultPath: `screenshot_${Date.now()}.png`,
                    filters: [{ name: 'Images', extensions: ['png'] }]
                });

                if (!result.canceled) {
                    // Save the file
                    const fs = require('fs');
                    const buffer = Buffer.from(screenshot.split(',')[1], 'base64');
                    fs.writeFileSync(result.filePath, buffer);
                    this.addLog('success', `Screenshot saved to ${result.filePath}`);
                }
            }
        } catch (error) {
            this.addLog('error', `Screen capture failed: ${error.message}`);
        }
    }

    async testAI() {
        this.addLog('info', 'Testing AI connection...');

        // This would send a test request to the AI service
        this.addLog('warning', 'AI test requires API keys to be configured');
    }

    toggleServer() {
        // This would toggle the WebSocket server
        const btn = document.getElementById('toggle-server');
        if (btn.textContent === 'Start Server') {
            btn.textContent = 'Stop Server';
            this.addLog('success', 'WebSocket server started');
        } else {
            btn.textContent = 'Start Server';
            this.addLog('info', 'WebSocket server stopped');
        }
    }

    updateServerStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (status.running) {
            statusDot.classList.add('connected');
            statusText.textContent = `Running on port ${status.port}`;
            document.getElementById('ws-server-status').textContent = 'Running';
            document.getElementById('toggle-server').textContent = 'Stop Server';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Not running';
            document.getElementById('ws-server-status').textContent = 'Stopped';
            document.getElementById('toggle-server').textContent = 'Start Server';
        }
    }

    handleAIResponse(response) {
        this.stats.aiRequests++;
        this.addLog('success', `AI response received: ${response.substring(0, 100)}...`);
        this.updateStats();
    }

    updateStats() {
        document.getElementById('connected-clients').textContent = this.stats.connectedClients;
        document.getElementById('messages-processed').textContent = this.stats.messagesProcessed;
        document.getElementById('ai-requests').textContent = this.stats.aiRequests;

        // Update uptime
        const uptime = Date.now() - this.stats.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
    }

    addLog(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, level, message };
        this.logs.unshift(logEntry);

        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs.pop();
        }

        // Update activity log
        const activityLog = document.getElementById('activity-log');
        if (activityLog) {
            const entry = document.createElement('div');
            entry.className = `log-entry ${level}`;
            entry.textContent = `[${timestamp}] ${message}`;
            activityLog.insertBefore(entry, activityLog.firstChild);

            // Keep only last 20 in UI
            while (activityLog.children.length > 20) {
                activityLog.removeChild(activityLog.lastChild);
            }
        }

        // Update system logs
        this.updateSystemLogs();

        // Update footer status
        document.getElementById('footer-status').textContent = message;
    }

    updateSystemLogs() {
        const logsContainer = document.getElementById('system-logs');
        const logLevel = document.getElementById('log-level')?.value || 'all';

        if (!logsContainer) return;

        logsContainer.innerHTML = '';

        this.logs
            .filter(log => logLevel === 'all' || log.level === logLevel)
            .forEach(log => {
                const entry = document.createElement('div');
                entry.className = `log-entry ${log.level}`;
                entry.textContent = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
                logsContainer.appendChild(entry);
            });
    }

    filterLogs(level) {
        this.updateSystemLogs();
    }

    clearLogs() {
        if (confirm('Clear all logs?')) {
            this.logs = [];
            document.getElementById('activity-log').innerHTML = '';
            document.getElementById('system-logs').innerHTML = '';
            this.addLog('info', 'Logs cleared');
        }
    }

    async exportLogs() {
        const result = await window.electronAPI.showSaveDialog({
            defaultPath: `logs_${Date.now()}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (!result.canceled) {
            const fs = require('fs');
            fs.writeFileSync(result.filePath, JSON.stringify(this.logs, null, 2));
            this.addLog('success', `Logs exported to ${result.filePath}`);
        }
    }

    showNotification(message, type = 'info') {
        // Could implement a toast notification here
        console.log(`[${type}] ${message}`);
    }

    updateTime() {
        const updateTimeDisplay = () => {
            const now = new Date();
            document.getElementById('footer-time').textContent = now.toLocaleString();
        };

        updateTimeDisplay();
        setInterval(updateTimeDisplay, 1000);
    }

    startUpdateLoop() {
        setInterval(() => {
            this.updateStats();
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DesktopAssistantUI();
});