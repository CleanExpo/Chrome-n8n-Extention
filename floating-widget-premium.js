/**
 * Premium AI Assistant Floating Widget
 * Enhanced UI/UX with advanced features, animations, and modern design
 */

class PremiumFloatingAssistant {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.isResizing = false;
        this.isMinimized = false;
        this.isFullscreen = false;
        this.isDocked = false;
        this.isTyping = false;
        this.theme = 'auto';
        this.currentTheme = 'light';
        this.size = 'medium';
        this.position = { x: window.innerWidth - 420, y: 50 };
        this.defaultSizes = {
            small: { width: 320, height: 400 },
            medium: { width: 400, height: 520 },
            large: { width: 480, height: 640 }
        };
        this.conversations = [];
        this.currentConversationId = null;
        this.isVoiceMode = false;
        this.isListening = false;
        this.mediaRecorder = null;
        this.speechSynthesis = window.speechSynthesis;
        this.recognition = null;
        this.shortcuts = [];
        this.plugins = new Map();
        this.notifications = [];
        this.analytics = {
            sessionsCount: 0,
            messagesCount: 0,
            totalUsageTime: 0,
            sessionStartTime: null
        };

        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            await this.initializeGoogleCloudIntegration();
            this.detectTheme();
            this.createWidget();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.setupSpeechRecognition();
            this.loadConversationHistory();
            this.startAnalyticsSession();

            console.log('Premium Floating Assistant initialized successfully');
        } catch (error) {
            console.error('Premium Floating Assistant initialization failed:', error);
        }
    }

    async initializeGoogleCloudIntegration() {
        if (typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized) {
            this.hasGoogleCloud = true;
            console.log('Google Cloud integration available');
        } else {
            this.hasGoogleCloud = false;
        }
    }

    detectTheme() {
        if (this.theme === 'auto') {
            this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (this.theme === 'auto') {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.updateTheme();
                }
            });
        } else {
            this.currentTheme = this.theme;
        }
    }

    createWidget() {
        const container = document.createElement('div');
        container.id = 'premium-ai-assistant';
        container.className = `premium-assistant theme-${this.currentTheme} size-${this.size}`;

        container.innerHTML = `
            <style>
                /* Premium AI Assistant Styles */
                #premium-ai-assistant {
                    --primary-color: #6366f1;
                    --primary-dark: #4f46e5;
                    --primary-light: #a5b4fc;
                    --secondary-color: #06b6d4;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --error-color: #ef4444;
                    --info-color: #3b82f6;

                    /* Light theme colors */
                    --bg-primary: #ffffff;
                    --bg-secondary: #f8fafc;
                    --bg-tertiary: #f1f5f9;
                    --bg-accent: #e2e8f0;
                    --bg-hover: #f3f4f6;
                    --text-primary: #0f172a;
                    --text-secondary: #475569;
                    --text-tertiary: #64748b;
                    --text-inverse: #ffffff;
                    --border-color: #e2e8f0;
                    --border-light: #f1f5f9;
                    --border-focus: var(--primary-color);

                    /* Shadows */
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

                    /* Glass morphism */
                    --glass-bg: rgba(255, 255, 255, 0.85);
                    --glass-border: rgba(255, 255, 255, 0.2);

                    /* Animations */
                    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
                    --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
                    --bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

                    /* Z-index */
                    --z-fab: 9998;
                    --z-widget: 9999;
                    --z-modal: 10000;
                    --z-notification: 10001;
                }

                /* Dark theme overrides */
                #premium-ai-assistant.theme-dark {
                    --bg-primary: #0f172a;
                    --bg-secondary: #1e293b;
                    --bg-tertiary: #334155;
                    --bg-accent: #475569;
                    --bg-hover: #374151;
                    --text-primary: #f8fafc;
                    --text-secondary: #cbd5e1;
                    --text-tertiary: #94a3b8;
                    --border-color: #334155;
                    --border-light: #475569;
                    --glass-bg: rgba(15, 23, 42, 0.85);
                    --glass-border: rgba(255, 255, 255, 0.1);
                }

                /* Size variants */
                #premium-ai-assistant.size-small { --widget-width: 320px; --widget-height: 400px; }
                #premium-ai-assistant.size-medium { --widget-width: 400px; --widget-height: 520px; }
                #premium-ai-assistant.size-large { --widget-width: 480px; --widget-height: 640px; }

                /* Base styles */
                #premium-ai-assistant * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                #premium-ai-assistant {
                    position: fixed;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: var(--text-primary);
                    z-index: var(--z-widget);
                    user-select: none;
                    pointer-events: none;
                }

                #premium-ai-assistant * {
                    pointer-events: auto;
                }

                /* FAB Button */
                .premium-fab {
                    position: fixed;
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    box-shadow: var(--shadow-lg);
                    transition: all var(--transition-normal);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: var(--z-fab);
                    backdrop-filter: blur(10px);
                }

                .premium-fab:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: var(--shadow-xl);
                }

                .premium-fab:active {
                    transform: translateY(0) scale(1);
                }

                .premium-fab .fab-icon {
                    width: 24px;
                    height: 24px;
                    color: white;
                    transition: transform var(--transition-fast);
                }

                .premium-fab.pulse {
                    animation: pulseGlow 2s infinite;
                }

                @keyframes pulseGlow {
                    0%, 100% { box-shadow: var(--shadow-lg), 0 0 0 0 rgba(99, 102, 241, 0.4); }
                    50% { box-shadow: var(--shadow-xl), 0 0 0 8px rgba(99, 102, 241, 0); }
                }

                /* Widget Container */
                .premium-widget {
                    position: fixed;
                    width: var(--widget-width);
                    height: var(--widget-height);
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    box-shadow: var(--shadow-2xl);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transform: scale(0.8) translateY(20px);
                    opacity: 0;
                    transition: all var(--transition-normal) var(--bounce);
                    max-height: calc(100vh - 40px);
                }

                .premium-widget.visible {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }

                .premium-widget.minimized {
                    transform: scale(0.95) translateY(10px);
                    height: 60px;
                    overflow: hidden;
                }

                .premium-widget.fullscreen {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 40px);
                    top: 20px !important;
                    left: 20px !important;
                }

                /* Header */
                .widget-header {
                    background: var(--bg-secondary);
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: move;
                    user-select: none;
                    position: relative;
                    z-index: 1;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .widget-logo {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                }

                .widget-title {
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--text-primary);
                }

                .widget-subtitle {
                    font-size: 12px;
                    color: var(--text-tertiary);
                    margin-top: 2px;
                }

                .header-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .control-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: var(--bg-tertiary);
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    transition: all var(--transition-fast);
                }

                .control-btn:hover {
                    background: var(--bg-accent);
                    color: var(--text-primary);
                    transform: scale(1.05);
                }

                .control-btn.active {
                    background: var(--primary-color);
                    color: white;
                }

                /* Status Indicator */
                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    background: var(--bg-tertiary);
                    border-radius: 12px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--success-color);
                    animation: pulse 2s infinite;
                }

                .status-dot.connecting { background: var(--warning-color); }
                .status-dot.error { background: var(--error-color); }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Chat Container */
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }

                .messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    scroll-behavior: smooth;
                }

                .messages-area::-webkit-scrollbar {
                    width: 4px;
                }

                .messages-area::-webkit-scrollbar-track {
                    background: transparent;
                }

                .messages-area::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 4px;
                }

                .messages-area::-webkit-scrollbar-thumb:hover {
                    background: var(--text-tertiary);
                }

                /* Welcome Screen */
                .welcome-screen {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-secondary);
                }

                .welcome-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    animation: bounce 2s infinite;
                }

                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
                    40%, 43% { transform: translateY(-8px); }
                    70% { transform: translateY(-4px); }
                }

                .welcome-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }

                .welcome-subtitle {
                    margin-bottom: 24px;
                }

                .quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-top: 20px;
                }

                .quick-action {
                    padding: 12px 16px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }

                .quick-action:hover {
                    background: var(--bg-hover);
                    border-color: var(--primary-light);
                    transform: translateY(-1px);
                }

                .quick-action-icon {
                    font-size: 16px;
                }

                /* Message Bubbles */
                .message {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .message.user .message-avatar {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
                    color: white;
                }

                .message.assistant .message-avatar {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }

                .message-content {
                    flex: 1;
                    max-width: 85%;
                }

                .message-bubble {
                    background: var(--bg-secondary);
                    padding: 12px 16px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    position: relative;
                }

                .message.user .message-bubble {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
                    color: white;
                    border: none;
                    border-radius: 16px 4px 16px 16px;
                }

                .message.assistant .message-bubble {
                    border-radius: 4px 16px 16px 16px;
                }

                .message-text {
                    line-height: 1.5;
                    word-wrap: break-word;
                }

                .message-text pre {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 8px 12px;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin: 8px 0;
                    font-size: 13px;
                }

                .message-text code {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 13px;
                }

                .message-time {
                    font-size: 11px;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                    opacity: 0.7;
                }

                .message-actions {
                    display: flex;
                    gap: 4px;
                    margin-top: 8px;
                    opacity: 0;
                    transition: opacity var(--transition-fast);
                }

                .message:hover .message-actions {
                    opacity: 1;
                }

                .message-action {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: currentColor;
                    transition: all var(--transition-fast);
                    font-size: 12px;
                }

                .message-action:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }

                /* Typing Indicator */
                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    color: var(--text-tertiary);
                    font-style: italic;
                }

                .typing-dots {
                    display: flex;
                    gap: 4px;
                }

                .typing-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: var(--text-tertiary);
                    animation: typingPulse 1.4s infinite ease-in-out;
                }

                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typingPulse {
                    0%, 60%, 100% { transform: scale(0.8); opacity: 0.5; }
                    30% { transform: scale(1); opacity: 1; }
                }

                /* Input Area */
                .input-area {
                    padding: 16px 20px;
                    border-top: 1px solid var(--border-color);
                    background: var(--bg-secondary);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .input-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-height: 32px;
                }

                .input-container {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    background: var(--bg-primary);
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    padding: 8px 12px;
                    transition: all var(--transition-fast);
                    position: relative;
                }

                .input-container:focus-within {
                    border-color: var(--border-focus);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .message-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 14px;
                    line-height: 1.5;
                    resize: none;
                    max-height: 120px;
                    min-height: 20px;
                    font-family: inherit;
                }

                .message-input::placeholder {
                    color: var(--text-tertiary);
                }

                .input-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .input-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    transition: all var(--transition-fast);
                    font-size: 16px;
                }

                .input-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .input-btn.active {
                    background: var(--primary-color);
                    color: white;
                }

                .send-btn {
                    background: var(--primary-color);
                    color: white;
                }

                .send-btn:hover {
                    background: var(--primary-dark);
                    transform: scale(1.05);
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Voice Recording UI */
                .voice-recording {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    animation: pulseRed 1s infinite;
                }

                @keyframes pulseRed {
                    0%, 100% { background: rgba(239, 68, 68, 0.1); }
                    50% { background: rgba(239, 68, 68, 0.2); }
                }

                .voice-icon {
                    color: var(--error-color);
                    font-size: 16px;
                }

                /* Suggestions */
                .suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 8px;
                }

                .suggestion {
                    padding: 4px 8px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    font-size: 12px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .suggestion:hover {
                    background: var(--primary-light);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                /* Toolbar */
                .toolbar {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    overflow-x: auto;
                    padding: 0 4px;
                }

                .toolbar::-webkit-scrollbar {
                    display: none;
                }

                .toolbar-btn {
                    padding: 6px 12px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    font-size: 12px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .toolbar-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .toolbar-btn.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                /* Notification Toast */
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 12px 16px;
                    box-shadow: var(--shadow-lg);
                    z-index: var(--z-notification);
                    max-width: 300px;
                    animation: slideInRight 0.3s ease-out;
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .notification.success { border-left: 4px solid var(--success-color); }
                .notification.error { border-left: 4px solid var(--error-color); }
                .notification.warning { border-left: 4px solid var(--warning-color); }
                .notification.info { border-left: 4px solid var(--info-color); }

                /* Resize Handle */
                .resize-handle {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 16px;
                    height: 16px;
                    cursor: se-resize;
                    background: linear-gradient(-45deg, transparent 0%, transparent 40%, var(--border-color) 40%, var(--border-color) 60%, transparent 60%);
                }

                .resize-handle:hover {
                    background: linear-gradient(-45deg, transparent 0%, transparent 40%, var(--text-tertiary) 40%, var(--text-tertiary) 60%, transparent 60%);
                }

                /* Animations */
                .fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                .fade-out {
                    animation: fadeOut 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }

                /* Responsive adjustments */
                @media (max-width: 480px) {
                    .premium-widget {
                        width: calc(100vw - 20px) !important;
                        height: calc(100vh - 20px) !important;
                        top: 10px !important;
                        left: 10px !important;
                    }

                    .quick-actions {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-height: 600px) {
                    .premium-widget {
                        height: calc(100vh - 20px) !important;
                        top: 10px !important;
                    }
                }

                /* Print styles */
                @media print {
                    #premium-ai-assistant {
                        display: none;
                    }
                }

                /* Accessibility improvements */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }

                /* High contrast mode */
                @media (prefers-contrast: high) {
                    #premium-ai-assistant {
                        --border-color: currentColor;
                        --bg-secondary: transparent;
                        --bg-tertiary: transparent;
                    }

                    .premium-widget {
                        border-width: 2px;
                        backdrop-filter: none;
                        background: var(--bg-primary);
                    }
                }
            </style>

            <!-- FAB Button -->
            <button class="premium-fab" id="premiumFab" title="Open AI Assistant" aria-label="Open AI Assistant">
                <svg class="fab-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21Z"/>
                </svg>
            </button>

            <!-- Widget Container -->
            <div class="premium-widget" id="premiumWidget">
                <!-- Header -->
                <div class="widget-header">
                    <div class="header-left">
                        <div class="widget-logo">🤖</div>
                        <div>
                            <div class="widget-title">AI Assistant</div>
                            <div class="widget-subtitle">Premium Experience</div>
                        </div>
                    </div>
                    <div class="status-indicator">
                        <div class="status-dot" id="statusDot"></div>
                        <span id="statusText">Ready</span>
                    </div>
                    <div class="header-controls">
                        <button class="control-btn" id="voiceBtn" title="Voice Mode" aria-label="Toggle voice mode">🎤</button>
                        <button class="control-btn" id="themeBtn" title="Toggle Theme" aria-label="Toggle theme">🌓</button>
                        <button class="control-btn" id="settingsBtn" title="Settings" aria-label="Open settings">⚙️</button>
                        <button class="control-btn" id="minimizeBtn" title="Minimize" aria-label="Minimize widget">−</button>
                        <button class="control-btn" id="closeBtn" title="Close" aria-label="Close widget">×</button>
                    </div>
                </div>

                <!-- Chat Container -->
                <div class="chat-container">
                    <!-- Messages Area -->
                    <div class="messages-area" id="messagesArea">
                        <!-- Welcome Screen -->
                        <div class="welcome-screen" id="welcomeScreen">
                            <div class="welcome-icon">👋</div>
                            <div class="welcome-title">Hello! I'm your AI Assistant</div>
                            <div class="welcome-subtitle">How can I help you today?</div>
                            <div class="quick-actions">
                                <div class="quick-action" data-action="help">
                                    <span class="quick-action-icon">❓</span>
                                    <span>Get Help</span>
                                </div>
                                <div class="quick-action" data-action="summarize">
                                    <span class="quick-action-icon">📝</span>
                                    <span>Summarize Page</span>
                                </div>
                                <div class="quick-action" data-action="translate">
                                    <span class="quick-action-icon">🌍</span>
                                    <span>Translate</span>
                                </div>
                                <div class="quick-action" data-action="analyze">
                                    <span class="quick-action-icon">📊</span>
                                    <span>Analyze Content</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator" id="typingIndicator" style="display: none;">
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="input-area">
                    <!-- Toolbar -->
                    <div class="input-toolbar">
                        <div class="toolbar" id="toolbar">
                            <button class="toolbar-btn" data-feature="google-cloud" title="Google Cloud AI">
                                <span>🧠</span> Cloud AI
                            </button>
                            <button class="toolbar-btn" data-feature="voice" title="Voice Commands">
                                <span>🎤</span> Voice
                            </button>
                            <button class="toolbar-btn" data-feature="vision" title="Image Analysis">
                                <span>👁️</span> Vision
                            </button>
                            <button class="toolbar-btn" data-feature="translation" title="Translation">
                                <span>🌍</span> Translate
                            </button>
                            <button class="toolbar-btn" data-feature="analytics" title="Analytics">
                                <span>📊</span> Analytics
                            </button>
                        </div>
                    </div>

                    <!-- Suggestions -->
                    <div class="suggestions" id="suggestions" style="display: none;"></div>

                    <!-- Input Container -->
                    <div class="input-container">
                        <textarea class="message-input" id="messageInput"
                                  placeholder="Type your message here..."
                                  rows="1"
                                  aria-label="Message input"></textarea>

                        <!-- Voice Recording Overlay -->
                        <div class="voice-recording" id="voiceRecording" style="display: none;">
                            <span class="voice-icon">🎤</span>
                            <span>Recording...</span>
                        </div>

                        <div class="input-actions">
                            <button class="input-btn" id="attachBtn" title="Attach File" aria-label="Attach file">📎</button>
                            <button class="input-btn" id="emojiBtn" title="Emoji" aria-label="Insert emoji">😊</button>
                            <button class="input-btn send-btn" id="sendBtn" title="Send Message" aria-label="Send message">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Resize Handle -->
                <div class="resize-handle" id="resizeHandle"></div>
            </div>
        `;

        document.body.appendChild(container);
        this.setupWidgetEventListeners();
        this.loadInitialState();
        this.checkGoogleCloudStatus();
    }

    setupWidgetEventListeners() {
        const fab = document.getElementById('premiumFab');
        const widget = document.getElementById('premiumWidget');
        const closeBtn = document.getElementById('closeBtn');
        const minimizeBtn = document.getElementById('minimizeBtn');
        const themeBtn = document.getElementById('themeBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        const header = document.querySelector('.widget-header');
        const resizeHandle = document.getElementById('resizeHandle');

        // FAB click
        fab.addEventListener('click', () => this.toggleWidget());

        // Header controls
        closeBtn.addEventListener('click', () => this.closeWidget());
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        themeBtn.addEventListener('click', () => this.toggleTheme());
        voiceBtn.addEventListener('click', () => this.toggleVoiceMode());
        settingsBtn.addEventListener('click', () => this.openSettings());

        // Message input
        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        messageInput.addEventListener('input', () => {
            this.adjustInputHeight();
            this.showSuggestions();
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', () => {
                const actionType = action.dataset.action;
                this.handleQuickAction(actionType);
            });
        });

        // Toolbar features
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const feature = btn.dataset.feature;
                this.toggleFeature(feature);
            });
        });

        // Dragging
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn')) return;
            isDragging = true;
            dragOffset.x = e.clientX - this.position.x;
            dragOffset.y = e.clientY - this.position.y;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.position.x = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, e.clientX - dragOffset.x));
            this.position.y = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, e.clientY - dragOffset.y));
            this.updateWidgetPosition();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                this.saveSettings();
            }
        });

        // Resizing
        let isResizing = false;
        let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            resizeStart = {
                x: e.clientX,
                y: e.clientY,
                width: widget.offsetWidth,
                height: widget.offsetHeight
            };
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'se-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
            const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));

            widget.style.width = newWidth + 'px';
            widget.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                this.saveSettings();
            }
        });
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.constrainPosition();
            this.updateWidgetPosition();
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOpen) {
                this.checkGoogleCloudStatus();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeWidget();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + A to toggle widget
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleWidget();
            }

            // Ctrl/Cmd + Shift + V to toggle voice mode
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V' && this.isOpen) {
                e.preventDefault();
                this.toggleVoiceMode();
            }

            // Ctrl/Cmd + / to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === '/' && this.isOpen) {
                e.preventDefault();
                document.getElementById('messageInput').focus();
            }
        });
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const messageInput = document.getElementById('messageInput');
                    messageInput.value = result[0].transcript;
                    this.adjustInputHeight();
                    this.sendMessage();
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecording();
                this.showNotification('Voice recognition error: ' + event.error, 'error');
            };

            this.recognition.onend = () => {
                this.stopVoiceRecording();
            };
        }
    }

    toggleWidget() {
        const widget = document.getElementById('premiumWidget');
        const fab = document.getElementById('premiumFab');

        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }

    openWidget() {
        const widget = document.getElementById('premiumWidget');
        const fab = document.getElementById('premiumFab');

        this.isOpen = true;
        widget.classList.add('visible');
        fab.style.display = 'none';

        this.updateWidgetPosition();
        this.focusInput();
        this.analytics.sessionsCount++;
        this.analytics.sessionStartTime = Date.now();

        // Add pulse effect to FAB for first-time users
        if (this.analytics.sessionsCount === 1) {
            fab.classList.add('pulse');
        }

        this.saveSettings();
    }

    closeWidget() {
        const widget = document.getElementById('premiumWidget');
        const fab = document.getElementById('premiumFab');

        this.isOpen = false;
        widget.classList.remove('visible');
        fab.style.display = 'flex';

        this.stopVoiceRecording();
        this.updateUsageAnalytics();
        this.saveSettings();
    }

    toggleMinimize() {
        const widget = document.getElementById('premiumWidget');
        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            widget.classList.add('minimized');
        } else {
            widget.classList.remove('minimized');
        }

        this.saveSettings();
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];

        if (this.theme === 'auto') {
            this.detectTheme();
        } else {
            this.currentTheme = this.theme;
        }

        this.updateTheme();
        this.saveSettings();
        this.showNotification(`Theme switched to ${this.theme}`, 'info');
    }

    updateTheme() {
        const widget = document.getElementById('premium-ai-assistant');
        if (widget) {
            widget.className = `premium-assistant theme-${this.currentTheme} size-${this.size}`;
        }
    }

    toggleVoiceMode() {
        if (this.isListening) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        if (!this.recognition) {
            this.showNotification('Speech recognition not supported in this browser', 'error');
            return;
        }

        const voiceBtn = document.getElementById('voiceBtn');
        const voiceRecording = document.getElementById('voiceRecording');

        this.isListening = true;
        voiceBtn.classList.add('active');
        voiceRecording.style.display = 'flex';

        try {
            this.recognition.start();
            this.showNotification('Listening... Speak now', 'info');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.stopVoiceRecording();
        }
    }

    stopVoiceRecording() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceRecording = document.getElementById('voiceRecording');

        this.isListening = false;
        voiceBtn.classList.remove('active');
        voiceRecording.style.display = 'none';

        if (this.recognition) {
            this.recognition.stop();
        }
    }

    adjustInputHeight() {
        const messageInput = document.getElementById('messageInput');
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    focusInput() {
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
        }, 100);
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        messageInput.value = '';
        this.adjustInputHeight();

        // Hide welcome screen
        const welcomeScreen = document.getElementById('welcomeScreen');
        welcomeScreen.style.display = 'none';

        // Add user message
        this.addMessage('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Determine which AI service to use
            let response;
            if (this.hasGoogleCloud) {
                response = await this.getGoogleCloudResponse(message);
            } else {
                response = await this.getDefaultResponse(message);
            }

            this.hideTypingIndicator();
            this.addMessage('assistant', response);

            // Update analytics
            this.analytics.messagesCount++;

        } catch (error) {
            console.error('Failed to get AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', "I'm sorry, I encountered an error. Please try again.");
            this.showNotification('Failed to get AI response', 'error');
        }

        this.saveConversation();
    }

    async getGoogleCloudResponse(message) {
        try {
            // Use Google Cloud AI for enhanced responses
            const result = await window.googleCloudIntegration.processWithAI(message, {
                useVertexAI: true,
                detectLanguage: true,
                processDocuments: false
            });

            if (result.success) {
                return result.response;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Google Cloud AI error:', error);
            return await this.getDefaultResponse(message);
        }
    }

    async getDefaultResponse(message) {
        // Fallback to extension's default AI
        try {
            const response = await new Promise((resolve, reject) => {
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage({
                        type: 'ASSISTANT_MESSAGE',
                        message: message
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response?.reply || 'I received your message but encountered an issue generating a response.');
                        }
                    });
                } else {
                    // Fallback response for non-extension environments
                    resolve("I'm here to help! However, I need to be properly connected to provide detailed responses.");
                }
            });

            return response;
        } catch (error) {
            console.error('Default AI response error:', error);
            return "I apologize, but I'm currently unable to process your request. Please check your connection and try again.";
        }
    }

    addMessage(sender, content) {
        const messagesArea = document.getElementById('messagesArea');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-actions">
                    <button class="message-action" onclick="this.copyMessage('${content}')" title="Copy">📋</button>
                    <button class="message-action" onclick="this.speakMessage('${content}')" title="Speak">🔊</button>
                </div>
            </div>
        `;

        messagesArea.appendChild(messageElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    formatMessage(content) {
        // Basic formatting for code blocks and links
        return content
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'flex';
        const messagesArea = document.getElementById('messagesArea');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }

    handleQuickAction(action) {
        const actions = {
            help: "How can I help you today? I can assist with various tasks including:",
            summarize: "I'll help you summarize the content on this page. What specifically would you like me to focus on?",
            translate: "I can translate text for you. What would you like me to translate and to which language?",
            analyze: "I can analyze content, data, or documents. What would you like me to analyze?"
        };

        if (actions[action]) {
            this.addMessage('assistant', actions[action]);
            document.getElementById('welcomeScreen').style.display = 'none';
        }
    }

    toggleFeature(feature) {
        const btn = document.querySelector(`[data-feature="${feature}"]`);
        btn.classList.toggle('active');

        const isActive = btn.classList.contains('active');

        // Feature-specific logic
        switch (feature) {
            case 'google-cloud':
                this.showNotification(
                    isActive ? 'Google Cloud AI enabled' : 'Google Cloud AI disabled',
                    'info'
                );
                break;
            case 'voice':
                if (isActive) {
                    this.toggleVoiceMode();
                }
                break;
            case 'translation':
                this.showNotification(
                    isActive ? 'Translation mode enabled' : 'Translation mode disabled',
                    'info'
                );
                break;
            // Add more feature logic as needed
        }
    }

    showSuggestions() {
        const input = document.getElementById('messageInput').value.toLowerCase();
        const suggestions = document.getElementById('suggestions');

        // Simple suggestion logic - can be enhanced
        if (input.length > 2) {
            const commonSuggestions = [
                'Summarize this page',
                'Translate to Spanish',
                'Analyze the content',
                'Help me with...'
            ];

            const filteredSuggestions = commonSuggestions.filter(s =>
                s.toLowerCase().includes(input)
            );

            if (filteredSuggestions.length > 0) {
                suggestions.innerHTML = filteredSuggestions
                    .map(s => `<div class="suggestion">${s}</div>`)
                    .join('');
                suggestions.style.display = 'flex';

                // Add click handlers to suggestions
                suggestions.querySelectorAll('.suggestion').forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                        document.getElementById('messageInput').value = suggestion.textContent;
                        suggestions.style.display = 'none';
                        this.adjustInputHeight();
                    });
                });
            } else {
                suggestions.style.display = 'none';
            }
        } else {
            suggestions.style.display = 'none';
        }
    }

    updateWidgetPosition() {
        const widget = document.getElementById('premiumWidget');
        if (widget) {
            widget.style.left = this.position.x + 'px';
            widget.style.top = this.position.y + 'px';
        }
    }

    constrainPosition() {
        const widget = document.getElementById('premiumWidget');
        if (!widget) return;

        const rect = widget.getBoundingClientRect();
        this.position.x = Math.max(0, Math.min(window.innerWidth - rect.width, this.position.x));
        this.position.y = Math.max(0, Math.min(window.innerHeight - rect.height, this.position.y));
    }

    async checkGoogleCloudStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (this.hasGoogleCloud) {
            try {
                const health = await window.googleCloudIntegration.performHealthCheck();
                if (health.success && health.overall === 'healthy') {
                    statusDot.className = 'status-dot';
                    statusText.textContent = 'Google Cloud Ready';
                } else {
                    statusDot.className = 'status-dot connecting';
                    statusText.textContent = 'Partial Service';
                }
            } catch (error) {
                statusDot.className = 'status-dot error';
                statusText.textContent = 'Connection Error';
            }
        } else {
            statusDot.className = 'status-dot connecting';
            statusText.textContent = 'Standard Mode';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    openSettings() {
        // Open the enhanced options page
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.openOptionsPage();
        } else {
            this.showNotification('Settings not available in this context', 'warning');
        }
    }

    loadInitialState() {
        // Set initial position and size
        this.updateWidgetPosition();
        this.updateTheme();
    }

    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.showNotification('Message copied to clipboard', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy message', 'error');
        });
    }

    speakMessage(content) {
        if (this.speechSynthesis) {
            // Cancel any ongoing speech
            this.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(content);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            this.speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Speech synthesis not supported', 'error');
        }
    }

    loadConversationHistory() {
        // Load from storage if available
        try {
            const stored = localStorage.getItem('premiumAssistantConversations');
            if (stored) {
                this.conversations = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    saveConversation() {
        try {
            localStorage.setItem('premiumAssistantConversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    async loadSettings() {
        try {
            const stored = localStorage.getItem('premiumAssistantSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                Object.assign(this, settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                theme: this.theme,
                size: this.size,
                position: this.position,
                isMinimized: this.isMinimized
            };
            localStorage.setItem('premiumAssistantSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    startAnalyticsSession() {
        this.analytics.sessionStartTime = Date.now();
    }

    updateUsageAnalytics() {
        if (this.analytics.sessionStartTime) {
            this.analytics.totalUsageTime += Date.now() - this.analytics.sessionStartTime;
            this.analytics.sessionStartTime = null;
        }
    }
}

// Initialize the Premium Floating Assistant
const premiumAssistant = new PremiumFloatingAssistant();

// Global functions for message actions
window.copyMessage = (content) => premiumAssistant.copyMessage(content);
window.speakMessage = (content) => premiumAssistant.speakMessage(content);

console.log('Premium AI Assistant loaded successfully');