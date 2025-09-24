/**
 * Google Cloud API Client Factory
 * Centralized management for all Google Cloud API clients
 */

class GoogleAPIClientFactory {
    constructor() {
        this.clients = new Map();
        this.credentials = null;
        this.projectId = null;
        this.initialized = false;
    }

    /**
     * Initialize the factory with credentials and project settings
     */
    async initialize(config) {
        try {
            this.projectId = config.projectId;
            this.credentials = config.credentials;

            // Validate required configuration
            if (!this.projectId) {
                throw new Error('Project ID is required for Google Cloud API integration');
            }

            if (!this.credentials) {
                throw new Error('Credentials are required for Google Cloud API integration');
            }

            this.initialized = true;
            console.log('Google API Client Factory initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Google API Client Factory:', error);
            throw error;
        }
    }

    /**
     * Create or get a client for a specific Google service
     */
    async createClient(serviceName, options = {}) {
        if (!this.initialized) {
            throw new Error('GoogleAPIClientFactory must be initialized before creating clients');
        }

        const clientKey = `${serviceName}_${JSON.stringify(options)}`;

        if (this.clients.has(clientKey)) {
            return this.clients.get(clientKey);
        }

        let client;

        switch (serviceName) {
            case 'vertexai':
                client = await this.createVertexAIClient(options);
                break;
            case 'documentai':
                client = await this.createDocumentAIClient(options);
                break;
            case 'translate':
                client = await this.createTranslateClient(options);
                break;
            case 'speech':
                client = await this.createSpeechClient(options);
                break;
            case 'texttospeech':
                client = await this.createTextToSpeechClient(options);
                break;
            case 'analytics':
                client = await this.createAnalyticsClient(options);
                break;
            case 'bigquery':
                client = await this.createBigQueryClient(options);
                break;
            case 'monitoring':
                client = await this.createMonitoringClient(options);
                break;
            case 'securitycenter':
                client = await this.createSecurityCenterClient(options);
                break;
            default:
                throw new Error(`Unsupported service: ${serviceName}`);
        }

        this.clients.set(clientKey, client);
        return client;
    }

    /**
     * Create Vertex AI client
     */
    async createVertexAIClient(options) {
        return new GoogleVertexAIClient({
            projectId: this.projectId,
            credentials: this.credentials,
            location: options.location || 'us-central1',
            ...options
        });
    }

    /**
     * Create Document AI client
     */
    async createDocumentAIClient(options) {
        return new GoogleDocumentAIClient({
            projectId: this.projectId,
            credentials: this.credentials,
            location: options.location || 'us',
            ...options
        });
    }

    /**
     * Create Translation client
     */
    async createTranslateClient(options) {
        return new GoogleTranslateClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create Speech-to-Text client
     */
    async createSpeechClient(options) {
        return new GoogleSpeechClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create Text-to-Speech client
     */
    async createTextToSpeechClient(options) {
        return new GoogleTextToSpeechClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create Analytics Reporting client
     */
    async createAnalyticsClient(options) {
        return new GoogleAnalyticsClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create BigQuery client
     */
    async createBigQueryClient(options) {
        return new GoogleBigQueryClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create Cloud Monitoring client
     */
    async createMonitoringClient(options) {
        return new GoogleMonitoringClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Create Security Command Center client
     */
    async createSecurityCenterClient(options) {
        return new GoogleSecurityCenterClient({
            projectId: this.projectId,
            credentials: this.credentials,
            ...options
        });
    }

    /**
     * Get all active clients
     */
    getActiveClients() {
        return Array.from(this.clients.keys());
    }

    /**
     * Clear all cached clients
     */
    clearClients() {
        this.clients.clear();
    }

    /**
     * Health check for the factory
     */
    async healthCheck() {
        try {
            if (!this.initialized) {
                return { status: 'error', message: 'Factory not initialized' };
            }

            // Test basic authentication
            const testClient = await this.createClient('translate');
            if (!testClient) {
                return { status: 'error', message: 'Failed to create test client' };
            }

            return {
                status: 'healthy',
                projectId: this.projectId,
                activeClients: this.getActiveClients().length,
                message: 'All systems operational'
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

// Singleton instance
const googleAPIClientFactory = new GoogleAPIClientFactory();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleAPIClientFactory, googleAPIClientFactory };
} else {
    window.GoogleAPIClientFactory = GoogleAPIClientFactory;
    window.googleAPIClientFactory = googleAPIClientFactory;
}