/**
 * Google Vertex AI Platform Client
 * Advanced AI capabilities beyond Gemini
 */

class GoogleVertexAIClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.location = config.location || 'us-central1';
        this.credentials = config.credentials;
        this.baseUrl = `https://${this.location}-aiplatform.googleapis.com/v1`;
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Generate text using PaLM models
     */
    async generateText(prompt, options = {}) {
        try {
            const model = options.model || 'text-bison@001';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const requestBody = {
                instances: [{
                    prompt: prompt
                }],
                parameters: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 256,
                    topK: options.topK || 40,
                    topP: options.topP || 0.95,
                    candidateCount: options.candidateCount || 1
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                text: response.predictions[0]?.content || '',
                safetyRatings: response.predictions[0]?.safetyRatings || [],
                citationMetadata: response.predictions[0]?.citationMetadata || null
            };
        } catch (error) {
            console.error('Vertex AI text generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate chat responses using chat-bison model
     */
    async generateChat(messages, options = {}) {
        try {
            const model = options.model || 'chat-bison@001';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const requestBody = {
                instances: [{
                    context: options.context || '',
                    examples: options.examples || [],
                    messages: messages
                }],
                parameters: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 256,
                    topK: options.topK || 40,
                    topP: options.topP || 0.95
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                candidates: response.predictions[0]?.candidates || [],
                safetyRatings: response.predictions[0]?.safetyRatings || []
            };
        } catch (error) {
            console.error('Vertex AI chat generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate code using Codey models
     */
    async generateCode(prompt, options = {}) {
        try {
            const model = options.model || 'code-bison@001';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const requestBody = {
                instances: [{
                    prefix: prompt
                }],
                parameters: {
                    temperature: options.temperature || 0.2,
                    maxOutputTokens: options.maxTokens || 1024,
                    candidateCount: options.candidateCount || 1
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                code: response.predictions[0]?.content || '',
                safetyRatings: response.predictions[0]?.safetyRatings || []
            };
        } catch (error) {
            console.error('Vertex AI code generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Complete code using code-gecko model
     */
    async completeCode(prefix, suffix = '', options = {}) {
        try {
            const model = options.model || 'code-gecko@001';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const requestBody = {
                instances: [{
                    prefix: prefix,
                    suffix: suffix
                }],
                parameters: {
                    temperature: options.temperature || 0.2,
                    maxOutputTokens: options.maxTokens || 64,
                    candidateCount: options.candidateCount || 1
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                completions: response.predictions || [],
                safetyRatings: response.predictions[0]?.safetyRatings || []
            };
        } catch (error) {
            console.error('Vertex AI code completion failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate embeddings for text
     */
    async generateEmbeddings(texts, options = {}) {
        try {
            const model = options.model || 'textembedding-gecko@001';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const instances = Array.isArray(texts)
                ? texts.map(text => ({ content: text }))
                : [{ content: texts }];

            const requestBody = {
                instances: instances
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                embeddings: response.predictions.map(pred => pred.embeddings.values),
                statistics: response.predictions.map(pred => pred.embeddings.statistics)
            };
        } catch (error) {
            console.error('Vertex AI embeddings generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate images using Imagen model
     */
    async generateImage(prompt, options = {}) {
        try {
            const model = options.model || 'imagegeneration@002';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

            const requestBody = {
                instances: [{
                    prompt: prompt
                }],
                parameters: {
                    sampleCount: options.sampleCount || 1,
                    aspectRatio: options.aspectRatio || '1:1',
                    safetyFilterLevel: options.safetyFilterLevel || 'block_some',
                    personGeneration: options.personGeneration || 'dont_allow'
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                images: response.predictions.map(pred => ({
                    bytesBase64Encoded: pred.bytesBase64Encoded,
                    mimeType: pred.mimeType || 'image/png'
                }))
            };
        } catch (error) {
            console.error('Vertex AI image generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a custom model endpoint
     */
    async createEndpoint(displayName, model, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/endpoints`;

            const requestBody = {
                displayName: displayName,
                deployedModels: [{
                    model: model,
                    displayName: options.deployedModelDisplayName || displayName,
                    dedicatedResources: {
                        machineSpec: {
                            machineType: options.machineType || 'n1-standard-2'
                        },
                        minReplicaCount: options.minReplicas || 1,
                        maxReplicaCount: options.maxReplicas || 1
                    }
                }]
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                operation: response.name,
                endpoint: response
            };
        } catch (error) {
            console.error('Vertex AI endpoint creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List available models
     */
    async listModels() {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                models: response.models || []
            };
        } catch (error) {
            console.error('Vertex AI model listing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Batch prediction for large datasets
     */
    async batchPredict(model, inputUri, outputUri, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/batchPredictionJobs`;

            const requestBody = {
                displayName: options.displayName || `Batch prediction ${Date.now()}`,
                model: `projects/${this.projectId}/locations/${this.location}/models/${model}`,
                inputConfig: {
                    instancesFormat: options.inputFormat || 'jsonl',
                    gcsSource: {
                        uris: [inputUri]
                    }
                },
                outputConfig: {
                    predictionsFormat: options.outputFormat || 'jsonl',
                    gcsDestination: {
                        outputUriPrefix: outputUri
                    }
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                jobName: response.name,
                job: response
            };
        } catch (error) {
            console.error('Vertex AI batch prediction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make authenticated request to Vertex AI API
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
            console.error('Vertex AI API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check for Vertex AI service
     */
    async healthCheck() {
        try {
            const result = await this.listModels();

            if (result.success) {
                return {
                    status: 'healthy',
                    service: 'Vertex AI',
                    location: this.location,
                    availableModels: result.models.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Vertex AI',
                    message: result.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Vertex AI',
                message: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleVertexAIClient;
} else {
    window.GoogleVertexAIClient = GoogleVertexAIClient;
}