/**
 * Google Cloud Services Integration
 * Main integration file for all Google Cloud APIs
 */

class GoogleCloudIntegration {
    constructor() {
        this.initialized = false;
        this.clients = {};
        this.config = null;
        this.healthStatus = {};
    }

    /**
     * Initialize Google Cloud integration
     */
    async initialize(config) {
        try {
            this.config = {
                projectId: config.projectId,
                credentials: config.credentials || null,
                serviceAccount: config.serviceAccount || null,
                apiKey: config.apiKey || null,
                location: config.location || 'us-central1',
                organizationId: config.organizationId || null,
                enableLogging: config.enableLogging !== false,
                enableMetrics: config.enableMetrics !== false,
                ...config
            };

            // Initialize authentication manager
            await this.initializeAuthentication();

            // Initialize client factory
            await this.initializeClientFactory();

            // Initialize all Google Cloud clients
            await this.initializeClients();

            // Initialize middleware and webhook systems
            await this.initializeMiddleware();

            // Setup default event handlers
            this.setupEventHandlers();

            this.initialized = true;

            if (this.config.enableLogging) {
                console.log('Google Cloud Integration initialized successfully');
            }

            return {
                success: true,
                message: 'Google Cloud integration initialized',
                availableServices: Object.keys(this.clients)
            };
        } catch (error) {
            console.error('Google Cloud integration initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Initialize authentication
     */
    async initializeAuthentication() {
        if (typeof window.googleAuthManager === 'undefined') {
            throw new Error('Google Auth Manager not loaded');
        }

        // Initialize OAuth if client ID is provided
        if (this.config.clientId) {
            await window.googleAuthManager.initializeOAuth({
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
                scopes: this.config.scopes
            });
        }

        // Initialize service account if provided
        if (this.config.serviceAccount) {
            await window.googleAuthManager.initializeServiceAccount(this.config.serviceAccount);
        }

        // Set API key if provided
        if (this.config.apiKey) {
            window.googleAuthManager.setAPIKey(this.config.apiKey);
        }
    }

    /**
     * Initialize client factory
     */
    async initializeClientFactory() {
        if (typeof window.googleAPIClientFactory === 'undefined') {
            throw new Error('Google API Client Factory not loaded');
        }

        await window.googleAPIClientFactory.initialize({
            projectId: this.config.projectId,
            credentials: this.config.credentials
        });
    }

    /**
     * Initialize middleware
     */
    async initializeMiddleware() {
        if (typeof window.googleAPIMiddleware !== 'undefined') {
            // Configure middleware with project settings
            window.googleAPIMiddleware.config.enableLogging = this.config.enableLogging;
            window.googleAPIMiddleware.config.enableMetrics = this.config.enableMetrics;

            // Add project-specific interceptors
            window.googleAPIMiddleware.addRequestInterceptor(async (context) => {
                context.projectId = this.config.projectId;
                context.userAgent = `Chrome-Extension-n8n/${chrome.runtime.getManifest().version}`;
                return context;
            });
        }

        if (typeof window.googleWebhookHandler !== 'undefined') {
            // Configure webhook handler
            window.googleWebhookHandler.config.enableLogging = this.config.enableLogging;
        }
    }

    /**
     * Initialize all Google Cloud clients
     */
    async initializeClients() {
        const clientConfigs = [
            { name: 'vertexai', class: 'GoogleVertexAIClient', options: { location: this.config.location } },
            { name: 'documentai', class: 'GoogleDocumentAIClient', options: { location: 'us' } },
            { name: 'translate', class: 'GoogleTranslateClient', options: {} },
            { name: 'speech', class: 'GoogleSpeechClient', options: {} },
            { name: 'analytics', class: 'GoogleAnalyticsClient', options: {} },
            { name: 'bigquery', class: 'GoogleBigQueryClient', options: {} },
            { name: 'monitoring', class: 'GoogleMonitoringClient', options: {} }
        ];

        for (const clientConfig of clientConfigs) {
            try {
                if (typeof window[clientConfig.class] !== 'undefined') {
                    this.clients[clientConfig.name] = new window[clientConfig.class]({
                        projectId: this.config.projectId,
                        credentials: this.config.credentials,
                        authManager: window.googleAuthManager,
                        ...clientConfig.options
                    });

                    if (this.config.enableLogging) {
                        console.log(`Initialized ${clientConfig.name} client`);
                    }
                } else {
                    console.warn(`${clientConfig.class} not available`);
                }
            } catch (error) {
                console.error(`Failed to initialize ${clientConfig.name} client:`, error);
            }
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Extension-specific event handlers
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
                if (message.type === 'GOOGLE_CLOUD_API_CALL') {
                    const result = await this.handleAPICall(message.data);
                    sendResponse(result);
                    return true;
                }

                if (message.type === 'GOOGLE_CLOUD_HEALTH_CHECK') {
                    const result = await this.performHealthCheck();
                    sendResponse(result);
                    return true;
                }
            });
        }

        // Window message listener for content script communication
        if (typeof window !== 'undefined') {
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'GOOGLE_CLOUD_API_CALL') {
                    const result = await this.handleAPICall(event.data.payload);
                    window.postMessage({
                        type: 'GOOGLE_CLOUD_API_RESPONSE',
                        requestId: event.data.requestId,
                        result: result
                    }, '*');
                }
            });
        }
    }

    /**
     * Handle API calls from extension components
     */
    async handleAPICall(data) {
        try {
            if (!this.initialized) {
                throw new Error('Google Cloud integration not initialized');
            }

            const { service, method, params = {} } = data;

            if (!this.clients[service]) {
                throw new Error(`Service ${service} not available`);
            }

            const client = this.clients[service];

            if (typeof client[method] !== 'function') {
                throw new Error(`Method ${method} not available on ${service} service`);
            }

            // Execute API call with middleware if available
            let result;
            if (typeof window.googleAPIMiddleware !== 'undefined') {
                result = await window.googleAPIMiddleware.execute(
                    async (context) => {
                        return await client[method](...(params.args || []), params.options || {});
                    },
                    {
                        api: `${service}.${method}`,
                        service: service,
                        method: method,
                        params: params
                    }
                );
            } else {
                result = {
                    success: true,
                    data: await client[method](...(params.args || []), params.options || {}),
                    attempts: 1,
                    responseTime: 0
                };
            }

            return result;
        } catch (error) {
            console.error('Google Cloud API call failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Perform health check on all services
     */
    async performHealthCheck() {
        const healthChecks = {};

        // Check authentication status
        if (typeof window.googleAuthManager !== 'undefined') {
            healthChecks.authentication = window.googleAuthManager.getAuthStatus();
        }

        // Check client factory
        if (typeof window.googleAPIClientFactory !== 'undefined') {
            healthChecks.clientFactory = await window.googleAPIClientFactory.healthCheck();
        }

        // Check individual services
        for (const [serviceName, client] of Object.entries(this.clients)) {
            if (typeof client.healthCheck === 'function') {
                try {
                    healthChecks[serviceName] = await client.healthCheck();
                } catch (error) {
                    healthChecks[serviceName] = {
                        status: 'error',
                        service: serviceName,
                        message: error.message
                    };
                }
            }
        }

        // Check middleware
        if (typeof window.googleAPIMiddleware !== 'undefined') {
            healthChecks.middleware = {
                status: 'healthy',
                service: 'API Middleware',
                metrics: window.googleAPIMiddleware.getMetrics(),
                message: 'Middleware operational'
            };
        }

        // Check webhook handler
        if (typeof window.googleWebhookHandler !== 'undefined') {
            healthChecks.webhooks = window.googleWebhookHandler.healthCheck();
        }

        this.healthStatus = healthChecks;

        return {
            success: true,
            timestamp: new Date().toISOString(),
            overall: this.getOverallHealthStatus(healthChecks),
            services: healthChecks
        };
    }

    /**
     * Get overall health status
     */
    getOverallHealthStatus(healthChecks) {
        const statuses = Object.values(healthChecks).map(check => check.status);

        if (statuses.some(status => status === 'error')) {
            return 'degraded';
        } else if (statuses.every(status => status === 'healthy')) {
            return 'healthy';
        } else {
            return 'warning';
        }
    }

    /**
     * Get service client
     */
    getClient(serviceName) {
        if (!this.initialized) {
            throw new Error('Google Cloud integration not initialized');
        }

        return this.clients[serviceName] || null;
    }

    /**
     * List available services
     */
    getAvailableServices() {
        return Object.keys(this.clients);
    }

    /**
     * Get configuration
     */
    getConfig() {
        return {
            projectId: this.config.projectId,
            location: this.config.location,
            availableServices: this.getAvailableServices(),
            initialized: this.initialized
        };
    }

    /**
     * Enhanced AI workflow helper
     */
    async processWithAI(input, options = {}) {
        try {
            const workflow = {
                input: input,
                steps: [],
                results: {}
            };

            // Step 1: Analyze input with Vertex AI
            if (this.clients.vertexai && options.useVertexAI !== false) {
                workflow.steps.push('vertex_ai_analysis');
                const analysis = await this.clients.vertexai.generateText(
                    `Analyze the following input and suggest the best Google Cloud services to process it:\n\n${input}`,
                    { temperature: 0.3, maxTokens: 500 }
                );
                workflow.results.analysis = analysis;
            }

            // Step 2: Document processing if file detected
            if (this.clients.documentai && options.processDocuments !== false) {
                // Check if input contains document references
                if (input.toLowerCase().includes('document') || input.toLowerCase().includes('file')) {
                    workflow.steps.push('document_ai_processing');
                    // Would process documents here with actual file data
                }
            }

            // Step 3: Translation if needed
            if (this.clients.translate && options.detectLanguage !== false) {
                workflow.steps.push('language_detection');
                const langDetection = await this.clients.translate.detectLanguage(input);
                workflow.results.language = langDetection;

                if (langDetection.success && langDetection.languages[0]?.languageCode !== 'en') {
                    workflow.steps.push('translation');
                    const translation = await this.clients.translate.translateText(input, 'en');
                    workflow.results.translation = translation;
                }
            }

            // Step 4: Analytics if requested
            if (this.clients.analytics && options.analytics !== false) {
                // Would perform analytics operations here
            }

            // Step 5: Generate final response
            if (this.clients.vertexai) {
                const context = JSON.stringify(workflow.results, null, 2);
                const finalResponse = await this.clients.vertexai.generateText(
                    `Based on this analysis: ${context}\n\nProvide a comprehensive response to: ${input}`,
                    { temperature: 0.7, maxTokens: 1000 }
                );
                workflow.results.finalResponse = finalResponse;
            }

            return {
                success: true,
                workflow: workflow,
                response: workflow.results.finalResponse?.text || 'Processing completed'
            };
        } catch (error) {
            console.error('AI workflow processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const googleCloudIntegration = new GoogleCloudIntegration();

// Auto-initialize if configuration is available
if (typeof window !== 'undefined' && window.GOOGLE_CLOUD_CONFIG) {
    googleCloudIntegration.initialize(window.GOOGLE_CLOUD_CONFIG);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleCloudIntegration, googleCloudIntegration };
} else {
    window.GoogleCloudIntegration = GoogleCloudIntegration;
    window.googleCloudIntegration = googleCloudIntegration;
}