/**
 * Google BigQuery API Client
 * Big data processing for n8n workflows
 */

class GoogleBigQueryClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.credentials = config.credentials;
        this.baseUrl = 'https://bigquery.googleapis.com/bigquery/v2';
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Execute a SQL query
     */
    async query(sql, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/queries`;

            const requestBody = {
                query: sql,
                useLegacySql: options.useLegacySql || false,
                useQueryCache: options.useQueryCache !== false,
                maximumBytesProcessed: options.maximumBytesProcessed || null,
                timeoutMs: options.timeoutMs || 30000,
                dryRun: options.dryRun || false,
                location: options.location || 'US',
                jobConfig: options.jobConfig || null,
                parameterMode: options.parameterMode || null,
                queryParameters: options.queryParameters || []
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                jobReference: response.jobReference,
                schema: response.schema,
                rows: response.rows || [],
                totalRows: response.totalRows,
                pageToken: response.pageToken,
                totalBytesProcessed: response.totalBytesProcessed,
                cacheHit: response.cacheHit,
                jobComplete: response.jobComplete
            };
        } catch (error) {
            console.error('BigQuery query failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a dataset
     */
    async createDataset(datasetId, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets`;

            const requestBody = {
                datasetReference: {
                    projectId: this.projectId,
                    datasetId: datasetId
                },
                friendlyName: options.friendlyName || datasetId,
                description: options.description || null,
                location: options.location || 'US',
                defaultTableExpirationMs: options.defaultTableExpirationMs || null,
                defaultPartitionExpirationMs: options.defaultPartitionExpirationMs || null,
                access: options.access || [{
                    role: 'OWNER',
                    userByEmail: options.ownerEmail || null
                }]
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                dataset: response
            };
        } catch (error) {
            console.error('Dataset creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a table
     */
    async createTable(datasetId, tableId, schema, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets/${datasetId}/tables`;

            const requestBody = {
                tableReference: {
                    projectId: this.projectId,
                    datasetId: datasetId,
                    tableId: tableId
                },
                friendlyName: options.friendlyName || tableId,
                description: options.description || null,
                schema: {
                    fields: schema
                },
                timePartitioning: options.timePartitioning || null,
                clustering: options.clustering || null,
                expirationTime: options.expirationTime || null
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                table: response
            };
        } catch (error) {
            console.error('Table creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Insert data into table
     */
    async insertData(datasetId, tableId, rows, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets/${datasetId}/tables/${tableId}/insertAll`;

            const requestBody = {
                rows: rows.map((row, index) => ({
                    insertId: options.generateInsertIds ? `${Date.now()}_${index}` : null,
                    json: row
                })),
                ignoreUnknownValues: options.ignoreUnknownValues || false,
                skipInvalidRows: options.skipInvalidRows || false,
                templateSuffix: options.templateSuffix || null
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                insertErrors: response.insertErrors || []
            };
        } catch (error) {
            console.error('Data insertion failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load data from Cloud Storage
     */
    async loadDataFromGCS(datasetId, tableId, sourceUris, options = {}) {
        try {
            const jobId = options.jobId || `load_${Date.now()}`;
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/jobs`;

            const requestBody = {
                jobReference: {
                    projectId: this.projectId,
                    jobId: jobId,
                    location: options.location || 'US'
                },
                configuration: {
                    load: {
                        destinationTable: {
                            projectId: this.projectId,
                            datasetId: datasetId,
                            tableId: tableId
                        },
                        sourceUris: Array.isArray(sourceUris) ? sourceUris : [sourceUris],
                        sourceFormat: options.sourceFormat || 'CSV',
                        createDisposition: options.createDisposition || 'CREATE_IF_NEEDED',
                        writeDisposition: options.writeDisposition || 'WRITE_APPEND',
                        skipLeadingRows: options.skipLeadingRows || 0,
                        fieldDelimiter: options.fieldDelimiter || ',',
                        allowQuotedNewlines: options.allowQuotedNewlines || false,
                        allowJaggedRows: options.allowJaggedRows || false,
                        ignoreUnknownValues: options.ignoreUnknownValues || false,
                        schema: options.schema || null,
                        autodetect: options.autodetect !== false
                    }
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                job: response,
                jobId: jobId
            };
        } catch (error) {
            console.error('Data loading from GCS failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export data to Cloud Storage
     */
    async exportDataToGCS(datasetId, tableId, destinationUri, options = {}) {
        try {
            const jobId = options.jobId || `export_${Date.now()}`;
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/jobs`;

            const requestBody = {
                jobReference: {
                    projectId: this.projectId,
                    jobId: jobId,
                    location: options.location || 'US'
                },
                configuration: {
                    extract: {
                        sourceTable: {
                            projectId: this.projectId,
                            datasetId: datasetId,
                            tableId: tableId
                        },
                        destinationUris: Array.isArray(destinationUri) ? destinationUri : [destinationUri],
                        destinationFormat: options.destinationFormat || 'CSV',
                        fieldDelimiter: options.fieldDelimiter || ',',
                        printHeader: options.printHeader !== false,
                        compression: options.compression || 'NONE'
                    }
                }
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                job: response,
                jobId: jobId
            };
        } catch (error) {
            console.error('Data export to GCS failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId, options = {}) {
        try {
            const location = options.location || 'US';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/jobs/${jobId}?location=${location}`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                job: response,
                status: response.status,
                statistics: response.statistics
            };
        } catch (error) {
            console.error('Failed to get job status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List datasets
     */
    async listDatasets(options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets`;

            const params = new URLSearchParams();
            if (options.maxResults) params.append('maxResults', options.maxResults);
            if (options.pageToken) params.append('pageToken', options.pageToken);
            if (options.filter) params.append('filter', options.filter);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                datasets: response.datasets || [],
                nextPageToken: response.nextPageToken
            };
        } catch (error) {
            console.error('Failed to list datasets:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List tables in dataset
     */
    async listTables(datasetId, options = {}) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets/${datasetId}/tables`;

            const params = new URLSearchParams();
            if (options.maxResults) params.append('maxResults', options.maxResults);
            if (options.pageToken) params.append('pageToken', options.pageToken);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                tables: response.tables || [],
                nextPageToken: response.nextPageToken
            };
        } catch (error) {
            console.error('Failed to list tables:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get table metadata
     */
    async getTable(datasetId, tableId) {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/datasets/${datasetId}/tables/${tableId}`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                table: response
            };
        } catch (error) {
            console.error('Failed to get table:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create ML model
     */
    async createMLModel(datasetId, modelId, sql, options = {}) {
        try {
            const createModelSQL = `
                CREATE OR REPLACE MODEL \`${this.projectId}.${datasetId}.${modelId}\`
                OPTIONS(
                    model_type='${options.modelType || 'linear_reg'}',
                    input_label_cols=['${options.labelColumn || 'label'}']
                ) AS
                ${sql}
            `;

            return await this.query(createModelSQL, options);
        } catch (error) {
            console.error('ML model creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make predictions with ML model
     */
    async predict(datasetId, modelId, sql, options = {}) {
        try {
            const predictSQL = `
                SELECT *
                FROM ML.PREDICT(MODEL \`${this.projectId}.${datasetId}.${modelId}\`,
                    (${sql})
                )
            `;

            return await this.query(predictSQL, options);
        } catch (error) {
            console.error('ML prediction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get query results
     */
    async getQueryResults(jobId, options = {}) {
        try {
            const location = options.location || 'US';
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/queries/${jobId}`;

            const params = new URLSearchParams();
            params.append('location', location);
            if (options.maxResults) params.append('maxResults', options.maxResults);
            if (options.pageToken) params.append('pageToken', options.pageToken);
            if (options.startIndex) params.append('startIndex', options.startIndex);
            if (options.timeoutMs) params.append('timeoutMs', options.timeoutMs);

            const url = `${endpoint}?${params}`;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                rows: response.rows || [],
                schema: response.schema,
                totalRows: response.totalRows,
                pageToken: response.pageToken,
                jobComplete: response.jobComplete,
                totalBytesProcessed: response.totalBytesProcessed
            };
        } catch (error) {
            console.error('Failed to get query results:', error);
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
            console.error('BigQuery API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const result = await this.listDatasets({ maxResults: 1 });

            if (result.success) {
                return {
                    status: 'healthy',
                    service: 'BigQuery',
                    availableDatasets: result.datasets.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'BigQuery',
                    message: result.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'BigQuery',
                message: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleBigQueryClient;
} else {
    window.GoogleBigQueryClient = GoogleBigQueryClient;
}