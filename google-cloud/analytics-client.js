/**
 * Google Analytics Reporting API Client
 * Enhanced SEO and analytics workflows
 */

class GoogleAnalyticsClient {
    constructor(config) {
        this.projectId = config.projectId;
        this.credentials = config.credentials;
        this.baseUrl = 'https://analyticsreporting.googleapis.com/v4';
        this.dataApiUrl = 'https://analyticsdata.googleapis.com/v1beta';
        this.authManager = config.authManager || window.googleAuthManager;
    }

    /**
     * Get reports from Analytics
     */
    async getReports(reportRequests) {
        try {
            const endpoint = `${this.baseUrl}/reports:batchGet`;

            const requestBody = {
                reportRequests: Array.isArray(reportRequests) ? reportRequests : [reportRequests]
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                reports: response.reports.map(report => ({
                    columnHeader: report.columnHeader,
                    data: report.data,
                    nextPageToken: report.nextPageToken
                }))
            };
        } catch (error) {
            console.error('Analytics reporting failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get real-time reports (GA4)
     */
    async getRealtimeReport(property, options = {}) {
        try {
            const endpoint = `${this.dataApiUrl}/properties/${property}:runRealtimeReport`;

            const requestBody = {
                dimensions: options.dimensions || [{ name: 'country' }],
                metrics: options.metrics || [{ name: 'activeUsers' }],
                dimensionFilter: options.dimensionFilter || null,
                metricFilter: options.metricFilter || null,
                limit: options.limit || 10,
                metricAggregations: options.metricAggregations || []
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                dimensionHeaders: response.dimensionHeaders || [],
                metricHeaders: response.metricHeaders || [],
                rows: response.rows || [],
                totals: response.totals || [],
                maximums: response.maximums || [],
                minimums: response.minimums || []
            };
        } catch (error) {
            console.error('Real-time analytics failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Run report (GA4)
     */
    async runReport(property, options = {}) {
        try {
            const endpoint = `${this.dataApiUrl}/properties/${property}:runReport`;

            const requestBody = {
                dateRanges: options.dateRanges || [{ startDate: '7daysAgo', endDate: 'today' }],
                dimensions: options.dimensions || [{ name: 'date' }],
                metrics: options.metrics || [{ name: 'activeUsers' }],
                dimensionFilter: options.dimensionFilter || null,
                metricFilter: options.metricFilter || null,
                orderBys: options.orderBys || null,
                limit: options.limit || 100,
                offset: options.offset || 0,
                keepEmptyRows: options.keepEmptyRows || false,
                returnPropertyQuota: options.returnPropertyQuota || false
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                dimensionHeaders: response.dimensionHeaders || [],
                metricHeaders: response.metricHeaders || [],
                rows: response.rows || [],
                totals: response.totals || [],
                maximums: response.maximums || [],
                minimums: response.minimums || [],
                rowCount: response.rowCount || 0,
                metadata: response.metadata || {},
                propertyQuota: response.propertyQuota || null
            };
        } catch (error) {
            console.error('Analytics report failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get top pages report
     */
    async getTopPages(property, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [
                { name: 'screenPageViews' },
                { name: 'sessions' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' }
            ],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: options.limit || 20
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Get traffic sources report
     */
    async getTrafficSources(property, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [
                { name: 'sessionDefaultChannelGroup' },
                { name: 'sessionSource' },
                { name: 'sessionMedium' }
            ],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'newUsers' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' }
            ],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: options.limit || 20
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Get conversion funnel data
     */
    async getConversionFunnel(property, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'eventName' }],
            metrics: [
                { name: 'eventCount' },
                { name: 'totalUsers' },
                { name: 'conversions' }
            ],
            dimensionFilter: {
                filter: {
                    fieldName: 'eventName',
                    inListFilter: {
                        values: options.events || ['page_view', 'add_to_cart', 'purchase']
                    }
                }
            },
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            limit: options.limit || 10
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Get demographic data
     */
    async getDemographics(property, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [
                { name: 'country' },
                { name: 'city' },
                { name: 'userAgeBracket' },
                { name: 'userGender' }
            ],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' }
            ],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: options.limit || 50
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Get device and technology data
     */
    async getTechnologyReport(property, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [
                { name: 'deviceCategory' },
                { name: 'operatingSystem' },
                { name: 'browser' },
                { name: 'screenResolution' }
            ],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' }
            ],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: options.limit || 30
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Create custom report
     */
    async createCustomReport(property, dimensions, metrics, options = {}) {
        const reportOptions = {
            dateRanges: options.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: Array.isArray(dimensions) ? dimensions : [dimensions],
            metrics: Array.isArray(metrics) ? metrics : [metrics],
            dimensionFilter: options.dimensionFilter || null,
            metricFilter: options.metricFilter || null,
            orderBys: options.orderBys || null,
            limit: options.limit || 100,
            offset: options.offset || 0
        };

        return await this.runReport(property, reportOptions);
    }

    /**
     * Get account summaries
     */
    async getAccountSummaries() {
        try {
            const endpoint = `https://analyticsadmin.googleapis.com/v1beta/accountSummaries`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                accountSummaries: response.accountSummaries || []
            };
        } catch (error) {
            console.error('Failed to get account summaries:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get property details
     */
    async getPropertyDetails(property) {
        try {
            const endpoint = `https://analyticsadmin.googleapis.com/v1beta/properties/${property}`;

            const response = await this.makeRequest(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                property: response
            };
        } catch (error) {
            console.error('Failed to get property details:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search Console integration helper
     */
    async getSearchConsoleData(siteUrl, options = {}) {
        try {
            const endpoint = 'https://searchconsole.googleapis.com/v1/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query';

            const requestBody = {
                startDate: options.startDate || this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                endDate: options.endDate || this.formatDate(new Date()),
                dimensions: options.dimensions || ['query'],
                rowLimit: options.rowLimit || 1000,
                startRow: options.startRow || 0,
                dimensionFilterGroups: options.dimensionFilterGroups || []
            };

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return {
                success: true,
                rows: response.rows || [],
                responseAggregationType: response.responseAggregationType
            };
        } catch (error) {
            console.error('Search Console data failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Format date for API
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
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
            console.error('Analytics API request failed:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const result = await this.getAccountSummaries();

            if (result.success) {
                return {
                    status: 'healthy',
                    service: 'Google Analytics',
                    availableAccounts: result.accountSummaries.length,
                    message: 'Service operational'
                };
            } else {
                return {
                    status: 'error',
                    service: 'Google Analytics',
                    message: result.error
                };
            }
        } catch (error) {
            return {
                status: 'error',
                service: 'Google Analytics',
                message: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleAnalyticsClient;
} else {
    window.GoogleAnalyticsClient = GoogleAnalyticsClient;
}