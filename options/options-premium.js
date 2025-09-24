/**
 * Premium Options Page JavaScript
 * Handles all settings, API configurations, and user interactions
 */

class PremiumOptionsManager {
    constructor() {
        this.settings = {};
        this.activeTab = 'general';
        this.activeAuthMethod = 'oauth';
        this.saveTimeout = null;

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.initializeTheme();
        this.populateSettings();
        this.setupTabs();
        this.setupAuthTabs();
    }

    // Settings Management
    async loadSettings() {
        try {
            let settings = {};

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(null);
                settings = result || {};
            } else {
                const stored = localStorage.getItem('extensionSettings');
                settings = stored ? JSON.parse(stored) : {};
            }

            this.settings = {
                // General Settings
                defaultTheme: settings.defaultTheme || 'auto',
                widgetPosition: settings.widgetPosition || 'bottom-right',
                enableShortcuts: settings.enableShortcuts !== false,
                showNotifications: settings.showNotifications !== false,
                autoSaveConversations: settings.autoSaveConversations !== false,

                // AI Configuration
                primaryProvider: settings.primaryProvider || 'openai',
                openaiKey: settings.openaiKey || '',
                openaiModel: settings.openaiModel || 'gpt-4',
                n8nWebhook: settings.n8nWebhook || '',
                n8nKey: settings.n8nKey || '',

                // Google Cloud Platform
                gcpProjectId: settings.gcpProjectId || '',
                gcpLocation: settings.gcpLocation || 'us-central1',
                gcpClientId: settings.gcpClientId || '',
                gcpApiKey: settings.gcpApiKey || '',
                serviceAccountKey: settings.serviceAccountKey || '',
                enabledServices: settings.enabledServices || {
                    vertexai: true,
                    documentai: false,
                    translate: false,
                    speech: false,
                    analytics: false,
                    bigquery: false
                },

                // Privacy & Security
                localStorageOnly: settings.localStorageOnly !== false,
                dataRetention: settings.dataRetention || '30',
                anonymousAnalytics: settings.anonymousAnalytics || false,

                ...settings
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    async saveSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set(this.settings);
            } else {
                localStorage.setItem('extensionSettings', JSON.stringify(this.settings));
            }

            this.showStatus('Settings saved successfully', 'success');

            // Notify other parts of the extension about settings change
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'settingsUpdated',
                    settings: this.settings
                });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    // Auto-save with debouncing
    autoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveSettings();
        }, 1000);
    }

    // UI Population
    populateSettings() {
        // General Settings
        document.getElementById('defaultTheme').value = this.settings.defaultTheme;
        document.getElementById('widgetPosition').value = this.settings.widgetPosition;
        document.getElementById('enableShortcuts').checked = this.settings.enableShortcuts;
        document.getElementById('showNotifications').checked = this.settings.showNotifications;
        document.getElementById('autoSaveConversations').checked = this.settings.autoSaveConversations;

        // AI Configuration
        document.getElementById('primaryProvider').value = this.settings.primaryProvider;
        document.getElementById('openaiKey').value = this.settings.openaiKey;
        document.getElementById('openaiModel').value = this.settings.openaiModel;
        document.getElementById('n8nWebhook').value = this.settings.n8nWebhook;
        document.getElementById('n8nKey').value = this.settings.n8nKey;

        // Google Cloud Platform
        document.getElementById('gcpProjectId').value = this.settings.gcpProjectId;
        document.getElementById('gcpLocation').value = this.settings.gcpLocation;
        document.getElementById('gcpClientId').value = this.settings.gcpClientId;
        document.getElementById('gcpApiKey').value = this.settings.gcpApiKey;
        document.getElementById('serviceAccountKey').value = this.settings.serviceAccountKey;

        // Enabled Services
        const services = this.settings.enabledServices || {};
        Object.keys(services).forEach(service => {
            const checkbox = document.getElementById(`enable${service.charAt(0).toUpperCase()}${service.slice(1)}`);
            if (checkbox) {
                checkbox.checked = services[service];
            }
        });

        // Privacy & Security
        document.getElementById('localStorageOnly').checked = this.settings.localStorageOnly;
        document.getElementById('dataRetention').value = this.settings.dataRetention;
        document.getElementById('anonymousAnalytics').checked = this.settings.anonymousAnalytics;
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Form inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleInputChange(e);
            });
        });

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Auth method tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAuthMethod(e.target.dataset.auth);
            });
        });

        // Test buttons
        document.querySelectorAll('.test-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.testConnection(e.target.dataset.api);
            });
        });

        // Save button
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Export/Import buttons
        document.getElementById('exportSettings').addEventListener('click', () => {
            this.exportSettings();
        });

        document.getElementById('importSettings').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importSettings(e.target.files[0]);
        });

        // Danger zone buttons
        document.getElementById('clearAllData').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Google Cloud authorization
        document.getElementById('authorizeGCP').addEventListener('click', () => {
            this.authorizeGoogleCloud();
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on background click
        document.getElementById('statusModal').addEventListener('click', (e) => {
            if (e.target.id === 'statusModal') {
                this.closeModal();
            }
        });

        // Integration buttons
        document.querySelectorAll('.connect-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleIntegrationConnect(e.target);
            });
        });
    }

    // Input Change Handler
    handleInputChange(event) {
        const { id, value, type, checked } = event.target;

        if (type === 'checkbox') {
            if (id.startsWith('enable')) {
                const serviceName = id.replace('enable', '').toLowerCase();
                this.settings.enabledServices = this.settings.enabledServices || {};
                this.settings.enabledServices[serviceName] = checked;
            } else {
                this.settings[id] = checked;
            }
        } else {
            this.settings[id] = value;
        }

        this.autoSave();
    }

    // Tab Management
    setupTabs() {
        this.switchTab(this.activeTab);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).setAttribute('aria-selected', 'true');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        this.activeTab = tabName;
    }

    // Auth Tab Management
    setupAuthTabs() {
        this.switchAuthMethod(this.activeAuthMethod);
    }

    switchAuthMethod(method) {
        // Update auth tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelector(`[data-auth="${method}"]`).classList.add('active');

        // Update auth content
        document.querySelectorAll('.auth-content').forEach(content => {
            content.classList.remove('active');
        });

        document.getElementById(`${method}Auth`).classList.add('active');
        this.activeAuthMethod = method;
    }

    // Theme Management
    initializeTheme() {
        const savedTheme = this.settings.defaultTheme || 'auto';
        this.applyTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.applyTheme(newTheme);
        this.settings.defaultTheme = newTheme;
        this.saveSettings();
    }

    applyTheme(theme) {
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        const currentTheme = document.documentElement.getAttribute('data-theme');
        themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    // API Testing
    async testConnection(apiType) {
        const modal = document.getElementById('statusModal');
        const title = document.getElementById('modalTitle');
        const message = document.getElementById('statusMessage');
        const indicator = document.getElementById('statusIndicator');

        title.textContent = `Testing ${apiType.toUpperCase()} Connection`;
        message.textContent = 'Connecting...';
        indicator.innerHTML = '<div class="spinner"></div><p id="statusMessage">Testing connection...</p>';

        modal.classList.add('show');

        try {
            let success = false;

            switch (apiType) {
                case 'openai':
                    success = await this.testOpenAI();
                    break;
                case 'n8n':
                    success = await this.testN8n();
                    break;
                case 'gcp':
                    success = await this.testGoogleCloud();
                    break;
            }

            if (success) {
                indicator.innerHTML = `
                    <div style="color: var(--success); font-size: 3rem;">✅</div>
                    <p style="color: var(--success);">Connection successful!</p>
                `;
            } else {
                indicator.innerHTML = `
                    <div style="color: var(--error); font-size: 3rem;">❌</div>
                    <p style="color: var(--error);">Connection failed. Please check your settings.</p>
                `;
            }
        } catch (error) {
            console.error('Connection test error:', error);
            indicator.innerHTML = `
                <div style="color: var(--error); font-size: 3rem;">❌</div>
                <p style="color: var(--error);">Error: ${error.message}</p>
            `;
        }
    }

    async testOpenAI() {
        const apiKey = this.settings.openaiKey;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.ok;
    }

    async testN8n() {
        const webhook = this.settings.n8nWebhook;
        if (!webhook) {
            throw new Error('Webhook URL not configured');
        }

        const response = await fetch(webhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: true,
                message: 'Connection test from Chrome Extension'
            })
        });

        return response.ok;
    }

    async testGoogleCloud() {
        // Mock test - in real implementation, this would test the actual GCP connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.settings.gcpProjectId && (this.settings.gcpClientId || this.settings.gcpApiKey || this.settings.serviceAccountKey);
    }

    // Google Cloud Authorization
    async authorizeGoogleCloud() {
        try {
            if (!this.settings.gcpClientId) {
                throw new Error('Client ID not configured');
            }

            // In a real implementation, this would use chrome.identity.launchWebAuthFlow
            this.showStatus('Google Cloud authorization would be initiated here', 'info');

        } catch (error) {
            console.error('Authorization error:', error);
            this.showStatus(`Authorization failed: ${error.message}`, 'error');
        }
    }

    // Integration Management
    handleIntegrationConnect(button) {
        const card = button.closest('.integration-card');
        const integration = card.querySelector('h3').textContent.toLowerCase();

        if (button.classList.contains('connected')) {
            this.manageIntegration(integration);
        } else {
            this.connectIntegration(integration);
        }
    }

    connectIntegration(integration) {
        // Mock connection - in real implementation, this would handle OAuth flows
        this.showStatus(`Connecting to ${integration}...`, 'info');

        setTimeout(() => {
            this.showStatus(`Successfully connected to ${integration}!`, 'success');
            // Update UI to show connected state
        }, 2000);
    }

    manageIntegration(integration) {
        this.showStatus(`Managing ${integration} integration...`, 'info');
    }

    // Settings Import/Export
    exportSettings() {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(settingsBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('Settings exported successfully', 'success');
    }

    async importSettings(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const importedSettings = JSON.parse(text);

            // Validate settings structure
            if (typeof importedSettings !== 'object') {
                throw new Error('Invalid settings file format');
            }

            // Merge with current settings
            this.settings = { ...this.settings, ...importedSettings };

            await this.saveSettings();
            this.populateSettings();

            this.showStatus('Settings imported successfully', 'success');
        } catch (error) {
            console.error('Import error:', error);
            this.showStatus(`Import failed: ${error.message}`, 'error');
        }
    }

    // Data Management
    async clearAllData() {
        const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.');

        if (confirmed) {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    await chrome.storage.sync.clear();
                    await chrome.storage.local.clear();
                } else {
                    localStorage.clear();
                }

                this.settings = {};
                this.populateSettings();

                this.showStatus('All data cleared successfully', 'success');
            } catch (error) {
                console.error('Clear data error:', error);
                this.showStatus(`Failed to clear data: ${error.message}`, 'error');
            }
        }
    }

    async resetSettings() {
        const confirmed = confirm('Are you sure you want to reset all settings to defaults?');

        if (confirmed) {
            this.settings = {};
            await this.loadSettings(); // This will load default values
            this.populateSettings();

            this.showStatus('Settings reset to defaults', 'success');
        }
    }

    // UI Helpers
    showStatus(message, type = 'info') {
        const status = document.getElementById('saveStatus');
        const statusIcon = status.querySelector('.status-icon');
        const statusText = status.querySelector('.status-text');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)',
            info: 'var(--primary-color)'
        };

        statusIcon.textContent = icons[type] || icons.info;
        statusText.textContent = message;
        status.style.color = colors[type] || colors.info;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusIcon.textContent = '💾';
            statusText.textContent = 'Settings saved automatically';
            status.style.color = '';
        }, 5000);
    }

    closeModal() {
        const modal = document.getElementById('statusModal');
        modal.classList.remove('show');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PremiumOptionsManager();
});

// Handle system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const optionsManager = window.optionsManager;
        if (optionsManager && optionsManager.settings.defaultTheme === 'auto') {
            optionsManager.applyTheme('auto');
        }
    });
}