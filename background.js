// Background Service Worker - Handles background tasks and communication

// Import modules
importScripts('websocket-client.js', 'screenshot.js', 'context7-integration.js', 'n8n-docs-integration.js', 'chrome-docs-integration.js', 'opal-docs-integration.js');

// Initialize WebSocket client
let wsClient = null;
let screenCapture = null;

// Extension state
let extensionState = {
    enabled: true,
    pageCount: 0,
    actionCount: 0,
    analysisResults: new Map()
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);

    // Initialize WebSocket client and screen capture
    wsClient = new WebSocketClient();
    screenCapture = new ScreenCapture();

    // Set default settings on first install
    if (details.reason === 'install') {
        chrome.storage.sync.set({
            enabled: true,
            pageCount: 0,
            actionCount: 0,
            autoAnalyze: false,
            showNotifications: true,
            analysisDelay: 2,
            theme: 'light',
            badgeColor: '#667eea',
            debugMode: false,
            maxHistory: 100,
            excludedSites: ''
        });

        // Open options page on install
        chrome.runtime.openOptionsPage();
    }

    // Initialize context menus
    createContextMenus();
});

// Create context menu items
function createContextMenus() {
    chrome.contextMenus.create({
        id: 'analyze-selection',
        title: 'Analyze Selection',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'analyze-image',
        title: 'Analyze Image',
        contexts: ['image']
    });

    chrome.contextMenus.create({
        id: 'analyze-link',
        title: 'Analyze Link',
        contexts: ['link']
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'analyze-selection':
            handleSelectionAnalysis(info.selectionText, tab);
            break;
        case 'analyze-image':
            handleImageAnalysis(info.srcUrl, tab);
            break;
        case 'analyze-link':
            handleLinkAnalysis(info.linkUrl, tab);
            break;
    }
});

// Handle selection analysis
async function handleSelectionAnalysis(text, tab) {
    console.log('Analyzing selection:', text);

    // Send to content script
    chrome.tabs.sendMessage(tab.id, {
        action: 'analyzeSelection',
        text: text
    });

    // Show notification if enabled
    const settings = await chrome.storage.sync.get(['showNotifications']);
    if (settings.showNotifications) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon-48.png',
            title: 'Text Analysis',
            message: `Analyzing ${text.length} characters of text...`
        });
    }
}

// Handle image analysis
async function handleImageAnalysis(imageUrl, tab) {
    console.log('Analyzing image:', imageUrl);

    chrome.tabs.sendMessage(tab.id, {
        action: 'analyzeImage',
        url: imageUrl
    });
}

// Handle link analysis
async function handleLinkAnalysis(linkUrl, tab) {
    console.log('Analyzing link:', linkUrl);

    chrome.tabs.sendMessage(tab.id, {
        action: 'analyzeLink',
        url: linkUrl
    });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    switch (request.action) {
        case 'toggleExtension':
            handleToggleExtension(request.enabled);
            sendResponse({ success: true });
            break;

        case 'toggleAssistant':
            handleToggleAssistant(request.enabled);
            sendResponse({ success: true });
            break;

        case 'getState':
            sendResponse(extensionState);
            break;

        case 'updateStats':
            handleUpdateStats(request);
            sendResponse({ success: true });
            break;

        case 'settingsUpdated':
            handleSettingsUpdate(request.settings);
            sendResponse({ success: true });
            break;

        case 'analyzeTab':
            handleTabAnalysis(sender.tab);
            sendResponse({ success: true });
            break;

        case 'storeAnalysis':
            storeAnalysisResult(request.url, request.data);
            sendResponse({ success: true });
            break;

        case 'checkDesktopConnection':
            handleCheckDesktopConnection(sendResponse);
            break;

        case 'checkApiConnections':
            handleCheckApiConnections(sendResponse);
            break;

        case 'assistantMessage':
            handleAssistantMessage(request, sendResponse);
            break;

        case 'captureScreenshot':
            handleScreenshotCapture(sendResponse);
            break;

        case 'fileAttached':
            handleFileAttachment(request.file, sendResponse);
            break;

        case 'extractContent':
            handleContentExtraction(request.content, sendResponse);
            break;

        case 'summarize':
            handleSummarize(request.text, sendResponse);
            break;

        case 'formDetected':
            handleFormDetection(request.formData, sendResponse);
            break;

        case 'translate':
            handleTranslation(request.text, sendResponse);
            break;

        case 'testOpenAI':
            testOpenAIKey(request.apiKey, sendResponse);
            break;

        default:
            console.log('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }

    // Return true to indicate async response
    return true;
});

// Handle extension toggle
function handleToggleExtension(enabled) {
    extensionState.enabled = enabled;

    // Update badge
    if (enabled) {
        chrome.action.setBadgeText({ text: '' });
    } else {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }

    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'extensionToggled',
                enabled: enabled
            }).catch(() => {
                // Ignore errors for tabs without content script
            });
        });
    });
}

// Handle assistant toggle
function handleToggleAssistant(enabled) {
    // Store the state
    chrome.storage.sync.set({ assistantEnabled: enabled });

    // Update badge to show assistant status
    if (!enabled) {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff9800' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }

    // Notify all tabs to show/hide the widget
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleWidget',
                enabled: enabled
            }).catch(() => {
                // Ignore errors for tabs without content script
            });
        });
    });

    console.log('Assistant toggled:', enabled);
}

// Handle stats update
async function handleUpdateStats(request) {
    if (request.pageCount !== undefined) {
        extensionState.pageCount = request.pageCount;
        await chrome.storage.sync.set({ pageCount: request.pageCount });
    }

    if (request.actionCount !== undefined) {
        extensionState.actionCount = request.actionCount;
        await chrome.storage.sync.set({ actionCount: request.actionCount });
    }

    // Update badge with page count
    if (extensionState.pageCount > 0) {
        chrome.action.setBadgeText({ text: extensionState.pageCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }
}

// Handle settings update
function handleSettingsUpdate(settings) {
    console.log('Settings updated:', settings);

    // Apply badge color if changed
    if (settings.badgeColor) {
        chrome.action.setBadgeBackgroundColor({ color: settings.badgeColor });
    }

    // Notify content scripts of settings change
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'settingsUpdated',
                settings: settings
            }).catch(() => {
                // Ignore errors
            });
        });
    });
}

// Handle tab analysis
async function handleTabAnalysis(tab) {
    console.log('Analyzing tab:', tab.url);

    // Check if URL is excluded
    const settings = await chrome.storage.sync.get(['excludedSites']);
    if (settings.excludedSites) {
        const excludedUrls = settings.excludedSites.split('\n').filter(url => url.trim());
        for (const excluded of excludedUrls) {
            if (tab.url.includes(excluded.trim())) {
                console.log('URL is excluded:', tab.url);
                return;
            }
        }
    }

    // Perform analysis (placeholder logic)
    const analysisData = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        elements: Math.floor(Math.random() * 100),
        performance: Math.floor(Math.random() * 100)
    };

    // Store result
    storeAnalysisResult(tab.url, analysisData);

    // Update page count
    extensionState.pageCount++;
    await chrome.storage.sync.set({ pageCount: extensionState.pageCount });

    // Send result back to content script
    chrome.tabs.sendMessage(tab.id, {
        action: 'analysisComplete',
        data: analysisData
    });
}

// Store analysis result
function storeAnalysisResult(url, data) {
    extensionState.analysisResults.set(url, data);

    // Limit stored results to prevent memory issues
    if (extensionState.analysisResults.size > 100) {
        const firstKey = extensionState.analysisResults.keys().next().value;
        extensionState.analysisResults.delete(firstKey);
    }
}

// Handle tab updates (for auto-analysis)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const settings = await chrome.storage.sync.get(['autoAnalyze', 'enabled']);

        if (settings.enabled && settings.autoAnalyze) {
            // Delay analysis based on settings
            const delaySettings = await chrome.storage.sync.get(['analysisDelay']);
            const delay = (delaySettings.analysisDelay || 2) * 1000;

            setTimeout(() => {
                handleTabAnalysis(tab);
            }, delay);
        }
    }
});

// Handle extension icon click (when no popup)
chrome.action.onClicked.addListener((tab) => {
    // This won't fire if we have a popup, but included for completeness
    console.log('Extension icon clicked for tab:', tab.id);
});

// Handle alarms for periodic tasks
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        performCleanup();
    }
});

// Cleanup old data
async function performCleanup() {
    console.log('Performing cleanup...');

    const settings = await chrome.storage.sync.get(['maxHistory']);
    const maxHistory = settings.maxHistory || 100;

    // Clean up old analysis results
    if (extensionState.analysisResults.size > maxHistory) {
        const toRemove = extensionState.analysisResults.size - maxHistory;
        const keys = Array.from(extensionState.analysisResults.keys());

        for (let i = 0; i < toRemove; i++) {
            extensionState.analysisResults.delete(keys[i]);
        }
    }
}

// Handle extension unload
self.addEventListener('deactivate', () => {
    console.log('Service worker deactivating');
});

// Keep service worker alive
self.addEventListener('activate', () => {
    console.log('Service worker activated');
});

// Handle desktop connection check
async function handleCheckDesktopConnection(sendResponse) {
    try {
        const connected = wsClient && wsClient.isConnected();
        sendResponse({ connected: connected });
    } catch (error) {
        console.error('Error checking desktop connection:', error);
        sendResponse({ connected: false, error: error.message });
    }
}

// Cache for API connections status
let apiConnectionsCache = null;
let lastApiCheck = 0;
const API_CHECK_INTERVAL = 5000; // 5 seconds minimum between checks

// Handle API connections check with caching
async function handleCheckApiConnections(sendResponse) {
    const now = Date.now();

    // Use cached data if it's recent
    if (apiConnectionsCache && (now - lastApiCheck) < API_CHECK_INTERVAL) {
        sendResponse({
            success: true,
            connections: apiConnectionsCache,
            cached: true
        });
        return;
    }

    try {
        // Get stored settings
        const settings = await chrome.storage.sync.get([
            'integrationServer',
            'n8nUrl',
            'openaiKey',
            'googleApiKey'
        ]);

        const integrationUrl = settings.integrationServer || 'http://localhost:3000';

        // Fetch API connections status with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${integrationUrl}/n8n/connections`, {
            signal: controller.signal,
            headers: {
                'X-OpenAI-Key': settings.openaiKey || '',
                'X-Google-Key': settings.googleApiKey || '',
                'X-N8N-URL': settings.n8nUrl || ''
            }
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        // Update cache
        apiConnectionsCache = data.connections;
        lastApiCheck = now;

        sendResponse({
            success: true,
            connections: data.connections,
            cached: false
        });
    } catch (error) {
        console.error('Error checking API connections:', error);

        // Return cached data if available, otherwise default
        const fallbackConnections = apiConnectionsCache || {
            n8n: { status: 'disconnected' },
            websocket: { status: 'disconnected' },
            google: { status: 'not_configured' },
            openai: { status: 'not_configured' }
        };

        sendResponse({
            success: false,
            connections: fallbackConnections,
            cached: !!apiConnectionsCache
        });
    }
}

// Handle assistant messages
async function handleAssistantMessage(request, sendResponse) {
    try {
        const { message, context } = request;

        // Get stored settings
        const settings = await chrome.storage.sync.get([
            'integrationServer',
            'n8nUrl',
            'openaiKey',
            'context7ApiKey'
        ]);

        let reply = '';
        let docContext = '';
        let n8nContext = '';
        let chromeContext = '';
        let opalContext = '';

        // Check if message is about Chrome Extensions
        const chromeKeywords = ['chrome', 'extension', 'manifest', 'permission', 'background', 'content script', 'popup', 'chrome.', 'sendMessage'];
        const isChromeQuery = chromeKeywords.some(keyword => message.toLowerCase().includes(keyword));

        if (isChromeQuery) {
            try {
                // Get Chrome Extension documentation context
                const chromeDocs = new ChromeDocsIntegration();
                const chromeHelp = await chromeDocs.searchDocs(message);
                if (chromeHelp) {
                    chromeContext = `\n\n[Chrome Extension Documentation]:\n${chromeHelp.substring(0, 1500)}`;
                }
            } catch (chromeError) {
                console.log('Chrome docs fetch optional - continuing:', chromeError.message);
            }
        }

        // Check if message is about Opal AI
        const opalKeywords = ['opal', 'opal ai', 'google labs', 'no-code', 'no code', 'visual workflow', 'ai workflow', 'ai builder', 'mini app'];
        const isOpalQuery = opalKeywords.some(keyword => message.toLowerCase().includes(keyword));

        if (isOpalQuery) {
            try {
                // Get Opal AI documentation context
                const opalDocs = new OpalDocsIntegration();
                const opalHelp = await opalDocs.searchDocs(message);
                if (opalHelp) {
                    opalContext = `\n\n[Opal AI Documentation]:\n${opalHelp.substring(0, 1500)}`;
                }
            } catch (opalError) {
                console.log('Opal docs fetch optional - continuing:', opalError.message);
            }
        }

        // Check if message is about n8n
        const n8nKeywords = ['n8n', 'workflow', 'node', 'trigger', 'webhook', 'expression', 'automation'];
        const isN8nQuery = n8nKeywords.some(keyword => message.toLowerCase().includes(keyword));

        if (isN8nQuery) {
            try {
                // Get n8n documentation context
                const n8nDocs = new N8nDocsIntegration();
                const n8nHelp = await n8nDocs.searchDocs(message);
                if (n8nHelp) {
                    n8nContext = `\n\n[n8n Documentation Context]:\n${n8nHelp.substring(0, 2000)}`;
                }
            } catch (n8nError) {
                console.log('n8n docs fetch optional - continuing:', n8nError.message);
            }
        }

        // Check if message mentions a library/framework for Context7 docs
        const libraryMatches = message.match(/\b(react|vue|angular|next\.?js|express|mongodb|redis|postgres|supabase|firebase|tailwind|typescript|javascript|node\.?js|python|django|flask)\b/gi);

        if (libraryMatches && libraryMatches.length > 0) {
            try {
                // Initialize Context7
                const context7 = new Context7Integration(settings.context7ApiKey);

                // Get documentation for the mentioned library
                const libraryName = libraryMatches[0];
                const docsResult = await context7.getDocsWithContext(libraryName, message);

                if (docsResult && docsResult.documentation) {
                    // Add documentation context
                    docContext = `\n\n[Context7 Documentation for ${libraryName}]:\n${docsResult.documentation.substring(0, 2000)}`;
                }
            } catch (context7Error) {
                console.log('Context7 fetch optional - continuing without docs:', context7Error.message);
            }
        }

        // Try n8n workflow first
        try {
            const integrationUrl = settings.integrationServer || 'http://localhost:3000';
            const response = await fetch(`${integrationUrl}/n8n/trigger/assistant-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-OpenAI-Key': settings.openaiKey || '',
                    'X-N8N-URL': settings.n8nUrl || ''
                },
                body: JSON.stringify({
                    message: message + docContext + n8nContext + chromeContext + opalContext,
                    context: context,
                    timestamp: new Date().toISOString(),
                    openaiKey: settings.openaiKey
                })
            });

            if (response.ok) {
                const result = await response.json();
                reply = result.result?.reply || result.reply || result.message;
            } else {
                throw new Error('n8n workflow not available');
            }
        } catch (n8nError) {
            console.log('n8n workflow not available, trying OpenAI directly...');

            // Fallback to direct OpenAI API
            if (settings.openaiKey) {
                try {
                    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${settings.openaiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a helpful AI assistant integrated into a Chrome extension. Help users with their browsing tasks, answer questions, and provide assistance with web content.'
                                },
                                {
                                    role: 'user',
                                    content: `${message}${docContext}${n8nContext}${chromeContext}${opalContext}\n\nContext: Currently on ${context?.title || 'a webpage'} (${context?.url || 'unknown URL'})`
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 500
                        })
                    });

                    if (openaiResponse.ok) {
                        const openaiResult = await openaiResponse.json();
                        reply = openaiResult.choices[0]?.message?.content || 'I received your message but had trouble generating a response.';
                    } else {
                        const errorData = await openaiResponse.json();
                        console.error('OpenAI API error:', errorData);
                        reply = 'I need a valid OpenAI API key to respond. Please add your API key in the extension settings.';
                    }
                } catch (openaiError) {
                    console.error('OpenAI API error:', openaiError);
                    reply = 'Error connecting to OpenAI. Please check your API key and internet connection.';
                }
            } else {
                // No API key configured
                reply = 'Please configure your OpenAI API key in the extension settings to enable AI responses. You can get an API key from platform.openai.com';
            }
        }

        sendResponse({
            success: true,
            reply: reply || 'I received your message. How can I help you?'
        });
    } catch (error) {
        console.error('Error handling assistant message:', error);
        sendResponse({
            success: false,
            reply: 'An error occurred. Please check the extension settings and try again.'
        });
    }
}

// Handle screenshot capture
async function handleScreenshotCapture(sendResponse) {
    try {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            // Store screenshot and/or send to n8n
            sendResponse({ success: true, dataUrl: dataUrl });
        });
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle file attachments
async function handleFileAttachment(file, sendResponse) {
    try {
        // Process file and send to n8n
        console.log('File attached:', file.name, file.type, file.size);

        sendResponse({ success: true, message: 'File received' });
    } catch (error) {
        console.error('Error handling file:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle content extraction
async function handleContentExtraction(content, sendResponse) {
    try {
        // Send extracted content to n8n
        const integrationUrl = 'http://localhost:3000';
        const response = await fetch(`${integrationUrl}/n8n/trigger/content-extraction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        });

        const result = await response.json();
        sendResponse({ success: true, result: result });
    } catch (error) {
        console.error('Error extracting content:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle summarization
async function handleSummarize(text, sendResponse) {
    try {
        // Send text to n8n for summarization
        const integrationUrl = 'http://localhost:3000';
        const response = await fetch(`${integrationUrl}/n8n/trigger/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        const result = await response.json();
        sendResponse({ success: true, summary: result.summary || 'Summary being generated...' });
    } catch (error) {
        console.error('Error summarizing:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle form detection
async function handleFormDetection(formData, sendResponse) {
    try {
        // Process detected form
        console.log('Form detected:', formData);

        sendResponse({ success: true, message: 'Form data received' });
    } catch (error) {
        console.error('Error handling form:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle translation
async function handleTranslation(text, sendResponse) {
    try {
        // Send text to n8n for translation
        const integrationUrl = 'http://localhost:3000';
        const response = await fetch(`${integrationUrl}/n8n/trigger/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        const result = await response.json();
        sendResponse({ success: true, translation: result.translation || 'Translating...' });
    } catch (error) {
        console.error('Error translating:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Test OpenAI API key
async function testOpenAIKey(apiKey, sendResponse) {
    console.log('Testing OpenAI API key in background...');

    if (!apiKey) {
        sendResponse({ success: false, error: 'No API key provided' });
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('OpenAI API key is valid, models available:', data.data.length);
            sendResponse({
                success: true,
                message: 'API key is valid',
                models: data.data.length
            });
        } else {
            const errorData = await response.text();
            console.error('OpenAI API error:', response.status, errorData);

            if (response.status === 401) {
                sendResponse({
                    success: false,
                    error: 'Invalid API key - check your key and try again'
                });
            } else {
                sendResponse({
                    success: false,
                    error: `API error (${response.status}): ${errorData}`
                });
            }
        }
    } catch (error) {
        console.error('Error testing OpenAI key:', error);
        sendResponse({
            success: false,
            error: error.message || 'Network error - check your connection'
        });
    }
}

console.log('Background service worker loaded');