// Options JavaScript - Settings management for the extension

// Default settings
const DEFAULT_SETTINGS = {
    // API Configuration
    n8nUrl: 'http://localhost:5678',
    openaiKey: '',
    googleApiKey: '',
    integrationServer: 'http://localhost:3000',
    websocketPort: 8766,
    // General Settings
    autoAnalyze: false,
    showNotifications: true,
    analysisDelay: 2,
    theme: 'light',
    badgeColor: '#667eea',
    debugMode: false,
    maxHistory: 100,
    excludedSites: '',
    // Assistant Settings
    assistantEnabled: true
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');
    loadSettings();
    setupEventListeners();

    // Direct event listener for test button
    const testBtn = document.getElementById('test-openai-btn');
    if (testBtn) {
        console.log('Test button found, adding listener');
        testBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Test button clicked!');
            testOpenAISimple();
        });
    } else {
        console.error('Test button not found!');
    }
});

// Load settings from Chrome storage
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

        // Apply API settings to form
        document.getElementById('n8n-url').value = settings.n8nUrl || DEFAULT_SETTINGS.n8nUrl;
        document.getElementById('openai-key').value = settings.openaiKey || '';
        document.getElementById('google-api-key').value = settings.googleApiKey || '';
        document.getElementById('integration-server').value = settings.integrationServer || DEFAULT_SETTINGS.integrationServer;
        document.getElementById('websocket-port').value = settings.websocketPort || DEFAULT_SETTINGS.websocketPort;

        // Apply general settings to form
        document.getElementById('auto-analyze').checked = settings.autoAnalyze;
        document.getElementById('show-notifications').checked = settings.showNotifications;
        document.getElementById('analysis-delay').value = settings.analysisDelay;
        document.getElementById('theme').value = settings.theme;
        document.getElementById('badge-color').value = settings.badgeColor;
        document.getElementById('debug-mode').checked = settings.debugMode;
        document.getElementById('max-history').value = settings.maxHistory;
        document.getElementById('excluded-sites').value = settings.excludedSites;

        if (settings.debugMode) {
            console.log('Settings loaded:', settings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

// Save settings to Chrome storage
async function saveSettings(formData) {
    try {
        const settings = {
            // API Configuration
            n8nUrl: formData.get('n8nUrl') || DEFAULT_SETTINGS.n8nUrl,
            openaiKey: formData.get('openaiKey') || '',
            googleApiKey: formData.get('googleApiKey') || '',
            integrationServer: formData.get('integrationServer') || DEFAULT_SETTINGS.integrationServer,
            websocketPort: parseInt(formData.get('websocketPort')) || DEFAULT_SETTINGS.websocketPort,
            // General Settings
            autoAnalyze: formData.get('autoAnalyze') === 'on',
            showNotifications: formData.get('showNotifications') === 'on',
            analysisDelay: parseInt(formData.get('analysisDelay')) || 2,
            theme: formData.get('theme'),
            badgeColor: formData.get('badgeColor'),
            debugMode: formData.get('debugMode') === 'on',
            maxHistory: parseInt(formData.get('maxHistory')) || 100,
            excludedSites: formData.get('excludedSites')
        };

        await chrome.storage.sync.set(settings);

        // Send message to background script about settings update
        chrome.runtime.sendMessage({
            action: 'settingsUpdated',
            settings: settings
        });

        if (settings.debugMode) {
            console.log('Settings saved:', settings);
        }

        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    const form = document.getElementById('options-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const success = await saveSettings(formData);

        if (success) {
            showStatus('Settings saved successfully!', 'success');

            // Test API connection after saving
            testApiConnection(formData);
        } else {
            showStatus('Error saving settings', 'error');
        }
    });

    // Don't add test buttons since they're now in HTML
    // addTestButtons();

    // Export settings
    document.getElementById('export-btn').addEventListener('click', async function() {
        try {
            const settings = await chrome.storage.sync.get(null);
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `extension-settings-${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            showStatus('Settings exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showStatus('Error exporting settings', 'error');
        }
    });

    // Import settings
    document.getElementById('import-btn').addEventListener('click', function() {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const settings = JSON.parse(text);

            await chrome.storage.sync.set(settings);
            await loadSettings(); // Reload UI

            showStatus('Settings imported successfully!', 'success');
            e.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Import error:', error);
            showStatus('Error importing settings', 'error');
        }
    });

    // Reset to defaults
    document.getElementById('reset-btn').addEventListener('click', async function() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                await chrome.storage.sync.set(DEFAULT_SETTINGS);
                await loadSettings(); // Reload UI
                showStatus('Settings reset to defaults', 'success');
            } catch (error) {
                console.error('Reset error:', error);
                showStatus('Error resetting settings', 'error');
            }
        }
    });

    // Clear all data
    document.getElementById('clear-data-btn').addEventListener('click', async function() {
        if (confirm('Are you sure you want to clear all extension data? This cannot be undone.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                await chrome.storage.sync.set(DEFAULT_SETTINGS); // Restore defaults
                await loadSettings(); // Reload UI

                showStatus('All data cleared successfully', 'success');
            } catch (error) {
                console.error('Clear data error:', error);
                showStatus('Error clearing data', 'error');
            }
        }
    });

    // Real-time badge color preview
    document.getElementById('badge-color').addEventListener('input', function(e) {
        const color = e.target.value;
        // You could update a preview element here
        document.documentElement.style.setProperty('--primary-color', color);
    });

    // Theme change handler
    document.getElementById('theme').addEventListener('change', function(e) {
        applyTheme(e.target.value);
    });
}

// Show status message
function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');

    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

// Apply theme
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    const currentTheme = document.getElementById('theme').value;
    if (currentTheme === 'auto') {
        applyTheme('auto');
    }
});

// Add test buttons for API connections
function addTestButtons() {
    // Add test button for OpenAI
    const openaiField = document.getElementById('openai-key');
    if (openaiField && !document.getElementById('test-openai-btn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'test-openai-btn';
        testBtn.type = 'button';
        testBtn.className = 'btn btn-secondary';
        testBtn.textContent = 'Test OpenAI';
        testBtn.style.marginTop = '8px';
        openaiField.parentElement.appendChild(testBtn);

        // Add event listener after creating the button
        testBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Test OpenAI button clicked');
            testOpenAI();
        });
    }

    // Add test button for n8n
    const n8nField = document.getElementById('n8n-url');
    if (n8nField && !document.getElementById('test-n8n-btn')) {
        const testBtn = document.createElement('button');
        testBtn.id = 'test-n8n-btn';
        testBtn.type = 'button';
        testBtn.className = 'btn btn-secondary';
        testBtn.textContent = 'Test n8n Connection';
        testBtn.style.marginTop = '8px';
        n8nField.parentElement.appendChild(testBtn);

        // Add event listener after creating the button
        testBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Test n8n button clicked');
            testN8nConnection();
        });
    }
}

// Test OpenAI connection
async function testOpenAI() {
    console.log('Testing OpenAI API key...');
    const apiKey = document.getElementById('openai-key').value;

    if (!apiKey) {
        showStatus('Please enter an OpenAI API key', 'error');
        return;
    }

    showStatus('Testing OpenAI connection...', 'info');

    // Send test request through background script to avoid CORS
    chrome.runtime.sendMessage({
        action: 'testOpenAI',
        apiKey: apiKey
    }, response => {
        console.log('OpenAI test response:', response);

        if (response && response.success) {
            showStatus('✅ OpenAI API key is valid!', 'success');
        } else {
            const errorMsg = response && response.error ? response.error : 'Unknown error';
            showStatus(`❌ Invalid OpenAI API key: ${errorMsg}`, 'error');
        }
    });
}

// Test n8n connection
async function testN8nConnection() {
    const n8nUrl = document.getElementById('n8n-url').value;

    if (!n8nUrl) {
        showStatus('Please enter an n8n URL', 'error');
        return;
    }

    showStatus('Testing n8n connection...', 'info');

    try {
        // Try to connect to the integration server which will test n8n
        const integrationServer = document.getElementById('integration-server').value || 'http://localhost:3000';

        const response = await fetch(`${integrationServer}/n8n/status`);

        if (response.ok) {
            showStatus('✅ n8n connection successful!', 'success');
        } else {
            showStatus('❌ Could not connect to n8n. Make sure your n8n instance is running.', 'error');
        }
    } catch (error) {
        showStatus('❌ Failed to test n8n connection. Is the integration server running?', 'error');
    }
}

// Test API connection after saving
async function testApiConnection(formData) {
    // Send message to background to refresh connections
    chrome.runtime.sendMessage({
        action: 'checkApiConnections'
    }, response => {
        if (response && response.connections) {
            console.log('API connections status:', response.connections);
        }
    });
}

// Simple test function for OpenAI
function testOpenAISimple() {
    console.log('testOpenAISimple called');

    const apiKeyInput = document.getElementById('openai-key');
    const resultDiv = document.getElementById('openai-test-result');

    if (!apiKeyInput) {
        console.error('API key input not found');
        return;
    }

    const apiKey = apiKeyInput.value.trim();
    console.log('API key length:', apiKey.length);

    // Show result div
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<span style="color: blue;">Testing API key...</span>';
    }

    if (!apiKey) {
        if (resultDiv) {
            resultDiv.innerHTML = '<span style="color: red;">Please enter an API key first</span>';
        }
        return;
    }

    // Send to background script
    console.log('Sending test request to background');
    chrome.runtime.sendMessage({
        action: 'testOpenAI',
        apiKey: apiKey
    }, function(response) {
        console.log('Received response:', response);

        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            if (resultDiv) {
                resultDiv.innerHTML = '<span style="color: red;">Error: ' + chrome.runtime.lastError.message + '</span>';
            }
            return;
        }

        if (resultDiv) {
            if (response && response.success) {
                resultDiv.innerHTML = '<span style="color: green;">✅ API key is valid! Found ' + (response.models || 0) + ' models</span>';
            } else {
                const error = response && response.error ? response.error : 'Unknown error';
                resultDiv.innerHTML = '<span style="color: red;">❌ ' + error + '</span>';
            }
        }
    });
}