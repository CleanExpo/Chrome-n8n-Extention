const express = require('express');
const router = express.Router();

// API endpoints for Chrome extension communication
router.post('/screenshot', async (req, res) => {
    try {
        const { screenshot, metadata } = req.body;
        
        console.log('Received screenshot data:', {
            size: screenshot ? screenshot.length : 0,
            metadata: metadata
        });
        
        // Process screenshot
        const result = {
            success: true,
            message: 'Screenshot processed successfully',
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        res.json(result);
    } catch (error) {
        console.error('Screenshot API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Content extraction endpoint
router.post('/extract-content', async (req, res) => {
    try {
        const { url, content, forms } = req.body;
        
        console.log('Received content extraction:', {
            url: url,
            contentLength: content ? content.length : 0,
            formsCount: forms ? forms.length : 0
        });
        
        // Process extracted content
        const result = {
            success: true,
            message: 'Content extracted successfully',
            timestamp: new Date().toISOString(),
            data: {
                url: url,
                contentLength: content ? content.length : 0,
                formsCount: forms ? forms.length : 0
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('Content extraction API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Chat message endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        console.log('Received chat message:', {
            message: message,
            context: context
        });
        
        // Process chat message (integrate with AI assistant)
        const result = {
            success: true,
            response: 'Message received and processed',
            timestamp: new Date().toISOString(),
            data: {
                originalMessage: message,
                context: context
            }
        };
        
        res.json(result);
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Form auto-fill endpoint
router.post('/auto-fill', async (req, res) => {
    try {
        const { forms, context } = req.body;
        
        console.log('Received auto-fill request:', {
            formsCount: forms ? forms.length : 0,
            context: context
        });
        
        // Process form auto-fill
        const result = {
            success: true,
            message: 'Forms processed for auto-fill',
            timestamp: new Date().toISOString(),
            suggestions: forms ? forms.map(form => ({
                formId: form.id || 'unknown',
                fields: form.fields ? form.fields.length : 0,
                suggested: true
            })) : []
        };
        
        res.json(result);
    } catch (error) {
        console.error('Auto-fill API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Status endpoint
router.get('/status', (req, res) => {
    res.json({
        status: 'operational',
        service: 'api',
        timestamp: new Date().toISOString(),
        endpoints: {
            screenshot: '/api/screenshot',
            extractContent: '/api/extract-content',
            chat: '/api/chat',
            autoFill: '/api/auto-fill'
        }
    });
});

module.exports = router;
