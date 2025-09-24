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

    // Add visible marker for debugging
    console.log('✅ AI Assistant content script initializing...');

    // Simple state
    let isConnected = false;
    let widgetInjected = false;

    // Test connection to background
    function testConnection() {
        try {
            chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('⚠️ Connection error:', chrome.runtime.lastError.message);
                    isConnected = false;
                    setTimeout(testConnection, 3000); // Retry
                } else {
                    console.log('✅ Connected to background:', response);
                    isConnected = true;
                    // Try injecting widget after successful connection
                    if (!widgetInjected) {
                        setTimeout(injectWidget, 500);
                    }
                }
            });
        } catch (error) {
            console.error('❌ Failed to connect to background:', error);
            isConnected = false;
        }
    }

    // Inject floating button
    function injectWidget() {
        if (widgetInjected) {
            console.log('Widget already injected');
            return;
        }

        // Skip on certain pages
        const url = window.location.href;
        if (url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('edge://') ||
            url.startsWith('about:')) {
            console.log('Skipping widget injection on system page');
            return;
        }

        console.log('🔧 Injecting AI Assistant widget...');

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
        console.log('✅ AI Assistant widget injected successfully!');

        // Verify injection
        const injectedButton = document.getElementById('ai-assistant-button');
        if (injectedButton) {
            console.log('✅ Widget verified in DOM');
        } else {
            console.error('❌ Widget injection failed - not found in DOM');
            widgetInjected = false;
        }
    }

    // Open chat interface
    function openChat() {
        // Check if chat exists
        let chat = document.getElementById('ai-assistant-chat');

        if (!chat) {
            // Create chat interface with enhanced features
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
                transition: all 0.3s ease;
            `;

            // Add data attribute to track minimized state
            chat.setAttribute('data-minimized', 'false');

            chat.innerHTML = `
                <div id="ai-chat-header" style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px 16px 0 0; cursor: move;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 16px;">AI Assistant</h3>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button id="ai-minimize-btn" title="Minimize" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">−</button>
                            <button id="ai-close-btn" title="Close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
                        </div>
                    </div>
                </div>
                <div id="ai-chat-body" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <div id="ai-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;">
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
                            <p style="color: #6b7280;">How can I help you today?</p>
                        </div>
                    </div>
                    <div id="ai-input-area" style="padding: 16px; border-top: 1px solid #e5e7eb; background: white; border-radius: 0 0 16px 16px;">
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <button id="ai-screenshot-btn" title="Capture Screenshot" style="padding: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            </button>
                            <button id="ai-model-btn" title="Select Model" style="padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 12px;">
                                <span id="ai-model-display">GPT-4o Mini</span>
                            </button>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <input id="ai-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 24px; outline: none; font-size: 14px;">
                            <button id="ai-send" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: 600;">Send</button>
                        </div>
                    </div>
                </div>
                <div id="ai-model-selector" style="display: none; position: absolute; bottom: 100px; right: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 300px; overflow-y: auto; width: 250px;">
                    <div style="padding: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                        <strong>Select AI Model</strong>
                    </div>
                    <div id="ai-model-list"></div>
                </div>
            `;

            document.body.appendChild(chat);

            // Setup all event handlers
            setupChatHandlers(chat);

            // Load available models
            loadAvailableModels();

        } else {
            // Toggle visibility
            chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
        }
    }

    // Setup chat handlers
    function setupChatHandlers(chat) {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        const minimizeBtn = document.getElementById('ai-minimize-btn');
        const closeBtn = document.getElementById('ai-close-btn');
        const screenshotBtn = document.getElementById('ai-screenshot-btn');
        const modelBtn = document.getElementById('ai-model-btn');
        const modelSelector = document.getElementById('ai-model-selector');

        // Send message handler
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

        // Minimize/Restore handler
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMinimized = chat.getAttribute('data-minimized') === 'true';

            if (isMinimized) {
                // Restore
                chat.style.height = '500px';
                document.getElementById('ai-chat-body').style.display = 'flex';
                chat.setAttribute('data-minimized', 'false');
                minimizeBtn.innerHTML = '−';
                minimizeBtn.title = 'Minimize';
            } else {
                // Minimize
                chat.style.height = 'auto';
                document.getElementById('ai-chat-body').style.display = 'none';
                chat.setAttribute('data-minimized', 'true');
                minimizeBtn.innerHTML = '□';
                minimizeBtn.title = 'Restore';
            }
        });

        // Close handler
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chat.style.display = 'none';
        });

        // Screenshot handler
        screenshotBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await captureAndSendScreenshot();
        });

        // Model selector handler
        modelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelSelector.style.display = modelSelector.style.display === 'none' ? 'block' : 'none';
        });

        // Close model selector when clicking outside
        document.addEventListener('click', (e) => {
            if (!modelBtn.contains(e.target) && !modelSelector.contains(e.target)) {
                modelSelector.style.display = 'none';
            }
        });

        // Send message handlers
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Make header draggable
        makeDraggable(chat, document.getElementById('ai-chat-header'));
    }

    // Make element draggable
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            // Update position to use top/left instead of bottom/right
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Capture and send screenshot
    async function captureAndSendScreenshot() {
        try {
            // Show capture UI
            const captureOverlay = createCaptureOverlay();
            document.body.appendChild(captureOverlay);

            // Wait for user to select area or take full viewport
            const screenshot = await new Promise((resolve) => {
                // Option 1: Capture visible viewport
                const captureViewport = () => {
                    chrome.runtime.sendMessage({
                        action: 'captureVisibleTab'
                    }, (response) => {
                        if (response && response.dataUrl) {
                            resolve(response.dataUrl);
                        } else {
                            resolve(null);
                        }
                    });
                };

                // Add capture button to overlay
                const captureBtn = document.createElement('button');
                captureBtn.textContent = 'Capture Visible Area';
                captureBtn.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    z-index: 1000001;
                `;
                captureBtn.onclick = () => {
                    captureOverlay.remove();
                    captureViewport();
                };
                captureOverlay.appendChild(captureBtn);

                // Cancel button
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 180px;
                    padding: 12px 24px;
                    background: #6b7280;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    z-index: 1000001;
                `;
                cancelBtn.onclick = () => {
                    captureOverlay.remove();
                    resolve(null);
                };
                captureOverlay.appendChild(cancelBtn);
            });

            if (screenshot) {
                // Add screenshot message
                addMessage('Screenshot captured! Analyzing...', 'system');

                // Send screenshot to AI for analysis
                const typingId = showTyping();
                chrome.runtime.sendMessage({
                    action: 'sendMessage',
                    message: 'Please analyze this screenshot and tell me what you see.',
                    screenshot: screenshot,
                    context: {
                        url: window.location.href,
                        title: document.title
                    }
                }, (response) => {
                    removeTyping(typingId);
                    if (response && response.reply) {
                        addMessage(response.reply, 'assistant');
                    } else {
                        addMessage('Sorry, I couldn\'t analyze the screenshot.', 'assistant');
                    }
                });
            }
        } catch (error) {
            console.error('Screenshot capture error:', error);
            addMessage('Failed to capture screenshot. Please try again.', 'system');
        }
    }

    // Create capture overlay
    function createCaptureOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'ai-capture-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 1000000;
            cursor: crosshair;
        `;

        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            z-index: 1000001;
        `;
        instructions.innerHTML = `
            <h3 style="margin: 0 0 16px 0;">Capture Screenshot</h3>
            <p style="color: #6b7280;">Click the button above to capture the visible area</p>
        `;
        overlay.appendChild(instructions);

        return overlay;
    }

    // Load available models
    async function loadAvailableModels() {
        chrome.runtime.sendMessage({ action: 'getModels' }, (response) => {
            if (response && response.success) {
                const modelList = document.getElementById('ai-model-list');
                const modelDisplay = document.getElementById('ai-model-display');

                if (modelList) {
                    modelList.innerHTML = '';

                    // Group models by provider
                    Object.entries(response.models).forEach(([provider, models]) => {
                        const providerGroup = document.createElement('div');
                        providerGroup.style.cssText = 'margin-bottom: 12px;';

                        const providerTitle = document.createElement('div');
                        providerTitle.style.cssText = 'font-size: 11px; text-transform: uppercase; color: #9ca3af; margin-bottom: 4px; padding: 0 8px;';
                        providerTitle.textContent = provider;
                        providerGroup.appendChild(providerTitle);

                        models.forEach(model => {
                            const modelOption = document.createElement('div');
                            modelOption.style.cssText = `
                                padding: 8px;
                                cursor: pointer;
                                border-radius: 4px;
                                transition: background 0.2s;
                                ${response.current.model === model.id ? 'background: #f3f4f6;' : ''}
                            `;
                            modelOption.innerHTML = `
                                <div style="font-size: 13px; font-weight: 500;">${model.name}</div>
                                <div style="font-size: 11px; color: #6b7280;">${model.description}</div>
                            `;
                            modelOption.onmouseover = () => {
                                if (response.current.model !== model.id) {
                                    modelOption.style.background = '#f9fafb';
                                }
                            };
                            modelOption.onmouseout = () => {
                                if (response.current.model !== model.id) {
                                    modelOption.style.background = 'transparent';
                                }
                            };
                            modelOption.onclick = () => {
                                selectModel(provider, model);
                                document.getElementById('ai-model-selector').style.display = 'none';
                            };
                            providerGroup.appendChild(modelOption);
                        });

                        modelList.appendChild(providerGroup);
                    });
                }

                // Update current model display
                if (modelDisplay && response.current.model) {
                    const currentProvider = response.models[response.current.provider];
                    const currentModel = currentProvider?.find(m => m.id === response.current.model);
                    if (currentModel) {
                        modelDisplay.textContent = currentModel.name;
                    }
                }
            }
        });
    }

    // Select model
    function selectModel(provider, model) {
        chrome.runtime.sendMessage({
            action: 'setModel',
            provider: provider,
            model: model.id
        }, (response) => {
            if (response && response.success) {
                const modelDisplay = document.getElementById('ai-model-display');
                if (modelDisplay) {
                    modelDisplay.textContent = model.name;
                }
                addMessage(`Switched to ${model.name}`, 'system');
            }
        });
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

        // Style based on sender type
        if (sender === 'user') {
            bubble.style.cssText = `
                display: inline-block;
                max-width: 80%;
                padding: 10px 14px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            `;
        } else if (sender === 'system') {
            bubble.style.cssText = `
                display: inline-block;
                max-width: 80%;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 13px;
                line-height: 1.4;
                background: #f3f4f6;
                color: #6b7280;
                font-style: italic;
            `;
        } else {
            bubble.style.cssText = `
                display: inline-block;
                max-width: 80%;
                padding: 10px 14px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                background: white;
                border: 1px solid #e5e7eb;
            `;
        }

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
        console.log('🚀 Initializing AI Assistant...');

        // Check if document.body exists
        if (!document.body) {
            console.log('⏳ Waiting for document.body...');
            setTimeout(init, 100);
            return;
        }

        // Start connection test
        testConnection();

        // Try to inject widget with multiple attempts
        const attempts = [500, 1500, 3000];
        attempts.forEach(delay => {
            setTimeout(() => {
                if (!widgetInjected) {
                    console.log(`⏰ Injection attempt at ${delay}ms`);
                    injectWidget();
                }
            }, delay);
        });
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ AI Assistant content script setup complete');

    // Export test function for debugging
    window.testAIAssistant = function() {
        console.log('AI Assistant Status:', {
            loaded: window.__aiAssistantLoaded,
            connected: isConnected,
            widgetInjected: widgetInjected,
            widgetVisible: !!document.getElementById('ai-assistant-button'),
            chatVisible: !!document.getElementById('ai-assistant-chat')
        });
        return isConnected;
    };
}