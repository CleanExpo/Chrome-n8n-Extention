// Enhanced Floating Assistant Widget with Modern UI/UX
class FloatingAssistant {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.isResizing = false;
        this.isMaximized = false;
        this.isDocked = false;
        this.isEnabled = true;
        this.isTyping = false;
        this.theme = 'light';
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
        await this.checkEnabledState();
        await this.loadPreferences();

        if (this.isEnabled) {
            this.detectTheme();
            this.createWidget();
            this.attachEventListeners();
            this.checkDesktopConnection();
            this.addKeyboardShortcuts();
        }

        this.setupMessageListener();
    }

    detectTheme() {
        // Auto-detect dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme = 'dark';
        }

        // Listen for theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.theme = e.matches ? 'dark' : 'light';
            this.updateTheme();
        });
    }

    updateTheme() {
        const widget = document.getElementById('n8n-assistant-widget');
        if (widget) {
            widget.setAttribute('data-theme', this.theme);
        }
    }

    createWidget() {
        const container = document.createElement('div');
        container.id = 'n8n-assistant-widget';
        container.setAttribute('data-theme', this.theme);
        container.innerHTML = `
            <style>
                /* Enhanced CSS with modern design */
                #n8n-assistant-widget {
                    --primary-color: #667eea;
                    --primary-hover: #5568d3;
                    --primary-light: #e6e9ff;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --danger-color: #ef4444;
                    --bg-primary: #ffffff;
                    --bg-secondary: #f8fafc;
                    --bg-tertiary: #f1f5f9;
                    --text-primary: #1e293b;
                    --text-secondary: #64748b;
                    --text-tertiary: #94a3b8;
                    --border-color: #e2e8f0;
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
                    --radius-sm: 0.375rem;
                    --radius-md: 0.5rem;
                    --radius-lg: 0.75rem;
                    --radius-xl: 1rem;
                    --transition-all: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

                    position: fixed;
                    z-index: 2147483647;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: var(--text-primary);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                /* Dark theme */
                #n8n-assistant-widget[data-theme="dark"] {
                    --bg-primary: #0f172a;
                    --bg-secondary: #1e293b;
                    --bg-tertiary: #334155;
                    --text-primary: #f1f5f9;
                    --text-secondary: #cbd5e1;
                    --text-tertiary: #94a3b8;
                    --border-color: #334155;
                    --primary-light: #312e81;
                }

                /* Widget Button with pulse animation */
                .n8n-widget-button {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                    box-shadow: var(--shadow-lg);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-all);
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    overflow: visible;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .8;
                    }
                }

                .n8n-widget-button:hover {
                    transform: scale(1.1);
                    box-shadow: var(--shadow-xl);
                }

                .n8n-widget-button:active {
                    transform: scale(0.95);
                }

                .n8n-widget-button img {
                    width: 32px;
                    height: 32px;
                    filter: brightness(0) invert(1);
                }

                /* Status indicator with animation */
                .n8n-status-dot {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 3px solid var(--bg-primary);
                    transition: var(--transition-all);
                }

                .n8n-status-dot.connected {
                    background: var(--success-color);
                    animation: pulse-status 2s ease-in-out infinite;
                }

                .n8n-status-dot.disconnected {
                    background: var(--danger-color);
                }

                @keyframes pulse-status {
                    0% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }

                /* Chat Window with glassmorphism effect */
                .n8n-chat-window {
                    position: absolute;
                    bottom: 80px;
                    right: 20px;
                    width: 380px;
                    height: 500px;
                    background: var(--bg-primary);
                    backdrop-filter: blur(10px);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-2xl);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: var(--transition-all);
                }

                .n8n-chat-window.open {
                    display: flex;
                    animation: slideInUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Header with gradient */
                .n8n-chat-header {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                }

                .n8n-chat-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1));
                    pointer-events: none;
                }

                .n8n-chat-title {
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 1;
                    position: relative;
                }

                .n8n-chat-title::before {
                    content: '🤖';
                    font-size: 20px;
                    animation: bounce 2s ease-in-out infinite;
                }

                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }

                /* Header controls with hover effects */
                .n8n-header-controls {
                    display: flex;
                    gap: 8px;
                    z-index: 1;
                }

                .n8n-header-controls button {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-md);
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-all);
                    font-size: 18px;
                }

                .n8n-header-controls button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .n8n-header-controls button:active {
                    transform: scale(0.95);
                }

                /* API Status with smooth transitions */
                .n8n-api-status {
                    background: var(--bg-secondary);
                    padding: 12px 20px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .n8n-api-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    transition: var(--transition-all);
                }

                .n8n-api-indicator.connected {
                    background: var(--success-color);
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                }

                .n8n-api-indicator.disconnected {
                    background: var(--danger-color);
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
                }

                .n8n-api-indicator.not_configured {
                    background: var(--text-tertiary);
                }

                /* Messages area with better scrolling */
                .n8n-chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: var(--bg-secondary);
                    scroll-behavior: smooth;
                }

                .n8n-chat-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .n8n-chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }

                .n8n-chat-messages::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 3px;
                }

                .n8n-chat-messages::-webkit-scrollbar-thumb:hover {
                    background: var(--text-tertiary);
                }

                /* Message bubbles with animations */
                .n8n-message {
                    margin-bottom: 16px;
                    display: flex;
                    animation: fadeInMessage 0.3s ease;
                }

                @keyframes fadeInMessage {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .n8n-message.user {
                    justify-content: flex-end;
                }

                .n8n-message.assistant {
                    justify-content: flex-start;
                }

                .n8n-message-bubble {
                    max-width: 70%;
                    padding: 12px 16px;
                    border-radius: var(--radius-lg);
                    word-wrap: break-word;
                    position: relative;
                    box-shadow: var(--shadow-sm);
                    transition: var(--transition-all);
                }

                .n8n-message-bubble:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .n8n-message.user .n8n-message-bubble {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .n8n-message.assistant .n8n-message-bubble {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                    border-bottom-left-radius: 4px;
                }

                /* Typing indicator */
                .n8n-typing-indicator {
                    padding: 12px 16px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    border-bottom-left-radius: 4px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .n8n-typing-indicator span {
                    width: 8px;
                    height: 8px;
                    background: var(--text-tertiary);
                    border-radius: 50%;
                    animation: typing 1.4s ease-in-out infinite;
                }

                .n8n-typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .n8n-typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.5;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }

                /* Input area with modern design */
                .n8n-chat-input-container {
                    padding: 20px;
                    background: var(--bg-primary);
                    border-top: 1px solid var(--border-color);
                }

                .n8n-input-wrapper {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    padding: 8px;
                    border: 2px solid transparent;
                    transition: var(--transition-all);
                }

                .n8n-input-wrapper:focus-within {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px var(--primary-light);
                }

                .n8n-chat-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    padding: 8px;
                    font-size: 14px;
                    color: var(--text-primary);
                    font-family: inherit;
                }

                .n8n-chat-input::placeholder {
                    color: var(--text-tertiary);
                }

                /* Input buttons with tooltips */
                .n8n-input-button {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-all);
                    font-size: 20px;
                    position: relative;
                }

                .n8n-input-button:hover {
                    background: var(--bg-tertiary);
                    color: var(--primary-color);
                    transform: scale(1.1);
                }

                .n8n-input-button:active {
                    transform: scale(0.95);
                }

                .n8n-send-button {
                    background: var(--primary-color);
                    color: white;
                }

                .n8n-send-button:hover {
                    background: var(--primary-hover);
                }

                /* Tooltip */
                .n8n-input-button::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--text-primary);
                    color: var(--bg-primary);
                    padding: 4px 8px;
                    border-radius: var(--radius-sm);
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s;
                }

                .n8n-input-button:hover::after {
                    opacity: 1;
                }

                /* Quick actions with hover effects */
                .n8n-quick-actions {
                    padding: 12px 20px;
                    background: var(--bg-secondary);
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .n8n-quick-action {
                    padding: 6px 12px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    font-size: 12px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: var(--transition-all);
                    white-space: nowrap;
                }

                .n8n-quick-action:hover {
                    background: var(--primary-light);
                    color: var(--primary-color);
                    border-color: var(--primary-color);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                /* Loading animation */
                .n8n-loading {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                }

                .n8n-loading::after {
                    content: '';
                    width: 16px;
                    height: 16px;
                    border: 2px solid var(--border-color);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* Docked mode enhancements */
                #n8n-assistant-widget.docked {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: var(--docked-width, 400px);
                }

                #n8n-assistant-widget.docked .n8n-widget-button {
                    display: none;
                }

                #n8n-assistant-widget.docked .n8n-chat-window {
                    position: static;
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                    border: none;
                    border-left: 1px solid var(--border-color);
                }

                body.n8n-assistant-docked {
                    margin-right: var(--docked-width, 400px) !important;
                    transition: margin-right 0.3s ease;
                }

                /* Maximized mode */
                .n8n-chat-window.maximized {
                    width: 90vw;
                    height: 90vh;
                    max-width: 1200px;
                    max-height: 800px;
                    bottom: 50%;
                    right: 50%;
                    transform: translate(50%, 50%);
                    z-index: 2147483648;
                }

                /* Welcome message */
                .n8n-welcome-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary);
                }

                .n8n-welcome-message h3 {
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    font-size: 18px;
                }

                .n8n-welcome-message p {
                    margin-bottom: 20px;
                    line-height: 1.6;
                }

                /* Resize handle */
                .n8n-resize-handle {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                }

                .n8n-resize-handle::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -5px;
                    width: 10px;
                    height: 100%;
                    cursor: ew-resize;
                    pointer-events: auto;
                }

                /* Responsive design */
                @media (max-width: 480px) {
                    .n8n-chat-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 100px);
                        right: 20px;
                        bottom: 80px;
                    }

                    .n8n-chat-window.maximized {
                        width: 100vw;
                        height: 100vh;
                        border-radius: 0;
                    }
                }

                /* Accessibility improvements */
                .n8n-assistant-widget *:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }

                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }
            </style>

            <button class="n8n-widget-button" id="n8n-widget-toggle" aria-label="Open AI Assistant">
                <img src="${this.getResourceURL('images/icon-48.png')}" alt="n8n">
                <span class="n8n-status-dot disconnected" id="n8n-status" aria-label="Connection status"></span>
            </button>

            <div class="n8n-chat-window" id="n8n-chat-window" role="dialog" aria-label="AI Assistant Chat">
                <div class="n8n-dock-resize" id="n8n-dock-resize"></div>

                <div class="n8n-chat-header">
                    <span class="n8n-chat-title">n8n AI Assistant</span>
                    <div class="n8n-header-controls">
                        <button id="n8n-theme" class="n8n-theme-btn" aria-label="Toggle theme" data-tooltip="Toggle theme">
                            🌙
                        </button>
                        <button id="n8n-dock" class="n8n-dock-btn" aria-label="Dock to side" data-tooltip="Dock to side">
                            📌
                        </button>
                        <button id="n8n-maximize" class="n8n-maximize-btn" aria-label="Maximize" data-tooltip="Maximize">
                            🔳
                        </button>
                        <button id="n8n-close" class="n8n-chat-close" aria-label="Close chat" data-tooltip="Close">
                            ✕
                        </button>
                    </div>
                </div>

                <div class="n8n-api-status" id="n8n-api-status">
                    <span>Status:</span>
                    <span data-api="n8n" title="n8n Server">
                        <span id="api-n8n" class="n8n-api-indicator disconnected"></span> n8n
                    </span>
                    <span data-api="openai" title="OpenAI API">
                        <span id="api-openai" class="n8n-api-indicator not_configured"></span> AI
                    </span>
                </div>

                <div class="n8n-chat-messages" id="n8n-messages" role="log" aria-live="polite">
                    <div class="n8n-welcome-message">
                        <h3>👋 Welcome to n8n AI Assistant!</h3>
                        <p>I'm here to help you with:</p>
                        <div style="text-align: left; display: inline-block;">
                            • 🔍 Analyzing web pages<br>
                            • 📝 Summarizing content<br>
                            • 🌐 Translating text<br>
                            • 💡 Answering questions<br>
                            • 🚀 Automating tasks
                        </div>
                        <p style="margin-top: 20px;">Type a message below to get started!</p>
                    </div>
                </div>

                <div class="n8n-quick-actions">
                    <button class="n8n-quick-action" data-action="summarize">📄 Summarize page</button>
                    <button class="n8n-quick-action" data-action="extract">🔍 Extract info</button>
                    <button class="n8n-quick-action" data-action="translate">🌐 Translate</button>
                    <button class="n8n-quick-action" data-action="explain">💡 Explain</button>
                </div>

                <div class="n8n-chat-input-container">
                    <div class="n8n-input-wrapper">
                        <button id="n8n-attach" class="n8n-input-button n8n-attach-button" aria-label="Attach file" data-tooltip="Attach file">
                            📎
                        </button>
                        <button id="n8n-screenshot" class="n8n-input-button n8n-screenshot-button" aria-label="Take screenshot" data-tooltip="Screenshot">
                            📷
                        </button>
                        <input
                            type="text"
                            id="n8n-input"
                            class="n8n-chat-input"
                            placeholder="Ask me anything..."
                            aria-label="Message input"
                            autocomplete="off"
                        />
                        <button id="n8n-voice" class="n8n-input-button n8n-voice-button" aria-label="Voice input" data-tooltip="Voice input">
                            🎤
                        </button>
                        <button id="n8n-send" class="n8n-input-button n8n-send-button" aria-label="Send message" data-tooltip="Send">
                            ➤
                        </button>
                    </div>
                </div>

                <input type="file" id="n8n-file-input" style="display: none;" />
                <div class="n8n-resize-handle" id="n8n-resize-handle"></div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;

        // Set initial position
        const toggle = document.getElementById('n8n-widget-toggle');
        if (toggle) {
            toggle.style.bottom = '20px';
            toggle.style.right = '20px';
        }

        // Apply docked mode if saved
        if (this.isDocked) {
            setTimeout(() => this.applyDockedMode(), 100);
        }
    }

    setupMessageListener() {
        try {
            // Listen for events from content script
            window.addEventListener('n8n-open-chat', () => {
                if (this.isEnabled && !this.isOpen) {
                    this.toggleChat();
                }
            });

            window.addEventListener('n8n-toggle-assistant', (event) => {
                if (event.detail) {
                    this.isEnabled = event.detail.enabled;
                    this.handleToggle(event.detail.enabled);
                }
            });

            // Chrome runtime messaging if available
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
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                    } catch (error) {
                        console.error('Error handling message:', error);
                        if (sendResponse) {
                            sendResponse({ success: false, error: error.message });
                        }
                    }
                    return true;
                });
            }

            // Window messaging fallback
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
        } catch (error) {
            console.error('Error setting up message listener:', error);
        }
    }

    attachEventListeners() {
        const toggle = document.getElementById('n8n-widget-toggle');
        const closeBtn = document.getElementById('n8n-chat-close');
        const sendBtn = document.getElementById('n8n-send-btn');
        const input = document.getElementById('n8n-chat-input');
        const minimizeBtn = document.getElementById('n8n-chat-minimize');
        const maximizeBtn = document.getElementById('n8n-chat-maximize');
        const dockBtn = document.getElementById('n8n-chat-dock');
        const attachBtn = document.getElementById('n8n-attach-btn');
        const fileInput = document.getElementById('n8n-file-input');
        const header = document.getElementById('n8n-chat-header');
        const resizeHandle = document.getElementById('n8n-resize-handle');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleChat());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleChat());
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeChat());
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.maximizeChat());
        }

        if (dockBtn) {
            dockBtn.addEventListener('click', () => this.toggleDockMode());
        }

        if (attachBtn) {
            attachBtn.addEventListener('click', () => fileInput?.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        if (header && !this.isDocked) {
            this.setupDragging(header);
        }

        if (resizeHandle && !this.isDocked) {
            this.setupResizing(resizeHandle);
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('n8n-chat-window');
        const toggle = document.getElementById('n8n-widget-toggle');

        if (window && toggle) {
            if (this.isOpen) {
                window.style.display = 'flex';
                toggle.style.display = 'none';
                this.focusInput();
            } else {
                window.style.display = 'none';
                toggle.style.display = 'flex';
            }
        }
    }

    handleToggle(enabled) {
        this.isEnabled = enabled;
        const widget = document.getElementById('n8n-assistant-widget');
        if (widget) {
            widget.style.display = enabled ? 'block' : 'none';
        }
    }

    minimizeChat() {
        this.toggleChat();
    }

    maximizeChat() {
        this.isMaximized = !this.isMaximized;
        const window = document.getElementById('n8n-chat-window');

        if (window) {
            if (this.isMaximized) {
                this.previousSize = {
                    width: window.style.width,
                    height: window.style.height,
                    top: window.style.top,
                    left: window.style.left
                };
                window.style.width = '90vw';
                window.style.height = '90vh';
                window.style.top = '5vh';
                window.style.left = '5vw';
            } else if (this.previousSize) {
                window.style.width = this.previousSize.width;
                window.style.height = this.previousSize.height;
                window.style.top = this.previousSize.top;
                window.style.left = this.previousSize.left;
            }
        }
    }

    toggleDockMode() {
        this.isDocked = !this.isDocked;
        if (this.isDocked) {
            this.applyDockedMode();
        } else {
            this.removeDockedMode();
        }
        this.savePreferences();
    }

    applyDockedMode() {
        const window = document.getElementById('n8n-chat-window');
        const toggle = document.getElementById('n8n-widget-toggle');

        if (window) {
            window.style.position = 'fixed';
            window.style.right = '0';
            window.style.top = '0';
            window.style.bottom = '0';
            window.style.left = 'auto';
            window.style.width = `${this.dockedWidth}px`;
            window.style.height = '100vh';
            window.style.borderRadius = '0';
            window.style.display = 'flex';
        }

        if (toggle) {
            toggle.style.display = 'none';
        }

        // Shift page content
        if (document.body) {
            this.originalBodyMargin = document.body.style.marginRight;
            document.body.style.marginRight = `${this.dockedWidth}px`;
            document.body.style.transition = 'margin-right 0.3s ease';
        }

        this.isOpen = true;
    }

    removeDockedMode() {
        const window = document.getElementById('n8n-chat-window');

        if (window) {
            window.style.position = '';
            window.style.right = '';
            window.style.top = '';
            window.style.bottom = '';
            window.style.left = '';
            window.style.width = `${this.windowSize.width}px`;
            window.style.height = `${this.windowSize.height}px`;
            window.style.borderRadius = '';
        }

        // Restore page layout
        if (document.body) {
            document.body.style.marginRight = this.originalBodyMargin || '';
        }
    }

    setupDragging(header) {
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (this.isDocked || this.isMaximized) return;

            this.isDragging = true;
            const window = document.getElementById('n8n-chat-window');

            startX = e.clientX;
            startY = e.clientY;
            startLeft = window.offsetLeft;
            startTop = window.offsetTop;

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        const handleDrag = (e) => {
            if (!this.isDragging) return;

            const window = document.getElementById('n8n-chat-window');
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            window.style.left = `${startLeft + dx}px`;
            window.style.top = `${startTop + dy}px`;
        };

        const stopDrag = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
    }

    setupResizing(handle) {
        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', (e) => {
            if (this.isDocked) return;

            this.isResizing = true;
            const window = document.getElementById('n8n-chat-window');

            startX = e.clientX;
            startY = e.clientY;
            startWidth = window.offsetWidth;
            startHeight = window.offsetHeight;

            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });

        const handleResize = (e) => {
            if (!this.isResizing) return;

            const window = document.getElementById('n8n-chat-window');
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newWidth = Math.max(300, startWidth + dx);
            const newHeight = Math.max(400, startHeight + dy);

            window.style.width = `${newWidth}px`;
            window.style.height = `${newHeight}px`;

            this.windowSize = { width: newWidth, height: newHeight };
        };

        const stopResize = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    async sendMessage() {
        const input = document.getElementById('n8n-chat-input');
        const message = input?.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            // Send message to background script
            const response = await this.sendToBackground({
                type: 'assistant_message',
                message: message,
                context: {
                    url: window.location.href,
                    title: document.title
                }
            });

            this.hideTyping();

            if (response && response.reply) {
                this.addMessage(response.reply, 'assistant');
            } else {
                this.addMessage('Sorry, I couldn\'t process your request.', 'assistant');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTyping();
            this.addMessage('Failed to connect to the assistant.', 'assistant');
        }
    }

    async sendToBackground(data) {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage(data, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(response);
                    }
                });
            } else {
                // Fallback to window messaging
                window.postMessage({ type: 'n8n-assistant-message', ...data }, '*');

                const listener = (event) => {
                    if (event.data && event.data.type === 'n8n-assistant-response') {
                        window.removeEventListener('message', listener);
                        resolve(event.data);
                    }
                };

                window.addEventListener('message', listener);

                // Timeout after 10 seconds
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve(null);
                }, 10000);
            }
        });
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('n8n-chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `n8n-message n8n-message-${sender}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="n8n-message-avatar">
                ${sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="n8n-message-content">
                <div class="n8n-message-text">${this.escapeHtml(text)}</div>
                <div class="n8n-message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ text, sender, time });
    }

    showTyping() {
        this.isTyping = true;
        const indicator = document.createElement('div');
        indicator.className = 'n8n-typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';

        const messagesContainer = document.getElementById('n8n-chat-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    hideTyping() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.addMessage(`📎 Attached: ${file.name}`, 'user');
            // Handle file upload logic here
        }
    }

    focusInput() {
        setTimeout(() => {
            const input = document.getElementById('n8n-chat-input');
            if (input) {
                input.focus();
            }
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    savePreferences() {
        const prefs = {
            assistantDocked: this.isDocked,
            dockedWidth: this.dockedWidth
        };

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(prefs);
        } else {
            try {
                localStorage.setItem('assistantDocked', this.isDocked);
                localStorage.setItem('dockedWidth', this.dockedWidth);
            } catch (e) {
                console.log('Could not save preferences');
            }
        }
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + A to toggle assistant
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleChat();
            }
        });
    }

    async checkEnabledState() {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.get(['assistantEnabled'], (result) => {
                    this.isEnabled = result.assistantEnabled !== false;
                    resolve();
                });
            } else {
                try {
                    this.isEnabled = localStorage.getItem('assistantEnabled') !== 'false';
                } catch (e) {
                    this.isEnabled = true;
                }
                resolve();
            }
        });
    }

    async loadPreferences() {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.get(['assistantDocked', 'dockedWidth'], (result) => {
                    this.isDocked = result.assistantDocked || false;
                    this.dockedWidth = result.dockedWidth || 400;
                    resolve();
                });
            } else {
                try {
                    this.isDocked = localStorage.getItem('assistantDocked') === 'true';
                    this.dockedWidth = parseInt(localStorage.getItem('dockedWidth') || '400');
                } catch (e) {
                    console.log('Storage not available, using defaults');
                }
                resolve();
            }
        });
    }

    checkDesktopConnection() {
        // Placeholder for desktop app connection check
        console.log('Checking desktop connection...');
    }
}

// Initialize widget when DOM is ready
(function() {
    if (window.__n8nAssistantInstance) {
        console.log('n8n Assistant already initialized');
        return;
    }

    function initializeAssistant() {
        try {
            if (window.self !== window.top) {
                console.log('n8n Assistant: Skipping iframe');
                return;
            }

            if (document.getElementById('n8n-assistant-widget')) {
                console.log('n8n Assistant widget already exists');
                return;
            }

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