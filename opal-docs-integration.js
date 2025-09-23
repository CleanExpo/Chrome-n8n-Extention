/**
 * Opal AI Documentation Integration
 * Provides Opal AI documentation context to the AI Assistant
 */

class OpalDocsIntegration {
    constructor() {
        this.docsPath = 'opal-ai-docs/';
        this.availableDocs = {
            'README': 'Comprehensive Opal AI overview and features',
            'getting-started': 'Quick start guide and tutorials',
            'workflow-examples': 'Example workflows and patterns',
            'integration-guide': 'Integration with external systems',
            'opal-vs-alternatives': 'Platform comparison and decision guide'
        };
    }

    /**
     * Search for relevant Opal AI documentation based on query
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
        const opalKeywords = [
            'opal', 'opal ai', 'google labs', 'no-code', 'no code', 'visual workflow',
            'ai workflow', 'natural language', 'workflow builder', 'ai app', 'mini app',
            'prompt chain', 'ai model', 'visual editor', 'google opal', 'workflow automation',
            'ai prototype', 'rapid prototyping', 'ai development', 'workflow creation',
            'node-based', 'drag and drop', 'ai builder', 'conversational interface',
            'workflow pattern', 'ai integration', 'opal vs', 'compare opal'
        ];

        return opalKeywords.filter(keyword => query.includes(keyword));
    }

    /**
     * Find relevant documentation files based on keywords
     */
    findRelevantDocs(keywords) {
        const docMapping = {
            'README': ['opal', 'overview', 'what is', 'features', 'introduction', 'google labs', 'capabilities'],
            'getting-started': ['start', 'begin', 'tutorial', 'first', 'how to', 'create', 'build', 'step'],
            'workflow-examples': ['example', 'workflow', 'pattern', 'template', 'use case', 'sample', 'demo'],
            'integration-guide': ['integration', 'api', 'connect', 'webhook', 'external', 'zapier', 'n8n'],
            'opal-vs-alternatives': ['compare', 'vs', 'alternative', 'versus', 'comparison', 'difference', 'choose']
        };

        const relevantDocs = [];
        for (const [doc, docKeywords] of Object.entries(docMapping)) {
            if (keywords.some(keyword => docKeywords.some(dk => dk.includes(keyword) || keyword.includes(dk)))) {
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
            // In Chrome extension, fetch the local file
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
    extractRelevantSection(content, keywords, maxLength = 2500) {
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

            // Include lines in relevant sections or containing keywords
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
     * Get quick reference for common Opal AI questions
     */
    getQuickReference() {
        return `
## Opal AI Quick Reference

### What is Opal AI?
Opal is an experimental AI tool from Google Labs that allows users to create and share AI mini-apps without writing any code. It uses a visual workflow builder and natural language interface.

### Key Features
- **No-Code Development**: Build AI apps without programming
- **Visual Workflows**: Drag-and-drop interface
- **Natural Language**: Describe apps in plain English
- **AI Model Chaining**: Connect multiple AI models
- **Instant Sharing**: Share apps with other users

### Getting Started
1. Visit opal.withgoogle.com (US-only beta)
2. Sign in with Google account
3. Create new workflow or use template
4. Add nodes and connections
5. Test and refine
6. Share your creation

### Common Use Cases
- Text analysis and processing
- Content generation
- Data transformation
- Automation workflows
- Educational tools

### How It Differs
- **vs n8n**: AI-first, no-code, natural language
- **vs Zapier**: Visual workflows, AI-native
- **vs Make**: AI-focused, simpler interface
- **vs Code**: No programming required

Visit the Opal documentation for detailed guides and examples.
        `;
    }

    /**
     * Get specific documentation content (fallback method)
     */
    getDocContent(docName) {
        const docs = {
            'README': `
### Opal AI Overview
Opal is an experimental AI tool from Google Labs for creating AI mini-apps without code.
- Visual workflow builder
- Natural language interface
- AI model integration
- Instant sharing capabilities
            `,
            'getting-started': `
### Getting Started with Opal
1. Access opal.withgoogle.com
2. Sign in with Google account
3. Create new workflow
4. Add AI nodes
5. Connect components
6. Test and share
            `,
            'workflow-examples': `
### Workflow Examples
- Text Analysis: Sentiment, key points, summaries
- Content Creation: Blog posts, social media
- Data Processing: CSV analysis, transformations
- Business Automation: Email processing, tickets
            `,
            'integration-guide': `
### Integration Options
- Browser automation with Puppeteer
- Webhook patterns
- Google Workspace integration
- Platform connections via APIs
            `,
            'opal-vs-alternatives': `
### Platform Comparison
- Opal: Best for AI-first workflows
- n8n: Best for self-hosting and customization
- Zapier: Best for extensive integrations
- Make: Best for visual complexity
            `
        };

        return docs[docName] || '';
    }

    /**
     * Get context-specific help
     */
    async getContextualHelp(query, context = {}) {
        const baseContent = await this.searchDocs(query);

        // Add specific examples based on context
        if (context.needsExample) {
            const examples = this.getWorkflowExamples(context.type);
            return baseContent + '\n\n' + examples;
        }

        return baseContent;
    }

    /**
     * Get workflow examples
     */
    getWorkflowExamples(type) {
        const examples = {
            'text': `
### Text Processing Example
Input Node → AI Model (Analysis) → Output Formatter
- Sentiment analysis
- Key point extraction
- Summarization
            `,
            'automation': `
### Automation Example
Trigger → Data Processing → AI Decision → Action
- Email classification
- Ticket routing
- Response generation
            `,
            'creative': `
### Creative Example
Prompt → AI Generator → Style Transfer → Output
- Story generation
- Content creation
- Image descriptions
            `
        };

        return examples[type] || '';
    }

    /**
     * Get comparison information
     */
    getComparison(platform) {
        const comparisons = {
            'n8n': `
### Opal vs n8n
**Opal Advantages:**
- No-code, AI-first design
- Natural language interface
- Faster prototyping

**n8n Advantages:**
- Open source, self-hostable
- More integrations
- Code flexibility
            `,
            'zapier': `
### Opal vs Zapier
**Opal Advantages:**
- Visual workflow builder
- AI-native capabilities
- Natural language support

**Zapier Advantages:**
- 3000+ integrations
- Proven reliability
- Extensive documentation
            `
        };

        return comparisons[platform.toLowerCase()] || '';
    }
}

// Export for use in Chrome Extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpalDocsIntegration;
} else if (typeof window !== 'undefined') {
    window.OpalDocsIntegration = OpalDocsIntegration;
}