/**
 * Premium AI Assistant Popup JavaScript
 * Enhanced functionality with modern UX patterns
 */

class PremiumPopup {
    constructor() {
        this.currentTab = 'chat';
        this.currentModel = 'gpt-4o';
        this.theme = 'light';
        this.isConnected = false;
        this.chatHistory = [];
        this.conversations = [];
        this.settings = {};
        this.isTyping = false;
        this.voiceRecognition = null;
        this.isListening = false;

        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            await this.checkConnections();
            this.setupEventListeners();
            this.setupVoiceRecognition();
            this.loadChatHistory();
            this.updateUI();

            console.log('Premium Popup initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Premium Popup:', error);
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Model selection
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.saveSettings();
            this.updateModelStatus();
            this.showToast('Model changed to ' + e.target.options[e.target.selectedIndex].text, 'info');
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', () => {
                const actionType = action.getAttribute('data-action');
                this.handleQuickAction(actionType);
            });
        });

        // Chat input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const attachBtn = document.getElementById('attachBtn');

        messageInput.addEventListener('input', () => {
            this.adjustInputHeight();
            this.updateCharCount();
            this.updateSendButton();
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.ctrlKey || e.metaKey) {
                    this.sendMessage();
                } else if (!e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });

        sendBtn.addEventListener('click', () => this.sendMessage());
        voiceBtn.addEventListener('click', () => this.toggleVoice());
        attachBtn.addEventListener('click', () => this.handleAttachment());

        // Tool items
        document.querySelectorAll('.tool-item').forEach(tool => {
            tool.addEventListener('click', () => {
                const toolType = tool.getAttribute('data-tool');
                this.openTool(toolType);
            });
        });

        // Capture screen functionality
        const captureBtn = document.getElementById('captureScreen');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureScreen());
        }

        // History items
        document.getElementById('clearHistory')?.addEventListener('click', () => this.clearHistory());

        // Settings
        document.getElementById('testConnection')?.addEventListener('click', () => this.testConnection());
        document.getElementById('resetSettings')?.addEventListener('click', () => this.resetSettings());
        document.getElementById('openFullOptions')?.addEventListener('click', () => this.openFullOptions());

        // Settings controls
        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            this.theme = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.saveSettings());
        });

        document.querySelectorAll('.setting-control').forEach(control => {
            control.addEventListener('change', () => this.saveSettings());
        });
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();

            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';

            this.voiceRecognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                const messageInput = document.getElementById('messageInput');
                messageInput.value = result;
                this.adjustInputHeight();
                this.updateCharCount();
                this.sendMessage();
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecognition();
                this.showToast('Voice recognition error: ' + event.error, 'error');
            };

            this.voiceRecognition.onend = () => {
                this.stopVoiceRecognition();
            };
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;

        // Tab-specific initialization
        switch (tabName) {
            case 'tools':
                this.loadTools();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'settings':
                this.loadSettingsTab();
                break;
        }
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        this.theme = themes[(currentIndex + 1) % themes.length];

        this.applyTheme();
        this.saveSettings();
        this.showToast(`Theme switched to ${this.theme}`, 'info');
    }

    applyTheme() {
        const container = document.querySelector('.popup-container');

        if (this.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            container.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            container.setAttribute('data-theme', this.theme);
        }

        // Update theme select if in settings
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.theme;
        }
    }

    async handleQuickAction(action) {
        const actions = {
            'summarize': {
                message: 'Please summarize the current page content.',
                icon: '📄'
            },
            'translate': {
                message: 'Translate the selected text or current page.',
                icon: '🌍'
            },
            'explain': {
                message: 'Explain the selected content in simple terms.',
                icon: '💡'
            },
            'analyze': {
                message: 'Analyze the content on this page for insights.',
                icon: '📊'
            }
        };

        if (actions[action]) {
            // Switch to chat tab
            this.switchTab('chat');

            // Add the quick action message
            const messageInput = document.getElementById('messageInput');
            messageInput.value = actions[action].message;
            this.adjustInputHeight();
            this.updateCharCount();

            // Optionally auto-send
            setTimeout(() => this.sendMessage(), 100);
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message || this.isTyping) return;

        // Clear input and hide welcome message
        messageInput.value = '';
        this.adjustInputHeight();
        this.updateCharCount();
        this.hideWelcomeMessage();

        // Add user message to chat
        this.addMessage('user', message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response
            const response = await this.getAIResponse(message);

            // Hide typing indicator and add response
            this.hideTypingIndicator();
            this.addMessage('assistant', response);

            // Save to history
            this.saveChatMessage('user', message);
            this.saveChatMessage('assistant', response);

        } catch (error) {
            console.error('Failed to get AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', "I'm sorry, I encountered an error. Please try again.");
            this.showToast('Failed to get AI response', 'error');
        }

        this.updateSendButton();
    }

    async getAIResponse(message) {
        // Check if Google Cloud integration is available
        if (typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized) {
            try {
                const result = await window.googleCloudIntegration.processWithAI(message, {
                    useVertexAI: this.currentModel.startsWith('vertex-'),
                    detectLanguage: true,
                    processDocuments: false
                });

                if (result.success) {
                    return result.response;
                }
            } catch (error) {
                console.error('Google Cloud AI error:', error);
            }
        }

        // Fallback to extension's default AI
        return await this.getDefaultAIResponse(message);
    }

    async getDefaultAIResponse(message) {
        return new Promise((resolve, reject) => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: 'ASSISTANT_MESSAGE',
                    message: message,
                    model: this.currentModel
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response?.reply || 'I received your message but encountered an issue generating a response.');
                    }
                });
            } else {
                resolve("I'm here to help! However, I need to be properly connected to provide detailed responses.");
            }
        });
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${sender}`;

        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageContainer.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(content) {
        // Basic formatting for code blocks and links
        return content
            .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    hideWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'flex';
        this.isTyping = true;

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'none';
        this.isTyping = false;
    }

    adjustInputHeight() {
        const messageInput = document.getElementById('messageInput');
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 80) + 'px';
    }

    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = messageInput.value.length;

            const maxLength = 2000;
            if (messageInput.value.length > maxLength * 0.9) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--text-muted)';
            }
        }
    }

    updateSendButton() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn) {
            sendBtn.disabled = !messageInput.value.trim() || this.isTyping;
        }
    }

    toggleVoice() {
        if (!this.voiceRecognition) {
            this.showToast('Voice recognition not supported in this browser', 'error');
            return;
        }

        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        const voiceBtn = document.getElementById('voiceBtn');

        try {
            this.voiceRecognition.start();
            this.isListening = true;
            voiceBtn.classList.add('active');
            this.showToast('Listening... Speak now', 'info');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.showToast('Failed to start voice recognition', 'error');
        }
    }

    stopVoiceRecognition() {
        const voiceBtn = document.getElementById('voiceBtn');

        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
        }

        this.isListening = false;
        voiceBtn.classList.remove('active');
    }

    handleAttachment() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,text/*,.pdf,.doc,.docx';

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processAttachment(file);
            }
        };

        fileInput.click();
    }

    async processAttachment(file) {
        this.showToast(`Processing ${file.name}...`, 'info');

        try {
            // Check if Google Cloud Document AI is available
            if (typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized) {
                const documentAI = window.googleCloudIntegration.getClient('documentai');
                if (documentAI && (file.type.includes('image') || file.type.includes('pdf'))) {
                    const base64 = await this.fileToBase64(file);
                    const result = await documentAI.extractText(base64, { mimeType: file.type });

                    if (result.success) {
                        const message = `I've extracted text from ${file.name}:\n\n${result.text}`;
                        this.addMessage('assistant', message);
                        this.showToast('File processed successfully', 'success');
                        return;
                    }
                }
            }

            // Fallback: basic file info
            const fileInfo = `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${file.type})`;
            this.addMessage('user', `Attached: ${fileInfo}`);
            this.addMessage('assistant', "I can see your file attachment. While I can't process the file content directly in this version, I can help you with questions about it!");

        } catch (error) {
            console.error('File processing error:', error);
            this.showToast('Failed to process file', 'error');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async captureScreen() {
        const captureBtn = document.getElementById('captureScreen');

        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                // Visual feedback
                const originalContent = captureBtn.innerHTML;
                captureBtn.innerHTML = `
                    <div class="tool-icon">⏳</div>
                    <div class="tool-content">
                        <h4 class="tool-name">Capturing...</h4>
                        <p class="tool-description">Please wait</p>
                    </div>
                    <div class="tool-status available"></div>
                `;

                // Send message to background script
                chrome.runtime.sendMessage({ action: 'captureScreen' });

                // Success feedback
                setTimeout(() => {
                    captureBtn.innerHTML = `
                        <div class="tool-icon">✅</div>
                        <div class="tool-content">
                            <h4 class="tool-name">Captured!</h4>
                            <p class="tool-description">Screenshot saved</p>
                        </div>
                        <div class="tool-status available"></div>
                    `;
                }, 1000);

                // Reset after 2 seconds
                setTimeout(() => {
                    captureBtn.innerHTML = originalContent;
                }, 3000);

                this.showToast('Screenshot captured successfully!', 'success');

            } else {
                this.showToast('Screenshot capture not available in this context', 'warning');
            }
        } catch (error) {
            console.error('Screen capture failed:', error);
            this.showToast('Failed to capture screenshot', 'error');
        }
    }

    openTool(toolType) {
        const toolActions = {
            'capture': () => {
                this.captureScreen();
            },
            'vertex-ai': () => {
                this.switchTab('chat');
                this.currentModel = 'vertex-palm';
                this.updateModelSelect();
                this.showToast('Switched to Vertex AI model', 'success');
            },
            'document-ai': () => {
                this.handleAttachment();
            },
            'translate': () => {
                this.handleQuickAction('translate');
            },
            'speech': () => {
                this.toggleVoice();
            },
            'analytics': () => {
                this.handleQuickAction('analyze');
            },
            'bigquery': () => {
                this.showToast('BigQuery integration available via chat', 'info');
                this.switchTab('chat');
            }
        };

        if (toolActions[toolType]) {
            toolActions[toolType]();
        } else {
            this.showToast(`${toolType} tool opening...`, 'info');
        }
    }

    loadTools() {
        // Update tool status based on Google Cloud integration
        const toolItems = document.querySelectorAll('.tool-item');

        toolItems.forEach(tool => {
            const toolType = tool.getAttribute('data-tool');
            const statusIndicator = tool.querySelector('.tool-status');

            let isAvailable = true;

            if (toolType === 'capture') {
                isAvailable = typeof chrome !== 'undefined' && chrome.runtime;
            } else if (['vertex-ai', 'document-ai', 'translate', 'speech', 'analytics', 'bigquery'].includes(toolType)) {
                isAvailable = typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized;
            }

            if (statusIndicator) {
                statusIndicator.className = `tool-status ${isAvailable ? 'available' : 'unavailable'}`;
            }
        });
    }

    loadHistory() {
        const historyList = document.getElementById('historyList');
        const historyBadge = document.getElementById('historyBadge');

        if (historyList) {
            historyList.innerHTML = '';

            this.conversations.forEach((conversation, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.onclick = () => this.loadConversation(index);

                historyItem.innerHTML = `
                    <div class="history-preview">
                        <div class="history-title">${conversation.title}</div>
                        <div class="history-snippet">${conversation.snippet}</div>
                    </div>
                    <div class="history-meta">
                        <span class="history-time">${this.formatTime(conversation.timestamp)}</span>
                        <span class="history-messages">${conversation.messageCount} messages</span>
                    </div>
                `;

                historyList.appendChild(historyItem);
            });

            if (historyBadge) {
                historyBadge.textContent = this.conversations.length;
                historyBadge.style.display = this.conversations.length > 0 ? 'flex' : 'none';
            }
        }
    }

    loadConversation(index) {
        const conversation = this.conversations[index];
        if (conversation) {
            // Switch to chat tab
            this.switchTab('chat');

            // Clear current chat
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';

            // Load conversation messages
            conversation.messages.forEach(msg => {
                this.addMessage(msg.sender, msg.content);
            });

            this.showToast(`Loaded conversation: ${conversation.title}`, 'success');
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            this.conversations = [];
            this.chatHistory = [];
            this.saveData();
            this.loadHistory();
            this.showToast('Chat history cleared', 'success');
        }
    }

    loadSettingsTab() {
        // Load current settings into form controls
        const controls = {
            'themeSelect': this.theme,
            'defaultModelSelect': this.currentModel,
            'projectId': this.settings.projectId || '',
            'locationSelect': this.settings.location || 'us-central1'
        };

        Object.entries(controls).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });

        // Load checkbox states
        const checkboxes = ['voiceEnabled', 'saveHistory', 'analytics'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = this.settings[id] !== false;
            }
        });
    }

    async testConnection() {
        const testBtn = document.getElementById('testConnection');
        const originalText = testBtn.innerHTML;

        testBtn.innerHTML = '<span class="btn-icon">⏳</span> Testing...';
        testBtn.disabled = true;

        try {
            if (typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized) {
                const health = await window.googleCloudIntegration.performHealthCheck();

                if (health.success && health.overall === 'healthy') {
                    this.showToast('Google Cloud connection successful!', 'success');
                } else {
                    this.showToast('Connection partially working. Some services may be unavailable.', 'warning');
                }
            } else {
                this.showToast('Google Cloud integration not available', 'warning');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showToast('Connection test failed: ' + error.message, 'error');
        } finally {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = {};
            this.theme = 'light';
            this.currentModel = 'gpt-4o';
            this.applyTheme();
            this.updateModelSelect();
            this.loadSettingsTab();
            this.saveSettings();
            this.showToast('Settings reset to defaults', 'success');
        }
    }

    openFullOptions() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.openOptionsPage();
        } else {
            this.showToast('Full options page not available', 'warning');
        }
    }

    updateModelSelect() {
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            modelSelect.value = this.currentModel;
        }
    }

    updateModelStatus() {
        const modelIndicator = document.getElementById('modelIndicator');
        const statusDot = modelIndicator?.querySelector('.model-status');

        if (statusDot) {
            // Update status based on model availability
            if (this.currentModel.startsWith('vertex-')) {
                const hasGoogleCloud = typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized;
                statusDot.className = `model-status ${hasGoogleCloud ? 'active' : 'error'}`;
            } else {
                statusDot.className = 'model-status active';
            }
        }
    }

    async checkConnections() {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');

        try {
            // Check Google Cloud integration
            if (typeof window.googleCloudIntegration !== 'undefined' && window.googleCloudIntegration.initialized) {
                const health = await window.googleCloudIntegration.performHealthCheck();

                if (health.success && health.overall === 'healthy') {
                    this.isConnected = true;
                    statusDot.className = 'status-dot online';
                    statusText.textContent = 'Google Cloud Ready';
                } else {
                    statusDot.className = 'status-dot connecting';
                    statusText.textContent = 'Partial Service';
                }
            } else {
                // Check basic extension connectivity
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    statusDot.className = 'status-dot online';
                    statusText.textContent = 'Ready';
                    this.isConnected = true;
                } else {
                    statusDot.className = 'status-dot error';
                    statusText.textContent = 'Disconnected';
                }
            }
        } catch (error) {
            console.error('Connection check failed:', error);
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Error';
        }

        this.updateModelStatus();
    }

    saveChatMessage(sender, content) {
        if (this.settings.saveHistory !== false) {
            this.chatHistory.push({
                sender,
                content,
                timestamp: Date.now()
            });

            // Update or create conversation
            const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
            const existingConv = this.conversations.find(c => c.title === title);

            if (existingConv) {
                existingConv.messageCount++;
                existingConv.messages.push({ sender, content });
                existingConv.snippet = content.length > 100 ? content.substring(0, 97) + '...' : content;
            } else if (sender === 'user') {
                this.conversations.unshift({
                    title,
                    snippet: content.length > 100 ? content.substring(0, 97) + '...' : content,
                    timestamp: Date.now(),
                    messageCount: 1,
                    messages: [{ sender, content }]
                });
            }

            // Limit conversation history
            if (this.conversations.length > 50) {
                this.conversations = this.conversations.slice(0, 50);
            }

            this.saveData();
        }
    }

    loadChatHistory() {
        try {
            const stored = localStorage.getItem('premiumPopupData');
            if (stored) {
                const data = JSON.parse(stored);
                this.chatHistory = data.chatHistory || [];
                this.conversations = data.conversations || [];
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    saveData() {
        try {
            const data = {
                chatHistory: this.chatHistory,
                conversations: this.conversations
            };
            localStorage.setItem('premiumPopupData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save chat data:', error);
        }
    }

    async loadSettings() {
        try {
            const stored = localStorage.getItem('premiumPopupSettings');
            if (stored) {
                this.settings = JSON.parse(stored);
                this.theme = this.settings.theme || 'light';
                this.currentModel = this.settings.defaultModel || 'gpt-4o';
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    saveSettings() {
        try {
            // Gather settings from form controls
            this.settings.theme = this.theme;
            this.settings.defaultModel = this.currentModel;
            this.settings.projectId = document.getElementById('projectId')?.value || '';
            this.settings.location = document.getElementById('locationSelect')?.value || 'us-central1';

            // Checkboxes
            ['voiceEnabled', 'saveHistory', 'analytics'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    this.settings[id] = checkbox.checked;
                }
            });

            localStorage.setItem('premiumPopupSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    updateUI() {
        this.applyTheme();
        this.updateModelSelect();
        this.updateSendButton();
        this.updateCharCount();
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    showLoading(show = true) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
}

// Initialize the Premium Popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.premiumPopup = new PremiumPopup();
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (window.premiumPopup && window.premiumPopup.theme === 'auto') {
        window.premiumPopup.applyTheme();
    }
});