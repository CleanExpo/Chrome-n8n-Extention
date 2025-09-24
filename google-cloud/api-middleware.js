/**
 * Google Cloud API Middleware System
 * Request/response handling, retry logic, and error management
 */

class GoogleAPIMiddleware {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            baseDelay: config.baseDelay || 1000,
            maxDelay: config.maxDelay || 10000,
            backoffMultiplier: config.backoffMultiplier || 2,
            retryableStatusCodes: config.retryableStatusCodes || [408, 429, 500, 502, 503, 504],
            timeout: config.timeout || 30000,
            enableMetrics: config.enableMetrics !== false,
            enableLogging: config.enableLogging !== false
        };

        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retryCount: 0,
            avgResponseTime: 0,
            requestsByAPI: new Map(),
            errorsByType: new Map()
        };

        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * Add error interceptor
     */
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }

    /**
     * Execute API call with full middleware stack
     */
    async execute(apiCall, context = {}) {
        const startTime = Date.now();
        let lastError;

        // Update total requests metric
        this.updateMetric('totalRequests', 1);
        this.updateAPIMetric(context.api || 'unknown', 'requests', 1);

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                // Apply request interceptors
                const processedContext = await this.applyRequestInterceptors(context, attempt);

                // Execute the API call with timeout
                const result = await this.withTimeout(apiCall(processedContext), this.config.timeout);

                // Apply response interceptors
                const processedResult = await this.applyResponseInterceptors(result, processedContext);

                // Update success metrics
                const responseTime = Date.now() - startTime;
                this.updateMetric('successfulRequests', 1);
                this.updateResponseTime(responseTime);
                this.updateAPIMetric(context.api || 'unknown', 'success', 1);

                if (this.config.enableLogging) {
                    console.log(`API call successful: ${context.api} (${responseTime}ms, attempt ${attempt + 1})`);
                }

                return {
                    success: true,
                    data: processedResult,
                    attempts: attempt + 1,
                    responseTime: responseTime
                };

            } catch (error) {
                lastError = error;
                const shouldRetry = this.shouldRetry(error, attempt);

                // Update error metrics
                this.updateMetric('failedRequests', 1);
                this.updateErrorMetric(error.name || 'UnknownError', 1);
                this.updateAPIMetric(context.api || 'unknown', 'errors', 1);

                // Apply error interceptors
                await this.applyErrorInterceptors(error, context, attempt);

                if (shouldRetry && attempt < this.config.maxRetries) {
                    this.updateMetric('retryCount', 1);

                    const delay = this.calculateDelay(attempt);
                    if (this.config.enableLogging) {
                        console.warn(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries + 1}):`, error.message);
                    }

                    await this.sleep(delay);
                    continue;
                } else {
                    break;
                }
            }
        }

        // Final failure
        const responseTime = Date.now() - startTime;
        if (this.config.enableLogging) {
            console.error(`API call failed after ${this.config.maxRetries + 1} attempts: ${context.api}`, lastError);
        }

        return {
            success: false,
            error: lastError.message,
            attempts: this.config.maxRetries + 1,
            responseTime: responseTime
        };
    }

    /**
     * Apply request interceptors
     */
    async applyRequestInterceptors(context, attempt) {
        let processedContext = { ...context, attempt };

        for (const interceptor of this.requestInterceptors) {
            try {
                processedContext = await interceptor(processedContext) || processedContext;
            } catch (error) {
                console.warn('Request interceptor failed:', error);
            }
        }

        return processedContext;
    }

    /**
     * Apply response interceptors
     */
    async applyResponseInterceptors(result, context) {
        let processedResult = result;

        for (const interceptor of this.responseInterceptors) {
            try {
                processedResult = await interceptor(processedResult, context) || processedResult;
            } catch (error) {
                console.warn('Response interceptor failed:', error);
            }
        }

        return processedResult;
    }

    /**
     * Apply error interceptors
     */
    async applyErrorInterceptors(error, context, attempt) {
        for (const interceptor of this.errorInterceptors) {
            try {
                await interceptor(error, context, attempt);
            } catch (interceptorError) {
                console.warn('Error interceptor failed:', interceptorError);
            }
        }
    }

    /**
     * Determine if request should be retried
     */
    shouldRetry(error, attempt) {
        if (attempt >= this.config.maxRetries) {
            return false;
        }

        // Check if error has a status code that's retryable
        const statusCode = error.status || error.statusCode;
        if (statusCode && this.config.retryableStatusCodes.includes(statusCode)) {
            return true;
        }

        // Check for specific error types
        if (error.name === 'TimeoutError' ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ENOTFOUND')) {
            return true;
        }

        // Check for rate limiting
        if (error.message.includes('rate limit') ||
            error.message.includes('quota exceeded') ||
            statusCode === 429) {
            return true;
        }

        return false;
    }

    /**
     * Calculate exponential backoff delay
     */
    calculateDelay(attempt) {
        const baseDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
        const jitter = Math.random() * 0.1 * baseDelay; // Add 10% jitter
        const delay = Math.min(baseDelay + jitter, this.config.maxDelay);
        return Math.floor(delay);
    }

    /**
     * Execute function with timeout
     */
    async withTimeout(promise, timeoutMs) {
        let timeoutHandle;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                const error = new Error(`Request timed out after ${timeoutMs}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeoutMs);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutHandle);
            return result;
        } catch (error) {
            clearTimeout(timeoutHandle);
            throw error;
        }
    }

    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update general metrics
     */
    updateMetric(metricName, value) {
        if (!this.config.enableMetrics) return;

        if (metricName === 'avgResponseTime') {
            // Calculate running average
            const totalRequests = this.metrics.totalRequests;
            this.metrics.avgResponseTime = ((this.metrics.avgResponseTime * (totalRequests - 1)) + value) / totalRequests;
        } else {
            this.metrics[metricName] = (this.metrics[metricName] || 0) + value;
        }
    }

    /**
     * Update API-specific metrics
     */
    updateAPIMetric(apiName, metricType, value) {
        if (!this.config.enableMetrics) return;

        if (!this.metrics.requestsByAPI.has(apiName)) {
            this.metrics.requestsByAPI.set(apiName, {
                requests: 0,
                success: 0,
                errors: 0
            });
        }

        const apiMetrics = this.metrics.requestsByAPI.get(apiName);
        apiMetrics[metricType] = (apiMetrics[metricType] || 0) + value;
    }

    /**
     * Update error metrics
     */
    updateErrorMetric(errorType, value) {
        if (!this.config.enableMetrics) return;

        this.metrics.errorsByType.set(
            errorType,
            (this.metrics.errorsByType.get(errorType) || 0) + value
        );
    }

    /**
     * Update response time running average
     */
    updateResponseTime(responseTime) {
        this.updateMetric('avgResponseTime', responseTime);
    }

    /**
     * Get metrics summary
     */
    getMetrics() {
        const summary = {
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            avgResponseTime: Math.round(this.metrics.avgResponseTime) + 'ms'
        };

        // Convert Maps to Objects for easier serialization
        summary.requestsByAPI = Object.fromEntries(this.metrics.requestsByAPI);
        summary.errorsByType = Object.fromEntries(this.metrics.errorsByType);

        return summary;
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retryCount: 0,
            avgResponseTime: 0,
            requestsByAPI: new Map(),
            errorsByType: new Map()
        };
    }

    /**
     * Create rate limiter
     */
    createRateLimiter(requestsPerSecond = 10) {
        const tokens = requestsPerSecond;
        let lastRefill = Date.now();
        let availableTokens = tokens;

        return {
            async acquire() {
                const now = Date.now();
                const timePassed = (now - lastRefill) / 1000;

                // Refill tokens based on time passed
                availableTokens = Math.min(tokens, availableTokens + timePassed * requestsPerSecond);
                lastRefill = now;

                if (availableTokens >= 1) {
                    availableTokens -= 1;
                    return true;
                } else {
                    // Wait for next token
                    const waitTime = (1 - availableTokens) / requestsPerSecond * 1000;
                    await this.sleep(waitTime);
                    availableTokens = 0;
                    return true;
                }
            }
        };
    }

    /**
     * Create circuit breaker
     */
    createCircuitBreaker(options = {}) {
        const failureThreshold = options.failureThreshold || 5;
        const resetTimeout = options.resetTimeout || 60000;
        const monitoringWindow = options.monitoringWindow || 60000;

        let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        let failures = 0;
        let lastFailureTime = 0;
        let successCount = 0;

        return {
            async execute(operation) {
                const now = Date.now();

                // Reset failure count after monitoring window
                if (now - lastFailureTime > monitoringWindow) {
                    failures = 0;
                }

                switch (state) {
                    case 'CLOSED':
                        try {
                            const result = await operation();
                            failures = 0;
                            return result;
                        } catch (error) {
                            failures++;
                            lastFailureTime = now;

                            if (failures >= failureThreshold) {
                                state = 'OPEN';
                                console.warn(`Circuit breaker opened after ${failures} failures`);
                            }
                            throw error;
                        }

                    case 'OPEN':
                        if (now - lastFailureTime > resetTimeout) {
                            state = 'HALF_OPEN';
                            successCount = 0;
                            console.log('Circuit breaker half-open, testing...');
                        } else {
                            throw new Error('Circuit breaker is OPEN');
                        }
                        break;

                    case 'HALF_OPEN':
                        try {
                            const result = await operation();
                            successCount++;

                            if (successCount >= 3) {
                                state = 'CLOSED';
                                failures = 0;
                                console.log('Circuit breaker closed');
                            }

                            return result;
                        } catch (error) {
                            state = 'OPEN';
                            lastFailureTime = now;
                            console.warn('Circuit breaker opened again');
                            throw error;
                        }
                }
            },

            getState() {
                return {
                    state,
                    failures,
                    lastFailureTime,
                    successCount
                };
            }
        };
    }
}

// Singleton instance
const googleAPIMiddleware = new GoogleAPIMiddleware();

// Default interceptors
googleAPIMiddleware.addRequestInterceptor(async (context) => {
    // Add request ID for tracing
    context.requestId = context.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add user agent
    if (context.headers) {
        context.headers['User-Agent'] = context.headers['User-Agent'] || 'Chrome-Extension-n8n-Assistant/1.0';
    }

    return context;
});

googleAPIMiddleware.addResponseInterceptor(async (result, context) => {
    // Log successful requests
    if (context.requestId && googleAPIMiddleware.config.enableLogging) {
        console.debug(`Request ${context.requestId} completed successfully`);
    }

    return result;
});

googleAPIMiddleware.addErrorInterceptor(async (error, context, attempt) => {
    // Log error details
    if (context.requestId && googleAPIMiddleware.config.enableLogging) {
        console.error(`Request ${context.requestId} failed on attempt ${attempt + 1}:`, error.message);
    }

    // Send error to monitoring service if available
    if (window.GoogleMonitoringClient && context.api) {
        try {
            await window.googleMonitoringClient?.recordExtensionEvent(
                'custom.googleapis.com/chrome_extension/errors',
                1,
                {
                    error_type: error.name || 'UnknownError',
                    component: context.api,
                    request_id: context.requestId || 'unknown'
                }
            );
        } catch (monitoringError) {
            console.warn('Failed to record error metric:', monitoringError);
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleAPIMiddleware, googleAPIMiddleware };
} else {
    window.GoogleAPIMiddleware = GoogleAPIMiddleware;
    window.googleAPIMiddleware = googleAPIMiddleware;
}