/**
 * Context7 Integration for Chrome Extension
 * Provides up-to-date documentation fetching capabilities
 */

class Context7Integration {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        // Note: Context7 API endpoint may need configuration
        this.baseUrl = 'https://api.context7.com';
        this.headers = {
            'User-Agent': 'n8n-Chrome-Extension/1.0.0',
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            this.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        // Check if Context7 API is accessible
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            // Simple check to see if the API endpoint exists
            const response = await fetch(this.baseUrl + '/health', {
                method: 'HEAD',
                mode: 'no-cors' // Avoid CORS issues for availability check
            });
            this.isAvailable = true;
        } catch (error) {
            console.log('Context7 API not reachable:', error.message);
            this.isAvailable = false;
        }
    }

    /**
     * Resolve a library name to Context7-compatible ID
     * @param {string} libraryName - Name of the library (e.g., "react", "nextjs")
     * @returns {Promise<object>} Resolved library information
     */
    async resolveLibrary(libraryName) {
        // Skip if API is not available
        if (!this.isAvailable) {
            console.log('Context7 API not available, skipping library resolution');
            return null;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/resolve/${encodeURIComponent(libraryName)}`,
                {
                    method: 'GET',
                    headers: this.headers
                }
            );

            if (!response.ok) {
                console.log(`Library ${libraryName} not found in Context7`);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.log('Context7 resolve error:', error.message);
            return null;
        }
    }

    /**
     * Fetch documentation for a specific library
     * @param {string} libraryId - Context7-compatible library ID
     * @param {object} options - Options for fetching docs
     * @returns {Promise<string>} Documentation text
     */
    async getLibraryDocs(libraryId, options = {}) {
        const { topic = null, tokens = 5000 } = options;

        // Ensure minimum token count
        const adjustedTokens = tokens < 1000 ? 1000 : tokens;

        try {
            const params = new URLSearchParams({
                tokens: adjustedTokens.toString()
            });

            if (topic) {
                params.append('topic', topic);
            }

            const response = await fetch(
                `${this.baseUrl}/docs${libraryId}?${params}`,
                {
                    method: 'GET',
                    headers: this.headers
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch docs: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error fetching documentation:', error);
            throw error;
        }
    }

    /**
     * Search for libraries and get relevant documentation
     * @param {string} query - Search query
     * @returns {Promise<array>} Array of matching libraries
     */
    async searchLibraries(query) {
        try {
            const resolved = await this.resolveLibrary(query);

            if (resolved && resolved.libraries) {
                return resolved.libraries;
            }

            return [];
        } catch (error) {
            console.error('Error searching libraries:', error);
            return [];
        }
    }

    /**
     * Get documentation with context for AI assistant
     * @param {string} libraryName - Library name or ID
     * @param {string} context - Context or specific question
     * @returns {Promise<object>} Documentation with context
     */
    async getDocsWithContext(libraryName, context = '') {
        try {
            // First, resolve the library
            const resolved = await this.resolveLibrary(libraryName);

            if (!resolved || !resolved.id) {
                throw new Error('Library not found');
            }

            // Then fetch the documentation
            const docs = await this.getLibraryDocs(resolved.id, {
                topic: context,
                tokens: 5000
            });

            return {
                library: resolved,
                documentation: docs,
                context: context
            };
        } catch (error) {
            console.error('Error getting docs with context:', error);
            throw error;
        }
    }
}

// Export for use in Chrome Extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Context7Integration;
} else if (typeof window !== 'undefined') {
    window.Context7Integration = Context7Integration;
}