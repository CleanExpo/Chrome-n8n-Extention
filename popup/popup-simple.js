/**
 * Simple, Clean, and User-Friendly Popup Interface
 * No complexity, just works!
 */

class SimpleAIAssistant {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        this.init();
    }

    init() {
        // Get elements
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.statusElement = document.getElementById('status');

        // Setup event listeners
        this.setupEventListeners();

        // Check connection status
        this.checkConnectionStatus();

        // Load previous messages if any
        this.loadMessages();
    }

    setupEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Footer buttons
        this.clearBtn?.addEventListener('click', () => this.clearChat());
        this.settingsBtn?.addEventListener('click', () => this.openSettings());
        this.helpBtn?.addEventListener('click', () => this.showHelp());
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        // Clear input
        this.messageInput.value = '';

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        // Process message
        this.isProcessing = true;
        try {
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            console.error('Error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processMessage(message) {
        // Get current tab info
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];

        // Send message to background script
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'sendMessage',
                message: message,
                context: {
                    url: currentTab?.url || '',
                    title: currentTab?.title || ''
                }
            }, response => {
                if (response?.success && response?.reply) {
                    resolve(response.reply);
                } else {
                    resolve('I can help you with that! Please make sure your API keys are configured in settings.');
                }
            });
        });
    }

    addMessage(text, sender) {
        // Remove welcome message if it exists
        const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.animation = 'fadeOut 0.3s';
            setTimeout(() => welcomeMsg.remove(), 300);
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        this.chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

        // Save message
        this.messages.push({ text, sender, timestamp: Date.now() });
        this.saveMessages();
    }

    showTypingIndicator() {
        // Remove any existing indicator
        this.hideTypingIndicator();

        const indicator = document.createElement('div');
        indicator.className = 'message assistant';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        this.chatContainer.appendChild(indicator);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    async handleQuickAction(action) {
        let prompt = '';

        switch(action) {
            case 'summarize':
                prompt = 'Please summarize the content of this webpage in a clear and concise way.';
                break;
            case 'explain':
                // Get selected text from the page
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' }, (response) => {
                    if (response?.text) {
                        this.messageInput.value = `Please explain this: "${response.text}"`;
                        this.sendMessage();
                    } else {
                        this.messageInput.value = 'Please explain the main concept on this page.';
                        this.sendMessage();
                    }
                });
                return;
            case 'translate':
                prompt = 'Please translate the main content of this page to Spanish.';
                break;
            case 'improve':
                prompt = 'How can I improve the writing or content on this page?';
                break;
        }

        if (prompt) {
            this.messageInput.value = prompt;
            this.sendMessage();
        }
    }

    clearChat() {
        if (confirm('Clear all messages?')) {
            this.messages = [];
            this.chatContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">👋</div>
                    <h2>Hi! How can I help you today?</h2>
                    <p>Type a message below or try these quick actions:</p>
                    <div class="quick-actions">
                        <button class="quick-btn" data-action="summarize">
                            📝 Summarize this page
                        </button>
                        <button class="quick-btn" data-action="explain">
                            💡 Explain selection
                        </button>
                        <button class="quick-btn" data-action="translate">
                            🌐 Translate
                        </button>
                        <button class="quick-btn" data-action="improve">
                            ✨ Improve writing
                        </button>
                    </div>
                </div>
            `;

            // Re-attach quick action listeners
            document.querySelectorAll('.quick-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    this.handleQuickAction(action);
                });
            });

            // Clear saved messages
            chrome.storage.local.remove('chatMessages');
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    showHelp() {
        this.addMessage(
            `Here's what I can help you with:

• Summarize web pages
• Explain complex topics
• Translate content
• Improve your writing
• Answer questions
• Generate ideas
• Code assistance
• And much more!

Just type your question or click a quick action button to get started.`,
            'assistant'
        );
    }

    async checkConnectionStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getStats'
            });

            if (response?.apiStatus) {
                const isConnected = response.apiStatus.openai || response.apiStatus.n8n;
                this.updateStatus(isConnected);
            }
        } catch (error) {
            this.updateStatus(false);
        }
    }

    updateStatus(isConnected) {
        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('span:last-child');

        if (isConnected) {
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Ready';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'Setup Required';
        }
    }

    saveMessages() {
        // Only save last 50 messages
        const messagesToSave = this.messages.slice(-50);
        chrome.storage.local.set({ chatMessages: messagesToSave });
    }

    loadMessages() {
        chrome.storage.local.get(['chatMessages'], (result) => {
            if (result.chatMessages && result.chatMessages.length > 0) {
                // Remove welcome message
                const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
                if (welcomeMsg) welcomeMsg.remove();

                // Load previous messages
                result.chatMessages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${msg.sender}`;

                    const bubble = document.createElement('div');
                    bubble.className = 'message-bubble';
                    bubble.textContent = msg.text;

                    messageDiv.appendChild(bubble);
                    this.chatContainer.appendChild(messageDiv);
                });

                this.messages = result.chatMessages;
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }
        });
    }
}

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SimpleAIAssistant();
});