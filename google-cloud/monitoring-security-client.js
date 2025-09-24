/**
 * Google Cloud Monitoring and Security Command Center Client
 * Production monitoring and enterprise security
 */

class GoogleMonitoringClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.credentials = config.credentials;
        this.monitoringUrl = 'https://monitoring.googleapis.com/v3';
        this.securityUrl = 'https://securitycenter.googleapis.com/v1';
        this.authManager = config.authManager || window.googleAuthManager;
    }

    // ============ CLOUD MONITORING METHODS ============

    /**
     * List metric descriptors
     */
    async listMetricDescriptors(filter = null) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/metricDescriptors`;

            const params = new URLSearchParams();
            if (filter) params.append('filter', filter);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                metricDescriptors: response.metricDescriptors || []
            };
        } catch (error) {
            console.error('Failed to list metric descriptors:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create custom metric
     */
    async createCustomMetric(metricDescriptor) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/metricDescriptors`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(metricDescriptor)
            });

            return {
                success: true,
                metricDescriptor: response
            };
        } catch (error) {
            console.error('Failed to create custom metric:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write time series data
     */
    async writeTimeSeries(timeSeries) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/timeSeries`;

            const requestBody = {
                timeSeries: Array.isArray(timeSeries) ? timeSeries : [timeSeries]
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                result: response
            };
        } catch (error) {
            console.error('Failed to write time series:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Read time series data
     */
    async readTimeSeries(filter, interval, options = {}) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/timeSeries`;

            const params = new URLSearchParams();
            params.append('filter', filter);
            params.append('interval.endTime', interval.endTime || new Date().toISOString());
            if (interval.startTime) params.append('interval.startTime', interval.startTime);
            if (options.aggregation) params.append('aggregation', JSON.stringify(options.aggregation));
            if (options.view) params.append('view', options.view);

            const url = `${endpoint}?${params}`;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                timeSeries: response.timeSeries || [],
                nextPageToken: response.nextPageToken
            };
        } catch (error) {
            console.error('Failed to read time series:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create alert policy
     */
    async createAlertPolicy(alertPolicy) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/alertPolicies`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(alertPolicy)
            });

            return {
                success: true,
                alertPolicy: response
            };
        } catch (error) {
            console.error('Failed to create alert policy:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List alert policies
     */
    async listAlertPolicies(filter = null) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/alertPolicies`;

            const params = new URLSearchParams();
            if (filter) params.append('filter', filter);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                alertPolicies: response.alertPolicies || []
            };
        } catch (error) {
            console.error('Failed to list alert policies:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create notification channel
     */
    async createNotificationChannel(notificationChannel) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/notificationChannels`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(notificationChannel)
            });

            return {
                success: true,
                notificationChannel: response
            };
        } catch (error) {
            console.error('Failed to create notification channel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get uptime check config
     */
    async listUptimeCheckConfigs() {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/uptimeCheckConfigs`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                uptimeCheckConfigs: response.uptimeCheckConfigs || []
            };
        } catch (error) {
            console.error('Failed to list uptime check configs:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create uptime check
     */
    async createUptimeCheck(config) {
        try {
            const endpoint = `${this.monitoringUrl}/projects/${this.projectId}/uptimeCheckConfigs`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(config)
            });

            return {
                success: true,
                uptimeCheckConfig: response
            };
        } catch (error) {
            console.error('Failed to create uptime check:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============ SECURITY COMMAND CENTER METHODS ============

    /**
     * List findings
     */
    async listFindings(parent = null, options = {}) {
        try {
            const orgParent = parent || `organizations/${options.organizationId || 'YOUR_ORG_ID'}`;
            const endpoint = `${this.securityUrl}/${orgParent}/sources/-/findings`;

            const params = new URLSearchParams();
            if (options.filter) params.append('filter', options.filter);
            if (options.orderBy) params.append('orderBy', options.orderBy);
            if (options.pageSize) params.append('pageSize', options.pageSize);
            if (options.pageToken) params.append('pageToken', options.pageToken);
            if (options.readTime) params.append('readTime', options.readTime);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                findings: response.listFindingsResults || [],
                nextPageToken: response.nextPageToken,
                readTime: response.readTime
            };
        } catch (error) {
            console.error('Failed to list findings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List assets
     */
    async listAssets(parent = null, options = {}) {
        try {
            const orgParent = parent || `organizations/${options.organizationId || 'YOUR_ORG_ID'}`;
            const endpoint = `${this.securityUrl}/${orgParent}/assets`;

            const params = new URLSearchParams();
            if (options.filter) params.append('filter', options.filter);
            if (options.orderBy) params.append('orderBy', options.orderBy);
            if (options.pageSize) params.append('pageSize', options.pageSize);
            if (options.pageToken) params.append('pageToken', options.pageToken);
            if (options.readTime) params.append('readTime', options.readTime);

            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            const response = await this.makeRequest(url, { method: 'GET' });

            return {
                success: true,
                assets: response.listAssetsResults || [],
                nextPageToken: response.nextPageToken,
                readTime: response.readTime
            };
        } catch (error) {
            console.error('Failed to list assets:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create finding
     */
    async createFinding(parent, findingId, finding) {
        try {
            const endpoint = `${this.securityUrl}/${parent}/findings?findingId=${findingId}`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(finding)
            });

            return {
                success: true,
                finding: response
            };
        } catch (error) {
            console.error('Failed to create finding:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update finding state
     */
    async updateFindingState(findingName, state, startTime = null) {
        try {
            const endpoint = `${this.securityUrl}/${findingName}:setState`;

            const requestBody = {
                state: state, // ACTIVE, INACTIVE
                startTime: startTime || new Date().toISOString()
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                finding: response
            };
        } catch (error) {
            console.error('Failed to update finding state:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get organization settings
     */
    async getOrganizationSettings(organizationId) {
        try {
            const endpoint = `${this.securityUrl}/organizations/${organizationId}/organizationSettings`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                organizationSettings: response
            };
        } catch (error) {
            console.error('Failed to get organization settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Run asset discovery
     */
    async runAssetDiscovery(parent) {
        try {
            const endpoint = `${this.securityUrl}/${parent}:runAssetDiscovery`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({})
            });

            return {
                success: true,
                operation: response
            };
        } catch (error) {
            console.error('Failed to run asset discovery:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============ HELPER METHODS ============

    /**
     * Create Chrome extension monitoring metrics
     */
    async createExtensionMetrics() {
        const metrics = [
            {
                type: 'custom.googleapis.com/chrome_extension/api_calls',
                displayName: 'Chrome Extension API Calls',
                description: 'Number of API calls made by Chrome extension',
                metricKind: 'CUMULATIVE',
                valueType: 'INT64',
                labels: [
                    { key: 'api_name', valueType: 'STRING', description: 'Name of the API called' },
                    { key: 'status', valueType: 'STRING', description: 'Success or error status' }
                ]
            },
            {
                type: 'custom.googleapis.com/chrome_extension/user_interactions',
                displayName: 'Chrome Extension User Interactions',
                description: 'Number of user interactions with extension',
                metricKind: 'CUMULATIVE',
                valueType: 'INT64',
                labels: [
                    { key: 'interaction_type', valueType: 'STRING', description: 'Type of interaction' }
                ]
            },
            {
                type: 'custom.googleapis.com/chrome_extension/errors',
                displayName: 'Chrome Extension Errors',
                description: 'Number of errors in Chrome extension',
                metricKind: 'CUMULATIVE',
                valueType: 'INT64',
                labels: [
                    { key: 'error_type', valueType: 'STRING', description: 'Type of error' },
                    { key: 'component', valueType: 'STRING', description: 'Extension component' }
                ]
            }
        ];

        const results = [];
        for (const metric of metrics) {
            const result = await this.createCustomMetric(metric);
            results.push(result);
        }

        return results;
    }

    /**
     * Record extension event
     */
    async recordExtensionEvent(metricType, value = 1, labels = {}) {
        try {
            const timeSeries = {
                metric: {
                    type: metricType,
                    labels: labels
                },
                resource: {
                    type: 'global',
                    labels: {
                        project_id: this.projectId
                    }
                },
                points: [{
                    interval: {
                        endTime: new Date().toISOString()
                    },
                    value: {
                        int64Value: value.toString()
                    }
                }]
            };

            return await this.writeTimeSeries(timeSeries);
        } catch (error) {
            console.error('Failed to record extension event:', error);
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
            console.error('Monitoring/Security API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const monitoringResult = await this.listMetricDescriptors('metric.type=starts_with("compute.googleapis.com/instance/cpu/utilization")');

            if (monitoringResult.success) {
                return {
                    status: 'healthy',
                    service: 'Cloud Monitoring & Security',
                    availableMetrics: monitoringResult.metricDescriptors.length,
                    message: 'Services operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Cloud Monitoring & Security',
                    message: monitoringResult.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Cloud Monitoring & Security',
                message: error.message
            };
        }
    }
}

// Create separate classes for cleaner organization
class GoogleSecurityCenterClient extends GoogleMonitoringClient {
    constructor(config) {
        super(config);
        this.organizationId = config.organizationId;
    }

    // Security Command Center specific methods can be added here
    // All methods from GoogleMonitoringClient are inherited
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleMonitoringClient, GoogleSecurityCenterClient };
} else {
    window.GoogleMonitoringClient = GoogleMonitoringClient;
    window.GoogleSecurityCenterClient = GoogleSecurityCenterClient;
}