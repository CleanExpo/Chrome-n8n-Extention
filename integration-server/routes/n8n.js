const express = require('express');
const axios = require('axios');
const router = express.Router();

// n8n workflow trigger endpoint
router.post('/trigger/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const payload = req.body;

        // Get n8n URL from headers or environment
        const n8nUrl = req.headers['x-n8n-url'] || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';

        // Include OpenAI key in payload if provided
        if (req.headers['x-openai-key'] || payload.openaiKey) {
            payload.openaiKey = req.headers['x-openai-key'] || payload.openaiKey;
        }
        
        console.log(`Triggering n8n workflow ${workflowId}:`, payload);
        
        // Trigger n8n workflow
        try {
            const response = await axios.post(`${n8nUrl}/webhook/${workflowId}`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            res.json({
                success: true,
                message: 'Workflow triggered successfully',
                timestamp: new Date().toISOString(),
                workflowId: workflowId,
                result: response.data
            });
        } catch (n8nError) {
            console.error('n8n workflow error:', n8nError.message);
            res.json({
                success: false,
                message: 'Workflow trigger failed (n8n may not be running)',
                timestamp: new Date().toISOString(),
                workflowId: workflowId,
                error: n8nError.message,
                mockResponse: {
                    message: 'Mock response - n8n server not available',
                    workflowId: workflowId,
                    payload: payload
                }
            });
        }
    } catch (error) {
        console.error('n8n trigger error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// n8n workflow status endpoint
router.get('/workflow/:workflowId/status', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
        
        console.log(`Checking status for workflow ${workflowId}`);
        
        // Mock workflow status (would integrate with n8n API)
        const result = {
            success: true,
            workflowId: workflowId,
            timestamp: new Date().toISOString(),
            status: {
                active: true,
                lastExecution: new Date(Date.now() - 60000).toISOString(),
                executionCount: 42,
                health: 'healthy'
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('n8n status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List available workflows
router.get('/workflows', async (req, res) => {
    try {
        const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
        
        console.log('Fetching available workflows');
        
        // Mock workflow list (would integrate with n8n API)
        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            workflows: [
                {
                    id: 'chrome-extension-handler',
                    name: 'Chrome Extension Handler',
                    description: 'Processes Chrome extension data',
                    active: true
                },
                {
                    id: 'screenshot-processor',
                    name: 'Screenshot Processor',
                    description: 'Analyzes and processes screenshots',
                    active: true
                },
                {
                    id: 'form-auto-fill',
                    name: 'Form Auto-Fill',
                    description: 'Automatically fills web forms',
                    active: true
                }
            ]
        };
        
        res.json(result);
    } catch (error) {
        console.error('n8n workflows error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// n8n service status
router.get('/status', (req, res) => {
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';

    res.json({
        status: 'operational',
        service: 'n8n-integration',
        timestamp: new Date().toISOString(),
        config: {
            n8nUrl: n8nUrl,
            endpoints: {
                trigger: '/n8n/trigger/:workflowId',
                status: '/n8n/workflow/:workflowId/status',
                workflows: '/n8n/workflows',
                connections: '/n8n/connections'
            }
        }
    });
});

// API connections status
router.get('/connections', async (req, res) => {
    // Get API keys from headers (sent by extension) or environment
    const n8nUrl = req.headers['x-n8n-url'] || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
    const googleApiKey = req.headers['x-google-key'] || process.env.GOOGLE_API_KEY;
    const openAiKey = req.headers['x-openai-key'] || process.env.OPENAI_API_KEY;

    // Check n8n connection
    let n8nStatus = {
        service: 'n8n',
        status: 'disconnected',
        url: n8nUrl,
        lastCheck: new Date().toISOString()
    };

    try {
        const response = await axios.get(`${n8nUrl}/healthz`, { timeout: 5000 });
        n8nStatus.status = response.status === 200 ? 'connected' : 'error';
    } catch (error) {
        n8nStatus.status = 'disconnected';
        n8nStatus.error = error.message;
    }

    // Check WebSocket connection
    const wsStatus = {
        service: 'websocket',
        status: global.wsServer && global.wsServer.clients ? 'connected' : 'disconnected',
        port: process.env.WS_PORT || 8766,
        clients: global.wsServer ? global.wsServer.clients.size : 0
    };

    // Check Google API
    const googleStatus = {
        service: 'google',
        status: googleApiKey ? 'configured' : 'not_configured',
        features: ['sheets', 'drive', 'calendar', 'gmail']
    };

    // Check OpenAI API
    const openAiStatus = {
        service: 'openai',
        status: openAiKey ? 'configured' : 'not_configured',
        model: 'gpt-4'
    };

    // Overall health
    const allConnected =
        n8nStatus.status === 'connected' &&
        wsStatus.status === 'connected' &&
        googleStatus.status === 'configured';

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        overall: allConnected ? 'healthy' : 'degraded',
        connections: {
            n8n: n8nStatus,
            websocket: wsStatus,
            google: googleStatus,
            openai: openAiStatus
        },
        statistics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeConnections: wsStatus.clients
        }
    });
});

module.exports = router;
