/**
 * WebSocket Client - Production Version with Complete Error Handling
 * Manages communication with desktop application
 */

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectInterval = 5000;
        this.maxReconnectInterval = 30000;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.messageQueue = [];
        this.callbacks = new Map();
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.heartbeatInterval = 30000;
        this.config = {
            url: 'ws://localhost:8765',
            timeout: 10000
        };

        // Initialize connection
        this.connect();
    }

    /**
     * Connect to WebSocket server with error handling
     */
    async connect() {
        try {
            // Clear any existing connection
            this.cleanup();

            console.log('Attempting WebSocket connection to:', this.config.url);

            // Create new WebSocket connection
            this.ws = new WebSocket(this.config.url);

            // Set connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket connection timeout');
                    this.ws.close();
                    this.handleConnectionFailure();
                }
            }, this.config.timeout);

            this.ws.onopen = () => {
                try {
                    clearTimeout(connectionTimeout);
                    console.log('WebSocket connected successfully');

                    this.connected = true;
                    this.reconnectAttempts = 0;
                    this.clearReconnectTimer();

                    // Start heartbeat
                    this.startHeartbeat();

                    // Process queued messages
                    this.processMessageQueue();

                    // Notify extension of connection
                    this.notifyConnectionStatus(true);
                } catch (error) {
                    console.error('Error in WebSocket onopen handler:', error);
                }
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
                try {
                    console.error('WebSocket error:', error);
                    this.handleConnectionFailure();
                } catch (err) {
                    console.error('Error in WebSocket onerror handler:', err);
                }
            };

            this.ws.onclose = (event) => {
                try {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.connected = false;
                    this.stopHeartbeat();

                    // Only attempt reconnect if not manually closed
                    if (event.code !== 1000) {
                        this.handleConnectionFailure();
                    }
                } catch (error) {
                    console.error('Error in WebSocket onclose handler:', error);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.handleConnectionFailure();
        }
    }

    /**
     * Handle connection failure and schedule reconnect
     */
    handleConnectionFailure() {
        this.connected = false;
        this.stopHeartbeat();

        // Check if we should attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const backoffDelay = Math.min(
                this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
                this.maxReconnectInterval
            );

            console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${backoffDelay}ms`);
            this.scheduleReconnect(backoffDelay);
        } else {
            console.log('Max reconnection attempts reached. Stopping reconnection.');
            this.notifyConnectionStatus(false, 'Max reconnection attempts reached');
        }
    }

    /**
     * Schedule WebSocket reconnection
     */
    scheduleReconnect(delay = this.reconnectInterval) {
        this.clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
            console.log(`Reconnection attempt ${this.reconnectAttempts}`);
            this.connect();
        }, delay);
    }

    /**
     * Clear reconnection timer
     */
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send('ping', {}, null);
            }
        }, this.heartbeatInterval);
    }

    /**
     * Stop heartbeat timer
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected()) {
            const msg = this.messageQueue.shift();

            // Check message age
            const age = Date.now() - msg.timestamp;
            if (age < 60000) { // Process if less than 1 minute old
                this.send(msg.type, msg.data, msg.callback);
            } else {
                console.log('Message too old, dropping:', msg.type);
                if (msg.callback) {
                    msg.callback({ error: 'Message expired' });
                }
            }
        }
    }

    /**
     * Send message through WebSocket
     */
    send(type, data, callback = null) {
        if (this.isConnected()) {
            try {
                const message = {
                    id: this.generateId(),
                    type: type,
                    data: data,
                    timestamp: Date.now()
                };

                // Store callback if provided
                if (callback) {
                    const timeoutDuration = 30000; // 30 second timeout
                    const timeout = setTimeout(() => {
                        this.callbacks.delete(message.id);
                        callback({ error: 'Request timeout' });
                    }, timeoutDuration);

                    this.callbacks.set(message.id, {
                        callback: callback,
                        timeout: timeout
                    });
                }

                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send message:', error);
                if (callback) {
                    callback({ error: 'Send failed: ' + error.message });
                }
            }
        } else {
            // Queue message if not connected
            this.messageQueue.push({
                type,
                data,
                callback,
                retries: 0,
                timestamp: Date.now()
            });

            // Limit queue size
            if (this.messageQueue.length > 100) {
                const dropped = this.messageQueue.shift();
                console.log('Message queue overflow, dropping oldest message:', dropped.type);
                if (dropped.callback) {
                    dropped.callback({ error: 'Message queue overflow' });
                }
            }
        }
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(message) {
        try {
            // Handle response to specific request
            if (message.id && this.callbacks.has(message.id)) {
                const callbackData = this.callbacks.get(message.id);
                clearTimeout(callbackData.timeout);
                this.callbacks.delete(message.id);
                callbackData.callback(message.data || message);
                return;
            }

            // Handle different message types
            switch (message.type) {
                case 'pong':
                    // Heartbeat response
                    break;

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

                case 'error':
                    console.error('Server error:', message.data);
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    /**
     * Handle AI response
     */
    handleAIResponse(data) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'aiResponse',
                    data: data
                }).catch(error => {
                    console.log('Could not send AI response to extension:', error);
                });
            }
        } catch (error) {
            console.error('Error handling AI response:', error);
        }
    }

    /**
     * Handle voice transcription
     */
    handleVoiceTranscription(data) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'voiceTranscription',
                    text: data.text,
                    confidence: data.confidence
                }).catch(error => {
                    console.log('Could not send voice transcription:', error);
                });
            }
        } catch (error) {
            console.error('Error handling voice transcription:', error);
        }
    }

    /**
     * Handle system info
     */
    handleSystemInfo(data) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({
                    systemInfo: data
                }).catch(error => {
                    console.error('Could not save system info:', error);
                });
            }
        } catch (error) {
            console.error('Error handling system info:', error);
        }
    }

    /**
     * Handle file operation result
     */
    handleFileOperation(data) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'fileOperationComplete',
                    operation: data.operation,
                    result: data.result
                }).catch(error => {
                    console.log('Could not send file operation result:', error);
                });
            }
        } catch (error) {
            console.error('Error handling file operation:', error);
        }
    }

    /**
     * Handle screenshot result
     */
    handleScreenshotResult(data) {
        try {
            if (data.success && data.dataUrl && typeof chrome !== 'undefined' && chrome.downloads) {
                chrome.downloads.download({
                    url: data.dataUrl,
                    filename: `screenshot_${Date.now()}.png`
                }).catch(error => {
                    console.error('Could not save screenshot:', error);
                });
            } else {
                console.error('Screenshot failed:', data.error);
            }
        } catch (error) {
            console.error('Error handling screenshot:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(data) {
        try {
            if (typeof chrome !== 'undefined' && chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('images/icon-128.png'),
                    title: data.title || 'n8n AI Assistant',
                    message: data.message || 'Notification'
                }).catch(error => {
                    console.error('Could not create notification:', error);
                });
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Notify extension of connection status
     */
    notifyConnectionStatus(connected, message = null) {
        try {
            const statusData = {
                action: 'desktopConnectionStatus',
                connected: connected,
                message: message
            };

            // Notify background script
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(statusData).catch(() => {
                    // Extension might not be ready
                });

                // Update all tabs
                if (chrome.tabs) {
                    chrome.tabs.query({}, (tabs) => {
                        tabs.forEach(tab => {
                            chrome.tabs.sendMessage(tab.id, statusData).catch(() => {
                                // Tab might not have content script
                            });
                        });
                    });
                }
            }
        } catch (error) {
            console.log('Error notifying connection status:', error);
        }
    }

    /**
     * Generate unique message ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.clearReconnectTimer();
        this.stopHeartbeat();

        // Clear callbacks with timeout
        for (const [id, data] of this.callbacks.entries()) {
            clearTimeout(data.timeout);
            data.callback({ error: 'Connection closed' });
        }
        this.callbacks.clear();

        // Close existing WebSocket
        if (this.ws) {
            try {
                this.ws.close(1000, 'Cleanup');
            } catch (error) {
                // Ignore close errors
            }
            this.ws = null;
        }
    }

    /**
     * Disconnect WebSocket connection
     */
    disconnect() {
        console.log('Manually disconnecting WebSocket');
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
        this.cleanup();
        this.connected = false;
        this.notifyConnectionStatus(false, 'Manually disconnected');
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Public API methods with error handling

    /**
     * Send AI request
     */
    async sendAIRequest(prompt, context) {
        return new Promise((resolve) => {
            this.send('ai_request', {
                prompt: prompt,
                context: context
            }, (response) => {
                if (response.error) {
                    console.error('AI request failed:', response.error);
                    resolve({ error: response.error });
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Capture desktop screenshot
     */
    async captureDesktopScreenshot(options = {}) {
        return new Promise((resolve) => {
            this.send('capture_screenshot', options, (response) => {
                if (response.error) {
                    console.error('Screenshot failed:', response.error);
                    resolve({ success: false, error: response.error });
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Start voice recording
     */
    async startVoiceRecording() {
        return new Promise((resolve) => {
            this.send('start_voice_recording', {}, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Stop voice recording
     */
    async stopVoiceRecording() {
        return new Promise((resolve) => {
            this.send('stop_voice_recording', {}, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Save file to desktop
     */
    async saveFile(filename, content, type = 'text') {
        return new Promise((resolve) => {
            this.send('save_file', {
                filename: filename,
                content: content,
                type: type
            }, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Read file from desktop
     */
    async readFile(path) {
        return new Promise((resolve) => {
            this.send('read_file', {
                path: path
            }, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Get system information
     */
    async getSystemInfo() {
        return new Promise((resolve) => {
            this.send('get_system_info', {}, (response) => {
                resolve(response);
            });
        });
    }

    /**
     * Open external application
     */
    async openExternalApp(appName, args = []) {
        return new Promise((resolve) => {
            this.send('open_app', {
                app: appName,
                args: args
            }, (response) => {
                resolve(response);
            });
        });
    }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}