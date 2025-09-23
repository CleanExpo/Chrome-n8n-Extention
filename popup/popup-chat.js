// Popup Chat JavaScript - Enhanced chat interface functionality

class PopupChat {
    constructor() {
        this.messages = [];
        this.isRecording = false;
        this.wsConnected = false;
        this.init();
    }

    async init() {
        await this.loadChatHistory();
        this.attachEventListeners();
        this.checkConnection();
        this.loadSettings();
        this.autoResizeTextarea();
    }

    attachEventListeners() {
        // Send message
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // File attachment
        document.getElementById('attach-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileUpload(e));

        // Screenshot
        document.getElementById('screenshot-btn').addEventListener('click', () => this.captureScreenshot());

        // Voice recording
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceRecording());

        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'flex';
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });

        // Settings actions
        document.getElementById('connect-google').addEventListener('click', () => this.connectGoogle());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());

        // Save settings on change
        ['auto-detect-forms', 'enable-voice', 'save-history'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveSettings());
        });

        document.getElementById('ws-port').addEventListener('change', () => this.saveSettings());
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Send to background script
        chrome.runtime.sendMessage({
            action: 'processMessage',
            message: message,
            context: {
                url: tab.url,
                title: tab.title,
                timestamp: Date.now()
            }
        }, response => {
            if (response && response.reply) {
                this.addMessage(response.reply, 'assistant');
            } else {
                // If no desktop connection, use basic processing
                this.processLocally(message, tab);
            }
        });
    }

    addMessage(text, sender) {
        const container = document.getElementById('chat-container');

        // Remove welcome message if exists
        const welcome = container.querySelector('.welcome-message');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(text)}
                <div class="message-time">${time}</div>
            </div>
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        // Save to history
        this.messages.push({ text, sender, timestamp: Date.now() });
        this.saveChatHistory();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.addMessage('File too large. Maximum size is 10MB.', 'assistant');
            return;
        }

        this.addMessage(`📎 Uploading ${file.name}...`, 'user');

        const reader = new FileReader();
        reader.onload = (e) => {
            chrome.runtime.sendMessage({
                action: 'processFile',
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                }
            }, response => {
                if (response && response.success) {
                    this.addMessage(`File processed: ${file.name}`, 'assistant');
                } else {
                    this.addMessage('Failed to process file', 'assistant');
                }
            });
        };

        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }

    async captureScreenshot() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                this.addMessage('Failed to capture screenshot', 'assistant');
                return;
            }

            this.addMessage('📷 Screenshot captured', 'user');

            // Send to background for processing
            chrome.runtime.sendMessage({
                action: 'processScreenshot',
                screenshot: dataUrl,
                tabInfo: {
                    url: tab.url,
                    title: tab.title
                }
            }, response => {
                if (response && response.success) {
                    this.addMessage('Screenshot saved and ready for analysis', 'assistant');
                }
            });
        });
    }

    toggleVoiceRecording() {
        const voiceBtn = document.getElementById('voice-btn');
        const recordingIndicator = document.getElementById('recording-indicator');

        if (!this.wsConnected) {
            this.addMessage('Voice recording requires desktop app connection', 'assistant');
            return;
        }

        if (!this.isRecording) {
            this.startVoiceRecording();
            voiceBtn.classList.add('active');
            recordingIndicator.style.display = 'flex';
        } else {
            this.stopVoiceRecording();
            voiceBtn.classList.remove('active');
            recordingIndicator.style.display = 'none';
        }

        this.isRecording = !this.isRecording;
    }

    startVoiceRecording() {
        chrome.runtime.sendMessage({
            action: 'startVoiceRecording'
        }, response => {
            if (!response || !response.success) {
                this.addMessage('Failed to start voice recording', 'assistant');
                this.isRecording = false;
            }
        });
    }

    stopVoiceRecording() {
        chrome.runtime.sendMessage({
            action: 'stopVoiceRecording'
        }, response => {
            if (response && response.text) {
                this.addMessage(response.text, 'user');
                // Process the transcribed text
                this.sendMessage();
            }
        });
    }

    async handleQuickAction(action) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        switch (action) {
            case 'capture-tab':
                this.captureScreenshot();
                break;

            case 'extract-page':
                this.addMessage('Extracting page content...', 'assistant');
                chrome.tabs.sendMessage(tab.id, {
                    action: 'extractContent'
                }, response => {
                    if (response && response.content) {
                        const summary = `Extracted: ${response.content.title}\n` +
                                      `Text: ${response.content.text.substring(0, 200)}...`;
                        this.addMessage(summary, 'assistant');
                    }
                });
                break;

            case 'summarize':
                this.addMessage('Summarizing page...', 'assistant');
                chrome.tabs.sendMessage(tab.id, {
                    action: 'summarizePage'
                }, response => {
                    if (response && response.summary) {
                        this.addMessage(response.summary, 'assistant');
                    }
                });
                break;

            case 'translate':
                this.addMessage('Select text on the page and I\'ll translate it', 'assistant');
                chrome.tabs.sendMessage(tab.id, {
                    action: 'enableTranslation'
                });
                break;
        }
    }

    async connectGoogle() {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                this.addMessage('Failed to connect Google account', 'assistant');
                return;
            }

            // Get user info
            fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(user => {
                chrome.storage.sync.set({ googleUser: user });
                this.addMessage(`Connected as ${user.email}`, 'assistant');
            })
            .catch(error => {
                this.addMessage('Error connecting Google account', 'assistant');
            });
        });
    }

    async clearHistory() {
        if (confirm('Clear all chat history?')) {
            this.messages = [];
            await chrome.storage.local.remove('chatHistory');

            const container = document.getElementById('chat-container');
            container.innerHTML = `
                <div class="welcome-message">
                    <img src="../images/icon-128.png" alt="n8n" class="welcome-logo">
                    <h2>Chat history cleared</h2>
                    <p>Start a new conversation!</p>
                </div>
            `;

            document.getElementById('settings-modal').style.display = 'none';
        }
    }

    async loadChatHistory() {
        const result = await chrome.storage.local.get('chatHistory');
        if (result.chatHistory) {
            this.messages = result.chatHistory;

            // Display last 10 messages
            const recent = this.messages.slice(-10);
            if (recent.length > 0) {
                document.querySelector('.welcome-message')?.remove();
                recent.forEach(msg => {
                    this.addMessage(msg.text, msg.sender);
                });
            }
        }
    }

    async saveChatHistory() {
        const settings = await chrome.storage.sync.get('saveHistory');
        if (settings.saveHistory !== false) {
            // Keep only last 100 messages
            const toSave = this.messages.slice(-100);
            await chrome.storage.local.set({ chatHistory: toSave });
        }
    }

    async loadSettings() {
        const settings = await chrome.storage.sync.get([
            'autoDetectForms',
            'enableVoice',
            'saveHistory',
            'wsPort'
        ]);

        document.getElementById('auto-detect-forms').checked = settings.autoDetectForms || false;
        document.getElementById('enable-voice').checked = settings.enableVoice || false;
        document.getElementById('save-history').checked = settings.saveHistory !== false;
        document.getElementById('ws-port').value = settings.wsPort || 8765;
    }

    async saveSettings() {
        const settings = {
            autoDetectForms: document.getElementById('auto-detect-forms').checked,
            enableVoice: document.getElementById('enable-voice').checked,
            saveHistory: document.getElementById('save-history').checked,
            wsPort: parseInt(document.getElementById('ws-port').value)
        };

        await chrome.storage.sync.set(settings);

        // Notify background script of settings change
        chrome.runtime.sendMessage({
            action: 'settingsUpdated',
            settings: settings
        });
    }

    checkConnection() {
        // Check desktop app connection
        chrome.runtime.sendMessage({
            action: 'checkDesktopConnection'
        }, response => {
            const statusDot = document.getElementById('desktop-status');
            const statusText = document.getElementById('status-text');

            if (response && response.connected) {
                statusDot.classList.add('connected');
                statusText.textContent = 'Desktop app connected';
                this.wsConnected = true;
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = 'Desktop app not connected';
                this.wsConnected = false;
            }
        });

        // Check periodically
        setInterval(() => this.checkConnection(), 5000);
    }

    processLocally(message, tab) {
        // Basic local processing when desktop app is not connected
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('help')) {
            this.addMessage('I can help you with web automation, content extraction, and more. Connect the desktop app for AI-powered responses!', 'assistant');
        } else if (lowerMessage.includes('extract')) {
            chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
            this.addMessage('Extracting page content...', 'assistant');
        } else if (lowerMessage.includes('screenshot')) {
            this.captureScreenshot();
        } else {
            this.addMessage('Please connect the desktop app for AI-powered responses. You can still use quick actions above!', 'assistant');
        }
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('message-input');

        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupChat();
});