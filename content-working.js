/**
 * Simple Working Content Script
 * Minimal, reliable, works everywhere
 */

console.log('🚀 Content script loaded on:', window.location.href);

// Check if already injected
if (window.__aiAssistantLoaded) {
    console.log('Already loaded, skipping');
} else {
    window.__aiAssistantLoaded = true;

    // Simple state
    let isConnected = false;
    let widgetInjected = false;

    // Test connection to background
    function testConnection() {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Connection error:', chrome.runtime.lastError);
                isConnected = false;
                setTimeout(testConnection, 3000); // Retry
            } else {
                console.log('Connected to background:', response);
                isConnected = true;
            }
        });
    }

    // Inject floating button
    function injectWidget() {
        if (widgetInjected) return;

        // Skip on certain pages
        const url = window.location.href;
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
            return;
        }

        console.log('Injecting widget...');

        // Create floating button
        const button = document.createElement('div');
        button.id = 'ai-assistant-button';
        button.innerHTML = '🤖';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: transform 0.3s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', () => {
            console.log('Button clicked, opening chat...');
            openChat();
        });

        document.body.appendChild(button);
        widgetInjected = true;
        console.log('Widget injected successfully');
    }

    // Open chat interface
    function openChat() {
        // Check if chat exists
        let chat = document.getElementById('ai-assistant-chat');

        if (!chat) {
            // Create chat interface
            chat = document.createElement('div');
            chat.id = 'ai-assistant-chat';
            chat.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 999998;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            chat.innerHTML = `
                <div style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px 16px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 16px;">AI Assistant</h3>
                        <button onclick="this.closest('#ai-assistant-chat').style.display='none'" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                </div>
                <div id="ai-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
                        <p style="color: #6b7280;">How can I help you today?</p>
                    </div>
                </div>
                <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: white; border-radius: 0 0 16px 16px;">
                    <div style="display: flex; gap: 8px;">
                        <input id="ai-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; font-size: 14px;">
                        <button id="ai-send" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: 600;">Send</button>
                    </div>
                </div>
            `;

            document.body.appendChild(chat);

            // Setup input handlers
            const input = document.getElementById('ai-input');
            const sendBtn = document.getElementById('ai-send');

            const sendMessage = async () => {
                const message = input.value.trim();
                if (!message) return;

                // Add user message
                addMessage(message, 'user');
                input.value = '';

                // Show typing
                const typingId = showTyping();

                // Send to background
                chrome.runtime.sendMessage({
                    action: 'sendMessage',
                    message: message,
                    context: {
                        url: window.location.href,
                        title: document.title
                    }
                }, (response) => {
                    // Remove typing
                    removeTyping(typingId);

                    if (response && response.reply) {
                        addMessage(response.reply, 'assistant');
                    } else {
                        addMessage('Sorry, I couldn\'t process that. Please check your settings.', 'assistant');
                    }
                });
            };

            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });

        } else {
            // Toggle visibility
            chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
        }
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messagesDiv = document.getElementById('ai-messages');
        if (!messagesDiv) return;

        // Remove welcome message if exists
        const welcome = messagesDiv.querySelector('div[style*="text-align: center"]');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            ${sender === 'user' ? 'text-align: right;' : 'text-align: left;'}
        `;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
            display: inline-block;
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            ${sender === 'user' ?
                'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' :
                'background: white; border: 1px solid #e5e7eb;'}
        `;
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Show typing indicator
    function showTyping() {
        const messagesDiv = document.getElementById('ai-messages');
        if (!messagesDiv) return;

        const typingDiv = document.createElement('div');
        const id = 'typing-' + Date.now();
        typingDiv.id = id;
        typingDiv.innerHTML = `
            <div style="display: inline-flex; padding: 10px 14px; background: white; border: 1px solid #e5e7eb; border-radius: 18px; gap: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; animation: pulse 1.4s infinite;"></span>
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; animation: pulse 1.4s infinite; animation-delay: 0.2s;"></span>
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; animation: pulse 1.4s infinite; animation-delay: 0.4s;"></span>
            </div>
        `;

        // Add animation
        if (!document.getElementById('ai-pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'ai-pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 80%, 100% { opacity: 0.5; }
                    40% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        messagesDiv.appendChild(typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return id;
    }

    // Remove typing indicator
    function removeTyping(id) {
        const typing = document.getElementById(id);
        if (typing) typing.remove();
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Message from background:', request);

        if (request.action === 'openAssistant') {
            openChat();
            sendResponse({ success: true });
        } else if (request.action === 'showAIResponse') {
            // Show response in chat
            if (!document.getElementById('ai-assistant-chat')) {
                openChat();
            }
            addMessage(request.response, 'assistant');
            sendResponse({ success: true });
        }

        return true;
    });

    // Initialize
    function init() {
        console.log('Initializing content script...');
        testConnection();
        setTimeout(injectWidget, 1000); // Delay to ensure page is ready
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ Content script setup complete');
}