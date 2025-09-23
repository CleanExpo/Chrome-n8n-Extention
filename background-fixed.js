/**
 * Background Service Worker - Complete Rewrite with Proper Error Handling
 * This is a production-ready implementation with comprehensive error management
 * Private extension for phill.mcgurk@gmail.com and zenithfresh25@gmail.com
 */

// Authorized accounts configuration
const AUTHORIZED_ACCOUNTS = [
    'phill.mcgurk@gmail.com',
    'zenithfresh25@gmail.com'
];

// Import all required modules with error handling
try {
    importScripts(
        'private-auth.js',
        'websocket-client-fixed.js',
        'screenshot.js',
        'context7-integration.js',
        'n8n-docs-integration.js',
        'chrome-docs-integration.js',
        'opal-docs-integration.js',
        'seo-analysis.js',
        'seo-integration.js'
    );
    console.log('All modules imported successfully');
} catch (error) {
    console.warn('Some modules failed to load:', error.message);
    // Continue execution - modules are optional
}

// Global state management
const ExtensionState = {
    enabled: true,
    stats: {
        messageCount: 0,
        automationCount: 0,
        errors: 0
    },
    apiStatus: {
        openai: false,
        n8n: false,
        context7: false,
        integration: false
    },
    settings: {},
    wsClient: null,
    screenCapture: null
};

// API Configuration with proper defaults and validation
const APIConfig = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        timeout: 30000,
        maxRetries: 2
    },
    n8n: {
        timeout: 10000,
        maxRetries: 1
    },
    context7: {
        baseUrl: 'https://api.context7.com',
        timeout: 5000,
        maxRetries: 1
    },
    integration: {
        defaultUrl: 'http://localhost:3000',
        timeout: 5000,
        maxRetries: 0
    }
};

/**
 * Initialize extension on install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);

    try {
        // Initialize core services
        await initializeServices();

        // Set default settings on first install
        if (details.reason === 'install') {
            await setDefaultSettings();
            chrome.runtime.openOptionsPage();
        }

        // Create context menus
        await createContextMenus();

        console.log('Extension initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        // Continue anyway - don't break the extension
    }
});

/**
 * Initialize all services with error handling
 */
async function initializeServices() {
    try {
        // Initialize WebSocket client (optional)
        if (typeof WebSocketClient !== 'undefined') {
            ExtensionState.wsClient = new WebSocketClient();
        }

        // Initialize screenshot capture
        if (typeof ScreenCapture !== 'undefined') {
            ExtensionState.screenCapture = new ScreenCapture();
        }

        // Load user settings
        await loadSettings();

        // Check API connections
        await checkAllAPIConnections();
    } catch (error) {
        console.error('Service initialization error:', error);
    }
}

/**
 * Set default settings
 */
async function setDefaultSettings() {
    const defaults = {
        enabled: true,
        messageCount: 0,
        automationCount: 0,
        theme: 'auto',
        floatingPosition: 'bottom-right',
        openaiModel: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7,
        // Leave API keys empty - user must configure
        openaiKey: '',
        n8nWebhookUrl: '',
        integrationServer: '',
        context7ApiKey: ''
    };

    await chrome.storage.sync.set(defaults);
}

/**
 * Load settings with validation
 */
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (result) => {
            ExtensionState.settings = result || {};
            resolve(ExtensionState.settings);
        });
    });
}

/**
 * Check all API connections without throwing errors
 */
async function checkAllAPIConnections() {
    // Check OpenAI
    ExtensionState.apiStatus.openai = await checkOpenAIConnection();

    // Check n8n (only if configured)
    ExtensionState.apiStatus.n8n = await checkN8nConnection();

    // Check Context7 (only if configured)
    ExtensionState.apiStatus.context7 = await checkContext7Connection();

    // Check Integration Server (only if not localhost)
    ExtensionState.apiStatus.integration = await checkIntegrationConnection();

    console.log('API Status:', ExtensionState.apiStatus);
}

/**
 * Check OpenAI connection
 */
async function checkOpenAIConnection() {
    try {
        const apiKey = ExtensionState.settings.openaiKey;
        if (!apiKey || !apiKey.startsWith('sk-')) {
            return false;
        }

        // Quick validation - don't make actual API call unless needed
        return true;
    } catch (error) {
        console.log('OpenAI check failed:', error.message);
        return false;
    }
}

/**
 * Check n8n connection
 */
async function checkN8nConnection() {
    try {
        const url = ExtensionState.settings.n8nWebhookUrl;
        if (!url || !url.includes('n8n')) {
            return false;
        }

        // Valid URL pattern
        return true;
    } catch (error) {
        console.log('n8n check failed:', error.message);
        return false;
    }
}

/**
 * Check Context7 connection
 */
async function checkContext7Connection() {
    try {
        const apiKey = ExtensionState.settings.context7ApiKey;
        if (!apiKey) {
            return false;
        }

        // Has API key
        return true;
    } catch (error) {
        console.log('Context7 check failed:', error.message);
        return false;
    }
}

/**
 * Check Integration Server connection
 */
async function checkIntegrationConnection() {
    try {
        const url = ExtensionState.settings.integrationServer;
        if (!url || url === APIConfig.integration.defaultUrl || url.includes('localhost')) {
            return false;
        }

        // Has custom URL
        return true;
    } catch (error) {
        console.log('Integration check failed:', error.message);
        return false;
    }
}

/**
 * Create context menus with error handling
 */
async function createContextMenus() {
    try {
        // Remove existing menus
        await chrome.contextMenus.removeAll();

        // Create new menus
        chrome.contextMenus.create({
            id: 'analyze-selection',
            title: 'Analyze with n8n AI',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'capture-area',
            title: 'Capture Screenshot',
            contexts: ['page', 'image']
        });

        chrome.contextMenus.create({
            id: 'extract-content',
            title: 'Extract Page Content',
            contexts: ['page']
        });
    } catch (error) {
        console.error('Context menu error:', error);
    }
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle async responses properly
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async response
});

/**
 * Main message handler with comprehensive error handling
 */
async function handleMessage(request, sender, sendResponse) {
    try {
        console.log('Handling message:', request.action);

        switch (request.action) {
            case 'toggleExtension':
                ExtensionState.enabled = request.enabled;
                await chrome.storage.sync.set({ enabled: request.enabled });
                sendResponse({ success: true });
                break;

            case 'openAssistant':
                await openAssistant(sender.tab);
                sendResponse({ success: true });
                break;

            case 'sendMessage':
                const reply = await handleAssistantMessage(request.message, request.context);
                sendResponse({ success: true, reply });
                break;

            case 'captureScreen':
                const screenshot = await captureScreenshot();
                sendResponse({ success: true, screenshot });
                break;

            case 'extractContent':
                const content = await extractPageContent(request.tabId);
                sendResponse({ success: true, content });
                break;

            case 'testAPI':
                const result = await testAPIConnection(request.api, request.config);
                sendResponse({ success: result.success, message: result.message });
                break;

            case 'getStats':
                sendResponse({
                    success: true,
                    stats: ExtensionState.stats,
                    apiStatus: ExtensionState.apiStatus
                });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error(`Error handling ${request.action}:`, error);
        sendResponse({
            success: false,
            error: error.message || 'An error occurred'
        });
    }
}

/**
 * Handle AI assistant messages with proper fallback chain
 */
async function handleAssistantMessage(message, context) {
    try {
        // Update statistics
        ExtensionState.stats.messageCount++;
        await chrome.storage.sync.set({ messageCount: ExtensionState.stats.messageCount });

        // Load latest settings
        await loadSettings();

        // Build enhanced message with documentation context
        const enhancedMessage = await buildEnhancedMessage(message);

        // Try API chain with proper fallbacks
        let reply = null;

        // 1. Try n8n workflow (if configured)
        if (ExtensionState.apiStatus.n8n) {
            reply = await tryN8nWorkflow(enhancedMessage, context);
        }

        // 2. Try OpenAI directly (if configured and no reply yet)
        if (!reply && ExtensionState.apiStatus.openai) {
            reply = await tryOpenAIDirect(enhancedMessage, context);
        }

        // 3. Fallback message if nothing worked
        if (!reply) {
            reply = getFallbackMessage();
        }

        return reply;
    } catch (error) {
        console.error('Assistant message error:', error);
        ExtensionState.stats.errors++;
        return 'I encountered an error processing your request. Please check your API configuration in the extension settings.';
    }
}

/**
 * Build enhanced message with documentation context
 */
async function buildEnhancedMessage(message) {
    let enhanced = message;

    try {
        // Add Chrome Extension docs if relevant
        if (hasKeywords(message, ['chrome', 'extension', 'manifest', 'popup', 'content', 'background'])) {
            const chromeDocs = await getChromeDocs(message);
            if (chromeDocs) {
                enhanced += `\n\n[Chrome Extension Context]:\n${chromeDocs}`;
            }
        }

        // Add n8n docs if relevant
        if (hasKeywords(message, ['n8n', 'workflow', 'node', 'webhook', 'automation'])) {
            const n8nDocs = await getN8nDocs(message);
            if (n8nDocs) {
                enhanced += `\n\n[n8n Context]:\n${n8nDocs}`;
            }
        }

        // Add Opal AI docs if relevant
        if (hasKeywords(message, ['opal', 'no-code', 'visual workflow', 'ai builder'])) {
            const opalDocs = await getOpalDocs(message);
            if (opalDocs) {
                enhanced += `\n\n[Opal AI Context]:\n${opalDocs}`;
            }
        }

        // Add Context7 docs if configured and relevant
        if (ExtensionState.apiStatus.context7) {
            const context7Docs = await getContext7Docs(message);
            if (context7Docs) {
                enhanced += `\n\n[Library Documentation]:\n${context7Docs}`;
            }
        }
    } catch (error) {
        console.log('Documentation enhancement error:', error);
        // Continue with original message
    }

    return enhanced;
}

/**
 * Try n8n workflow
 */
async function tryN8nWorkflow(message, context) {
    try {
        const url = ExtensionState.settings.n8nWebhookUrl;
        if (!url) return null;

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                context,
                timestamp: new Date().toISOString()
            })
        }, APIConfig.n8n.timeout);

        if (response.ok) {
            const data = await response.json();
            return data.reply || data.message || data.output;
        }
    } catch (error) {
        console.log('n8n workflow error:', error.message);
    }

    return null;
}

/**
 * Try OpenAI directly
 */
async function tryOpenAIDirect(message, context) {
    try {
        const apiKey = ExtensionState.settings.openaiKey;
        if (!apiKey) return null;

        const response = await fetchWithTimeout(`${APIConfig.openai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ExtensionState.settings.openaiModel || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant integrated into a Chrome extension.'
                    },
                    {
                        role: 'user',
                        content: `${message}\n\nContext: ${JSON.stringify(context)}`
                    }
                ],
                temperature: ExtensionState.settings.temperature || 0.7,
                max_tokens: ExtensionState.settings.maxTokens || 2000
            })
        }, APIConfig.openai.timeout);

        if (response.ok) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response generated';
        } else {
            const error = await response.text();
            console.error('OpenAI API error:', error);
        }
    } catch (error) {
        console.error('OpenAI direct error:', error);
    }

    return null;
}

/**
 * Get fallback message
 */
function getFallbackMessage() {
    return `I'm currently unable to process your request. Please check:

1. Your API keys are configured in Settings
2. You have an active internet connection
3. Your OpenAI account has available credits

Click the extension icon and go to Settings to configure your API keys.`;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeout = 10000) {
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
 * Check if message has keywords
 */
function hasKeywords(message, keywords) {
    const lower = message.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword));
}

/**
 * Get Chrome Extension documentation
 */
async function getChromeDocs(message) {
    try {
        if (typeof ChromeDocsIntegration === 'undefined') return null;
        const docs = new ChromeDocsIntegration();
        return await docs.searchDocs(message);
    } catch (error) {
        console.log('Chrome docs error:', error);
        return null;
    }
}

/**
 * Get n8n documentation
 */
async function getN8nDocs(message) {
    try {
        if (typeof N8nDocsIntegration === 'undefined') return null;
        const docs = new N8nDocsIntegration();
        return await docs.searchDocs(message);
    } catch (error) {
        console.log('n8n docs error:', error);
        return null;
    }
}

/**
 * Get Opal AI documentation
 */
async function getOpalDocs(message) {
    try {
        if (typeof OpalDocsIntegration === 'undefined') return null;
        const docs = new OpalDocsIntegration();
        return await docs.searchDocs(message);
    } catch (error) {
        console.log('Opal docs error:', error);
        return null;
    }
}

/**
 * Get Context7 documentation
 */
async function getContext7Docs(message) {
    try {
        if (typeof Context7Integration === 'undefined') return null;
        const apiKey = ExtensionState.settings.context7ApiKey;
        if (!apiKey) return null;

        const context7 = new Context7Integration(apiKey);
        // Extract library name from message
        const libraries = ['react', 'vue', 'angular', 'nextjs', 'tailwind', 'typescript'];
        const found = libraries.find(lib => message.toLowerCase().includes(lib));

        if (found) {
            return await context7.getDocsWithContext(found, message);
        }
    } catch (error) {
        console.log('Context7 error:', error);
    }

    return null;
}

/**
 * Open assistant in current tab
 */
async function openAssistant(tab) {
    try {
        if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, { action: 'openAssistant' });
        } else {
            // Get active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                await chrome.tabs.sendMessage(tabs[0].id, { action: 'openAssistant' });
            }
        }
    } catch (error) {
        console.error('Open assistant error:', error);
    }
}

/**
 * Capture screenshot
 */
async function captureScreenshot() {
    try {
        if (ExtensionState.screenCapture) {
            return await ExtensionState.screenCapture.captureVisibleTab();
        } else {
            // Fallback to Chrome API
            return await chrome.tabs.captureVisibleTab();
        }
    } catch (error) {
        console.error('Screenshot error:', error);
        throw error;
    }
}

/**
 * Extract page content
 */
async function extractPageContent(tabId) {
    try {
        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                return {
                    title: document.title,
                    url: window.location.href,
                    text: document.body.innerText.substring(0, 5000),
                    meta: Array.from(document.querySelectorAll('meta')).map(m => ({
                        name: m.name || m.property,
                        content: m.content
                    })).filter(m => m.name)
                };
            }
        });

        return result[0]?.result || {};
    } catch (error) {
        console.error('Content extraction error:', error);
        throw error;
    }
}

/**
 * Test specific API connection
 */
async function testAPIConnection(api, config) {
    try {
        switch (api) {
            case 'openai':
                return await testOpenAI(config.apiKey);
            case 'n8n':
                return await testN8n(config.url);
            case 'context7':
                return await testContext7(config.apiKey);
            default:
                return { success: false, message: 'Unknown API' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Test OpenAI connection
 */
async function testOpenAI(apiKey) {
    try {
        const response = await fetchWithTimeout(`${APIConfig.openai.baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        }, 5000);

        if (response.ok) {
            return { success: true, message: 'OpenAI API connected successfully' };
        } else {
            return { success: false, message: `OpenAI API error: ${response.status}` };
        }
    } catch (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
    }
}

/**
 * Test n8n connection
 */
async function testN8n(url) {
    // n8n is optional - don't show as error if not configured
    if (!url || url.trim() === '') {
        return { success: true, message: 'n8n not configured (optional)' };
    }

    try {
        // Check if it's n8n cloud or local
        const isCloud = url.includes('.n8n.cloud') || url.includes('n8n.cloud');

        // For local n8n, check if it's running
        if (!isCloud && (url.includes('localhost') || url.includes('127.0.0.1'))) {
            // Try a simple GET first to check if n8n is running
            try {
                const healthCheck = await fetchWithTimeout(url.replace('/webhook/', '/').replace('/webhook', ''), {
                    method: 'GET'
                }, 2000);
                // If we can't reach n8n at all, it's probably not running
                if (!healthCheck.ok && healthCheck.status === 0) {
                    return {
                        success: false,
                        message: 'n8n not running locally. Start with: n8n start'
                    };
                }
            } catch (e) {
                // n8n might not be running
                return {
                    success: false,
                    message: 'n8n not running. Start with: n8n start'
                };
            }
        }

        // Try to POST to webhook endpoint
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true, source: 'chrome-extension' })
        }, 5000);

        if (response.ok) {
            const instanceName = isCloud ? 'n8n Cloud' : 'n8n';
            return { success: true, message: `${instanceName} webhook connected successfully` };
        } else if (response.status === 404) {
            const setupMsg = isCloud ?
                'Webhook not found. Create and activate workflow in n8n cloud.' :
                'Webhook not found. Create webhook in n8n first.';
            return { success: false, message: setupMsg };
        } else if (response.status === 401 || response.status === 403) {
            return { success: false, message: 'Authentication failed. Check webhook settings.' };
        } else {
            return { success: false, message: `n8n returned: ${response.status}` };
        }
    } catch (error) {
        // More user-friendly error messages
        if (error.message.includes('Failed to fetch')) {
            return { success: false, message: 'Cannot reach n8n. Is it running?' };
        }
        return { success: false, message: `Connection failed: ${error.message}` };
    }
}

/**
 * Test Context7 connection
 */
async function testContext7(apiKey) {
    try {
        const context7 = new Context7Integration(apiKey);
        const result = await context7.resolveLibrary('react');

        if (result) {
            return { success: true, message: 'Context7 API connected successfully' };
        } else {
            return { success: false, message: 'Context7 API not available' };
        }
    } catch (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
    }
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        switch (info.menuItemId) {
            case 'analyze-selection':
                if (info.selectionText) {
                    const reply = await handleAssistantMessage(info.selectionText, {
                        url: tab.url,
                        title: tab.title
                    });
                    // Send reply to content script
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'showAssistantReply',
                        reply
                    });
                }
                break;

            case 'capture-area':
                await captureScreenshot();
                break;

            case 'extract-content':
                await extractPageContent(tab.id);
                break;
        }
    } catch (error) {
        console.error('Context menu error:', error);
    }
});

/**
 * Periodic tasks
 */
setInterval(async () => {
    // Check API connections every 5 minutes
    await checkAllAPIConnections();

    // Save statistics
    await chrome.storage.sync.set({
        stats: ExtensionState.stats,
        apiStatus: ExtensionState.apiStatus
    });
}, 5 * 60 * 1000);

console.log('Background service worker initialized successfully');