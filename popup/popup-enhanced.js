// Enhanced Popup JavaScript with modern functionality

// State management
let settings = {};
let stats = {
    messages: 0,
    automations: 0
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    // Force popup dimensions first
    enforcePopupDimensions();

    await loadSettings();
    await updateConnectionStatus();
    await loadStats();
    setupEventListeners();
    applyTheme();
    animateStats();
});

// Enforce popup dimensions to prevent thin strip issue
function enforcePopupDimensions() {
    // Set minimum dimensions via CSS
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            width: 420px !important;
            min-width: 420px !important;
            max-width: 420px !important;
            height: 650px !important;
            min-height: 650px !important;
            max-height: 650px !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
        .container {
            width: 420px !important;
            height: 650px !important;
        }
    `;
    document.head.appendChild(style);

    // Log dimensions for debugging
    console.log('Popup initialized with dimensions: 420x650');
}

// Load settings from storage
async function loadSettings() {
    return new Promise((resolve) => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(['settings'], (result) => {
                settings = result.settings || {};
                resolve();
            });
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('settings');
            settings = stored ? JSON.parse(stored) : {};
            resolve();
        }
    });
}

// Update connection status indicators
async function updateConnectionStatus() {
    const openaiStatus = document.getElementById('openaiStatus');
    const n8nStatus = document.getElementById('n8nStatus');
    const serverStatus = document.getElementById('serverStatus');

    // OpenAI status
    if (settings.openaiKey) {
        openaiStatus.classList.add('connected');
        openaiStatus.classList.remove('not-configured');
    } else {
        openaiStatus.classList.add('not-configured');
        openaiStatus.classList.remove('connected');
    }

    // n8n status
    if (settings.n8nWebhookUrl) {
        // Test n8n connection
        testConnection(settings.n8nWebhookUrl).then(connected => {
            if (connected) {
                n8nStatus.classList.add('connected');
                n8nStatus.classList.remove('disconnected', 'not-configured');
            } else {
                n8nStatus.classList.add('disconnected');
                n8nStatus.classList.remove('connected', 'not-configured');
            }
        });
    } else {
        n8nStatus.classList.add('not-configured');
        n8nStatus.classList.remove('connected', 'disconnected');
    }

    // Server status
    if (settings.integrationServer) {
        testConnection(settings.integrationServer).then(connected => {
            if (connected) {
                serverStatus.classList.add('connected');
                serverStatus.classList.remove('disconnected', 'not-configured');
            } else {
                serverStatus.classList.add('disconnected');
                serverStatus.classList.remove('connected', 'not-configured');
            }
        });
    } else {
        serverStatus.classList.add('not-configured');
        serverStatus.classList.remove('connected', 'disconnected');
    }
}

// Test connection to a URL
async function testConnection(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, {
            method: 'OPTIONS',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Load usage stats
async function loadStats() {
    return new Promise((resolve) => {
        if (chrome?.storage?.local) {
            chrome.storage.local.get(['stats'], (result) => {
                stats = result.stats || { messages: 0, automations: 0 };
                updateStatsDisplay();
                resolve();
            });
        } else {
            const stored = localStorage.getItem('stats');
            stats = stored ? JSON.parse(stored) : { messages: 0, automations: 0 };
            updateStatsDisplay();
            resolve();
        }
    });
}

// Update stats display
function updateStatsDisplay() {
    const messagesEl = document.getElementById('messagesCount');
    const automationsEl = document.getElementById('automationsCount');

    if (messagesEl) messagesEl.textContent = stats.messages;
    if (automationsEl) automationsEl.textContent = stats.automations;
}

// Animate stats on load
function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        let currentValue = 0;
        const increment = Math.ceil(finalValue / 20);

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            stat.textContent = currentValue;
        }, 50);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Toggle assistant
    const toggleAssistant = document.getElementById('toggleAssistant');
    if (toggleAssistant) {
        toggleAssistant.addEventListener('change', handleToggleAssistant);
    }

    // Open chat
    const openChatBtn = document.getElementById('openChat');
    if (openChatBtn) {
        openChatBtn.addEventListener('click', handleOpenChat);
    }

    // Capture screenshot
    const captureBtn = document.getElementById('captureScreen');
    if (captureBtn) {
        captureBtn.addEventListener('click', handleCaptureScreen);
    }

    // Extract content
    const extractBtn = document.getElementById('extractContent');
    if (extractBtn) {
        extractBtn.addEventListener('click', handleExtractContent);
    }

    // Settings
    const settingsBtn = document.getElementById('openSettings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', handleOpenSettings);
    }

    // Documentation
    const docsBtn = document.getElementById('openDocs');
    if (docsBtn) {
        docsBtn.addEventListener('click', handleOpenDocs);
    }

    // Help link
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleOpenDocs();
        });
    }

    // Feedback link
    const feedbackLink = document.getElementById('feedbackLink');
    if (feedbackLink) {
        feedbackLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleFeedback();
        });
    }
}

// Handler functions
function handleToggleAssistant(e) {
    const isEnabled = e.target.checked;
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');

    if (isEnabled) {
        statusDot.classList.add('active');
        statusDot.classList.remove('inactive');
        statusText.textContent = 'AI Assistant Active';
        showMessage('AI Assistant enabled', 'success');
    } else {
        statusDot.classList.remove('active');
        statusDot.classList.add('inactive');
        statusText.textContent = 'AI Assistant Inactive';
        showMessage('AI Assistant disabled', 'warning');
    }

    // Save state
    if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ assistantEnabled: isEnabled });
    } else {
        localStorage.setItem('assistantEnabled', isEnabled);
    }

    // Send message to content script
    if (chrome && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'toggleAssistant',
                    enabled: isEnabled
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Could not send message to content script');
                    }
                });
            }
        });
    }
}

async function handleOpenChat() {
    // Send message to content script to open chat
    if (chrome && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'openChat'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        showMessage('Please refresh the page first', 'warning');
                        return;
                    }
                    if (response && response.success) {
                        showMessage('Chat window opened', 'success');
                        window.close();
                    } else {
                        showMessage('Failed to open chat', 'error');
                    }
                });
            }
        });
    } else {
        showMessage('Extension API not available', 'error');
    }
}

async function handleCaptureScreen() {
    showMessage('Capturing screenshot...', 'info');

    if (chrome && chrome.tabs && chrome.tabs.captureVisibleTab) {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                showMessage('Screenshot failed', 'error');
                return;
            }

            // Save to clipboard or download
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `screenshot-${Date.now()}.png`;
            link.click();

            showMessage('Screenshot captured!', 'success');
        });
    } else {
        showMessage('Screenshot not available', 'error');
    }
}

async function handleExtractContent() {
    showMessage('Extracting content...', 'info');

    if (chrome && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'extractContent'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        showMessage('Please refresh the page first', 'warning');
                        return;
                    }
                    if (response && response.content) {
                        // Copy to clipboard
                        navigator.clipboard.writeText(response.content).then(() => {
                            showMessage('Content copied to clipboard!', 'success');
                        }).catch(() => {
                            showMessage('Failed to copy content', 'error');
                        });
                    } else {
                        showMessage('No content to extract', 'warning');
                    }
                });
            }
        });
    } else {
        showMessage('Extension API not available', 'error');
    }
}

function handleOpenSettings() {
    if (chrome?.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options/options.html'));
    }
    window.close();
}

function handleOpenDocs() {
    if (chrome && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('AI_ASSISTANT_SETUP.md')
        });
        window.close();
    } else {
        window.open('AI_ASSISTANT_SETUP.md', '_blank');
    }
}

function handleFeedback() {
    if (chrome && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({
            url: 'https://github.com/n8n-io/n8n/issues'
        });
        window.close();
    } else {
        window.open('https://github.com/n8n-io/n8n/issues', '_blank');
    }
}

// Show message function
function showMessage(text, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageIcon = document.getElementById('messageIcon');

    if (!messageBox || !messageText || !messageIcon) return;

    // Set message text
    messageText.textContent = text;

    // Set icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    messageIcon.textContent = icons[type] || icons.info;

    // Set class for styling
    messageBox.className = `message ${type}`;

    // Show message with animation
    setTimeout(() => {
        messageBox.classList.remove('hidden');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// Apply theme based on system preference
function applyTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
}

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});