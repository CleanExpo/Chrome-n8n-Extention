/**
 * Google Document AI Client
 * OCR, document parsing, and intelligent document processing
 */

class GoogleDocumentAIClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.location = config.location || 'us';
        this.credentials = config.credentials;
        this.baseUrl = `https://${this.location}-documentai.googleapis.com/v1`;
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Process a document using a specific processor
     */
    async processDocument(processorId, document, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/processors/${processorId}:process`;

            let requestBody;

            if (typeof document === 'string') {
                // Document is base64 encoded or raw content
                requestBody = {
                    rawDocument: {
                        content: document,
                        mimeType: options.mimeType || 'application/pdf'
                    }
                };
            } else if (document.gcsUri) {
                // Document is stored in Google Cloud Storage
                requestBody = {
                    gcsDocument: {
                        gcsUri: document.gcsUri,
                        mimeType: options.mimeType || 'application/pdf'
                    }
                };
            } else {
                throw new Error('Invalid document format. Provide base64 content or GCS URI.');
            }

            if (options.fieldMask) {
                requestBody.fieldMask = options.fieldMask;
            }

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                document: response.document,
                humanReviewStatus: response.humanReviewStatus || null
            };
        } catch (error) {
            console.error('Document AI processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Batch process multiple documents
     */
    async batchProcessDocuments(processorId, inputDocuments, outputConfig, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/processors/${processorId}:batchProcess`;

            const requestBody = {
                inputDocuments: inputDocuments,
                documentOutputConfig: outputConfig,
                skipHumanReview: options.skipHumanReview || false
            };

            if (options.fieldMask) {
                requestBody.fieldMask = options.fieldMask;
            }

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
            console.error('Document AI batch processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract text from document using OCR
     */
    async extractText(document, options = {}) {
        try {
            // Use general form parser for text extraction
            const processorId = options.processorId || await this.getDefaultOCRProcessor();

            const result = await this.processDocument(processorId, document, options);

            if (result.success) {
                const extractedText = result.document.text || '';
                const pages = result.document.pages || [];
                const entities = result.document.entities || [];

                return {
                    success: true,
                    text: extractedText,
                    pages: pages.map(page => ({
                        pageNumber: page.pageNumber,
                        dimension: page.dimension,
                        layout: page.layout,
                        blocks: page.blocks || [],
                        paragraphs: page.paragraphs || [],
                        lines: page.lines || [],
                        tokens: page.tokens || []
                    })),
                    entities: entities.map(entity => ({
                        type: entity.type,
                        mentionText: entity.mentionText,
                        confidence: entity.confidence,
                        pageAnchor: entity.pageAnchor,
                        normalizedValue: entity.normalizedValue
                    }))
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('Text extraction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process forms and extract key-value pairs
     */
    async processForm(document, options = {}) {
        try {
            const processorId = options.processorId || await this.getFormProcessor();

            const result = await this.processDocument(processorId, document, options);

            if (result.success) {
                const formFields = [];

                if (result.document.pages) {
                    result.document.pages.forEach(page => {
                        if (page.formFields) {
                            page.formFields.forEach(field => {
                                formFields.push({
                                    fieldName: this.extractTextFromTextAnchor(field.fieldName, result.document.text),
                                    fieldValue: this.extractTextFromTextAnchor(field.fieldValue, result.document.text),
                                    confidence: field.fieldValue?.confidence || 0
                                });
                            });
                        }
                    });
                }

                return {
                    success: true,
                    formFields: formFields,
                    rawDocument: result.document
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('Form processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process invoices and extract structured data
     */
    async processInvoice(document, options = {}) {
        try {
            const processorId = options.processorId || await this.getInvoiceProcessor();

            const result = await this.processDocument(processorId, document, options);

            if (result.success && result.document.entities) {
                const invoiceData = {
                    invoiceId: null,
                    invoiceDate: null,
                    dueDate: null,
                    supplier: {},
                    receiver: {},
                    totalAmount: null,
                    currency: null,
                    lineItems: [],
                    taxInfo: []
                };

                result.document.entities.forEach(entity => {
                    switch (entity.type) {
                        case 'invoice_id':
                            invoiceData.invoiceId = entity.normalizedValue?.text || entity.mentionText;
                            break;
                        case 'invoice_date':
                            invoiceData.invoiceDate = entity.normalizedValue?.datetimeValue || entity.mentionText;
                            break;
                        case 'due_date':
                            invoiceData.dueDate = entity.normalizedValue?.datetimeValue || entity.mentionText;
                            break;
                        case 'supplier_name':
                            invoiceData.supplier.name = entity.mentionText;
                            break;
                        case 'supplier_address':
                            invoiceData.supplier.address = entity.mentionText;
                            break;
                        case 'receiver_name':
                            invoiceData.receiver.name = entity.mentionText;
                            break;
                        case 'receiver_address':
                            invoiceData.receiver.address = entity.mentionText;
                            break;
                        case 'total_amount':
                            invoiceData.totalAmount = entity.normalizedValue?.moneyValue || entity.mentionText;
                            break;
                        case 'currency':
                            invoiceData.currency = entity.mentionText;
                            break;
                    }
                });

                // Extract line items if available
                if (result.document.pages) {
                    result.document.pages.forEach(page => {
                        if (page.tables) {
                            page.tables.forEach(table => {
                                if (table.bodyRows) {
                                    table.bodyRows.forEach(row => {
                                        const lineItem = {};
                                        row.cells.forEach((cell, index) => {
                                            const cellText = this.extractTextFromTextAnchor(cell.layout, result.document.text);
                                            switch (index) {
                                                case 0:
                                                    lineItem.description = cellText;
                                                    break;
                                                case 1:
                                                    lineItem.quantity = cellText;
                                                    break;
                                                case 2:
                                                    lineItem.unitPrice = cellText;
                                                    break;
                                                case 3:
                                                    lineItem.amount = cellText;
                                                    break;
                                            }
                                        });
                                        if (Object.keys(lineItem).length > 0) {
                                            invoiceData.lineItems.push(lineItem);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                return {
                    success: true,
                    invoiceData: invoiceData,
                    rawDocument: result.document
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('Invoice processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process contracts and extract key terms
     */
    async processContract(document, options = {}) {
        try {
            const processorId = options.processorId || await this.getContractProcessor();

            const result = await this.processDocument(processorId, document, options);

            if (result.success && result.document.entities) {
                const contractData = {
                    parties: [],
                    effectiveDate: null,
                    expirationDate: null,
                    terms: [],
                    clauses: [],
                    signatures: []
                };

                result.document.entities.forEach(entity => {
                    switch (entity.type) {
                        case 'party':
                            contractData.parties.push(entity.mentionText);
                            break;
                        case 'effective_date':
                            contractData.effectiveDate = entity.normalizedValue?.datetimeValue || entity.mentionText;
                            break;
                        case 'expiration_date':
                            contractData.expirationDate = entity.normalizedValue?.datetimeValue || entity.mentionText;
                            break;
                        case 'contract_term':
                            contractData.terms.push({
                                term: entity.mentionText,
                                confidence: entity.confidence
                            });
                            break;
                        case 'clause':
                            contractData.clauses.push({
                                clause: entity.mentionText,
                                confidence: entity.confidence
                            });
                            break;
                    }
                });

                return {
                    success: true,
                    contractData: contractData,
                    rawDocument: result.document
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('Contract processing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List available processors
     */
    async listProcessors() {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/processors`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                processors: response.processors || []
            };
        } catch (error) {
            console.error('Failed to list processors:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new processor
     */
    async createProcessor(displayName, type, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/processors`;

            const requestBody = {
                processor: {
                    displayName: displayName,
                    type: type,
                    defaultProcessorVersion: options.defaultVersion || null
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                processor: response
            };
        } catch (error) {
            console.error('Failed to create processor:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get default OCR processor ID
     */
    async getDefaultOCRProcessor() {
        const processors = await this.listProcessors();
        if (processors.success) {
            const ocrProcessor = processors.processors.find(p => p.type === 'OCR_PROCESSOR');
            return ocrProcessor ? ocrProcessor.name.split('/').pop() : null;
        }
        return null;
    }

    /**
     * Get form processor ID
     */
    async getFormProcessor() {
        const processors = await this.listProcessors();
        if (processors.success) {
            const formProcessor = processors.processors.find(p => p.type === 'FORM_PARSER_PROCESSOR');
            return formProcessor ? formProcessor.name.split('/').pop() : null;
        }
        return null;
    }

    /**
     * Get invoice processor ID
     */
    async getInvoiceProcessor() {
        const processors = await this.listProcessors();
        if (processors.success) {
            const invoiceProcessor = processors.processors.find(p => p.type === 'INVOICE_PROCESSOR');
            return invoiceProcessor ? invoiceProcessor.name.split('/').pop() : null;
        }
        return null;
    }

    /**
     * Get contract processor ID
     */
    async getContractProcessor() {
        const processors = await this.listProcessors();
        if (processors.success) {
            const contractProcessor = processors.processors.find(p => p.type === 'CONTRACT_PROCESSOR');
            return contractProcessor ? contractProcessor.name.split('/').pop() : null;
        }
        return null;
    }

    /**
     * Extract text from text anchor
     */
    extractTextFromTextAnchor(textAnchor, documentText) {
        if (!textAnchor || !textAnchor.textSegments || !documentText) {
            return '';
        }

        let extractedText = '';
        textAnchor.textSegments.forEach(segment => {
            const startIndex = parseInt(segment.startIndex) || 0;
            const endIndex = parseInt(segment.endIndex) || documentText.length;
            extractedText += documentText.substring(startIndex, endIndex);
        });

        return extractedText.trim();
    }

    /**
     * Convert file to base64
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:mime/type;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Make authenticated request to Document AI API
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
            console.error('Document AI API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check for Document AI service
     */
    async healthCheck() {
        try {
            const result = await this.listProcessors();

            if (result.success) {
                return {
                    status: 'healthy',
                    service: 'Document AI',
                    location: this.location,
                    availableProcessors: result.processors.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Document AI',
                    message: result.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Document AI',
                message: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleDocumentAIClient;
} else {
    window.GoogleDocumentAIClient = GoogleDocumentAIClient;
}