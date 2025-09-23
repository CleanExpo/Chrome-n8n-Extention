// Enhanced Options Page JavaScript

// State management
let settings = {};
let hasUnsavedChanges = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    setupNavigation();
    applyTheme();
});

// Load settings from storage
async function loadSettings() {
    try {
        // Check if Chrome storage is available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(null, (result) => {
                settings = result || {};
                applySettingsToUI();
                updateConnectionStatuses();
            });
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('settings');
            settings = stored ? JSON.parse(stored) : {};
            applySettingsToUI();
            updateConnectionStatuses();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Failed to load settings', 'error');
    }
}

// Apply settings to UI elements
function applySettingsToUI() {
    // General settings
    setInputValue('assistantName', settings.assistantName || 'n8n AI Assistant');
    setCheckboxValue('enableAssistant', settings.enableAssistant !== false);
    setCheckboxValue('autoStartChat', settings.autoStartChat || false);
    setSelectValue('defaultModel', settings.defaultModel || 'gpt-3.5-turbo');

    // API Keys
    setInputValue('openaiKey', settings.openaiKey || '');
    setInputValue('n8nApiKey', settings.n8nApiKey || '');
    setInputValue('context7ApiKey', settings.context7ApiKey || '');

    // Connections
    setInputValue('n8nWebhookUrl', settings.n8nWebhookUrl || '');
    setInputValue('integrationServer', settings.integrationServer || '');
    setInputValue('customEndpoint', settings.customEndpoint || '');

    // Appearance
    setSelectValue('theme', settings.theme || 'auto');
    setSelectValue('widgetPosition', settings.widgetPosition || 'bottom-right');
    setSelectValue('widgetSize', settings.widgetSize || 'medium');
    setCheckboxValue('enableAnimations', settings.enableAnimations !== false);
    setCheckboxValue('compactMode', settings.compactMode || false);

    // Advanced
    setInputValue('systemPrompt', settings.systemPrompt || '');
    setInputValue('maxTokens', settings.maxTokens || 2000);
    setInputValue('temperature', settings.temperature || 0.7);
    setCheckboxValue('debugMode', settings.debugMode || false);
}

// Helper functions to set values safely
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function setCheckboxValue(id, checked) {
    const element = document.getElementById(id);
    if (element) {
        element.checked = checked;
    }
}

function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                    loadSettings();
                    hasUnsavedChanges = false;
                }
            } else {
                loadSettings();
            }
        });
    }

    // Test buttons
    const testOpenaiBtn = document.getElementById('testOpenaiBtn');
    if (testOpenaiBtn) {
        testOpenaiBtn.addEventListener('click', testOpenAIConnection);
    }

    const testN8nApiBtn = document.getElementById('testN8nApiBtn');
    if (testN8nApiBtn) {
        testN8nApiBtn.addEventListener('click', testN8nConnection);
    }

    const testAllBtn = document.getElementById('testAllConnections');
    if (testAllBtn) {
        testAllBtn.addEventListener('click', testAllConnections);
    }

    const testContext7Btn = document.getElementById('testContext7Btn');
    if (testContext7Btn) {
        testContext7Btn.addEventListener('click', testContext7Connection);
    }

    // Advanced buttons
    const exportBtn = document.getElementById('exportSettings');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSettings);
    }

    const importBtn = document.getElementById('importSettings');
    if (importBtn) {
        importBtn.addEventListener('click', importSettings);
    }

    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }

    // Documentation link
    const viewDocsBtn = document.getElementById('viewDocs');
    if (viewDocsBtn) {
        viewDocsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (chrome && chrome.tabs) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('AI_ASSISTANT_SETUP.md')
                });
            } else {
                window.open('AI_ASSISTANT_SETUP.md', '_blank');
            }
        });
    }

    // Track changes
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            const sectionId = item.dataset.section;
            showSection(sectionId);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Save settings
async function saveSettings() {
    // Gather all settings
    const newSettings = {
        // General
        assistantName: document.getElementById('assistantName')?.value || 'n8n AI Assistant',
        enableAssistant: document.getElementById('enableAssistant')?.checked !== false,
        autoStartChat: document.getElementById('autoStartChat')?.checked || false,
        defaultModel: document.getElementById('defaultModel')?.value || 'gpt-3.5-turbo',

        // API Keys
        openaiKey: document.getElementById('openaiKey')?.value || '',
        n8nApiKey: document.getElementById('n8nApiKey')?.value || '',
        context7ApiKey: document.getElementById('context7ApiKey')?.value || '',

        // Connections
        n8nWebhookUrl: document.getElementById('n8nWebhookUrl')?.value || '',
        integrationServer: document.getElementById('integrationServer')?.value || '',
        customEndpoint: document.getElementById('customEndpoint')?.value || '',

        // Appearance
        theme: document.getElementById('theme')?.value || 'auto',
        widgetPosition: document.getElementById('widgetPosition')?.value || 'bottom-right',
        widgetSize: document.getElementById('widgetSize')?.value || 'medium',
        enableAnimations: document.getElementById('enableAnimations')?.checked !== false,
        compactMode: document.getElementById('compactMode')?.checked || false,

        // Advanced
        systemPrompt: document.getElementById('systemPrompt')?.value || '',
        maxTokens: parseInt(document.getElementById('maxTokens')?.value) || 2000,
        temperature: parseFloat(document.getElementById('temperature')?.value) || 0.7,
        debugMode: document.getElementById('debugMode')?.checked || false
    };

    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(newSettings, () => {
                settings = newSettings;
                hasUnsavedChanges = false;
                showMessage('Settings saved successfully!', 'success');

                // Notify other parts of the extension
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        action: 'settingsUpdated',
                        settings: newSettings
                    });
                }
            });
        } else {
            // Fallback to localStorage
            localStorage.setItem('settings', JSON.stringify(newSettings));
            settings = newSettings;
            hasUnsavedChanges = false;
            showMessage('Settings saved successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Failed to save settings', 'error');
    }
}

// Test OpenAI connection
async function testOpenAIConnection() {
    const apiKey = document.getElementById('openaiKey')?.value;
    const resultDiv = document.getElementById('openaiTestResult');
    const statusDiv = document.getElementById('openaiStatus');

    if (!apiKey) {
        showTestResult(resultDiv, 'Please enter an API key first', 'error');
        updateStatus(statusDiv, 'not-configured', 'Not Configured');
        return;
    }

    showTestResult(resultDiv, 'Testing connection...', 'info');

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            showTestResult(resultDiv, 'Connection successful! API key is valid.', 'success');
            updateStatus(statusDiv, 'connected', 'Connected');
        } else {
            const error = await response.json();
            showTestResult(resultDiv, `Connection failed: ${error.error?.message || 'Invalid API key'}`, 'error');
            updateStatus(statusDiv, 'error', 'Error');
        }
    } catch (error) {
        showTestResult(resultDiv, `Connection failed: ${error.message}`, 'error');
        updateStatus(statusDiv, 'error', 'Error');
    }
}

// Test n8n connection
async function testN8nConnection() {
    const apiKey = document.getElementById('n8nApiKey')?.value;
    const webhookUrl = document.getElementById('n8nWebhookUrl')?.value;
    const resultDiv = document.getElementById('n8nApiTestResult');
    const statusDiv = document.getElementById('n8nApiStatus');

    if (!webhookUrl) {
        showTestResult(resultDiv, 'Please enter a webhook URL in the Connections section', 'error');
        updateStatus(statusDiv, 'not-configured', 'Not Configured');
        return;
    }

    showTestResult(resultDiv, 'Testing connection...', 'info');

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ test: true })
        });

        if (response.ok) {
            showTestResult(resultDiv, 'Connection successful!', 'success');
            updateStatus(statusDiv, 'connected', 'Connected');
        } else {
            showTestResult(resultDiv, 'Connection failed: Server returned error', 'error');
            updateStatus(statusDiv, 'error', 'Error');
        }
    } catch (error) {
        showTestResult(resultDiv, `Connection failed: ${error.message}`, 'error');
        updateStatus(statusDiv, 'error', 'Error');
    }
}

// Test Context7 connection
async function testContext7Connection() {
    const apiKey = document.getElementById('context7ApiKey')?.value;
    const resultDiv = document.getElementById('context7TestResult');
    const statusDiv = document.getElementById('context7Status');

    if (!apiKey) {
        showTestResult(resultDiv, 'Please enter an API key first', 'error');
        updateStatus(statusDiv, 'not-configured', 'Not Configured');
        return;
    }

    showTestResult(resultDiv, 'Testing connection...', 'info');

    try {
        // Test by trying to resolve a common library
        const response = await fetch('https://api.context7.com/resolve/react', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'User-Agent': 'n8n-Chrome-Extension/1.0.0'
            }
        });

        if (response.ok) {
            showTestResult(resultDiv, 'Connection successful! Context7 is ready.', 'success');
            updateStatus(statusDiv, 'connected', 'Connected');
        } else if (response.status === 401) {
            showTestResult(resultDiv, 'Invalid API key', 'error');
            updateStatus(statusDiv, 'error', 'Invalid Key');
        } else {
            showTestResult(resultDiv, 'Connection failed', 'error');
            updateStatus(statusDiv, 'error', 'Error');
        }
    } catch (error) {
        showTestResult(resultDiv, `Connection failed: ${error.message}`, 'error');
        updateStatus(statusDiv, 'error', 'Error');
    }
}

// Test all connections
async function testAllConnections() {
    showMessage('Testing all connections...', 'info');

    // Test OpenAI
    await testOpenAIConnection();

    // Test n8n
    await testN8nConnection();

    // Test integration server
    const integrationServer = document.getElementById('integrationServer')?.value;
    if (integrationServer) {
        try {
            const response = await fetch(integrationServer);
            if (response.ok) {
                showMessage('Integration server is reachable', 'success');
            } else {
                showMessage('Integration server returned an error', 'warning');
            }
        } catch (error) {
            showMessage('Could not reach integration server', 'warning');
        }
    }
}

// Update connection status
function updateConnectionStatuses() {
    // Update OpenAI status
    const openaiStatus = document.getElementById('openaiStatus');
    if (openaiStatus && settings.openaiKey) {
        updateStatus(openaiStatus, 'configured', 'Configured');
    }

    // Update n8n status
    const n8nStatus = document.getElementById('n8nApiStatus');
    if (n8nStatus && settings.n8nWebhookUrl) {
        updateStatus(n8nStatus, 'configured', 'Configured');
    }
}

// Update status element
function updateStatus(statusElement, className, text) {
    if (!statusElement) return;

    statusElement.className = `api-key-status ${className}`;
    const textSpan = statusElement.querySelector('span:last-child');
    if (textSpan) {
        textSpan.textContent = text;
    }
}

// Show test result
function showTestResult(resultDiv, message, type) {
    if (!resultDiv) return;

    resultDiv.className = `test-result ${type}`;
    resultDiv.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
    `;
    resultDiv.style.display = 'flex';
}

// Export settings
function exportSettings() {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `n8n-assistant-settings-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showMessage('Settings exported successfully!', 'success');
}

// Import settings
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const imported = JSON.parse(text);

            // Apply imported settings
            settings = imported;
            applySettingsToUI();

            // Save immediately
            await saveSettings();

            showMessage('Settings imported successfully!', 'success');
        } catch (error) {
            showMessage('Failed to import settings: Invalid file format', 'error');
        }
    };

    input.click();
}

// Reset settings
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        settings = {};

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.clear(() => {
                loadSettings();
                showMessage('Settings reset to defaults', 'success');
            });
        } else {
            localStorage.removeItem('settings');
            loadSettings();
            showMessage('Settings reset to defaults', 'success');
        }
    }
}

// Show message
function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const message = document.createElement('div');
    message.className = `alert alert-${type}`;
    message.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span>${text}</span>
    `;

    container.appendChild(message);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            message.remove();
        }, 300);
    }, 3000);
}

// Apply theme
function applyTheme() {
    const theme = settings.theme || 'auto';

    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);