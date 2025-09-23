/**
 * n8n Documentation Integration
 * Provides n8n documentation context to the AI Assistant
 */

class N8nDocsIntegration {
    constructor() {
        this.docsPath = 'n8n-docs/';
        this.availableDocs = {
            'core-concepts': 'Core n8n concepts and architecture',
            'workflow-basics': 'Creating and managing workflows',
            'nodes-reference': 'Common nodes and their usage',
            'expressions': 'n8n expressions and data transformation'
        };
    }

    /**
     * Search for relevant n8n documentation based on query
     * @param {string} query - User's question or topic
     * @returns {Promise<string>} Relevant documentation content
     */
    async searchDocs(query) {
        const keywords = this.extractKeywords(query.toLowerCase());
        const relevantDocs = this.findRelevantDocs(keywords);

        if (relevantDocs.length === 0) {
            return this.getQuickReference();
        }

        let content = '';
        for (const doc of relevantDocs) {
            const docContent = await this.loadDoc(doc);
            if (docContent) {
                content += `\n\n## From ${doc}.md:\n${this.extractRelevantSection(docContent, keywords)}`;
            }
        }

        return content;
    }

    /**
     * Extract keywords from query
     */
    extractKeywords(query) {
        const n8nKeywords = [
            'workflow', 'node', 'trigger', 'webhook', 'expression', 'variable',
            'schedule', 'http', 'api', 'database', 'postgres', 'mongodb',
            'merge', 'split', 'batch', 'loop', 'if', 'switch', 'code',
            'function', 'javascript', 'python', 'credentials', 'authentication',
            'error', 'debug', 'execution', 'data', 'json', 'transform',
            'filter', 'map', 'reduce', 'aggregate', 'set', 'email', 'slack'
        ];

        return n8nKeywords.filter(keyword => query.includes(keyword));
    }

    /**
     * Find relevant documentation files based on keywords
     */
    findRelevantDocs(keywords) {
        const docMapping = {
            'core-concepts': ['workflow', 'node', 'execution', 'trigger', 'credentials', 'architecture'],
            'workflow-basics': ['create', 'workflow', 'trigger', 'webhook', 'schedule', 'error', 'debug'],
            'nodes-reference': ['node', 'http', 'database', 'postgres', 'mongodb', 'slack', 'email', 'api'],
            'expressions': ['expression', 'variable', 'json', 'transform', 'filter', 'map', 'data', 'javascript']
        };

        const relevantDocs = [];
        for (const [doc, docKeywords] of Object.entries(docMapping)) {
            if (keywords.some(keyword => docKeywords.includes(keyword))) {
                relevantDocs.push(doc);
            }
        }

        return relevantDocs;
    }

    /**
     * Load documentation file content
     */
    async loadDoc(docName) {
        try {
            // In Chrome extension, we'll need to fetch the local file
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const url = chrome.runtime.getURL(`${this.docsPath}${docName}.md`);
                const response = await fetch(url);
                return await response.text();
            }

            // Fallback for testing
            return this.getDocContent(docName);
        } catch (error) {
            console.error(`Error loading ${docName}:`, error);
            return null;
        }
    }

    /**
     * Extract relevant section from documentation
     */
    extractRelevantSection(content, keywords, maxLength = 2000) {
        const lines = content.split('\n');
        const relevantLines = [];
        let currentSection = '';
        let sectionRelevance = 0;

        for (const line of lines) {
            // Track section headers
            if (line.startsWith('#')) {
                currentSection = line;
                sectionRelevance = keywords.filter(k => line.toLowerCase().includes(k)).length;
            }

            // Include lines in relevant sections
            if (sectionRelevance > 0 || keywords.some(k => line.toLowerCase().includes(k))) {
                relevantLines.push(line);
            }

            // Stop if we have enough content
            if (relevantLines.join('\n').length > maxLength) {
                break;
            }
        }

        return relevantLines.join('\n').substring(0, maxLength);
    }

    /**
     * Get quick reference for common n8n questions
     */
    getQuickReference() {
        return `
## n8n Quick Reference

### Creating a Workflow
1. Add a trigger node (Webhook, Schedule, Manual)
2. Add action nodes (HTTP Request, Database, etc.)
3. Connect nodes to define data flow
4. Test with "Execute Workflow"

### Common Expressions
- Access data: \`{{ $json.fieldName }}\`
- Previous node: \`{{ $node["NodeName"].json }}\`
- Current time: \`{{ $now }}\`
- Environment var: \`{{ $env.VARIABLE_NAME }}\`

### Popular Nodes
- **HTTP Request**: Make API calls
- **Code**: Write JavaScript/Python
- **Set**: Transform data fields
- **IF**: Conditional branching
- **Webhook**: Receive HTTP requests

### Need Help?
Visit docs.n8n.io for complete documentation.
        `;
    }

    /**
     * Get specific documentation content (fallback method)
     */
    getDocContent(docName) {
        // This is a fallback with embedded essential content
        const docs = {
            'expressions': `
### n8n Expressions
- Access JSON: \`{{ $json.field }}\`
- Array operations: \`{{ $json.items.map(i => i.name) }}\`
- Conditionals: \`{{ $json.status === 'active' ? 'Yes' : 'No' }}\`
- Date/Time: \`{{ $now.toFormat('yyyy-MM-dd') }}\`
            `,
            'nodes-reference': `
### Common Nodes
**HTTP Request**: API calls with authentication
**Code Node**: JavaScript/Python execution
**Set Node**: Data transformation
**IF Node**: Conditional logic
**Merge Node**: Combine data streams
            `,
            'workflow-basics': `
### Workflow Basics
1. Every workflow needs a trigger
2. Connect nodes left to right
3. Test with sample data
4. Use expressions for dynamic values
5. Handle errors with error workflows
            `
        };

        return docs[docName] || '';
    }

    /**
     * Enhanced search with context
     */
    async getContextualHelp(query, context = {}) {
        const baseContent = await this.searchDocs(query);

        // Add context-specific help
        if (context.currentNode) {
            const nodeHelp = this.getNodeSpecificHelp(context.currentNode);
            return baseContent + '\n\n' + nodeHelp;
        }

        return baseContent;
    }

    /**
     * Get node-specific help
     */
    getNodeSpecificHelp(nodeType) {
        const nodeHelp = {
            'webhook': `
### Webhook Node Tips
- Path: Unique endpoint for your webhook
- Response Mode: "On Received" for immediate response
- HTTP Method: GET, POST, PUT, DELETE
- Test URL available in node settings
            `,
            'httpRequest': `
### HTTP Request Node Tips
- Authentication: Use credentials for security
- Retry on Fail: Configure retry logic
- Timeout: Set appropriate timeout values
- Response Format: JSON, Text, or Binary
            `,
            'code': `
### Code Node Tips
- Access items: \`$input.all()\`
- Return format: \`[{json: {...}}]\`
- Available: DateTime, $jmespath, Buffer
- Console.log for debugging
            `
        };

        return nodeHelp[nodeType] || '';
    }
}

// Export for use in Chrome Extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = N8nDocsIntegration;
} else if (typeof window !== 'undefined') {
    window.N8nDocsIntegration = N8nDocsIntegration;
}