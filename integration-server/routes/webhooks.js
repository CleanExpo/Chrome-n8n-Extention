const express = require('express');
const router = express.Router();

// Webhook endpoint for n8n workflows
router.post('/n8n/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const payload = req.body;
        
        console.log(`Received webhook for workflow ${workflowId}:`, payload);
        
        // Process webhook payload
        const result = {
            success: true,
            workflowId: workflowId,
            timestamp: new Date().toISOString(),
            data: payload
        };
        
        res.json(result);
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generic webhook endpoint
router.post('/:service', async (req, res) => {
    try {
        const { service } = req.params;
        const payload = req.body;
        
        console.log(`Received webhook for ${service}:`, payload);
        
        // Process generic webhook
        const result = {
            success: true,
            service: service,
            timestamp: new Date().toISOString(),
            data: payload
        };
        
        res.json(result);
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check for webhooks
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'webhooks',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
