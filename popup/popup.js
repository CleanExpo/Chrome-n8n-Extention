// Popup JavaScript - Main functionality for the n8n AI Assistant popup

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize UI elements
    const assistantToggle = document.getElementById('assistant-toggle');
    const openAssistantBtn = document.getElementById('open-assistant-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const refreshConnectionsBtn = document.getElementById('refresh-connections-btn');
    const optionsLink = document.getElementById('options-link');
    const helpLink = document.getElementById('help-link');
    const statusText = document.getElementById('status-text');
    const mainStatusDot = document.getElementById('main-status-dot');
    const pageCount = document.getElementById('page-count');
    const actionCount = document.getElementById('action-count');
    const message = document.getElementById('message');

    // Connection status dots
    const connectionDots = {
        n8n: document.getElementById('n8n-status'),
        websocket: document.getElementById('ws-status'),
        google: document.getElementById('google-status'),
        openai: document.getElementById('openai-status')
    };

    // Load current state from storage
    async function loadState() {
        try {
            const result = await chrome.storage.sync.get([
                'assistantEnabled',
                'pageCount',
                'actionCount'
            ]);

            // Update UI based on stored state
            const isEnabled = result.assistantEnabled !== false; // Default to true if not set
            updateAssistantStatus(isEnabled);
            assistantToggle.checked = isEnabled;

            pageCount.textContent = result.pageCount || 0;
            actionCount.textContent = result.actionCount || 0;

            // Check connections
            checkApiConnections();
        } catch (error) {
            console.error('Error loading state:', error);
            showMessage('Error loading settings', 'error');
        }
    }

    // Update assistant status indicator
    function updateAssistantStatus(enabled) {
        if (enabled) {
            statusText.textContent = 'Active';
            mainStatusDot.classList.add('active');
            mainStatusDot.classList.remove('inactive');
        } else {
            statusText.textContent = 'Inactive';
            mainStatusDot.classList.remove('active');
            mainStatusDot.classList.add('inactive');
        }
    }

    // Check API connections
    async function checkApiConnections() {
        try {
            chrome.runtime.sendMessage({
                action: 'checkApiConnections'
            }, response => {
                if (response && response.connections) {
                    updateConnectionStatus(response.connections);
                }
            });
        } catch (error) {
            console.error('Error checking connections:', error);
            // Set all to disconnected on error
            Object.values(connectionDots).forEach(dot => {
                if (dot) {
                    dot.className = 'connection-dot disconnected';
                }
            });
        }
    }

    // Update connection status indicators
    function updateConnectionStatus(connections) {
        // Update n8n status
        if (connectionDots.n8n && connections.n8n) {
            connectionDots.n8n.className = `connection-dot ${connections.n8n.status}`;
            connectionDots.n8n.title = `n8n: ${connections.n8n.status}`;
        }

        // Update WebSocket status
        if (connectionDots.websocket && connections.websocket) {
            connectionDots.websocket.className = `connection-dot ${connections.websocket.status}`;
            connectionDots.websocket.title = `WebSocket: ${connections.websocket.status}`;
        }

        // Update Google API status
        if (connectionDots.google && connections.google) {
            connectionDots.google.className = `connection-dot ${connections.google.status}`;
            connectionDots.google.title = `Google API: ${connections.google.status}`;
        }

        // Update OpenAI status
        if (connectionDots.openai && connections.openai) {
            connectionDots.openai.className = `connection-dot ${connections.openai.status}`;
            connectionDots.openai.title = `OpenAI: ${connections.openai.status}`;
        }
    }

    // Show message to user
    function showMessage(text, type = 'info') {
        message.textContent = text;
        message.className = `message ${type}`;
        message.classList.remove('hidden');

        setTimeout(() => {
            message.classList.add('hidden');
        }, 3000);
    }

    // Toggle assistant on/off
    assistantToggle.addEventListener('change', async function() {
        try {
            const newState = assistantToggle.checked;

            // Update storage
            await chrome.storage.sync.set({ assistantEnabled: newState });

            // Send message to background script and all tabs
            chrome.runtime.sendMessage({
                action: 'toggleAssistant',
                enabled: newState
            });

            // Notify all tabs to show/hide widget
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'toggleWidget',
                        enabled: newState
                    }).catch(() => {
                        // Ignore errors for tabs without content script
                    });
                });
            });

            updateAssistantStatus(newState);
            showMessage(newState ? 'Assistant enabled' : 'Assistant disabled', 'info');

            // Increment action count
            const actionResult = await chrome.storage.sync.get(['actionCount']);
            const newActionCount = (actionResult.actionCount || 0) + 1;
            await chrome.storage.sync.set({ actionCount: newActionCount });
            actionCount.textContent = newActionCount;
        } catch (error) {
            console.error('Error toggling assistant:', error);
            showMessage('Could not toggle assistant', 'error');
        }
    });

    // Open assistant in current tab
    openAssistantBtn.addEventListener('click', async function() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to content script to open assistant
            chrome.tabs.sendMessage(tab.id, {
                action: 'openAssistant'
            });

            // Close popup
            window.close();
        } catch (error) {
            console.error('Error opening assistant:', error);
            showMessage('Could not open assistant', 'error');
        }
    });

    // Open settings page
    settingsBtn.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    // Analyze current page
    analyzeBtn.addEventListener('click', async function() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: 'analyze',
                url: tab.url
            });

            showMessage('Analyzing page...', 'info');

            // Increment page count
            const result = await chrome.storage.sync.get(['pageCount']);
            const newCount = (result.pageCount || 0) + 1;
            await chrome.storage.sync.set({ pageCount: newCount });
            pageCount.textContent = newCount;
        } catch (error) {
            console.error('Error analyzing page:', error);
            showMessage('Could not analyze page', 'error');
        }
    });

    // Refresh connections
    refreshConnectionsBtn.addEventListener('click', async function() {
        showMessage('Refreshing connections...', 'info');
        await checkApiConnections();
    });

    // Open options page
    optionsLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    // Show help
    helpLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-repo/n8n-assistant' });
    });

    // Listen for messages from background or content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateStats') {
            if (request.pageCount !== undefined) {
                pageCount.textContent = request.pageCount;
            }
            if (request.actionCount !== undefined) {
                actionCount.textContent = request.actionCount;
            }
        } else if (request.action === 'connectionsUpdated') {
            updateConnectionStatus(request.connections);
        }
    });

    // Periodically check connections (only while popup is open)
    const connectionCheckInterval = setInterval(checkApiConnections, 15000);

    // Clean up interval when popup closes
    window.addEventListener('unload', () => {
        clearInterval(connectionCheckInterval);
    });

    // Initialize on load
    loadState();
});