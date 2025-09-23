// Integration Server for n8n AI Assistant
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8766;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
const webhookRoutes = require('./routes/webhooks');
const apiRoutes = require('./routes/api');
const googleRoutes = require('./routes/google');
const n8nRoutes = require('./routes/n8n');

// Import Playwright MCP integration (optional - only if MCP server is running)
let mcpRoutes = null;
let initializeMCP = null;
try {
    const mcpIntegration = require('../playwright-mcp/n8n-integration');
    mcpRoutes = mcpIntegration.router;
    initializeMCP = mcpIntegration.initializeMCP;
} catch (error) {
    console.log('Playwright MCP integration not available:', error.message);
}

// Use routes
app.use('/webhooks', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/google', googleRoutes);
app.use('/n8n', n8nRoutes);

// Use MCP routes if available
if (mcpRoutes) {
    app.use('/mcp', mcpRoutes);
    console.log('Playwright MCP routes loaded at /mcp');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            api: 'running',
            websocket: wsServer ? 'running' : 'stopped'
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'n8n Integration Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            webhooks: '/webhooks',
            api: '/api',
            google: '/google',
            n8n: '/n8n'
        }
    });
});

// WebSocket server for real-time communication
let wsServer = null;

function createWebSocketServer() {
    wsServer = new WebSocket.Server({ port: WS_PORT });

    wsServer.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        console.log(`New WebSocket connection from ${clientIp}`);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('Invalid WebSocket message:', error);
                ws.send(JSON.stringify({
                    error: 'Invalid message format'
                }));
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket connection closed from ${clientIp}`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to n8n Integration Server',
            timestamp: Date.now()
        }));
    });

    console.log(`WebSocket server running on port ${WS_PORT}`);
}

// Handle WebSocket messages
function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'n8n_workflow':
            triggerN8nWorkflow(data.workflow, data.payload)
                .then(result => {
                    ws.send(JSON.stringify({
                        type: 'workflow_result',
                        result: result
                    }));
                })
                .catch(error => {
                    ws.send(JSON.stringify({
                        type: 'workflow_error',
                        error: error.message
                    }));
                });
            break;

        case 'google_api':
            handleGoogleApiRequest(data.service, data.method, data.params)
                .then(result => {
                    ws.send(JSON.stringify({
                        type: 'google_result',
                        result: result
                    }));
                })
                .catch(error => {
                    ws.send(JSON.stringify({
                        type: 'google_error',
                        error: error.message
                    }));
                });
            break;

        case 'broadcast':
            // Broadcast to all connected clients
            wsServer.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'broadcast',
                        data: data.payload,
                        from: data.from || 'anonymous'
                    }));
                }
            });
            break;

        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`
            }));
    }
}

// Trigger n8n workflow
async function triggerN8nWorkflow(workflowId, payload) {
    const axios = require('axios');
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';

    try {
        const response = await axios.post(`${n8nUrl}/webhook/${workflowId}`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error triggering n8n workflow:', error);
        throw error;
    }
}

// Handle Google API requests
async function handleGoogleApiRequest(service, method, params) {
    // This would integrate with Google APIs
    // Implementation depends on specific Google services needed
    return {
        service,
        method,
        status: 'processed',
        timestamp: Date.now()
    };
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Start servers
app.listen(PORT, () => {
    console.log(`Integration server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}`);
});

createWebSocketServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');

    if (wsServer) {
        wsServer.clients.forEach(client => {
            client.close();
        });
        wsServer.close();
    }

    process.exit(0);
});

module.exports = app;