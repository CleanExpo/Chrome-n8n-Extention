// WebSocket client for communication with desktop app

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectInterval = 5000;
        this.messageQueue = [];
        this.callbacks = new Map();
        this.reconnectTimer = null;
        this.connect();
    }

    connect() {
        try {
            // Connect to local desktop app
            this.ws = new WebSocket('ws://localhost:8765');

            this.ws.onopen = () => {
                console.log('Connected to desktop app');
                this.connected = true;
                this.clearReconnectTimer();

                // Send queued messages
                while (this.messageQueue.length > 0) {
                    const msg = this.messageQueue.shift();
                    this.send(msg.type, msg.data, msg.callback);
                }

                // Notify extension of connection
                this.notifyConnectionStatus(true);
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.connected = false;
            };

            this.ws.onclose = () => {
                console.log('Disconnected from desktop app');
                this.connected = false;
                this.notifyConnectionStatus(false);
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('Failed to connect to desktop app:', error);
            this.connected = false;
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        this.clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect();
        }, this.reconnectInterval);
    }

    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    send(type, data, callback) {
        const messageId = this.generateId();
        const message = {
            id: messageId,
            type: type,
            data: data,
            timestamp: Date.now()
        };

        if (callback) {
            this.callbacks.set(messageId, callback);
        }

        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            // Queue message if not connected
            this.messageQueue.push({ type, data, callback });
        }

        return messageId;
    }

    handleMessage(message) {
        // Handle response to a specific request
        if (message.id && this.callbacks.has(message.id)) {
            const callback = this.callbacks.get(message.id);
            this.callbacks.delete(message.id);
            callback(message.data);
            return;
        }

        // Handle different message types
        switch (message.type) {
            case 'ai_response':
                this.handleAIResponse(message.data);
                break;

            case 'voice_transcription':
                this.handleVoiceTranscription(message.data);
                break;

            case 'system_info':
                this.handleSystemInfo(message.data);
                break;

            case 'file_operation':
                this.handleFileOperation(message.data);
                break;

            case 'screenshot_result':
                this.handleScreenshotResult(message.data);
                break;

            case 'notification':
                this.showNotification(message.data);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    handleAIResponse(data) {
        // Send AI response to content script or popup
        chrome.runtime.sendMessage({
            action: 'aiResponse',
            data: data
        });
    }

    handleVoiceTranscription(data) {
        chrome.runtime.sendMessage({
            action: 'voiceTranscription',
            text: data.text,
            confidence: data.confidence
        });
    }

    handleSystemInfo(data) {
        chrome.storage.local.set({
            systemInfo: data
        });
    }

    handleFileOperation(data) {
        chrome.runtime.sendMessage({
            action: 'fileOperationComplete',
            operation: data.operation,
            result: data.result
        });
    }

    handleScreenshotResult(data) {
        if (data.success) {
            // Save screenshot to downloads or process it
            chrome.downloads.download({
                url: data.dataUrl,
                filename: `screenshot_${Date.now()}.png`
            });
        }
    }

    showNotification(data) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('images/icon-128.png'),
            title: data.title || 'n8n AI Assistant',
            message: data.message
        });
    }

    notifyConnectionStatus(connected) {
        chrome.runtime.sendMessage({
            action: 'desktopConnectionStatus',
            connected: connected
        });

        // Update all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'desktopConnectionStatus',
                    connected: connected
                }).catch(() => {
                    // Ignore errors for tabs without content script
                });
            });
        });
    }

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API methods

    sendAIRequest(prompt, context) {
        return new Promise((resolve) => {
            this.send('ai_request', {
                prompt: prompt,
                context: context
            }, resolve);
        });
    }

    captureDesktopScreenshot(options = {}) {
        return new Promise((resolve) => {
            this.send('capture_screenshot', options, resolve);
        });
    }

    startVoiceRecording() {
        return new Promise((resolve) => {
            this.send('start_voice_recording', {}, resolve);
        });
    }

    stopVoiceRecording() {
        return new Promise((resolve) => {
            this.send('stop_voice_recording', {}, resolve);
        });
    }

    saveFile(filename, content, type = 'text') {
        return new Promise((resolve) => {
            this.send('save_file', {
                filename: filename,
                content: content,
                type: type
            }, resolve);
        });
    }

    readFile(path) {
        return new Promise((resolve) => {
            this.send('read_file', {
                path: path
            }, resolve);
        });
    }

    getSystemInfo() {
        return new Promise((resolve) => {
            this.send('get_system_info', {}, resolve);
        });
    }

    openExternalApp(appName, args = []) {
        return new Promise((resolve) => {
            this.send('open_app', {
                app: appName,
                args: args
            }, resolve);
        });
    }

    isConnected() {
        return this.connected;
    }

    disconnect() {
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}