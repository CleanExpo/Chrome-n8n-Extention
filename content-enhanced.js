/**
 * Enhanced Content Script with Robust Injection and Error Recovery
 * Works on all pages with proper CSP handling
 */

// ============================================================================
// INITIALIZATION CHECK
// ============================================================================

// Prevent duplicate injection
if (window.__aiAssistantInjected) {
    console.log('AI Assistant already injected on this page');
} else {
    window.__aiAssistantInjected = true;

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const ContentState = {
        widgetInjected: false,
        isConnected: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        messageQueue: [],
        selectedText: '',
        apiStatus: null
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * Initialize content script
     */
    async function initializeContent() {
        try {
            console.log('🚀 Initializing AI Assistant content script');

            // Check if we can inject on this page
            if (!canInjectOnPage()) {
                console.log('Cannot inject on this page type');
                return;
            }

            // Establish connection with background script
            await establishConnection();

            // Inject floating widget if enabled
            const settings = await getSettings();
            if (settings.enableAssistant !== false) {
                await injectFloatingWidget();
            }

            // Setup message listeners
            setupMessageListeners();

            // Setup selection listener
            setupSelectionListener();

            // Monitor for dynamic content changes
            setupMutationObserver();

            console.log('✅ AI Assistant initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            // Retry initialization after delay
            setTimeout(initializeContent, 3000);
        }
    }

    // ============================================================================
    // PAGE COMPATIBILITY CHECK
    // ============================================================================

    /**
     * Check if we can inject on this page
     */
    function canInjectOnPage() {
        const url = window.location.href;

        // Don't inject on browser pages
        const blockedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'data:'];
        const isBlocked = blockedProtocols.some(protocol => url.startsWith(protocol));

        if (isBlocked) {
            return false;
        }

        // Don't inject on certain domains that might have conflicts
        const blockedDomains = [
            'accounts.google.com',
            'mail.google.com',
            'calendar.google.com',
            'drive.google.com'
        ];

        const hostname = window.location.hostname;
        if (blockedDomains.includes(hostname)) {
            console.log('Skipping injection on', hostname);
            return false;
        }

        return true;
    }

    // ============================================================================
    // CONNECTION MANAGEMENT
    // ============================================================================

    /**
     * Establish connection with background script
     */
    async function establishConnection() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Connection error:', chrome.runtime.lastError);
                    ContentState.isConnected = false;

                    // Retry connection
                    if (ContentState.reconnectAttempts < ContentState.maxReconnectAttempts) {
                        ContentState.reconnectAttempts++;
                        setTimeout(() => establishConnection().then(resolve), 2000);
                    } else {
                        resolve(false);
                    }
                } else {
                    ContentState.isConnected = true;
                    ContentState.reconnectAttempts = 0;
                    console.log('✅ Connected to background script');

                    // Process any queued messages
                    processMessageQueue();

                    resolve(true);
                }
            });
        });
    }

    /**
     * Send message with automatic reconnection
     */
    async function sendMessageToBackground(message) {
        if (!ContentState.isConnected) {
            // Queue message and try to reconnect
            ContentState.messageQueue.push(message);
            await establishConnection();
            return null;
        }

        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Message error:', chrome.runtime.lastError);
                    ContentState.isConnected = false;
                    ContentState.messageQueue.push(message);
                    establishConnection();
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Process queued messages
     */
    async function processMessageQueue() {
        while (ContentState.messageQueue.length > 0 && ContentState.isConnected) {
            const message = ContentState.messageQueue.shift();
            await sendMessageToBackground(message);
        }
    }

    // ============================================================================
    // FLOATING WIDGET INJECTION
    // ============================================================================

    /**
     * Inject floating widget
     */
    async function injectFloatingWidget() {
        if (ContentState.widgetInjected) return;

        try {
            // Create widget container
            const widgetContainer = document.createElement('div');
            widgetContainer.id = 'ai-assistant-widget';
            widgetContainer.className = 'ai-assistant-widget';
            widgetContainer.setAttribute('data-theme', 'auto');

            // Add widget HTML
            widgetContainer.innerHTML = `
                <div class="ai-widget-button" id="ai-widget-button">
                    <span class="ai-widget-icon">🤖</span>
                    <span class="ai-widget-badge" id="ai-message-badge" style="display: none;">1</span>
                </div>

                <div class="ai-widget-chat" id="ai-widget-chat" style="display: none;">
                    <div class="ai-chat-header">
                        <h3>AI Assistant</h3>
                        <div class="ai-chat-actions">
                            <button class="ai-chat-minimize" id="ai-minimize">−</button>
                            <button class="ai-chat-close" id="ai-close">×</button>
                        </div>
                    </div>

                    <div class="ai-chat-messages" id="ai-chat-messages">
                        <div class="ai-welcome-message">
                            <div class="ai-welcome-icon">👋</div>
                            <p>Hi! How can I help you with this page?</p>
                            <div class="ai-quick-actions">
                                <button class="ai-quick-btn" data-action="summarize">📝 Summarize</button>
                                <button class="ai-quick-btn" data-action="explain">💡 Explain</button>
                                <button class="ai-quick-btn" data-action="translate">🌐 Translate</button>
                            </div>
                        </div>
                    </div>

                    <div class="ai-chat-input">
                        <input type="text" id="ai-message-input" placeholder="Type your message..." />
                        <button id="ai-send-btn">Send</button>
                    </div>
                </div>
            `;

            // Add styles
            injectStyles();

            // Append to body
            document.body.appendChild(widgetContainer);

            // Setup widget event listeners
            setupWidgetListeners();

            ContentState.widgetInjected = true;
            console.log('✅ Floating widget injected');
        } catch (error) {
            console.error('❌ Widget injection failed:', error);
        }
    }

    /**
     * Inject widget styles
     */
    function injectStyles() {
        if (document.getElementById('ai-assistant-styles')) return;

        const styleElement = document.createElement('style');
        styleElement.id = 'ai-assistant-styles';
        styleElement.textContent = `
            .ai-assistant-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .ai-widget-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.3s, box-shadow 0.3s;
                position: relative;
            }

            .ai-widget-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }

            .ai-widget-icon {
                font-size: 30px;
                filter: grayscale(0);
            }

            .ai-widget-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }

            .ai-widget-chat {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .ai-chat-header {
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .ai-chat-header h3 {
                margin: 0;
                font-size: 16px;
            }

            .ai-chat-actions {
                display: flex;
                gap: 8px;
            }

            .ai-chat-actions button {
                width: 28px;
                height: 28px;
                border: none;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-chat-actions button:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .ai-chat-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                background: #f9fafb;
            }

            .ai-welcome-message {
                text-align: center;
                padding: 20px;
            }

            .ai-welcome-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .ai-quick-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .ai-quick-btn {
                padding: 8px 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }

            .ai-quick-btn:hover {
                background: #f3f4f6;
                border-color: #667eea;
            }

            .ai-chat-input {
                padding: 16px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 8px;
                background: white;
            }

            #ai-message-input {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                outline: none;
                font-size: 14px;
            }

            #ai-message-input:focus {
                border-color: #667eea;
            }

            #ai-send-btn {
                padding: 10px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 24px;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.2s;
            }

            #ai-send-btn:hover {
                transform: scale(1.05);
            }

            .ai-message {
                margin-bottom: 12px;
                animation: slideIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .ai-message.user {
                text-align: right;
            }

            .ai-message-bubble {
                display: inline-block;
                max-width: 80%;
                padding: 10px 14px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }

            .ai-message.user .ai-message-bubble {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-bottom-right-radius: 4px;
            }

            .ai-message.assistant .ai-message-bubble {
                background: white;
                border: 1px solid #e5e7eb;
                border-bottom-left-radius: 4px;
            }

            .ai-typing-indicator {
                display: inline-flex;
                padding: 10px 14px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 18px;
                gap: 4px;
            }

            .ai-typing-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #9ca3af;
                animation: typing 1.4s infinite ease-in-out;
            }

            .ai-typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .ai-typing-dot:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
                40% { transform: scale(1.3); opacity: 1; }
            }

            /* Dark theme support */
            @media (prefers-color-scheme: dark) {
                .ai-widget-chat {
                    background: #1f2937;
                }

                .ai-chat-messages {
                    background: #111827;
                }

                .ai-message.assistant .ai-message-bubble {
                    background: #374151;
                    color: #f3f4f6;
                    border-color: #4b5563;
                }

                #ai-message-input {
                    background: #374151;
                    color: white;
                    border-color: #4b5563;
                }

                .ai-chat-input {
                    background: #1f2937;
                    border-color: #374151;
                }
            }
        `;

        document.head.appendChild(styleElement);
    }

    /**
     * Setup widget event listeners
     */
    function setupWidgetListeners() {
        // Toggle chat
        document.getElementById('ai-widget-button')?.addEventListener('click', toggleChat);

        // Close chat
        document.getElementById('ai-close')?.addEventListener('click', closeChat);

        // Minimize chat
        document.getElementById('ai-minimize')?.addEventListener('click', closeChat);

        // Send message
        document.getElementById('ai-send-btn')?.addEventListener('click', sendMessage);

        // Send on enter
        document.getElementById('ai-message-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Quick actions
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => handleQuickAction(btn.dataset.action));
        });
    }

    /**
     * Toggle chat window
     */
    function toggleChat() {
        const chat = document.getElementById('ai-widget-chat');
        if (chat) {
            const isVisible = chat.style.display !== 'none';
            chat.style.display = isVisible ? 'none' : 'flex';

            if (!isVisible) {
                // Focus input when opening
                document.getElementById('ai-message-input')?.focus();

                // Clear badge
                const badge = document.getElementById('ai-message-badge');
                if (badge) badge.style.display = 'none';
            }
        }
    }

    /**
     * Close chat window
     */
    function closeChat() {
        const chat = document.getElementById('ai-widget-chat');
        if (chat) chat.style.display = 'none';
    }

    /**
     * Send message to AI
     */
    async function sendMessage() {
        const input = document.getElementById('ai-message-input');
        const message = input?.value.trim();

        if (!message) return;

        // Clear input
        input.value = '';

        // Add user message to chat
        addMessageToChat(message, 'user');

        // Show typing indicator
        showTypingIndicator();

        // Send to background
        const response = await sendMessageToBackground({
            action: 'sendMessage',
            message: message,
            context: {
                url: window.location.href,
                title: document.title,
                selectedText: ContentState.selectedText
            }
        });

        // Remove typing indicator
        hideTypingIndicator();

        // Add response to chat
        if (response?.reply) {
            addMessageToChat(response.reply, 'assistant');
        } else {
            addMessageToChat('Sorry, I encountered an error. Please check your API settings.', 'assistant');
        }
    }

    /**
     * Add message to chat
     */
    function addMessageToChat(text, sender) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;

        // Remove welcome message if exists
        const welcome = messagesContainer.querySelector('.ai-welcome-message');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;

        const indicator = document.createElement('div');
        indicator.className = 'ai-message assistant';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="ai-typing-indicator">
                <span class="ai-typing-dot"></span>
                <span class="ai-typing-dot"></span>
                <span class="ai-typing-dot"></span>
            </div>
        `;

        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    /**
     * Handle quick actions
     */
    async function handleQuickAction(action) {
        let prompt = '';

        switch(action) {
            case 'summarize':
                prompt = 'Please summarize the content of this webpage in a clear and concise way.';
                break;
            case 'explain':
                prompt = ContentState.selectedText ?
                    `Please explain this: "${ContentState.selectedText}"` :
                    'Please explain the main concept on this page.';
                break;
            case 'translate':
                prompt = ContentState.selectedText ?
                    `Translate this to English: "${ContentState.selectedText}"` :
                    'Translate the main content of this page to English.';
                break;
        }

        if (prompt) {
            // Add to input and send
            const input = document.getElementById('ai-message-input');
            if (input) {
                input.value = prompt;
                sendMessage();
            }
        }
    }

    // ============================================================================
    // MESSAGE LISTENERS
    // ============================================================================

    /**
     * Setup message listeners
     */
    function setupMessageListeners() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            handleMessage(request, sendResponse);
            return true; // Keep channel open for async response
        });
    }

    /**
     * Handle incoming messages
     */
    function handleMessage(request, sendResponse) {
        switch(request.action) {
            case 'openAssistant':
                if (!ContentState.widgetInjected) {
                    injectFloatingWidget().then(() => {
                        toggleChat();
                    });
                } else {
                    toggleChat();
                }
                sendResponse({ success: true });
                break;

            case 'showAIResponse':
                // Show response in notification or chat
                addMessageToChat(request.response, 'assistant');

                // Show badge if chat is closed
                const chat = document.getElementById('ai-widget-chat');
                if (chat?.style.display === 'none') {
                    const badge = document.getElementById('ai-message-badge');
                    if (badge) {
                        badge.style.display = 'flex';
                        badge.textContent = '1';
                    }
                }
                sendResponse({ success: true });
                break;

            case 'getSelection':
                sendResponse({ text: ContentState.selectedText });
                break;

            case 'extensionReady':
                ContentState.apiStatus = request.apiStatus;
                console.log('Extension ready, API status:', ContentState.apiStatus);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    // ============================================================================
    // SELECTION LISTENER
    // ============================================================================

    /**
     * Setup text selection listener
     */
    function setupSelectionListener() {
        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text) {
                ContentState.selectedText = text;
            }
        });
    }

    // ============================================================================
    // MUTATION OBSERVER
    // ============================================================================

    /**
     * Monitor for dynamic content changes
     */
    function setupMutationObserver() {
        // Watch for dynamic content that might remove our widget
        const observer = new MutationObserver((mutations) => {
            // Check if widget was removed
            if (ContentState.widgetInjected && !document.getElementById('ai-assistant-widget')) {
                console.log('Widget was removed, re-injecting...');
                ContentState.widgetInjected = false;
                injectFloatingWidget();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    // ============================================================================
    // SETTINGS
    // ============================================================================

    /**
     * Get extension settings
     */
    async function getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (settings) => {
                resolve(settings || {});
            });
        });
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }
}