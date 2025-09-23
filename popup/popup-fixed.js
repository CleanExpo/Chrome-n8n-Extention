/**
 * Fixed Popup JavaScript - Comprehensive implementation
 * Handles all functionality with proper error handling
 */

// Initialize immediately to prevent any rendering issues
document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
});

async function initializePopup() {
    try {
        // Force dimensions first
        enforceDimensions();

        // Initialize all components
        await loadSettings();
        await checkConnections();
        await loadStatistics();
        setupEventListeners();

        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Popup initialization error:', error);
        // Continue anyway - don't break the popup
    }
}

function enforceDimensions() {
    // Ensure popup maintains correct size
    document.documentElement.style.width = '420px';
    document.documentElement.style.height = '650px';
    document.body.style.width = '420px';
    document.body.style.height = '650px';
}

async function loadSettings() {
    return new Promise((resolve) => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get([
                'enabled',
                'openaiKey',
                'n8nWebhookUrl',
                'integrationServer',
                'context7ApiKey'
            ], (result) => {
                updateUIWithSettings(result);
                resolve(result);
            });
        } else {
            // Fallback for testing
            const mockSettings = {
                enabled: true,
                openaiKey: '',
                n8nWebhookUrl: '',
                integrationServer: '',
                context7ApiKey: ''
            };
            updateUIWithSettings(mockSettings);
            resolve(mockSettings);
        }
    });
}

function updateUIWithSettings(settings) {
    const toggle = document.getElementById('toggleAssistant');
    if (toggle) {
        toggle.checked = settings.enabled !== false;
    }
}

async function checkConnections() {
    // Check each service connection
    const connections = {
        'openai-status': await checkOpenAI(),
        'n8n-status': await checkN8n(),
        'context7-status': await checkContext7(),
        'integration-status': await checkIntegration()
    };

    // Update UI
    for (const [id, status] of Object.entries(connections)) {
        const element = document.getElementById(id);
        if (element) {
            if (status) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    }
}

async function checkOpenAI() {
    try {
        const result = await chrome.storage.sync.get(['openaiKey']);
        return !!(result.openaiKey && result.openaiKey.startsWith('sk-'));
    } catch {
        return false;
    }
}

async function checkN8n() {
    try {
        const result = await chrome.storage.sync.get(['n8nWebhookUrl']);
        return !!(result.n8nWebhookUrl && result.n8nWebhookUrl.includes('n8n'));
    } catch {
        return false;
    }
}

async function checkContext7() {
    try {
        const result = await chrome.storage.sync.get(['context7ApiKey']);
        return !!(result.context7ApiKey && result.context7ApiKey.length > 0);
    } catch {
        return false;
    }
}

async function checkIntegration() {
    try {
        const result = await chrome.storage.sync.get(['integrationServer']);
        return !!(result.integrationServer &&
                 result.integrationServer !== 'http://localhost:3000' &&
                 !result.integrationServer.includes('localhost'));
    } catch {
        return false;
    }
}

async function loadStatistics() {
    try {
        const stats = await chrome.storage.sync.get(['messageCount', 'automationCount']);

        const messageElement = document.getElementById('messageCount');
        if (messageElement) {
            messageElement.textContent = stats.messageCount || '0';
        }

        const automationElement = document.getElementById('automationCount');
        if (automationElement) {
            automationElement.textContent = stats.automationCount || '0';
        }
    } catch (error) {
        console.log('Could not load statistics:', error);
    }
}

function setupEventListeners() {
    // Toggle Assistant
    const toggle = document.getElementById('toggleAssistant');
    if (toggle) {
        toggle.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            await chrome.storage.sync.set({ enabled });

            // Send message to background
            chrome.runtime.sendMessage({
                action: 'toggleExtension',
                enabled: enabled
            });
        });
    }

    // Open Chat
    const openChatBtn = document.getElementById('openChat');
    if (openChatBtn) {
        openChatBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openAssistant' });
            window.close();
        });
    }

    // Capture Screenshot
    const captureBtn = document.getElementById('captureScreen');
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            try {
                chrome.runtime.sendMessage({ action: 'captureScreen' });

                // Visual feedback
                captureBtn.textContent = '✓ Captured!';
                setTimeout(() => {
                    captureBtn.innerHTML = '<span>📸</span><span>Capture Screenshot</span>';
                }, 2000);
            } catch (error) {
                console.error('Screenshot error:', error);
            }
        });
    }

    // Extract Content
    const extractBtn = document.getElementById('extractContent');
    if (extractBtn) {
        extractBtn.addEventListener('click', async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0]) {
                    chrome.runtime.sendMessage({
                        action: 'extractContent',
                        tabId: tabs[0].id
                    });

                    // Visual feedback
                    extractBtn.textContent = '✓ Extracted!';
                    setTimeout(() => {
                        extractBtn.innerHTML = '<span>📄</span><span>Extract Page Content</span>';
                    }, 2000);
                }
            } catch (error) {
                console.error('Extract error:', error);
            }
        });
    }

    // Open Settings
    const settingsBtn = document.getElementById('openSettings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    // Open Documentation
    const docsBtn = document.getElementById('openDocs');
    if (docsBtn) {
        docsBtn.addEventListener('click', () => {
            chrome.tabs.create({
                url: 'https://github.com/CleanExpo/Chrome-n8n-Extention/wiki'
            });
        });
    }

    // Help Link
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({
                url: chrome.runtime.getURL('API_SETUP_GUIDE.md')
            });
        });
    }
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateStats') {
        loadStatistics();
    }
});

// Refresh connections every 5 seconds
setInterval(checkConnections, 5000);