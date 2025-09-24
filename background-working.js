/**
 * Simple Working Background Script - Guaranteed to Work
 * Minimal complexity, maximum reliability
 */

console.log('🚀 Background script starting...');

// Simple state
const state = {
    settings: {},
    connected: false
};

// Load settings on startup
chrome.storage.sync.get(null, (result) => {
    state.settings = result || {};
    console.log('Settings loaded:', state.settings);
    state.connected = true;
});

// Handle messages - SIMPLE AND WORKING
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);

    // Always respond immediately
    handleMessage(request, sender, sendResponse);

    // Keep channel open for async
    return true;
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'ping':
                sendResponse({ pong: true, connected: true });
                break;

            case 'sendMessage':
                // Process the message
                const reply = await processAIMessage(request.message, request.context);
                sendResponse({ success: true, reply });
                break;

            case 'getStatus':
                sendResponse({
                    connected: state.connected,
                    hasSettings: Object.keys(state.settings).length > 0,
                    apiStatus: {
                        openai: !!state.settings.openaiKey,
                        n8n: !!state.settings.n8nWebhookUrl
                    }
                });
                break;

            case 'openAssistant':
                // Open floating widget on current tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'openAssistant' });
                    }
                });
                sendResponse({ success: true });
                break;

            case 'testAPI':
                const result = await testAPI(request.api, request.config);
                sendResponse(result);
                break;

            case 'saveSettings':
                state.settings = { ...state.settings, ...request.settings };
                await chrome.storage.sync.set(request.settings);
                sendResponse({ success: true, message: 'Settings saved' });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({
            success: false,
            error: error.message,
            reply: 'Sorry, I encountered an error. Please check your settings.'
        });
    }
}

// Process AI messages
async function processAIMessage(message, context) {
    console.log('Processing message:', message);

    // Reload settings to get latest
    const settings = await new Promise(resolve => {
        chrome.storage.sync.get(null, resolve);
    });

    state.settings = settings;

    // Try n8n first
    if (settings.n8nWebhookUrl) {
        try {
            console.log('Trying n8n webhook...');
            const response = await callN8n(settings.n8nWebhookUrl, settings.n8nApiKey, message, context);
            if (response) return response;
        } catch (error) {
            console.log('n8n failed:', error.message);
        }
    }

    // Try OpenAI
    if (settings.openaiKey) {
        try {
            console.log('Trying OpenAI...');
            const response = await callOpenAI(settings.openaiKey, message, context);
            if (response) return response;
        } catch (error) {
            console.log('OpenAI failed:', error.message);
        }
    }

    // No API configured
    return `I need to be set up first! Please:
1. Click the extension icon
2. Go to Settings (⚙️ button)
3. Enter your OpenAI API key or n8n webhook URL
4. Save and try again!

For OpenAI: Get a key at platform.openai.com
For n8n: Set up a webhook in your n8n workflow`;
}

// Call n8n webhook - SIMPLE VERSION
async function callN8n(webhookUrl, apiKey, message, context) {
    const headers = { 'Content-Type': 'application/json' };

    // Add API key for n8n cloud
    if (apiKey && webhookUrl.includes('n8n.cloud')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-N8N-API-KEY'] = apiKey;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            message,
            context,
            timestamp: new Date().toISOString(),
            source: 'chrome-extension'
        })
    });

    if (!response.ok) {
        throw new Error(`n8n error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || data.response || JSON.stringify(data);
}

// Call OpenAI - SIMPLE VERSION
async function callOpenAI(apiKey, message, context) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant in a Chrome extension. Be concise and helpful.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Test API connection
async function testAPI(api, config) {
    try {
        if (api === 'openai') {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${config.apiKey}` }
            });
            return {
                success: response.ok,
                message: response.ok ? 'OpenAI connected!' : 'Invalid API key'
            };
        } else if (api === 'n8n') {
            const headers = { 'Content-Type': 'application/json' };
            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const response = await fetch(config.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ test: true })
            });

            return {
                success: response.ok || response.status === 404,
                message: response.ok ? 'n8n webhook connected!' : 'Check webhook URL'
            };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Context menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'ai-assistant',
        title: 'AI Assistant',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'ai-assistant' && info.selectionText) {
        // Send selected text to AI
        processAIMessage(`Please help me with: ${info.selectionText}`, {
            url: tab.url,
            title: tab.title
        }).then(reply => {
            // Send response to content script
            chrome.tabs.sendMessage(tab.id, {
                action: 'showAIResponse',
                response: reply
            });
        });
    }
});

// Keep service worker alive
setInterval(() => {
    chrome.storage.local.get('keepAlive', () => {
        // Just access storage to keep alive
    });
}, 25000);

console.log('✅ Background script loaded and ready!');