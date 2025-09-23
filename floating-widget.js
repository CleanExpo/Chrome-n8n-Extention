// Floating Assistant Widget - Injected into web pages

class FloatingAssistant {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.isResizing = false;
        this.isMaximized = false;
        this.isDocked = false;
        this.isEnabled = true;
        this.position = { x: window.innerWidth - 80, y: window.innerHeight - 100 };
        this.windowSize = { width: 380, height: 500 };
        this.dockedWidth = 400;
        this.previousSize = null;
        this.messages = [];
        this.wsConnected = false;
        this.apiConnections = {};
        this.checkInterval = null;
        this.originalBodyMargin = null;
        this.init();
    }

    async init() {
        // Check if assistant is enabled
        await this.checkEnabledState();

        // Load user preferences
        await this.loadPreferences();

        if (this.isEnabled) {
            this.createWidget();
            this.attachEventListeners();
            this.checkDesktopConnection();
        }

        // Listen for toggle messages
        this.setupMessageListener();
    }

    async loadPreferences() {
        return new Promise((resolve) => {
            // Check if chrome.storage is available
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.get(['assistantDocked', 'dockedWidth'], (result) => {
                    this.isDocked = result.assistantDocked || false;
                    this.dockedWidth = result.dockedWidth || 400;
                    resolve();
                });
            } else {
                // Use localStorage as fallback
                try {
                    this.isDocked = localStorage.getItem('assistantDocked') === 'true' || false;
                    this.dockedWidth = parseInt(localStorage.getItem('dockedWidth') || '400');
                } catch (e) {
                    console.log('Storage not available, using defaults');
                }
                resolve();
            }
        });
    }

    async checkEnabledState() {
        return new Promise((resolve) => {
            // Check if chrome.storage is available
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.get(['assistantEnabled'], (result) => {
                    this.isEnabled = result.assistantEnabled !== false; // Default to true
                    resolve();
                });
            } else {
                // Use localStorage as fallback
                try {
                    const stored = localStorage.getItem('assistantEnabled');
                    this.isEnabled = stored !== 'false'; // Default to true
                } catch (e) {
                    this.isEnabled = true; // Default to enabled
                }
                resolve();
            }
        });
    }

    setupMessageListener() {
        try {
            // Only setup chrome listener if available
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                try {
                    if (request.action === 'toggleWidget') {
                        this.handleToggle(request.enabled);
                    } else if (request.action === 'openAssistant') {
                        if (this.isEnabled && !this.isOpen) {
                            this.toggleChat();
                        }
                    }
                    // Always send a response to prevent port closed errors
                    if (sendResponse) {
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                    if (sendResponse) {
                        sendResponse({ success: false, error: error.message });
                    }
                }
                return true; // Keep port open for async response
                });
            } else {
                console.log('Chrome runtime not available, using window message listener');
                // Fallback to window messaging
                window.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'n8n-assistant') {
                        if (event.data.action === 'toggleWidget') {
                            this.handleToggle(event.data.enabled);
                        } else if (event.data.action === 'openAssistant') {
                            if (this.isEnabled && !this.isOpen) {
                                this.toggleChat();
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to setup message listener:', error);
        }
    }

    handleToggle(enabled) {
        this.isEnabled = enabled;

        if (enabled && !this.container) {
            // Create widget if it doesn't exist
            this.createWidget();
            this.attachEventListeners();
            this.checkDesktopConnection();
        } else if (!enabled && this.container) {
            // Remove widget if it exists
            this.destroy();
        }
    }

    // Helper methods for chrome API compatibility
    getResourceURL(path) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL(path);
        } else {
            // Fallback to relative path
            return path;
        }
    }

    saveToStorage(data) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(data);
        } else {
            // Fallback to localStorage
            try {
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                });
            } catch (e) {
                console.log('Unable to save to storage:', e);
            }
        }
    }

    sendMessage(message, callback) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(message, callback);
        } else {
            // Fallback to window messaging
            window.postMessage({
                type: 'n8n-assistant-message',
                ...message
            }, '*');

            // Simulate callback for consistency
            if (callback) {
                setTimeout(() => callback({ success: true, fallback: true }), 10);
            }
        }
    }

    destroy() {
        // Clear interval timer
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    createWidget() {
        // Create main container
        const container = document.createElement('div');
        container.id = 'n8n-assistant-widget';
        container.innerHTML = `
            <style>
                #n8n-assistant-widget {
                    position: fixed;
                    z-index: 2147483647;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                #n8n-assistant-widget.docked {
                    top: 0 !important;
                    right: 0 !important;
                    left: auto !important;
                    height: 100vh !important;
                    width: var(--docked-width, 400px) !important;
                }

                body.n8n-assistant-docked {
                    margin-right: var(--docked-width, 400px) !important;
                    transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .n8n-widget-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .n8n-widget-button:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                }

                .n8n-widget-button img {
                    width: 35px;
                    height: 35px;
                    filter: brightness(0) invert(1);
                }

                .n8n-status-dot {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                }

                .n8n-status-dot.connected {
                    background: #10b981;
                }

                .n8n-status-dot.disconnected {
                    background: #ef4444;
                }

                .n8n-chat-window {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 380px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    resize: both;
                    min-width: 320px;
                    min-height: 400px;
                    max-width: 90vw;
                    max-height: 90vh;
                }

                #n8n-assistant-widget.docked .n8n-chat-window {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: auto;
                    width: 100%;
                    height: 100vh;
                    border-radius: 0;
                    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
                    max-width: none;
                    max-height: none;
                    resize: none;
                }

                #n8n-assistant-widget.docked .n8n-widget-button {
                    display: none;
                }

                #n8n-assistant-widget.docked .n8n-maximize-btn {
                    display: none;
                }

                #n8n-assistant-widget.docked .n8n-resize-handle {
                    display: none;
                }

                .n8n-chat-window.maximized {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    width: auto;
                    height: auto;
                    max-width: none;
                    max-height: none;
                    border-radius: 8px;
                    resize: none;
                }

                .n8n-resize-handle {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 20px;
                    height: 20px;
                    cursor: nwse-resize;
                    background: linear-gradient(135deg, transparent 50%, #667eea 50%);
                    border-radius: 0 0 12px 0;
                    opacity: 0.3;
                    transition: opacity 0.3s;
                }

                .n8n-resize-handle:hover {
                    opacity: 0.6;
                }

                .n8n-chat-window.maximized .n8n-resize-handle {
                    display: none;
                }

                .n8n-chat-window.open {
                    display: flex;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .n8n-chat-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                }

                .n8n-header-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .n8n-maximize-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }

                .n8n-maximize-btn:hover {
                    opacity: 1;
                }

                .n8n-dock-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }

                .n8n-dock-btn:hover {
                    opacity: 1;
                }

                #n8n-assistant-widget.docked .n8n-dock-resize {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    cursor: ew-resize;
                    background: transparent;
                    transition: background 0.3s;
                }

                #n8n-assistant-widget.docked .n8n-dock-resize:hover {
                    background: #667eea;
                }

                .n8n-chat-title {
                    font-weight: 600;
                    font-size: 16px;
                }

                .n8n-chat-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .n8n-chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    background: #f9fafb;
                }

                .n8n-message {
                    margin-bottom: 12px;
                    display: flex;
                    align-items: flex-start;
                }

                .n8n-message.user {
                    justify-content: flex-end;
                }

                .n8n-message-bubble {
                    max-width: 70%;
                    padding: 10px 14px;
                    border-radius: 12px;
                    word-wrap: break-word;
                }

                .n8n-message.assistant .n8n-message-bubble {
                    background: white;
                    color: #333;
                    border: 1px solid #e5e7eb;
                }

                .n8n-message.user .n8n-message-bubble {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .n8n-chat-input-container {
                    padding: 15px;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                }

                .n8n-input-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .n8n-chat-input {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid #e5e7eb;
                    border-radius: 24px;
                    outline: none;
                    font-size: 14px;
                    transition: border 0.3s;
                }

                .n8n-chat-input:focus {
                    border-color: #667eea;
                }

                .n8n-input-button {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .n8n-send-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .n8n-attach-button {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .n8n-screenshot-button {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .n8n-voice-button {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .n8n-input-button:hover {
                    transform: scale(1.1);
                }

                .n8n-quick-actions {
                    padding: 10px 15px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .n8n-quick-action {
                    padding: 6px 12px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .n8n-quick-action:hover {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .n8n-api-status {
                    padding: 8px 15px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    font-size: 12px;
                    overflow-x: auto;
                }

                .n8n-api-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    white-space: nowrap;
                }

                .n8n-api-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .n8n-api-indicator.connected {
                    background: #10b981;
                }

                .n8n-api-indicator.disconnected {
                    background: #ef4444;
                }

                .n8n-api-indicator.configured {
                    background: #3b82f6;
                }

                .n8n-api-indicator.not_configured {
                    background: #9ca3af;
                }
            </style>

            <button class="n8n-widget-button" id="n8n-widget-toggle">
                <img src="${this.getResourceURL('images/icon-48.png')}" alt="n8n">
                <span class="n8n-status-dot disconnected" id="n8n-status"></span>
            </button>

            <div class="n8n-chat-window" id="n8n-chat-window">
                <div class="n8n-dock-resize" id="n8n-dock-resize"></div>
                <div class="n8n-chat-header">
                    <span class="n8n-chat-title">n8n AI Assistant</span>
                    <div class="n8n-header-controls">
                        <button class="n8n-dock-btn" id="n8n-dock" title="Dock to side">⬛</button>
                        <button class="n8n-maximize-btn" id="n8n-maximize" title="Maximize">⬜</button>
                        <button class="n8n-chat-close" id="n8n-close">×</button>
                    </div>
                </div>

                <div class="n8n-api-status" id="n8n-api-status">
                    <div class="n8n-api-item">
                        <span class="n8n-api-indicator disconnected" id="api-n8n"></span>
                        <span>n8n</span>
                    </div>
                    <div class="n8n-api-item">
                        <span class="n8n-api-indicator disconnected" id="api-ws"></span>
                        <span>WebSocket</span>
                    </div>
                    <div class="n8n-api-item">
                        <span class="n8n-api-indicator not_configured" id="api-google"></span>
                        <span>Google</span>
                    </div>
                    <div class="n8n-api-item">
                        <span class="n8n-api-indicator not_configured" id="api-openai"></span>
                        <span>OpenAI</span>
                    </div>
                </div>

                <div class="n8n-chat-messages" id="n8n-messages">
                    <div class="n8n-message assistant">
                        <div class="n8n-message-bubble">
                            👋 Hi! I'm your n8n AI Assistant. How can I help you today?
                        </div>
                    </div>
                </div>

                <div class="n8n-quick-actions">
                    <button class="n8n-quick-action" data-action="extract">Extract Page Content</button>
                    <button class="n8n-quick-action" data-action="summarize">Summarize Page</button>
                    <button class="n8n-quick-action" data-action="form">Auto-fill Forms</button>
                    <button class="n8n-quick-action" data-action="translate">Translate</button>
                </div>

                <div class="n8n-chat-input-container">
                    <div class="n8n-input-row">
                        <button class="n8n-input-button n8n-attach-button" id="n8n-attach" title="Attach file">
                            📎
                        </button>
                        <button class="n8n-input-button n8n-screenshot-button" id="n8n-screenshot" title="Take screenshot">
                            📷
                        </button>
                        <button class="n8n-input-button n8n-voice-button" id="n8n-voice" title="Voice input">
                            🎤
                        </button>
                        <input type="text" class="n8n-chat-input" id="n8n-input" placeholder="Type your message...">
                        <button class="n8n-input-button n8n-send-button" id="n8n-send">
                            ➤
                        </button>
                    </div>
                    <input type="file" id="n8n-file-input" style="display: none;" accept="image/*,.pdf,.txt,.doc,.docx">
                </div>
                <div class="n8n-resize-handle" id="n8n-resize-handle"></div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;

        // Apply docked state if saved
        if (this.isDocked) {
            this.applyDockedMode();
        } else {
            this.updatePosition();
        }
    }

    attachEventListeners() {
        const toggle = document.getElementById('n8n-widget-toggle');
        const close = document.getElementById('n8n-close');
        const maximize = document.getElementById('n8n-maximize');
        const dock = document.getElementById('n8n-dock');
        const dockResize = document.getElementById('n8n-dock-resize');
        const input = document.getElementById('n8n-input');
        const send = document.getElementById('n8n-send');
        const attach = document.getElementById('n8n-attach');
        const screenshot = document.getElementById('n8n-screenshot');
        const voice = document.getElementById('n8n-voice');
        const fileInput = document.getElementById('n8n-file-input');
        const resizeHandle = document.getElementById('n8n-resize-handle');
        const chatWindow = document.getElementById('n8n-chat-window');

        // Toggle chat window
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleChat());
        }
        close.addEventListener('click', () => this.toggleChat());

        // Dock/undock window
        dock.addEventListener('click', () => this.toggleDocked());

        // Maximize/restore window
        maximize.addEventListener('click', () => this.toggleMaximize());

        // Make widget draggable
        if (toggle) {
            toggle.addEventListener('mousedown', (e) => this.startDragging(e));
        }

        // Resize functionality
        resizeHandle.addEventListener('mousedown', (e) => this.startResizing(e));

        // Dock resize functionality
        if (dockResize) {
            dockResize.addEventListener('mousedown', (e) => this.startDockResize(e));
        }

        // Handle window resize on double-click header
        const chatHeader = document.querySelector('.n8n-chat-header');
        chatHeader.addEventListener('dblclick', () => this.toggleMaximize());

        // Send message
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Attach file
        attach.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Screenshot
        screenshot.addEventListener('click', () => this.takeScreenshot());

        // Voice input
        voice.addEventListener('click', () => this.startVoiceRecording());

        // Quick actions
        document.querySelectorAll('.n8n-quick-action').forEach(button => {
            button.addEventListener('click', (e) => this.handleQuickAction(e.target.dataset.action));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+A to toggle assistant
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleChat();
            }
            // ESC to close when open
            if (e.key === 'Escape' && this.isOpen) {
                this.toggleChat();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('n8n-chat-window');
        if (chatWindow) {
            if (this.isOpen) {
                chatWindow.classList.add('open');
                console.log('Chat window opened');
            } else {
                chatWindow.classList.remove('open');
                console.log('Chat window closed');
            }
        } else {
            console.error('Chat window element not found');
        }
    }

    startDragging(e) {
        if (this.isOpen || this.isDocked) return;

        this.isDragging = true;
        const startX = e.clientX - this.position.x;
        const startY = e.clientY - this.position.y;

        const handleMouseMove = (e) => {
            if (!this.isDragging) return;

            this.position.x = e.clientX - startX;
            this.position.y = e.clientY - startY;
            this.updatePosition();
        };

        const handleMouseUp = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    updatePosition() {
        if (!this.isDocked) {
            this.container.style.left = `${this.position.x}px`;
            this.container.style.top = `${this.position.y}px`;
        }
    }

    toggleDocked() {
        this.isDocked = !this.isDocked;

        if (this.isDocked) {
            this.applyDockedMode();
        } else {
            this.removeDockedMode();
        }

        // Save preference
        this.saveToStorage({
            assistantDocked: this.isDocked,
            dockedWidth: this.dockedWidth
        });
    }

    applyDockedMode() {
        const chatWindow = document.getElementById('n8n-chat-window');
        const dockBtn = document.getElementById('n8n-dock');

        // Store original body margin
        if (!this.originalBodyMargin) {
            this.originalBodyMargin = document.body.style.marginRight || '';
        }

        // Add docked class to widget
        this.container.classList.add('docked');

        // Set CSS variable for width
        this.container.style.setProperty('--docked-width', `${this.dockedWidth}px`);
        document.body.style.setProperty('--docked-width', `${this.dockedWidth}px`);

        // Push page content
        document.body.classList.add('n8n-assistant-docked');

        // Open chat window if not open
        if (!this.isOpen) {
            chatWindow.classList.add('open');
            this.isOpen = true;
        }

        // Update button
        dockBtn.innerHTML = '⬜';
        dockBtn.title = 'Undock from side';
    }

    removeDockedMode() {
        const chatWindow = document.getElementById('n8n-chat-window');
        const dockBtn = document.getElementById('n8n-dock');

        // Remove docked class
        this.container.classList.remove('docked');

        // Restore page content
        document.body.classList.remove('n8n-assistant-docked');
        if (this.originalBodyMargin !== null) {
            document.body.style.marginRight = this.originalBodyMargin;
        }

        // Update position for floating mode
        this.updatePosition();

        // Update button
        dockBtn.innerHTML = '⬛';
        dockBtn.title = 'Dock to side';
    }

    startDockResize(e) {
        e.preventDefault();
        this.isResizing = true;

        const startX = e.clientX;
        const startWidth = this.dockedWidth;

        const handleMouseMove = (e) => {
            if (!this.isResizing) return;

            const deltaX = startX - e.clientX; // Reversed because we're resizing from left edge
            const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));

            this.dockedWidth = newWidth;
            this.container.style.setProperty('--docked-width', `${newWidth}px`);
            document.body.style.setProperty('--docked-width', `${newWidth}px`);
        };

        const handleMouseUp = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // Save the new width
            this.saveToStorage({ dockedWidth: this.dockedWidth });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    async sendMessage() {
        const input = document.getElementById('n8n-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Send to background script
        this.sendMessage({
            action: 'assistantMessage',
            message: message,
            context: {
                url: window.location.href,
                title: document.title
            }
        }, response => {
            if (response && response.reply) {
                this.addMessage(response.reply, 'assistant');
            }
        });
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('n8n-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `n8n-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="n8n-message-bubble">${text}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.addMessage(`📎 Attached: ${file.name}`, 'user');

            this.sendMessage({
                action: 'fileAttached',
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                }
            });
        };

        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }

    async takeScreenshot() {
        this.sendMessage({
            action: 'captureScreenshot'
        }, response => {
            if (response && response.success) {
                this.addMessage('📷 Screenshot captured', 'user');
                this.addMessage('Screenshot saved successfully!', 'assistant');
            }
        });
    }

    startVoiceRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.addMessage('Voice recording not supported in this browser', 'assistant');
            return;
        }

        // This will be implemented with the desktop app integration
        this.addMessage('🎤 Voice recording will be available when desktop app is connected', 'assistant');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'extract':
                this.extractPageContent();
                break;
            case 'summarize':
                this.summarizePage();
                break;
            case 'form':
                this.detectForms();
                break;
            case 'translate':
                this.translateSelection();
                break;
        }
    }

    extractPageContent() {
        const content = {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 5000),
            images: Array.from(document.images).slice(0, 10).map(img => img.src)
        };

        this.sendMessage({
            action: 'extractContent',
            content: content
        });

        this.addMessage('Extracting page content...', 'assistant');
    }

    summarizePage() {
        const text = document.body.innerText;

        this.sendMessage({
            action: 'summarize',
            text: text.substring(0, 10000)
        });

        this.addMessage('Generating page summary...', 'assistant');
    }

    detectForms() {
        const forms = document.querySelectorAll('form');
        if (forms.length === 0) {
            this.addMessage('No forms found on this page', 'assistant');
            return;
        }

        this.addMessage(`Found ${forms.length} form(s). Analyzing...`, 'assistant');

        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, select, textarea');
            const formData = {
                index: index,
                action: form.action,
                method: form.method,
                fields: Array.from(inputs).map(input => ({
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    required: input.required
                }))
            };

            this.sendMessage({
                action: 'formDetected',
                formData: formData
            });
        });
    }

    translateSelection() {
        const selection = window.getSelection().toString();
        if (!selection) {
            this.addMessage('Please select text to translate', 'assistant');
            return;
        }

        this.sendMessage({
            action: 'translate',
            text: selection
        });

        this.addMessage(`Translating: "${selection.substring(0, 50)}..."`, 'assistant');
    }

    toggleMaximize() {
        // Don't allow maximize in docked mode
        if (this.isDocked) return;

        const chatWindow = document.getElementById('n8n-chat-window');
        const maximizeBtn = document.getElementById('n8n-maximize');

        this.isMaximized = !this.isMaximized;

        if (this.isMaximized) {
            // Save current size
            this.previousSize = {
                width: chatWindow.offsetWidth,
                height: chatWindow.offsetHeight
            };

            chatWindow.classList.add('maximized');
            maximizeBtn.innerHTML = '⬜';
            maximizeBtn.title = 'Restore';
        } else {
            chatWindow.classList.remove('maximized');

            // Restore previous size
            if (this.previousSize) {
                chatWindow.style.width = this.previousSize.width + 'px';
                chatWindow.style.height = this.previousSize.height + 'px';
            }

            maximizeBtn.innerHTML = '⬜';
            maximizeBtn.title = 'Maximize';
        }
    }

    startResizing(e) {
        e.preventDefault();
        this.isResizing = true;

        const chatWindow = document.getElementById('n8n-chat-window');
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = chatWindow.offsetWidth;
        const startHeight = chatWindow.offsetHeight;

        const handleMouseMove = (e) => {
            if (!this.isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(320, Math.min(window.innerWidth * 0.9, startWidth + deltaX));
            const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + deltaY));

            chatWindow.style.width = newWidth + 'px';
            chatWindow.style.height = newHeight + 'px';

            this.windowSize = { width: newWidth, height: newHeight };
        };

        const handleMouseUp = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    checkDesktopConnection() {
        // Perform the connection check
        this.performConnectionCheck();

        // Set up periodic check only once
        if (!this.checkInterval) {
            this.checkInterval = setInterval(() => {
                this.performConnectionCheck();
            }, 10000); // Check every 10 seconds instead of 5
        }
    }

    performConnectionCheck() {
        // Check WebSocket connection to desktop app
        try {
            this.sendMessage({
                action: 'checkDesktopConnection'
            }, response => {
                const statusDot = document.getElementById('n8n-status');
                if (statusDot) {
                    if (response && response.connected) {
                        statusDot.classList.remove('disconnected');
                        statusDot.classList.add('connected');
                        this.wsConnected = true;
                    } else {
                        statusDot.classList.remove('connected');
                        statusDot.classList.add('disconnected');
                        this.wsConnected = false;
                    }
                }
            });
        } catch (error) {
            console.error('Error checking desktop connection:', error);
        }

        // Check API connections
        this.checkApiConnections();
    }

    async checkApiConnections() {
        // Debounce: skip if we checked too recently
        const now = Date.now();
        if (this.lastApiCheck && (now - this.lastApiCheck) < 3000) {
            return; // Skip if checked within last 3 seconds
        }
        this.lastApiCheck = now;

        try {
            // Request API status from background script
            this.sendMessage({
                action: 'checkApiConnections'
            }, response => {
                if (response && response.connections) {
                    this.updateApiStatusIndicators(response.connections);
                    this.apiConnections = response.connections;
                }
            });
        } catch (error) {
            console.error('Error checking API connections:', error);
        }
    }

    updateApiStatusIndicators(connections) {
        // Update n8n indicator
        const n8nIndicator = document.getElementById('api-n8n');
        if (n8nIndicator && connections.n8n) {
            n8nIndicator.className = `n8n-api-indicator ${connections.n8n.status}`;
            n8nIndicator.parentElement.title = `n8n: ${connections.n8n.status}`;
        }

        // Update WebSocket indicator
        const wsIndicator = document.getElementById('api-ws');
        if (wsIndicator && connections.websocket) {
            wsIndicator.className = `n8n-api-indicator ${connections.websocket.status}`;
            wsIndicator.parentElement.title = `WebSocket: ${connections.websocket.status} (${connections.websocket.clients} clients)`;
        }

        // Update Google API indicator
        const googleIndicator = document.getElementById('api-google');
        if (googleIndicator && connections.google) {
            googleIndicator.className = `n8n-api-indicator ${connections.google.status}`;
            googleIndicator.parentElement.title = `Google API: ${connections.google.status}`;
        }

        // Update OpenAI indicator
        const openaiIndicator = document.getElementById('api-openai');
        if (openaiIndicator && connections.openai) {
            openaiIndicator.className = `n8n-api-indicator ${connections.openai.status}`;
            openaiIndicator.parentElement.title = `OpenAI: ${connections.openai.status}`;
        }
    }
}

// Initialize widget when DOM is ready with error handling
(function() {
    // Prevent multiple instances
    if (window.__n8nAssistantInstance) {
        console.log('n8n Assistant already initialized');
        return;
    }

    function initializeAssistant() {
        try {
            // Check if we're in an iframe or restricted context
            if (window.self !== window.top) {
                console.log('n8n Assistant: Skipping iframe');
                return;
            }

            // Check for conflicting extensions
            if (document.getElementById('n8n-assistant-widget')) {
                console.log('n8n Assistant widget already exists');
                return;
            }

            // Create single instance
            window.__n8nAssistantInstance = new FloatingAssistant();
        } catch (error) {
            console.error('Failed to initialize n8n Assistant:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAssistant, { once: true });
    } else {
        initializeAssistant();
    }
})();