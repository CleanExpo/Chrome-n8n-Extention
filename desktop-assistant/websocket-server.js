// WebSocket Server for Desktop Assistant
const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
    constructor(port = 8765) {
        super();
        this.port = port;
        this.wss = null;
        this.clients = new Set();
        this.running = false;
    }

    start(callback) {
        if (this.running) {
            callback && callback(new Error('Server already running'));
            return;
        }

        try {
            this.wss = new WebSocket.Server({ port: this.port });

            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            this.wss.on('error', (error) => {
                console.error('WebSocket server error:', error);
                this.emit('error', error);
            });

            this.running = true;
            console.log(`WebSocket server started on port ${this.port}`);
            this.emit('started', this.port);
            callback && callback(null);
        } catch (error) {
            console.error('Failed to start WebSocket server:', error);
            callback && callback(error);
        }
    }

    stop() {
        if (!this.running) return;

        this.clients.forEach(client => {
            client.close();
        });

        if (this.wss) {
            this.wss.close(() => {
                console.log('WebSocket server stopped');
                this.emit('stopped');
            });
        }

        this.running = false;
    }

    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const clientIp = req.socket.remoteAddress;

        console.log(`New client connected: ${clientId} from ${clientIp}`);

        ws.clientId = clientId;
        this.clients.add(ws);

        // Send welcome message
        this.send(ws, {
            type: 'connected',
            clientId: clientId,
            message: 'Connected to n8n Desktop Assistant'
        });

        // Handle messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(ws, data);
            } catch (error) {
                console.error('Error parsing message:', error);
                this.send(ws, {
                    type: 'error',
                    error: 'Invalid message format'
                });
            }
        });

        // Handle close
        ws.on('close', () => {
            console.log(`Client disconnected: ${clientId}`);
            this.clients.delete(ws);
            this.emit('clientDisconnected', clientId);
        });

        // Handle error
        ws.on('error', (error) => {
            console.error(`Client error (${clientId}):`, error);
        });

        this.emit('clientConnected', clientId);
    }

    async handleMessage(ws, data) {
        console.log(`Message from ${ws.clientId}:`, data.type);

        switch (data.type) {
            case 'ping':
                this.send(ws, { type: 'pong' });
                break;

            case 'checkDesktopConnection':
                this.send(ws, {
                    type: 'desktopConnectionStatus',
                    connected: true
                });
                break;

            case 'ai_request':
                await this.handleAIRequest(ws, data.data);
                break;

            case 'capture_screenshot':
                await this.handleScreenshot(ws, data.data);
                break;

            case 'start_voice_recording':
                await this.startVoiceRecording(ws);
                break;

            case 'stop_voice_recording':
                await this.stopVoiceRecording(ws);
                break;

            case 'save_file':
                await this.handleFileSave(ws, data.data);
                break;

            case 'read_file':
                await this.handleFileRead(ws, data.data);
                break;

            case 'get_system_info':
                await this.handleSystemInfo(ws);
                break;

            case 'processMessage':
                await this.processMessage(ws, data.data);
                break;

            case 'processScreenshot':
                await this.processScreenshot(ws, data.data);
                break;

            case 'extractContent':
                await this.extractContent(ws, data.data);
                break;

            default:
                this.send(ws, {
                    type: 'error',
                    error: `Unknown message type: ${data.type}`
                });
        }
    }

    async handleAIRequest(ws, data) {
        // Integrate with OpenAI/Claude
        try {
            // Placeholder for AI processing
            const response = await this.processWithAI(data.prompt, data.context);

            this.send(ws, {
                id: data.id,
                type: 'ai_response',
                data: {
                    response: response,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            this.send(ws, {
                id: data.id,
                type: 'error',
                error: error.message
            });
        }
    }

    async handleScreenshot(ws, options) {
        try {
            const screenshot = require('screenshot-desktop');
            const image = await screenshot({ format: 'png' });

            this.send(ws, {
                type: 'screenshot_result',
                data: {
                    success: true,
                    dataUrl: `data:image/png;base64,${image.toString('base64')}`
                }
            });
        } catch (error) {
            this.send(ws, {
                type: 'screenshot_result',
                data: {
                    success: false,
                    error: error.message
                }
            });
        }
    }

    async startVoiceRecording(ws) {
        // Implement voice recording
        this.send(ws, {
            type: 'voice_recording_started',
            data: { recording: true }
        });
    }

    async stopVoiceRecording(ws) {
        // Implement voice recording stop and transcription
        this.send(ws, {
            type: 'voice_transcription',
            data: {
                text: 'Transcribed text would go here',
                confidence: 0.95
            }
        });
    }

    async handleFileSave(ws, data) {
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const filePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', data.filename);
            await fs.writeFile(filePath, data.content);

            this.send(ws, {
                type: 'file_operation',
                data: {
                    operation: 'save',
                    result: 'success',
                    path: filePath
                }
            });
        } catch (error) {
            this.send(ws, {
                type: 'file_operation',
                data: {
                    operation: 'save',
                    result: 'error',
                    error: error.message
                }
            });
        }
    }

    async handleFileRead(ws, data) {
        const fs = require('fs').promises;

        try {
            const content = await fs.readFile(data.path, 'utf8');

            this.send(ws, {
                type: 'file_operation',
                data: {
                    operation: 'read',
                    result: 'success',
                    content: content
                }
            });
        } catch (error) {
            this.send(ws, {
                type: 'file_operation',
                data: {
                    operation: 'read',
                    result: 'error',
                    error: error.message
                }
            });
        }
    }

    async handleSystemInfo(ws) {
        const os = require('os');

        this.send(ws, {
            type: 'system_info',
            data: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                cpus: os.cpus().length,
                memory: {
                    total: os.totalmem(),
                    free: os.freemem()
                },
                uptime: os.uptime(),
                hostname: os.hostname()
            }
        });
    }

    async processMessage(ws, data) {
        // Process chat messages
        const response = await this.processWithAI(data.message, data.context);

        this.send(ws, {
            type: 'aiResponse',
            data: {
                reply: response
            }
        });
    }

    async processScreenshot(ws, data) {
        // Process screenshot with AI/Vision API
        this.send(ws, {
            type: 'screenshotProcessed',
            data: {
                success: true,
                analysis: 'Screenshot analysis would go here'
            }
        });
    }

    async extractContent(ws, data) {
        // Process extracted content
        this.send(ws, {
            type: 'contentExtracted',
            data: {
                success: true,
                summary: 'Content summary would go here'
            }
        });
    }

    async processWithAI(prompt, context) {
        // Placeholder for AI processing
        // In production, integrate with OpenAI/Claude API
        return `AI response to: ${prompt}`;
    }

    send(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcast(data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.send(client, data);
            }
        });
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isRunning() {
        return this.running;
    }

    getClients() {
        return Array.from(this.clients).map(client => ({
            id: client.clientId,
            readyState: client.readyState
        }));
    }
}

module.exports = WebSocketServer;