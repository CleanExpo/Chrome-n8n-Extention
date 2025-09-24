/**
 * Enhanced Background Script with Latest AI Models
 * Supports: GPT-4, GPT-4 Turbo, GPT-3.5, Google Gemini Pro, Claude 3
 */

console.log('🚀 Background script with latest models starting...');

// Hot reload in development
const ENABLE_HOT_RELOAD = true;
if (ENABLE_HOT_RELOAD) {
    console.log('🔥 Hot reload enabled for development');

    // Watch for file changes
    let lastReload = Date.now();
    setInterval(async () => {
        try {
            const response = await fetch(chrome.runtime.getURL('version.json'));
            const text = await response.text();
            const timestamp = JSON.parse(text).timestamp;

            // If timestamp changed, reload
            if (window.lastVersion && window.lastVersion !== timestamp) {
                console.log('🔄 Changes detected, reloading...');
                chrome.runtime.reload();
            }
            window.lastVersion = timestamp;
        } catch (e) {
            // Version file doesn't exist yet, that's ok
        }
    }, 2000); // Check every 2 seconds
}

// State management
const state = {
    settings: {},
    connected: false,
    availableModels: {
        openai: [
            { id: 'gpt-4o', name: 'GPT-4o (Omni)', description: 'Latest multimodal, fastest GPT-4' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Cost-efficient, outperforms GPT-3.5' },
            { id: 'o1-preview', name: 'o1 Preview', description: 'Advanced reasoning for complex tasks' },
            { id: 'o1-mini', name: 'o1 Mini', description: 'Fast reasoning model' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High capability, 128K context' },
            { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', description: 'Latest GPT-4 Turbo version' },
            { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4 model' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' }
        ],
        google: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest, fastest with 1M context' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable (legacy)' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast & efficient (legacy)' },
            { id: 'gemini-pro', name: 'Gemini Pro', description: 'Previous generation' },
            { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal (legacy)' }
        ],
        anthropic: [
            { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Latest, beats Opus, 200K context' },
            { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast, beats Claude 3 Opus' },
            { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Previous most capable' },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced (older)' },
            { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast (older)' }
        ]
    }
};

// Load settings on startup
chrome.storage.sync.get(null, (result) => {
    state.settings = result || {};
    // Set defaults
    if (!state.settings.selectedModel) {
        state.settings.selectedModel = 'gpt-4o-mini'; // Default to cost-efficient latest
    }
    if (!state.settings.selectedProvider) {
        state.settings.selectedProvider = 'openai';
    }
    console.log('Settings loaded:', state.settings);
    state.connected = true;
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'ping':
                sendResponse({ pong: true, connected: true });
                break;

            case 'sendMessage':
                const reply = await processAIMessage(request.message, request.context, request.screenshot);
                sendResponse({ success: true, reply });
                break;

            case 'captureVisibleTab':
                try {
                    // Get active tab
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (activeTab) {
                        // Capture visible area
                        const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, {
                            format: 'png',
                            quality: 100
                        });
                        sendResponse({ success: true, dataUrl });
                    } else {
                        sendResponse({ success: false, error: 'No active tab found' });
                    }
                } catch (error) {
                    console.error('Screenshot capture error:', error);
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'captureScreen':
                try {
                    // Get active tab
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (activeTab) {
                        // Capture visible area
                        const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, {
                            format: 'png',
                            quality: 100
                        });

                        // Optionally save to downloads or show in notification
                        console.log('Screenshot captured successfully');

                        sendResponse({ success: true, dataUrl, screenshot: dataUrl });
                    } else {
                        sendResponse({ success: false, error: 'No active tab found' });
                    }
                } catch (error) {
                    console.error('Screen capture error:', error);
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'getStatus':
                sendResponse({
                    connected: state.connected,
                    hasSettings: Object.keys(state.settings).length > 0,
                    apiStatus: {
                        openai: !!state.settings.openaiKey,
                        google: !!state.settings.googleApiKey,
                        anthropic: !!state.settings.anthropicKey,
                        n8n: !!state.settings.n8nWebhookUrl
                    },
                    selectedModel: state.settings.selectedModel,
                    selectedProvider: state.settings.selectedProvider
                });
                break;

            case 'getModels':
                sendResponse({
                    success: true,
                    models: state.availableModels,
                    current: {
                        provider: state.settings.selectedProvider,
                        model: state.settings.selectedModel
                    }
                });
                break;

            case 'setModel':
                state.settings.selectedProvider = request.provider;
                state.settings.selectedModel = request.model;
                await chrome.storage.sync.set({
                    selectedProvider: request.provider,
                    selectedModel: request.model
                });
                sendResponse({ success: true, message: 'Model updated' });
                break;

            case 'openAssistant':
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

// Process AI messages with model selection and screenshot support
async function processAIMessage(message, context, screenshot = null) {
    console.log('Processing message with model:', state.settings.selectedModel);
    if (screenshot) {
        console.log('Processing with screenshot');
    }

    // Reload settings to get latest
    const settings = await new Promise(resolve => {
        chrome.storage.sync.get(null, resolve);
    });

    state.settings = settings;
    const provider = settings.selectedProvider || 'openai';
    const model = settings.selectedModel || 'gpt-4o-mini';

    console.log(`Using ${provider} with model ${model}`);

    // Route to appropriate provider
    switch (provider) {
        case 'openai':
            if (settings.openaiKey) {
                try {
                    return await callOpenAI(settings.openaiKey, message, model, context, screenshot);
                } catch (error) {
                    console.error('OpenAI error:', error);
                    return `OpenAI Error: ${error.message}`;
                }
            }
            break;

        case 'google':
            if (settings.googleApiKey) {
                try {
                    return await callGoogleGemini(settings.googleApiKey, message, model, context, screenshot);
                } catch (error) {
                    console.error('Google Gemini error:', error);
                    return `Google Gemini Error: ${error.message}`;
                }
            }
            break;

        case 'anthropic':
            if (settings.anthropicKey) {
                try {
                    return await callClaude(settings.anthropicKey, message, model, context, screenshot);
                } catch (error) {
                    console.error('Claude error:', error);
                    return `Claude Error: ${error.message}`;
                }
            }
            break;
    }

    // Try n8n as fallback
    if (settings.n8nWebhookUrl) {
        try {
            return await callN8n(settings.n8nWebhookUrl, settings.n8nApiKey, message, context, screenshot);
        } catch (error) {
            console.log('n8n failed:', error.message);
        }
    }

    // No API configured for selected provider
    return `Please configure your ${provider} API key in settings.

Available providers:
- OpenAI (GPT-4, GPT-4 Turbo)
- Google (Gemini Pro)
- Anthropic (Claude 3)

Go to Settings → API Keys to set up.`;
}

// Call OpenAI with specific model and screenshot support
async function callOpenAI(apiKey, message, model, context, screenshot = null) {
    console.log(`Calling OpenAI API with model: ${model}`);
    if (screenshot) {
        console.log('Including screenshot in OpenAI request');
    }

    // Build user message content
    let userContent = message;

    // For vision-capable models with screenshot
    if (screenshot && (model.includes('gpt-4o') || model === 'gpt-4-turbo' || model === 'gpt-4-turbo-preview')) {
        userContent = [
            {
                type: 'text',
                text: message
            },
            {
                type: 'image_url',
                image_url: {
                    url: screenshot,
                    detail: 'high'
                }
            }
        ];
    }

    // Prepare messages - o1 models don't use system messages
    const messages = model.includes('o1')
        ? [{ role: 'user', content: userContent }]
        : [
            {
                role: 'system',
                content: `You are a helpful AI assistant using ${model}. You have access to the latest information and can help with complex tasks.`
            },
            {
                role: 'user',
                content: userContent
            }
        ];

    // Build request body - o1 models don't support temperature or max_tokens in same way
    const requestBody = {
        model: model,
        messages: messages
    };

    // Add parameters based on model type
    if (!model.includes('o1')) {
        requestBody.temperature = 0.7;
        requestBody.max_tokens = model.includes('gpt-4') ? 4000 : 2000;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Call Google Gemini API with proper error handling
async function callGoogleGemini(apiKey, message, model, context, screenshot = null) {
    console.log(`Calling Google Gemini API with model: ${model}`);

    // Map model names to API endpoints - use correct endpoint formats
    let apiModel = model;
    const modelMapping = {
        'gemini-2.0-flash': 'gemini-2.0-flash-exp', // Latest 2.0 experimental
        'gemini-1.5-pro': 'gemini-1.5-pro-latest',
        'gemini-1.5-flash': 'gemini-1.5-flash-latest',
        'gemini-pro': 'gemini-pro',
        'gemini-pro-vision': 'gemini-pro-vision'
    };

    if (modelMapping[model]) {
        apiModel = modelMapping[model];
    }

    // Build content parts
    const parts = [];

    // Add text part
    parts.push({ text: message });

    // Add screenshot if provided
    if (screenshot) {
        // Convert data URL to base64
        const base64Data = screenshot.replace(/^data:image\/[^;]+;base64,/, '');
        parts.push({
            inline_data: {
                mime_type: 'image/png',
                data: base64Data
            }
        });
    }

    try {
        // Gemini API endpoint - use v1beta for newer models
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: model.includes('2.0') ? 8192 : 4096
            }
        };

        // Add safety settings for better reliability
        requestBody.safetySettings = [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_ONLY_HIGH"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_ONLY_HIGH"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_ONLY_HIGH"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH"
            }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error('Gemini API error response:', responseText);

            // Parse error for better messaging
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.error?.message) {
                    throw new Error(errorData.error.message);
                }
            } catch {
                // If not JSON, use the raw text
            }

            throw new Error(`Gemini API error (${response.status}): ${responseText.substring(0, 200)}`);
        }

        const data = JSON.parse(responseText);

        // Check for valid response
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('Invalid Gemini response structure:', data);
            throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Google Gemini API error:', error);
        throw error;
    }
}

// Call Anthropic Claude API with screenshot support
async function callClaude(apiKey, message, model, context, screenshot = null) {
    console.log(`Calling Claude API with model: ${model}`);
    if (screenshot) {
        console.log('Including screenshot in Claude request');
    }

    // Map our model names to Anthropic's API model IDs
    let apiModel = model;
    const modelMapping = {
        'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022', // Latest version
        'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
        'claude-3-haiku': 'claude-3-haiku-20240307'
    };

    if (modelMapping[model]) {
        apiModel = modelMapping[model];
    }

    // Build message content
    let messageContent = message;

    // Add screenshot support for Claude 3 models
    if (screenshot) {
        // Convert data URL to base64
        const base64Data = screenshot.replace(/^data:image\/[^;]+;base64,/, '');
        const mimeType = screenshot.match(/^data:(image\/[^;]+);base64,/)?.[1] || 'image/png';

        messageContent = [
            {
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Data
                }
            },
            {
                type: 'text',
                text: message
            }
        ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true' // Required for browser extensions
        },
        body: JSON.stringify({
            model: apiModel,
            messages: [{
                role: 'user',
                content: messageContent
            }],
            max_tokens: model.includes('3.5') ? 8192 : 4096
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// Call n8n webhook with screenshot support
async function callN8n(webhookUrl, apiKey, message, context, screenshot = null) {
    const headers = { 'Content-Type': 'application/json' };

    if (apiKey && webhookUrl.includes('n8n.cloud')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-N8N-API-KEY'] = apiKey;
    }

    const requestBody = {
        message,
        context,
        model: state.settings.selectedModel,
        provider: state.settings.selectedProvider,
        timestamp: new Date().toISOString()
    };

    // Add screenshot if provided
    if (screenshot) {
        requestBody.screenshot = screenshot;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`n8n error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || data.response || JSON.stringify(data);
}

// Test API connections
async function testAPI(api, config) {
    try {
        switch (api) {
            case 'openai':
                const openaiResponse = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${config.apiKey}` }
                });
                return {
                    success: openaiResponse.ok,
                    message: openaiResponse.ok ? 'OpenAI connected! GPT-4 and GPT-4 Turbo available!' : 'Invalid API key'
                };

            case 'google':
                // Test Gemini API
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
                const geminiResponse = await fetch(geminiUrl);
                return {
                    success: geminiResponse.ok,
                    message: geminiResponse.ok ? 'Google Gemini connected!' : 'Invalid API key'
                };

            case 'anthropic':
                // Test Claude API with correct model ID and headers
                console.log('Testing Anthropic API key...');
                const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true' // Required for browser extensions
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307', // Use full model ID
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 50
                    })
                });

                // Check various response codes
                if (claudeResponse.ok) {
                    return {
                        success: true,
                        message: 'Claude API connected successfully!'
                    };
                } else if (claudeResponse.status === 401) {
                    return {
                        success: false,
                        message: 'Invalid API key - please check your Anthropic API key'
                    };
                } else if (claudeResponse.status === 400) {
                    // This might mean the API is working but request format issue
                    const error = await claudeResponse.text();
                    if (error.includes('credit')) {
                        return {
                            success: false,
                            message: 'API key is valid but you may not have credits'
                        };
                    }
                    return {
                        success: true,
                        message: 'Claude API is reachable (may need credits)'
                    };
                } else {
                    const errorText = await claudeResponse.text();
                    return {
                        success: false,
                        message: `Claude API error (${claudeResponse.status}): ${errorText.substring(0, 100)}`
                    };
                }

            case 'n8n':
                const headers = { 'Content-Type': 'application/json' };
                if (config.apiKey) {
                    headers['Authorization'] = `Bearer ${config.apiKey}`;
                }
                const n8nResponse = await fetch(config.url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ test: true })
                });
                return {
                    success: n8nResponse.ok || n8nResponse.status === 404,
                    message: n8nResponse.ok ? 'n8n webhook connected!' : 'Check webhook URL'
                };

            default:
                return { success: false, message: 'Unknown API' };
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

    // Add model selection submenu
    chrome.contextMenus.create({
        id: 'select-model',
        title: 'Select AI Model',
        contexts: ['all']
    });

    // Add model options
    state.availableModels.openai.forEach(model => {
        chrome.contextMenus.create({
            id: `model-${model.id}`,
            parentId: 'select-model',
            title: `${model.name} - ${model.description}`,
            contexts: ['all']
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'ai-assistant' && info.selectionText) {
        processAIMessage(`Please help me with: ${info.selectionText}`, {
            url: tab.url,
            title: tab.title
        }).then(reply => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'showAIResponse',
                response: reply
            });
        });
    } else if (info.menuItemId.startsWith('model-')) {
        const modelId = info.menuItemId.replace('model-', '');
        state.settings.selectedModel = modelId;
        chrome.storage.sync.set({ selectedModel: modelId });
        console.log('Model switched to:', modelId);
    }
});

// Keep service worker alive
setInterval(() => {
    chrome.storage.local.get('keepAlive', () => {
        // Just access storage to keep alive
    });
}, 25000);

console.log('✅ Enhanced background script with latest models loaded!');