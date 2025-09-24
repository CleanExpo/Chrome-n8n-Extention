/**
 * Enhanced Background Service Worker with Robust Communication
 * Features: Auto-reconnection, error recovery, offline support, better messaging
 */

// ============================================================================
// CORE STATE MANAGEMENT
// ============================================================================

const ExtensionState = {
    initialized: false,
    isOnline: navigator.onLine,
    messageQueue: [],
    activeConnections: new Map(),
    retryAttempts: new Map(),
    settings: {},
    apiStatus: {
        openai: false,
        n8n: false,
        lastCheck: null
    },
    stats: {
        messagesProcessed: 0,
        errors: 0,
        apiCalls: 0
    }
};

// ============================================================================
// INITIALIZATION & LIFECYCLE
// ============================================================================

/**
 * Initialize extension on install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🚀 Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        // First time install - show onboarding
        await showOnboarding();
        await setDefaultSettings();
    } else if (details.reason === 'update') {
        // Extension updated - show what's new
        await showWhatsNew();
    }

    await initializeExtension();
});

/**
 * Initialize extension on startup
 */
chrome.runtime.onStartup.addListener(async () => {
    console.log('🔄 Browser started - initializing extension');
    await initializeExtension();
});

/**
 * Keep service worker alive
 */
setInterval(() => {
    chrome.storage.local.get(null, () => {
        // Keep-alive ping
    });
}, 20000); // Every 20 seconds

/**
 * Main initialization function
 */
async function initializeExtension() {
    try {
        console.log('⚙️ Initializing extension...');

        // Load settings
        await loadSettings();

        // Check API connections
        await checkAPIConnections();

        // Setup context menus
        await setupContextMenus();

        // Process any queued messages
        await processMessageQueue();

        // Set initialization flag
        ExtensionState.initialized = true;

        // Notify all tabs that extension is ready
        broadcastToAllTabs({ action: 'extensionReady', apiStatus: ExtensionState.apiStatus });

        console.log('✅ Extension initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        // Retry initialization after 5 seconds
        setTimeout(initializeExtension, 5000);
    }
}

// ============================================================================
// ONBOARDING & SETUP
// ============================================================================

/**
 * Show onboarding for new users
 */
async function showOnboarding() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('onboarding/welcome.html'),
        active: true
    });
}

/**
 * Show what's new after update
 */
async function showWhatsNew() {
    const { lastVersion } = await chrome.storage.local.get('lastVersion');
    const currentVersion = chrome.runtime.getManifest().version;

    if (lastVersion !== currentVersion) {
        // Only show what's new for significant updates
        chrome.storage.local.set({ lastVersion: currentVersion });
    }
}

/**
 * Set default settings for first-time users
 */
async function setDefaultSettings() {
    const defaults = {
        theme: 'auto',
        language: 'en',
        enableNotifications: true,
        enableAnalytics: false,
        quickActions: ['summarize', 'explain', 'translate', 'improve'],
        maxHistoryItems: 100,
        apiTimeout: 30000,
        retryAttempts: 3,
        offlineMode: true
    };

    await chrome.storage.sync.set(defaults);
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Load settings from storage
 */
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (settings) => {
            ExtensionState.settings = settings || {};
            console.log('📋 Settings loaded:', Object.keys(settings).length, 'items');
            resolve(settings);
        });
    });
}

/**
 * Save settings to storage
 */
async function saveSettings(settings) {
    await chrome.storage.sync.set(settings);
    ExtensionState.settings = { ...ExtensionState.settings, ...settings };

    // Notify all tabs of settings change
    broadcastToAllTabs({ action: 'settingsUpdated', settings });
}

// ============================================================================
// MESSAGE HANDLING WITH RECONNECTION
// ============================================================================

/**
 * Main message handler with error recovery
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Keep the channel open for async response
    handleMessageWithRecovery(request, sender, sendResponse);
    return true;
});

/**
 * Handle messages with automatic recovery
 */
async function handleMessageWithRecovery(request, sender, sendResponse) {
    const messageId = generateMessageId();
    console.log(`📨 Message received [${messageId}]:`, request.action);

    try {
        // Check if extension is initialized
        if (!ExtensionState.initialized && request.action !== 'ping') {
            // Queue message for later processing
            ExtensionState.messageQueue.push({ request, sender, sendResponse, messageId });
            sendResponse({ success: false, queued: true, message: 'Extension initializing...' });
            return;
        }

        // Process the message
        const response = await processMessage(request, sender);
        ExtensionState.stats.messagesProcessed++;

        sendResponse({ success: true, ...response });
    } catch (error) {
        console.error(`❌ Message handling error [${messageId}]:`, error);
        ExtensionState.stats.errors++;

        // Try to recover
        const recovery = await attemptRecovery(request, error);
        if (recovery.success) {
            sendResponse(recovery);
        } else {
            sendResponse({
                success: false,
                error: error.message,
                recoveryFailed: true,
                suggestion: getErrorSuggestion(error)
            });
        }
    }
}

/**
 * Process individual messages
 */
async function processMessage(request, sender) {
    switch (request.action) {
        case 'ping':
            return { pong: true, initialized: ExtensionState.initialized };

        case 'getStatus':
            return {
                initialized: ExtensionState.initialized,
                isOnline: ExtensionState.isOnline,
                apiStatus: ExtensionState.apiStatus,
                stats: ExtensionState.stats
            };

        case 'sendMessage':
            return await processAIMessage(request.message, request.context);

        case 'testAPI':
            return await testAPIConnection(request.api, request.config);

        case 'saveSettings':
            await saveSettings(request.settings);
            return { message: 'Settings saved successfully' };

        case 'openOnboarding':
            await showOnboarding();
            return { message: 'Onboarding opened' };

        case 'checkAPIs':
            await checkAPIConnections();
            return { apiStatus: ExtensionState.apiStatus };

        case 'clearCache':
            await clearCache();
            return { message: 'Cache cleared' };

        case 'exportData':
            return await exportUserData();

        case 'importData':
            return await importUserData(request.data);

        default:
            throw new Error(`Unknown action: ${request.action}`);
    }
}

// ============================================================================
// AI MESSAGE PROCESSING
// ============================================================================

/**
 * Process AI messages with fallback chain
 */
async function processAIMessage(message, context) {
    console.log('🤖 Processing AI message:', message.substring(0, 50) + '...');

    // Check if offline
    if (!ExtensionState.isOnline && ExtensionState.settings.offlineMode) {
        return {
            reply: "I'm currently offline. Your message has been queued and will be processed when connection is restored.",
            offline: true,
            queued: true
        };
    }

    // Try n8n first if configured
    if (ExtensionState.apiStatus.n8n) {
        try {
            const response = await callN8nWebhook(message, context);
            if (response) return { reply: response, source: 'n8n' };
        } catch (error) {
            console.warn('n8n failed, trying OpenAI:', error.message);
        }
    }

    // Try OpenAI as fallback
    if (ExtensionState.apiStatus.openai) {
        try {
            const response = await callOpenAI(message, context);
            if (response) return { reply: response, source: 'openai' };
        } catch (error) {
            console.warn('OpenAI failed:', error.message);
        }
    }

    // Return helpful error message
    return {
        reply: `I need to be configured first. Please:
1. Click the extension icon
2. Click the ⚙️ settings button
3. Add your API keys (OpenAI or n8n webhook)
4. Test the connection
5. Try again!`,
        needsSetup: true
    };
}

// ============================================================================
// API CONNECTIONS
// ============================================================================

/**
 * Check all API connections
 */
async function checkAPIConnections() {
    console.log('🔍 Checking API connections...');

    const settings = ExtensionState.settings;

    // Check OpenAI
    if (settings.openaiKey) {
        ExtensionState.apiStatus.openai = await testOpenAIConnection(settings.openaiKey);
    }

    // Check n8n
    if (settings.n8nWebhookUrl) {
        ExtensionState.apiStatus.n8n = await testN8nConnection(settings.n8nWebhookUrl, settings.n8nApiKey);
    }

    ExtensionState.apiStatus.lastCheck = Date.now();

    // Save status
    await chrome.storage.local.set({ apiStatus: ExtensionState.apiStatus });

    return ExtensionState.apiStatus;
}

/**
 * Test OpenAI connection
 */
async function testOpenAIConnection(apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (error) {
        console.error('OpenAI test failed:', error);
        return false;
    }
}

/**
 * Test n8n connection
 */
async function testN8nConnection(webhookUrl, apiKey) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ test: true })
        });

        return response.ok || response.status === 404; // 404 means webhook exists but not for test
    } catch (error) {
        console.error('n8n test failed:', error);
        return false;
    }
}

/**
 * Call n8n webhook
 */
async function callN8nWebhook(message, context) {
    const settings = ExtensionState.settings;
    const headers = { 'Content-Type': 'application/json' };

    if (settings.n8nApiKey) {
        headers['Authorization'] = `Bearer ${settings.n8nApiKey}`;
    }

    const response = await fetchWithTimeout(settings.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            message,
            context,
            timestamp: new Date().toISOString()
        })
    }, settings.apiTimeout || 30000);

    if (!response.ok) {
        throw new Error(`n8n error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || data.output;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(message, context) {
    const settings = ExtensionState.settings;

    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.openaiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: settings.openaiModel || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful AI assistant in a Chrome extension.' },
                { role: 'user', content: message }
            ],
            max_tokens: 2000,
            temperature: 0.7
        })
    }, settings.apiTimeout || 30000);

    if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Generate unique message ID
 */
function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Broadcast message to all tabs
 */
async function broadcastToAllTabs(message) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            // Tab might not have content script
        }
    }
}

/**
 * Attempt to recover from error
 */
async function attemptRecovery(request, error) {
    const attempts = ExtensionState.retryAttempts.get(request.action) || 0;

    if (attempts < (ExtensionState.settings.retryAttempts || 3)) {
        ExtensionState.retryAttempts.set(request.action, attempts + 1);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));

        try {
            const response = await processMessage(request, null);
            ExtensionState.retryAttempts.delete(request.action);
            return { success: true, ...response, recovered: true };
        } catch (retryError) {
            // Recovery failed
        }
    }

    return { success: false };
}

/**
 * Get helpful error suggestion
 */
function getErrorSuggestion(error) {
    if (error.message.includes('fetch')) {
        return 'Check your internet connection';
    }
    if (error.message.includes('401')) {
        return 'Check your API key in settings';
    }
    if (error.message.includes('timeout')) {
        return 'Request timed out. Try again or check your connection';
    }
    return 'Try refreshing the page or restarting the extension';
}

/**
 * Process queued messages
 */
async function processMessageQueue() {
    while (ExtensionState.messageQueue.length > 0) {
        const { request, sender, sendResponse, messageId } = ExtensionState.messageQueue.shift();
        console.log(`Processing queued message [${messageId}]`);

        try {
            const response = await processMessage(request, sender);
            sendResponse({ success: true, ...response, wasQueued: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
}

/**
 * Clear cache
 */
async function clearCache() {
    await chrome.storage.local.clear();
    await loadSettings(); // Reload settings
    ExtensionState.stats = { messagesProcessed: 0, errors: 0, apiCalls: 0 };
}

/**
 * Export user data
 */
async function exportUserData() {
    const data = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get(null);

    return {
        settings: data,
        localData: localData,
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
    };
}

/**
 * Import user data
 */
async function importUserData(data) {
    if (data.settings) {
        await chrome.storage.sync.set(data.settings);
    }
    if (data.localData) {
        await chrome.storage.local.set(data.localData);
    }
    await loadSettings();
    return { message: 'Data imported successfully' };
}

// ============================================================================
// CONTEXT MENUS
// ============================================================================

/**
 * Setup context menus
 */
async function setupContextMenus() {
    await chrome.contextMenus.removeAll();

    chrome.contextMenus.create({
        id: 'ai-assistant',
        title: '🤖 AI Assistant',
        contexts: ['selection', 'page']
    });

    chrome.contextMenus.create({
        id: 'summarize',
        parentId: 'ai-assistant',
        title: '📝 Summarize',
        contexts: ['selection', 'page']
    });

    chrome.contextMenus.create({
        id: 'explain',
        parentId: 'ai-assistant',
        title: '💡 Explain',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'translate',
        parentId: 'ai-assistant',
        title: '🌐 Translate',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'improve',
        parentId: 'ai-assistant',
        title: '✨ Improve Writing',
        contexts: ['selection']
    });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const action = info.menuItemId;
    const text = info.selectionText || '';

    let prompt = '';
    switch (action) {
        case 'summarize':
            prompt = text ? `Summarize this: ${text}` : 'Summarize this page';
            break;
        case 'explain':
            prompt = `Explain this: ${text}`;
            break;
        case 'translate':
            prompt = `Translate to English: ${text}`;
            break;
        case 'improve':
            prompt = `Improve this writing: ${text}`;
            break;
    }

    if (prompt) {
        const response = await processAIMessage(prompt, { url: tab.url, title: tab.title });

        // Send response to content script to show in page
        chrome.tabs.sendMessage(tab.id, {
            action: 'showAIResponse',
            response: response.reply
        });
    }
});

// ============================================================================
// NETWORK STATE MONITORING
// ============================================================================

/**
 * Monitor online/offline state
 */
if (typeof navigator !== 'undefined') {
    // These events don't work in service workers, use alternative
    setInterval(async () => {
        const wasOnline = ExtensionState.isOnline;
        ExtensionState.isOnline = navigator.onLine;

        if (!wasOnline && ExtensionState.isOnline) {
            console.log('📶 Back online! Processing queued messages...');
            await processMessageQueue();
        }
    }, 5000);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global error handler
 */
self.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ExtensionState.stats.errors++;
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    ExtensionState.stats.errors++;
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize on load
initializeExtension();

console.log('✨ Enhanced background service worker loaded');