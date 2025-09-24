/**
 * Google Cloud Translation API Client
 * Real-time and batch translation services
 */

class GoogleTranslateClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.location = config.location || 'global';
        this.credentials = config.credentials;
        this.baseUrl = 'https://translation.googleapis.com/v3';
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Translate text
     */
    async translateText(text, targetLanguage, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}:translateText`;

            const requestBody = {
                contents: Array.isArray(text) ? text : [text],
                targetLanguageCode: targetLanguage,
                sourceLanguageCode: options.sourceLanguage || null,
                mimeType: options.mimeType || 'text/plain',
                model: options.model || null,
                glossaryConfig: options.glossaryConfig || null
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                translations: response.translations.map(t => ({
                    translatedText: t.translatedText,
                    detectedLanguageCode: t.detectedLanguageCode,
                    glossaryConfig: t.glossaryConfig,
                    model: t.model
                }))
            };
        } catch (error) {
            console.error('Translation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect language
     */
    async detectLanguage(text) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}:detectLanguage`;

            const requestBody = {
                content: text,
                mimeType: 'text/plain'
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                languages: response.languages.map(lang => ({
                    languageCode: lang.languageCode,
                    confidence: lang.confidence
                }))
            };
        } catch (error) {
            console.error('Language detection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get supported languages
     */
    async getSupportedLanguages(options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/supportedLanguages`;

            const params = new URLSearchParams();
            if (options.displayLanguageCode) {
                params.append('displayLanguageCode', options.displayLanguageCode);
            }
            if (options.model) {
                params.append('model', options.model);
            }

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                languages: response.languages.map(lang => ({
                    languageCode: lang.languageCode,
                    displayName: lang.displayName,
                    supportSource: lang.supportSource,
                    supportTarget: lang.supportTarget
                }))
            };
        } catch (error) {
            console.error('Failed to get supported languages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Translate document
     */
    async translateDocument(document, targetLanguage, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}:translateDocument`;

            const requestBody = {
                documentInputConfig: {
                    content: document.content || null,
                    gcsSource: document.gcsUri ? { inputUri: document.gcsUri } : null,
                    mimeType: document.mimeType || 'application/pdf'
                },
                targetLanguageCode: targetLanguage,
                sourceLanguageCode: options.sourceLanguage || null,
                documentOutputConfig: options.outputConfig || null,
                model: options.model || null,
                glossaryConfig: options.glossaryConfig || null
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                documentTranslation: response.documentTranslation,
                glossaryDocumentTranslation: response.glossaryDocumentTranslation,
                model: response.model
            };
        } catch (error) {
            console.error('Document translation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Batch translate documents
     */
    async batchTranslateDocument(inputConfigs, outputConfig, targetLanguages, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}:batchTranslateDocument`;

            const requestBody = {
                parent: `projects/${this.projectId}/locations/${this.location}`,
                sourceLanguageCode: options.sourceLanguage || 'auto',
                targetLanguageCodes: Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages],
                inputConfigs: inputConfigs,
                outputConfig: outputConfig,
                models: options.models || {},
                glossaries: options.glossaries || {},
                formatConversions: options.formatConversions || {}
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                operation: response.name,
                operationDetails: response
            };
        } catch (error) {
            console.error('Batch document translation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create glossary
     */
    async createGlossary(name, inputConfig, languagePair) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/glossaries`;

            const requestBody = {
                name: `projects/${this.projectId}/locations/${this.location}/glossaries/${name}`,
                languageCodesSet: languagePair ? null : undefined,
                languagePair: languagePair || null,
                inputConfig: inputConfig
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ glossary: requestBody })
            });

            return {
                success: true,
                operation: response.name,
                glossary: response
            };
        } catch (error) {
            console.error('Glossary creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List glossaries
     */
    async listGlossaries() {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/glossaries`;

            const response = await this.makeRequest(endpoint, { method: 'GET' });

            return {
                success: true,
                glossaries: response.glossaries || []
            };
        } catch (error) {
            console.error('Failed to list glossaries:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make authenticated request
     */
    async makeRequest(url, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...await this.authManager.getAuthHeaders()
            };

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Translation API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const result = await this.getSupportedLanguages();

            if (result.success) {
                return {
                    status: 'healthy',
                    service: 'Cloud Translation',
                    location: this.location,
                    supportedLanguages: result.languages.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Cloud Translation',
                    message: result.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Cloud Translation',
                message: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleTranslateClient;
} else {
    window.GoogleTranslateClient = GoogleTranslateClient;
}