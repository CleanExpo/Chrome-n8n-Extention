/**
 * Advanced Chat System for Chrome Extension
 * Handles conversation management, AI interactions, and chat features
 */

class AdvancedChatSystem {
    constructor(options = {}) {
        this.options = {
            maxConversations: 50,
            maxMessagesPerConversation: 1000,
            autoSave: true,
            enableVoice: true,
            enableFileUpload: true,
            enableMarkdown: true,
            enableCodeHighlight: true,
            apiTimeout: 30000,
            retryAttempts: 3,
            ...options
        };

        this.conversations = new Map();
        this.currentConversationId = null;
        this.messageQueue = [];
        this.isProcessing = false;
        this.voiceRecognition = null;
        this.speechSynthesis = null;
        this.listeners = new Set();

        this.init();
    }

    async init() {
        await this.loadConversations();
        this.setupVoiceFeatures();
        this.setupMarkdownProcessor();
        this.setupCodeHighlighter();
        this.setupEventListeners();

        // Create or restore the current conversation
        if (this.conversations.size === 0) {
            this.createNewConversation();
        } else {
            const lastConversation = Array.from(this.conversations.values()).pop();
            this.currentConversationId = lastConversation.id;
        }
    }

    // Conversation Management
    createNewConversation(title = null) {
        const id = this.generateConversationId();
        const conversation = {
            id,
            title: title || `Conversation ${this.conversations.size + 1}`,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: {
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 2000,
                systemPrompt: ''
            },
            metadata: {
                messageCount: 0,
                tokensUsed: 0,
                tags: [],
                archived: false,
                starred: false
            }
        };

        this.conversations.set(id, conversation);
        this.currentConversationId = id;

        if (this.options.autoSave) {
            this.saveConversations();
        }

        this.notifyListeners('conversationCreated', { conversation });
        return conversation;
    }

    getConversation(id = null) {
        const conversationId = id || this.currentConversationId;
        return this.conversations.get(conversationId);
    }

    switchConversation(id) {
        if (this.conversations.has(id)) {
            this.currentConversationId = id;
            this.notifyListeners('conversationSwitched', {
                conversationId: id,
                conversation: this.conversations.get(id)
            });
            return true;
        }
        return false;
    }

    deleteConversation(id) {
        if (this.conversations.has(id)) {
            const conversation = this.conversations.get(id);
            this.conversations.delete(id);

            // Switch to another conversation if the current one was deleted
            if (this.currentConversationId === id) {
                if (this.conversations.size > 0) {
                    this.currentConversationId = Array.from(this.conversations.keys())[0];
                } else {
                    this.createNewConversation();
                }
            }

            if (this.options.autoSave) {
                this.saveConversations();
            }

            this.notifyListeners('conversationDeleted', { conversationId: id, conversation });
            return true;
        }
        return false;
    }

    updateConversationSettings(id, settings) {
        const conversation = this.conversations.get(id);
        if (conversation) {
            conversation.settings = { ...conversation.settings, ...settings };
            conversation.updatedAt = new Date().toISOString();

            if (this.options.autoSave) {
                this.saveConversations();
            }

            this.notifyListeners('conversationUpdated', { conversationId: id, conversation });
            return true;
        }
        return false;
    }

    // Message Management
    async addMessage(content, type = 'user', metadata = {}) {
        const conversation = this.getConversation();
        if (!conversation) return null;

        const message = {
            id: this.generateMessageId(),
            content,
            type, // 'user', 'assistant', 'system', 'error'
            timestamp: new Date().toISOString(),
            metadata: {
                tokens: 0,
                model: '',
                processingTime: 0,
                retries: 0,
                ...metadata
            }
        };

        conversation.messages.push(message);
        conversation.metadata.messageCount++;
        conversation.updatedAt = new Date().toISOString();

        // Auto-generate title from first user message
        if (conversation.messages.length === 1 && type === 'user') {
            conversation.title = this.generateConversationTitle(content);
        }

        // Trim conversation if it exceeds max messages
        if (conversation.messages.length > this.options.maxMessagesPerConversation) {
            conversation.messages = conversation.messages.slice(-this.options.maxMessagesPerConversation);
        }

        if (this.options.autoSave) {
            this.saveConversations();
        }

        this.notifyListeners('messageAdded', { message, conversationId: conversation.id });
        return message;
    }

    async sendMessage(content, options = {}) {
        if (this.isProcessing) {
            this.messageQueue.push({ content, options });
            return;
        }

        this.isProcessing = true;

        try {
            // Add user message
            const userMessage = await this.addMessage(content, 'user');

            // Process with AI
            const response = await this.processWithAI(content, options);

            // Add AI response
            const aiMessage = await this.addMessage(response.content, 'assistant', {
                model: response.model,
                tokens: response.tokens,
                processingTime: response.processingTime
            });

            this.notifyListeners('messageProcessed', {
                userMessage,
                aiMessage,
                conversationId: this.currentConversationId
            });

            return { userMessage, aiMessage };
        } catch (error) {
            const errorMessage = await this.addMessage(
                `Error: ${error.message}`,
                'error',
                { error: error.stack }
            );

            this.notifyListeners('messageError', {
                error,
                errorMessage,
                conversationId: this.currentConversationId
            });

            throw error;
        } finally {
            this.isProcessing = false;

            // Process queued messages
            if (this.messageQueue.length > 0) {
                const { content, options } = this.messageQueue.shift();
                setTimeout(() => this.sendMessage(content, options), 100);
            }
        }
    }

    async processWithAI(content, options = {}) {
        const conversation = this.getConversation();
        const settings = { ...conversation.settings, ...options };

        const startTime = Date.now();
        let attempts = 0;

        while (attempts < this.options.retryAttempts) {
            try {
                // Build conversation context
                const context = this.buildConversationContext(conversation, settings);

                // Try different AI providers in order of preference
                let response = null;

                // 1. Try Google Cloud Vertex AI
                if (window.googleCloudIntegration && !response) {
                    try {
                        response = await this.tryVertexAI(content, context, settings);
                    } catch (error) {
                        console.log('Vertex AI failed, trying next provider:', error.message);
                    }
                }

                // 2. Try OpenAI
                if (!response) {
                    try {
                        response = await this.tryOpenAI(content, context, settings);
                    } catch (error) {
                        console.log('OpenAI failed, trying next provider:', error.message);
                    }
                }

                // 3. Try n8n workflow
                if (!response) {
                    try {
                        response = await this.tryN8nWorkflow(content, context, settings);
                    } catch (error) {
                        console.log('n8n failed, trying next provider:', error.message);
                    }
                }

                if (!response) {
                    throw new Error('All AI providers failed. Please check your configuration.');
                }

                const processingTime = Date.now() - startTime;

                return {
                    content: response.content || response.message || response.response || 'No response received.',
                    model: response.model || settings.model || 'unknown',
                    tokens: response.usage?.total_tokens || 0,
                    processingTime,
                    attempts: attempts + 1
                };

            } catch (error) {
                attempts++;
                if (attempts >= this.options.retryAttempts) {
                    throw error;
                }

                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }
    }

    buildConversationContext(conversation, settings) {
        const context = [];

        // Add system prompt if present
        if (settings.systemPrompt) {
            context.push({
                role: 'system',
                content: settings.systemPrompt
            });
        }

        // Add recent messages (limit to avoid token limits)
        const recentMessages = conversation.messages.slice(-20);

        for (const message of recentMessages) {
            if (message.type === 'user' || message.type === 'assistant') {
                context.push({
                    role: message.type === 'user' ? 'user' : 'assistant',
                    content: message.content
                });
            }
        }

        return context;
    }

    async tryVertexAI(content, context, settings) {
        if (!window.googleCloudIntegration) {
            throw new Error('Google Cloud integration not available');
        }

        const client = window.googleCloudIntegration.getClient('vertexai');
        if (!client) {
            throw new Error('Vertex AI client not initialized');
        }

        const prompt = this.buildPromptFromContext(context, content);

        return await client.generateText(prompt, {
            model: settings.model || 'text-bison@001',
            temperature: settings.temperature || 0.7,
            maxOutputTokens: settings.maxTokens || 2000,
            topP: 0.9,
            topK: 40
        });
    }

    async tryOpenAI(content, context, settings) {
        const apiKey = await this.getStoredSetting('openaiKey');
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const messages = [...context, { role: 'user', content }];

        const response = await this.fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.model || 'gpt-4',
                messages,
                temperature: settings.temperature || 0.7,
                max_tokens: settings.maxTokens || 2000,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI request failed');
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content,
            model: data.model,
            usage: data.usage
        };
    }

    async tryN8nWorkflow(content, context, settings) {
        const webhookUrl = await this.getStoredSetting('n8nWebhook');
        if (!webhookUrl) {
            throw new Error('n8n webhook URL not configured');
        }

        const response = await this.fetchWithTimeout(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: content,
                context: context,
                settings: settings
            })
        });

        if (!response.ok) {
            throw new Error(`n8n workflow failed: ${response.status}`);
        }

        return await response.json();
    }

    buildPromptFromContext(context, currentMessage) {
        let prompt = '';

        for (const message of context) {
            if (message.role === 'system') {
                prompt += `System: ${message.content}\n\n`;
            } else if (message.role === 'user') {
                prompt += `User: ${message.content}\n\n`;
            } else if (message.role === 'assistant') {
                prompt += `Assistant: ${message.content}\n\n`;
            }
        }

        prompt += `User: ${currentMessage}\n\nAssistant:`;
        return prompt;
    }

    // Voice Features
    setupVoiceFeatures() {
        if (!this.options.enableVoice || typeof window === 'undefined') return;

        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();

            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';

            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.notifyListeners('voiceInput', { transcript });
            };

            this.voiceRecognition.onerror = (event) => {
                this.notifyListeners('voiceError', { error: event.error });
            };
        }

        // Speech Synthesis
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    startVoiceRecognition() {
        if (this.voiceRecognition) {
            try {
                this.voiceRecognition.start();
                this.notifyListeners('voiceRecognitionStarted');
                return true;
            } catch (error) {
                this.notifyListeners('voiceError', { error: error.message });
                return false;
            }
        }
        return false;
    }

    stopVoiceRecognition() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
            this.notifyListeners('voiceRecognitionStopped');
        }
    }

    speakText(text, options = {}) {
        if (!this.speechSynthesis) return false;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        utterance.lang = options.lang || 'en-US';

        if (options.voice) {
            const voices = this.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.name === options.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.onstart = () => this.notifyListeners('speechStarted', { text });
        utterance.onend = () => this.notifyListeners('speechEnded', { text });
        utterance.onerror = (event) => this.notifyListeners('speechError', { error: event.error });

        this.speechSynthesis.speak(utterance);
        return true;
    }

    // File Upload Processing
    async processFileUpload(file) {
        if (!this.options.enableFileUpload) {
            throw new Error('File upload is disabled');
        }

        const maxSize = 10 * 1024 * 1024; // 10MB limit
        if (file.size > maxSize) {
            throw new Error('File size exceeds 10MB limit');
        }

        const allowedTypes = [
            'text/plain',
            'text/csv',
            'application/json',
            'text/markdown',
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Unsupported file type');
        }

        try {
            if (file.type.startsWith('text/') || file.type === 'application/json') {
                const text = await file.text();
                return {
                    type: 'text',
                    content: text,
                    filename: file.name,
                    size: file.size
                };
            } else if (file.type.startsWith('image/')) {
                const base64 = await this.fileToBase64(file);
                return {
                    type: 'image',
                    content: base64,
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type
                };
            } else if (file.type === 'application/pdf') {
                // For PDF processing, we'd typically use PDF.js or send to Document AI
                const base64 = await this.fileToBase64(file);
                return {
                    type: 'pdf',
                    content: base64,
                    filename: file.name,
                    size: file.size
                };
            }
        } catch (error) {
            throw new Error(`Failed to process file: ${error.message}`);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Markdown and Code Features
    setupMarkdownProcessor() {
        if (!this.options.enableMarkdown) return;

        // Basic markdown processor (could be enhanced with a full library)
        this.markdownProcessor = {
            process: (text) => {
                return text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^\- (.*$)/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                    .replace(/\n/g, '<br>');
            }
        };
    }

    setupCodeHighlighter() {
        if (!this.options.enableCodeHighlight) return;

        // Basic code highlighting (could be enhanced with highlight.js)
        this.codeHighlighter = {
            highlight: (code, language = 'javascript') => {
                // This is a basic implementation
                // In production, you'd use a proper syntax highlighter
                return `<pre class="code-block language-${language}"><code>${this.escapeHtml(code)}</code></pre>`;
            }
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Search and Export
    searchConversations(query) {
        const results = [];
        const searchTerms = query.toLowerCase().split(' ');

        for (const [id, conversation] of this.conversations) {
            let matches = 0;
            const searchableText = [
                conversation.title,
                ...conversation.messages.map(m => m.content),
                ...conversation.metadata.tags
            ].join(' ').toLowerCase();

            for (const term of searchTerms) {
                if (searchableText.includes(term)) {
                    matches++;
                }
            }

            if (matches > 0) {
                results.push({
                    conversation,
                    relevance: matches / searchTerms.length
                });
            }
        }

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    exportConversation(id, format = 'json') {
        const conversation = this.conversations.get(id);
        if (!conversation) return null;

        switch (format) {
            case 'json':
                return JSON.stringify(conversation, null, 2);
            case 'markdown':
                return this.conversationToMarkdown(conversation);
            case 'txt':
                return this.conversationToText(conversation);
            default:
                return null;
        }
    }

    conversationToMarkdown(conversation) {
        let md = `# ${conversation.title}\n\n`;
        md += `*Created: ${new Date(conversation.createdAt).toLocaleString()}*\n\n`;

        for (const message of conversation.messages) {
            const sender = message.type === 'user' ? 'User' : 'Assistant';
            const timestamp = new Date(message.timestamp).toLocaleString();

            md += `## ${sender} (${timestamp})\n\n`;
            md += `${message.content}\n\n`;
        }

        return md;
    }

    conversationToText(conversation) {
        let text = `${conversation.title}\n`;
        text += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;

        for (const message of conversation.messages) {
            const sender = message.type === 'user' ? 'User' : 'Assistant';
            const timestamp = new Date(message.timestamp).toLocaleString();

            text += `${sender} (${timestamp}):\n${message.content}\n\n`;
        }

        return text;
    }

    // Storage Management
    async loadConversations() {
        try {
            let stored = null;

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['conversations']);
                stored = result.conversations;
            } else {
                const data = localStorage.getItem('chatConversations');
                stored = data ? JSON.parse(data) : null;
            }

            if (stored && Array.isArray(stored)) {
                for (const conversation of stored) {
                    this.conversations.set(conversation.id, conversation);
                }
            }
        } catch (error) {
            console.warn('Failed to load conversations:', error);
        }
    }

    async saveConversations() {
        try {
            const conversationsArray = Array.from(this.conversations.values());

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ conversations: conversationsArray });
            } else {
                localStorage.setItem('chatConversations', JSON.stringify(conversationsArray));
            }
        } catch (error) {
            console.warn('Failed to save conversations:', error);
        }
    }

    async getStoredSetting(key) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get([key]);
                return result[key];
            } else {
                const settings = localStorage.getItem('extensionSettings');
                if (settings) {
                    const parsed = JSON.parse(settings);
                    return parsed[key];
                }
            }
        } catch (error) {
            console.warn(`Failed to get setting ${key}:`, error);
        }
        return null;
    }

    // Utility Methods
    fetchWithTimeout(url, options = {}, timeout = this.options.apiTimeout) {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                reject(new Error('Request timeout'));
            }, timeout);

            fetch(url, { ...options, signal: controller.signal })
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timeoutId));
        });
    }

    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateConversationTitle(firstMessage) {
        const words = firstMessage.split(' ').slice(0, 8);
        let title = words.join(' ');
        if (title.length > 50) {
            title = title.substring(0, 47) + '...';
        }
        return title;
    }

    // Event System
    addEventListener(event, callback) {
        const listener = { event, callback };
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    removeEventListener(callback) {
        for (const listener of this.listeners) {
            if (listener.callback === callback) {
                this.listeners.delete(listener);
            }
        }
    }

    notifyListeners(event, data = {}) {
        for (const listener of this.listeners) {
            if (listener.event === event || listener.event === '*') {
                try {
                    listener.callback(data, event);
                } catch (error) {
                    console.warn('Chat system listener error:', error);
                }
            }
        }
    }

    setupEventListeners() {
        // Handle extension messages
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === 'sendChatMessage') {
                    this.sendMessage(message.content, message.options)
                        .then(result => sendResponse({ success: true, result }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true; // Keep message port open for async response
                }
            });
        }
    }

    // Cleanup
    destroy() {
        this.listeners.clear();
        this.conversations.clear();

        if (this.voiceRecognition) {
            this.voiceRecognition.abort();
        }

        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }

    // Public API
    getConversations() {
        return Array.from(this.conversations.values());
    }

    getConversationHistory(id = null) {
        const conversation = this.getConversation(id);
        return conversation ? conversation.messages : [];
    }

    getCurrentConversation() {
        return this.getConversation();
    }

    getStats() {
        const conversations = Array.from(this.conversations.values());

        return {
            totalConversations: conversations.length,
            totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
            totalTokens: conversations.reduce((sum, conv) => sum + conv.metadata.tokensUsed, 0),
            archivedConversations: conversations.filter(conv => conv.metadata.archived).length,
            starredConversations: conversations.filter(conv => conv.metadata.starred).length
        };
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedChatSystem };
} else if (typeof window !== 'undefined') {
    window.AdvancedChatSystem = AdvancedChatSystem;
}

// Auto-initialize in browser environments
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.chatSystem = null;

    function initializeChatSystem(options = {}) {
        if (!window.chatSystem) {
            window.chatSystem = new AdvancedChatSystem(options);
        }
        return window.chatSystem;
    }

    window.initializeChatSystem = initializeChatSystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initializeChatSystem());
    } else {
        initializeChatSystem();
    }
}