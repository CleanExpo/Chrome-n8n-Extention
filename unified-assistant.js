/**
 * Unified AI Assistant
 * Combines browser, system, and AI capabilities into one powerful interface
 */

class UnifiedAssistant {
    constructor() {
        this.browserAutomation = typeof BrowserAutomation !== 'undefined' ? new BrowserAutomation() : null;
        this.systemAutomation = typeof SystemAutomation !== 'undefined' ? new SystemAutomation() : null;
        this.aiProcessor = typeof AICommandProcessor !== 'undefined' ? new AICommandProcessor() : null;

        this.capabilities = {
            browser: !!this.browserAutomation,
            system: false, // Will be true after native host connection
            ai: false, // Will be true after API key setup
            voice: false // Will be true after voice init
        };

        this.initialize();
    }

    /**
     * Initialize all systems
     */
    async initialize() {
        console.log('🚀 Initializing Personal AI Assistant...');

        // Try to connect to native host
        if (this.systemAutomation) {
            const result = await this.systemAutomation.connect();
            this.capabilities.system = result.success;

            if (result.success) {
                console.log('✅ System automation ready');
                
                // Test secure authentication
                try {
                    const authResult = await this.authenticateGoogle();
                    if (authResult.success) {
                        this.capabilities.google = true;
                        this.capabilities.ai = true; // Gemini available through Google
                        this.userEmail = authResult.email;
                        console.log(`✅ Google APIs authenticated as: ${authResult.email}`);
                    }
                } catch (e) {
                    console.log('⚠️ Google APIs not authenticated - run personal_setup.py first');
                }

                // Check for voice capabilities
                try {
                    await this.systemAutomation.speak('Personal Assistant ready');
                    this.capabilities.voice = true;
                    console.log('✅ Voice control ready');
                } catch (e) {
                    console.log('⚠️ Voice control not available');
                }
            } else {
                console.log('⚠️ System automation not available - run native-host/setup.bat');
            }
        }

        // Enhanced capabilities
        this.capabilities.gmail = this.capabilities.google;
        this.capabilities.drive = this.capabilities.google;
        this.capabilities.sheets = this.capabilities.google;
        this.capabilities.calendar = this.capabilities.google;
        this.capabilities.gemini = this.capabilities.google;

        console.log('📊 Personal Assistant Capabilities:', this.capabilities);
    }

    /**
     * Authenticate with Google APIs using secure system
     */
    async authenticateGoogle() {
        if (!this.systemAutomation || !this.capabilities.system) {
            throw new Error('Native host not available');
        }

        const result = await this.systemAutomation.sendMessage('authenticate', {});
        return result;
    }

    /**
     * Execute natural language command
     */
    async execute(command) {
        console.log('🎯 Executing:', command);

        // Analyze command intent
        const intent = await this.analyzeIntent(command);

        // Route to appropriate handler
        switch (intent.category) {
            case 'browser':
                return await this.executeBrowserCommand(intent);

            case 'system':
                return await this.executeSystemCommand(intent);

            case 'workflow':
                return await this.executeWorkflow(intent);

            case 'ai':
                return await this.executeAICommand(intent);

            default:
                return await this.handleUnknownCommand(command);
        }
    }

    /**
     * Analyze command intent
     */
    async analyzeIntent(command) {
        const lower = command.toLowerCase();

        // Browser-related keywords
        if (lower.includes('open') || lower.includes('navigate') ||
            lower.includes('search') || lower.includes('download') ||
            lower.includes('extract') || lower.includes('scrape')) {
            return { category: 'browser', command };
        }

        // System-related keywords
        if (lower.includes('launch') || lower.includes('start') ||
            lower.includes('type') || lower.includes('click') ||
            lower.includes('screenshot') || lower.includes('file')) {
            return { category: 'system', command };
        }

        // Workflow keywords
        if (lower.includes('automate') || lower.includes('create') ||
            lower.includes('schedule') || lower.includes('routine')) {
            return { category: 'workflow', command };
        }

        // AI keywords
        if (lower.includes('write') || lower.includes('generate') ||
            lower.includes('analyze') || lower.includes('summarize')) {
            return { category: 'ai', command };
        }

        return { category: 'unknown', command };
    }

    /**
     * Execute browser command
     */
    async executeBrowserCommand(intent) {
        if (!this.capabilities.browser) {
            return { error: 'Browser automation not available' };
        }

        // Use AI command processor for natural language
        if (this.aiProcessor) {
            return await this.aiProcessor.processCommand(intent.command);
        }

        // Fallback to direct commands
        const patterns = {
            'open (.+)': async (match) => {
                window.location.href = match[1].includes('http') ?
                    match[1] : `https://${match[1]}`;
                return { success: true, action: 'navigate' };
            },
            'search for (.+)': async (match) => {
                window.location.href = `https://google.com/search?q=${encodeURIComponent(match[1])}`;
                return { success: true, action: 'search' };
            },
            'extract all (.+)': async (match) => {
                return await this.browserAutomation.intelligentScrape({
                    selector: '*',
                    extractText: true,
                    extractLinks: match[1].includes('link'),
                    extractImages: match[1].includes('image')
                });
            }
        };

        for (const [pattern, handler] of Object.entries(patterns)) {
            const regex = new RegExp(pattern, 'i');
            const match = intent.command.match(regex);
            if (match) {
                return await handler(match);
            }
        }

        return { error: 'Command not understood' };
    }

    /**
     * Execute system command
     */
    async executeSystemCommand(intent) {
        if (!this.capabilities.system) {
            return {
                error: 'System automation not available',
                help: 'Run native-host/setup.bat to enable system control'
            };
        }

        const patterns = {
            'launch (.+)': async (match) => {
                return await this.systemAutomation.launchApp(match[1]);
            },
            'type (.+)': async (match) => {
                return await this.systemAutomation.type(match[1]);
            },
            'press (.+)': async (match) => {
                return await this.systemAutomation.pressKey(match[1]);
            },
            'screenshot': async () => {
                return await this.systemAutomation.screenshot();
            },
            'click at (\\d+)[, ]+(\\d+)': async (match) => {
                return await this.systemAutomation.click(
                    parseInt(match[1]),
                    parseInt(match[2])
                );
            }
        };

        for (const [pattern, handler] of Object.entries(patterns)) {
            const regex = new RegExp(pattern, 'i');
            const match = intent.command.match(regex);
            if (match) {
                return await handler(match);
            }
        }

        // Try to find and click by text
        if (intent.command.includes('click')) {
            const text = intent.command.replace(/click( on)?/i, '').trim();
            return await this.systemAutomation.findAndClick({ text });
        }

        return { error: 'System command not understood' };
    }

    /**
     * Execute complex workflow
     */
    async executeWorkflow(intent) {
        const workflows = {
            'morning routine': async () => {
                const tasks = [];

                // Browser tasks
                if (this.capabilities.browser) {
                    window.open('https://gmail.com', '_blank');
                    window.open('https://calendar.google.com', '_blank');
                    window.open('https://news.google.com', '_blank');
                    tasks.push('Opened browser tabs');
                }

                // System tasks
                if (this.capabilities.system) {
                    await this.systemAutomation.launchApp('notepad');
                    await this.systemAutomation.type('Today\'s Tasks:\n\n');
                    tasks.push('Created task list');
                }

                // Voice greeting
                if (this.capabilities.voice) {
                    await this.systemAutomation.speak('Good morning! Your workspace is ready.');
                    tasks.push('Voice greeting');
                }

                return { success: true, tasks };
            },

            'create presentation': async () => {
                if (!this.capabilities.system) {
                    return { error: 'System automation required' };
                }

                const topic = intent.command.match(/about (.+)/i)?.[1] || 'General';

                // Launch PowerPoint
                await this.systemAutomation.launchApp('powerpoint');
                await this.delay(3000);

                // Create slides
                await this.systemAutomation.hotkey('ctrl', 'n');
                await this.delay(1000);
                await this.systemAutomation.type(`${topic} Presentation`);

                return { success: true, message: `Created presentation about ${topic}` };
            },

            'daily report': async () => {
                const report = {
                    date: new Date().toLocaleDateString(),
                    tasks: [],
                    data: {}
                };

                // Collect browser data
                if (this.capabilities.browser) {
                    const emails = await this.browserAutomation.intelligentScrape({
                        selector: '.email-count',
                        extractText: true
                    });
                    report.data.emails = emails;
                }

                // System info
                if (this.capabilities.system) {
                    const sysInfo = await this.systemAutomation.getSystemInfo();
                    report.data.system = sysInfo;
                }

                // Generate with AI
                if (this.capabilities.ai) {
                    const summary = await this.generateAISummary(report);
                    report.summary = summary;
                }

                return report;
            }
        };

        // Match workflow
        for (const [name, handler] of Object.entries(workflows)) {
            if (intent.command.toLowerCase().includes(name)) {
                return await handler();
            }
        }

        return { error: 'Workflow not found' };
    }

    /**
     * Execute AI command
     */
    async executeAICommand(intent) {
        if (!this.capabilities.gemini) {
            return {
                error: 'Gemini AI not available',
                help: 'Ensure Google APIs are authenticated and Gemini key is configured'
            };
        }

        // Send to Gemini API through native host
        const result = await this.systemAutomation.sendMessage('gemini', {
            prompt: intent.command,
            context: {
                capabilities: this.capabilities,
                currentPage: window.location.href,
                userEmail: this.userEmail
            }
        });

        return result;
    }

    /**
     * Gmail operations
     */
    async gmailCommand(operation, params = {}) {
        if (!this.capabilities.gmail) {
            return { error: 'Gmail API not available' };
        }

        return await this.systemAutomation.sendMessage('gmail', {
            operation: operation,
            params: params
        });
    }

    /**
     * Google Drive operations
     */
    async driveCommand(operation, params = {}) {
        if (!this.capabilities.drive) {
            return { error: 'Google Drive API not available' };
        }

        return await this.systemAutomation.sendMessage('drive', {
            operation: operation,
            params: params
        });
    }

    /**
     * Google Sheets operations
     */
    async sheetsCommand(operation, params = {}) {
        if (!this.capabilities.sheets) {
            return { error: 'Google Sheets API not available' };
        }

        return await this.systemAutomation.sendMessage('sheets', {
            operation: operation,
            params: params
        });
    }

    /**
     * Google Calendar operations
     */
    async calendarCommand(operation, params = {}) {
        if (!this.capabilities.calendar) {
            return { error: 'Google Calendar API not available' };
        }

        return await this.systemAutomation.sendMessage('calendar', {
            operation: operation,
            params: params
        });
    }

    /**
     * Gemini AI request
     */
    async askGemini(prompt, context = null) {
        if (!this.capabilities.gemini) {
            return { error: 'Gemini API not available' };
        }

        return await this.systemAutomation.sendMessage('gemini', {
            prompt: prompt,
            context: context || {
                currentPage: window.location.href,
                userEmail: this.userEmail
            }
        });
    }

    /**
     * Google Search Console operations
     */
    async searchConsoleCommand(operation, params = {}) {
        if (!this.capabilities.google) {
            return { error: 'Search Console API not available' };
        }

        return await this.systemAutomation.sendMessage('searchconsole', {
            operation: operation,
            params: params
        });
    }

    /**
     * Fact Check operations
     */
    async factCheckCommand(operation, params = {}) {
        if (!this.capabilities.system) {
            return { error: 'Fact Check API not available' };
        }

        return await this.systemAutomation.sendMessage('factcheck', {
            operation: operation,
            params: params
        });
    }

    /**
     * Document AI operations
     */
    async documentAICommand(operation, params = {}) {
        if (!this.capabilities.google) {
            return { error: 'Document AI API not available' };
        }

        return await this.systemAutomation.sendMessage('documentai', {
            operation: operation,
            params: params
        });
    }

    /**
     * API Keys management operations
     */
    async apiKeysCommand(operation, params = {}) {
        if (!this.capabilities.google) {
            return { error: 'API Keys management not available' };
        }

        return await this.systemAutomation.sendMessage('apikeys', {
            operation: operation,
            params: params
        });
    }

    /**
     * Chrome Verified Access operations
     */
    async verifiedAccessCommand(operation, params = {}) {
        if (!this.capabilities.google) {
            return { error: 'Verified Access API not available' };
        }

        return await this.systemAutomation.sendMessage('verifiedaccess', {
            operation: operation,
            params: params
        });
    }

    /**
     * Handle unknown command with AI fallback
     */
    async handleUnknownCommand(command) {
        // Try AI if available
        if (this.capabilities.ai) {
            return await this.executeAICommand({ command });
        }

        // Suggest similar commands
        const suggestions = [
            'open [website]',
            'search for [query]',
            'extract all [emails/links/images]',
            'launch [application]',
            'type [text]',
            'take screenshot',
            'morning routine'
        ];

        return {
            error: 'Command not understood',
            suggestions,
            help: 'Try one of the suggested commands'
        };
    }

    /**
     * Voice command interface
     */
    async voiceCommand() {
        if (!this.capabilities.voice) {
            return { error: 'Voice not available' };
        }

        // Listen for command
        await this.systemAutomation.speak('Listening...');
        const result = await this.systemAutomation.listen();

        if (result.success && result.text) {
            // Execute command
            const response = await this.execute(result.text);

            // Speak response
            if (response.success) {
                await this.systemAutomation.speak('Task completed');
            } else {
                await this.systemAutomation.speak('Sorry, I couldn\'t do that');
            }

            return response;
        }

        return { error: 'No voice input detected' };
    }

    /**
     * Interactive command builder
     */
    async buildCommand() {
        const command = {
            action: '',
            target: '',
            data: {}
        };

        // Step 1: Choose action
        const actions = [
            'Open/Navigate',
            'Search',
            'Extract Data',
            'Launch App',
            'Type Text',
            'Click',
            'Screenshot',
            'Automate'
        ];

        // This would typically show a UI, but for now return structure
        return {
            available_actions: actions,
            help: 'Choose an action and provide details'
        };
    }

    /**
     * Learn from user actions
     */
    async learnFromUser() {
        // Start recording user actions
        if (this.browserAutomation) {
            const recordId = await this.browserAutomation.startRecording();

            // User performs actions...

            // Stop and save
            setTimeout(async () => {
                const macro = await this.browserAutomation.stopRecording('User Macro');
                console.log('Learned macro:', macro);
            }, 30000); // Record for 30 seconds

            return {
                status: 'recording',
                message: 'Perform actions to teach the assistant. Recording for 30 seconds...'
            };
        }

        return { error: 'Recording not available' };
    }

    /**
     * Generate AI summary
     */
    async generateAISummary(data) {
        if (!this.capabilities.ai) {
            return 'AI not available';
        }

        const response = await chrome.runtime.sendMessage({
            action: 'assistantMessage',
            message: `Summarize this data: ${JSON.stringify(data)}`,
            context: { task: 'summarize' }
        });

        return response.reply || 'Summary not available';
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get status report
     */
    getStatus() {
        return {
            capabilities: this.capabilities,
            ready: Object.values(this.capabilities).some(v => v),
            features: {
                browser: this.capabilities.browser ?
                    ['Web automation', 'Data extraction', 'Form filling'] : [],
                system: this.capabilities.system ?
                    ['App control', 'Mouse/keyboard', 'Screenshots', 'File operations'] : [],
                ai: this.capabilities.ai ?
                    ['Natural language', 'Content generation', 'Analysis'] : [],
                voice: this.capabilities.voice ?
                    ['Voice commands', 'Text-to-speech'] : []
            }
        };
    }
}

// ============= POWER USER COMMANDS =============

const POWER_COMMANDS = {
    // Productivity
    'schedule meeting with [person] at [time]': async (person, time) => {
        // Open calendar
        window.open('https://calendar.google.com', '_blank');
        // Would need calendar API integration
    },

    'summarize this page': async () => {
        const text = document.body.innerText;
        // Send to AI for summarization
        return { text: text.substring(0, 1000) + '...' };
    },

    // Development
    'create react component [name]': async (name) => {
        const template = `import React from 'react';

const ${name} = () => {
    return (
        <div>
            <h1>${name} Component</h1>
        </div>
    );
};

export default ${name};`;

        // Copy to clipboard
        navigator.clipboard.writeText(template);
        return { success: true, message: 'Component template copied to clipboard' };
    },

    // Research
    'research [topic] and create report': async (topic) => {
        // Open multiple sources
        const sources = [
            `https://google.com/search?q=${topic}`,
            `https://scholar.google.com/scholar?q=${topic}`,
            `https://en.wikipedia.org/wiki/${topic}`
        ];

        sources.forEach(url => window.open(url, '_blank'));
        return { success: true, sources: sources.length };
    },

    // Automation
    'backup my work': async () => {
        // Would trigger backup workflow
        return { success: true, message: 'Backup initiated' };
    }
};

// Initialize the unified assistant
const unifiedAssistant = new UnifiedAssistant();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAssistant;
}

// Make available globally
window.UnifiedAssistant = unifiedAssistant;
