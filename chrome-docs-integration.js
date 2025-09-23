/**
 * Chrome Extension Documentation Integration
 * Provides Chrome Extension documentation context to the AI Assistant
 */

class ChromeDocsIntegration {
    constructor() {
        this.docsPath = 'chrome-extension-docs/';
        this.availableDocs = {
            'manifest-v3': 'Manifest V3 structure and configuration',
            'chrome-apis': 'Chrome Extension APIs reference',
            'messaging': 'Extension messaging and communication',
            'service-workers': 'Background scripts and service workers',
            'content-scripts': 'Content scripts and injection',
            'permissions': 'Permissions and security',
            'storage': 'Chrome storage API and data persistence'
        };
    }

    /**
     * Search for relevant Chrome Extension documentation based on query
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
        const chromeKeywords = [
            'manifest', 'permission', 'chrome', 'extension', 'background', 'service worker',
            'content script', 'popup', 'options', 'storage', 'tabs', 'runtime', 'message',
            'messaging', 'api', 'action', 'browser action', 'context menu', 'notification',
            'alarm', 'scripting', 'inject', 'badge', 'icon', 'window', 'identity',
            'chrome.tabs', 'chrome.runtime', 'chrome.storage', 'sendMessage', 'onMessage',
            'manifest.json', 'web accessible', 'host permission', 'content security policy'
        ];

        return chromeKeywords.filter(keyword => query.includes(keyword));
    }

    /**
     * Find relevant documentation files based on keywords
     */
    findRelevantDocs(keywords) {
        const docMapping = {
            'manifest-v3': ['manifest', 'permission', 'manifest.json', 'host permission', 'action', 'background', 'content script'],
            'chrome-apis': ['chrome.', 'api', 'tabs', 'storage', 'runtime', 'action', 'notification', 'alarm', 'scripting', 'identity'],
            'messaging': ['message', 'messaging', 'sendMessage', 'onMessage', 'port', 'connect', 'communication'],
            'service-workers': ['background', 'service worker', 'event', 'listener', 'lifecycle'],
            'content-scripts': ['content script', 'inject', 'page', 'dom', 'web page'],
            'storage': ['storage', 'chrome.storage', 'sync', 'local', 'data', 'persist'],
            'permissions': ['permission', 'security', 'host', 'optional', 'required']
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
     * Get quick reference for common Chrome Extension questions
     */
    getQuickReference() {
        return `
## Chrome Extension Quick Reference

### Manifest V3 Basics
\`\`\`json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js" },
  "permissions": ["storage", "tabs"],
  "host_permissions": ["https://*/*"]
}
\`\`\`

### Common Chrome APIs
- **chrome.storage**: Store and retrieve data
- **chrome.tabs**: Interact with browser tabs
- **chrome.runtime**: Extension runtime and messaging
- **chrome.action**: Extension toolbar button
- **chrome.scripting**: Execute scripts in tabs

### Messaging
\`\`\`javascript
// Send message
chrome.runtime.sendMessage({data: "hello"}, (response) => {
  console.log(response);
});

// Receive message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendResponse({data: "response"});
  return true; // For async response
});
\`\`\`

### Need Help?
Visit developer.chrome.com/docs/extensions for complete documentation.
        `;
    }

    /**
     * Get specific documentation content (fallback method)
     */
    getDocContent(docName) {
        const docs = {
            'manifest-v3': `
### Manifest V3 Structure
- manifest_version: Must be 3
- background: Uses service_worker, not scripts
- action: Replaces browserAction and pageAction
- host_permissions: Separate from permissions
- content_security_policy: Object format
            `,
            'chrome-apis': `
### Chrome APIs
**chrome.storage.sync.set/get**: Sync data across devices
**chrome.tabs.query**: Find tabs
**chrome.tabs.sendMessage**: Message content scripts
**chrome.runtime.sendMessage**: Extension messaging
**chrome.action.setBadgeText**: Update badge
            `,
            'messaging': `
### Extension Messaging
- One-time requests: chrome.runtime.sendMessage
- Long-lived connections: chrome.runtime.connect
- Content to background: chrome.runtime.sendMessage
- Background to content: chrome.tabs.sendMessage
- Return true for async responses
            `,
            'storage': `
### Chrome Storage API
- chrome.storage.sync: Synced across devices (100KB limit)
- chrome.storage.local: Local only (10MB limit)
- chrome.storage.session: Cleared on browser close
- Listen for changes: chrome.storage.onChanged
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
        if (context.errorType) {
            const errorHelp = this.getErrorHelp(context.errorType);
            return baseContent + '\n\n' + errorHelp;
        }

        return baseContent;
    }

    /**
     * Get error-specific help
     */
    getErrorHelp(errorType) {
        const errorHelp = {
            'connection': `
### Connection Error Solutions
1. Check if extension context is valid
2. Ensure content script is injected
3. Verify message listener is registered
4. Return true for async responses
            `,
            'permission': `
### Permission Error Solutions
1. Add required permissions to manifest.json
2. Use host_permissions for site access
3. Request optional permissions at runtime
4. Check if permission is granted before use
            `,
            'csp': `
### Content Security Policy Solutions
1. Remove inline event handlers
2. Move scripts to external files
3. Use addEventListener instead of onclick
4. No eval() or new Function() in Manifest V3
            `
        };

        return errorHelp[errorType] || '';
    }

    /**
     * Get API-specific examples
     */
    getAPIExample(apiName) {
        const examples = {
            'chrome.storage': `
// Set data
chrome.storage.sync.set({key: 'value'}, () => {
  console.log('Saved');
});

// Get data
chrome.storage.sync.get(['key'], (result) => {
  console.log('Value:', result.key);
});
            `,
            'chrome.tabs': `
// Query tabs
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  const activeTab = tabs[0];
  console.log('Active tab:', activeTab.url);
});

// Send message to tab
chrome.tabs.sendMessage(tabId, {action: 'doSomething'});
            `,
            'chrome.runtime': `
// Send message
chrome.runtime.sendMessage({greeting: 'hello'}, (response) => {
  console.log('Response:', response);
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendResponse({farewell: 'goodbye'});
  return true; // Async response
});
            `
        };

        return examples[apiName] || '';
    }
}

// Export for use in Chrome Extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChromeDocsIntegration;
} else if (typeof window !== 'undefined') {
    window.ChromeDocsIntegration = ChromeDocsIntegration;
}