/**
 * AI Command Processor
 * Natural language understanding and task execution
 */

class AICommandProcessor {
    constructor() {
        this.commands = new Map();
        this.context = {
            lastCommand: null,
            history: [],
            userData: {},
            currentTask: null
        };

        this.initializeCommands();
    }

    /**
     * Initialize command patterns
     */
    initializeCommands() {
        // Web browsing commands
        this.registerCommand(/^(open|go to|navigate to|visit)\s+(.+)$/i, this.navigateTo);
        this.registerCommand(/^search\s+(for\s+)?(.+)\s+(on|in)\s+(\w+)$/i, this.searchWeb);
        this.registerCommand(/^(download|save)\s+all\s+(.+)\s+from\s+(this\s+)?page$/i, this.downloadFiles);

        // Data extraction
        this.registerCommand(/^(extract|scrape|get)\s+(.+)\s+from\s+(this\s+)?page$/i, this.extractData);
        this.registerCommand(/^(copy|get)\s+all\s+(\w+)\s+(from\s+)?(this\s+)?page$/i, this.extractSpecific);

        // Form automation
        this.registerCommand(/^fill\s+(out\s+)?(.+)\s+form\s+with\s+(.+)$/i, this.fillForm);
        this.registerCommand(/^(submit|send)\s+(the\s+)?form$/i, this.submitForm);

        // Task automation
        this.registerCommand(/^(automate|run)\s+(.+)$/i, this.runAutomation);
        this.registerCommand(/^schedule\s+(.+)\s+at\s+(.+)$/i, this.scheduleTask);
        this.registerCommand(/^repeat\s+(.+)\s+(\d+)\s+times$/i, this.repeatTask);

        // File operations
        this.registerCommand(/^organize\s+(.+)\s+folder$/i, this.organizeFolder);
        this.registerCommand(/^create\s+(.+)\s+file\s+(with\s+)?(.*)$/i, this.createFile);

        // Communication
        this.registerCommand(/^(send|write)\s+(an?\s+)?email\s+to\s+(.+)\s+about\s+(.+)$/i, this.composeEmail);
        this.registerCommand(/^reply\s+to\s+(.+)\s+with\s+(.+)$/i, this.replyToMessage);

        // Research
        this.registerCommand(/^research\s+(.+)\s+and\s+(.+)$/i, this.researchTopic);
        this.registerCommand(/^summarize\s+(this\s+)?(page|article|document)$/i, this.summarizePage);

        // Monitoring
        this.registerCommand(/^(monitor|watch)\s+(.+)\s+for\s+(.+)$/i, this.monitorChanges);
        this.registerCommand(/^alert\s+me\s+when\s+(.+)$/i, this.setAlert);

        // Multi-step workflows
        this.registerCommand(/^book\s+(.+)\s+(flight|hotel|ticket)\s+(.+)$/i, this.bookTravel);
        this.registerCommand(/^order\s+(.+)\s+from\s+(.+)$/i, this.orderOnline);

        // Learning commands
        this.registerCommand(/^learn\s+(.+)\s+as\s+(.+)$/i, this.learnCommand);
        this.registerCommand(/^forget\s+(.+)$/i, this.forgetCommand);
    }

    /**
     * Process natural language command
     */
    async processCommand(input) {
        console.log('🎯 Processing command:', input);

        // Store in history
        this.context.history.push({
            command: input,
            timestamp: Date.now()
        });

        // Check for learned commands first
        const learnedCommand = this.checkLearnedCommands(input);
        if (learnedCommand) {
            return await this.executeLearned(learnedCommand);
        }

        // Try to match command patterns
        for (const [pattern, handler] of this.commands) {
            const match = input.match(pattern);
            if (match) {
                try {
                    const result = await handler.call(this, ...match.slice(1));
                    this.context.lastCommand = { input, result, success: true };
                    return {
                        success: true,
                        action: handler.name,
                        result: result,
                        message: this.generateSuccessMessage(handler.name, result)
                    };
                } catch (error) {
                    this.context.lastCommand = { input, error, success: false };
                    return {
                        success: false,
                        error: error.message,
                        suggestion: this.suggestAlternative(input, error)
                    };
                }
            }
        }

        // If no pattern matches, use AI to understand intent
        return await this.interpretWithAI(input);
    }

    /**
     * Register a command pattern
     */
    registerCommand(pattern, handler) {
        this.commands.set(pattern, handler);
    }

    /**
     * Navigate to URL or search
     */
    async navigateTo(destination) {
        // Check if it's a URL or a site name
        if (destination.includes('.') || destination.startsWith('http')) {
            // Direct URL
            const url = destination.startsWith('http') ? destination : `https://${destination}`;
            window.location.href = url;
        } else {
            // Site name - search for it
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(destination)}+site&btnI=1`;
            window.location.href = searchUrl;
        }

        return { action: 'navigation', destination };
    }

    /**
     * Search web
     */
    async searchWeb(prefix, query, preposition, engine) {
        const engines = {
            google: 'https://www.google.com/search?q=',
            youtube: 'https://www.youtube.com/results?search_query=',
            amazon: 'https://www.amazon.com/s?k=',
            github: 'https://github.com/search?q=',
            stackoverflow: 'https://stackoverflow.com/search?q=',
            reddit: 'https://www.reddit.com/search/?q='
        };

        const searchEngine = engines[engine.toLowerCase()] || engines.google;
        const searchUrl = searchEngine + encodeURIComponent(query);

        window.open(searchUrl, '_blank');
        return { action: 'search', query, engine };
    }

    /**
     * Extract data from page
     */
    async extractData(action, dataType) {
        const extractors = {
            'emails': () => this.extractEmails(),
            'links': () => this.extractLinks(),
            'images': () => this.extractImages(),
            'text': () => this.extractText(),
            'tables': () => this.extractTables(),
            'prices': () => this.extractPrices(),
            'dates': () => this.extractDates(),
            'phone numbers': () => this.extractPhoneNumbers()
        };

        const extractor = extractors[dataType.toLowerCase()];
        if (extractor) {
            const data = extractor();

            // Store extracted data
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    [`extracted_${Date.now()}`]: {
                        type: dataType,
                        data: data,
                        url: window.location.href,
                        timestamp: Date.now()
                    }
                });
            }

            return { action: 'extract', dataType, count: data.length, data };
        }

        throw new Error(`Don't know how to extract ${dataType}`);
    }

    /**
     * Extract emails from page
     */
    extractEmails() {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const text = document.body.innerText;
        const emails = text.match(emailRegex) || [];
        return [...new Set(emails)]; // Remove duplicates
    }

    /**
     * Extract links from page
     */
    extractLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.map(link => ({
            text: link.textContent.trim(),
            url: link.href,
            target: link.target
        }));
    }

    /**
     * Extract images from page
     */
    extractImages() {
        const images = Array.from(document.querySelectorAll('img'));
        return images.map(img => ({
            src: img.src,
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight
        }));
    }

    /**
     * Extract prices from page
     */
    extractPrices() {
        const priceRegex = /[$€£¥]\s*\d+([.,]\d{2})?|\d+([.,]\d{2})?\s*[$€£¥]/g;
        const text = document.body.innerText;
        const prices = text.match(priceRegex) || [];
        return [...new Set(prices)];
    }

    /**
     * Research topic
     */
    async researchTopic(topic, action) {
        const actions = {
            'summarize': async () => {
                // Open multiple sources
                const sources = [
                    `https://www.google.com/search?q=${encodeURIComponent(topic)}`,
                    `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
                    `https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`
                ];

                for (const source of sources) {
                    window.open(source, '_blank');
                }

                return { action: 'research', topic, sources: sources.length };
            },
            'create report': async () => {
                // Collect data and create report
                const data = await this.gatherResearchData(topic);
                const report = await this.createReport(topic, data);
                return { action: 'report', topic, report };
            },
            'save notes': async () => {
                // Extract and save research notes
                const notes = await this.extractResearchNotes();
                await this.saveNotes(topic, notes);
                return { action: 'notes', topic, count: notes.length };
            }
        };

        const handler = actions[action] || actions.summarize;
        return await handler();
    }

    /**
     * Fill form with data
     */
    async fillForm(prefix, formType, data) {
        // Parse data (could be JSON or natural language)
        const formData = this.parseFormData(data);

        // Find form elements
        const form = document.querySelector('form');
        if (!form) {
            throw new Error('No form found on page');
        }

        // Fill each field
        for (const [field, value] of Object.entries(formData)) {
            const input = form.querySelector(`[name="${field}"], [placeholder*="${field}"], [id*="${field}"]`);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        return { action: 'fillForm', fields: Object.keys(formData).length };
    }

    /**
     * Book travel
     */
    async bookTravel(details, type, moreDetails) {
        const bookingSteps = {
            flight: [
                { action: 'navigate', url: 'https://www.google.com/flights' },
                { action: 'fillForm', data: this.parseFlightDetails(details, moreDetails) },
                { action: 'search' },
                { action: 'selectBest' },
                { action: 'proceedToBooking' }
            ],
            hotel: [
                { action: 'navigate', url: 'https://www.booking.com' },
                { action: 'fillForm', data: this.parseHotelDetails(details, moreDetails) },
                { action: 'search' },
                { action: 'filterResults' },
                { action: 'selectBest' }
            ]
        };

        const steps = bookingSteps[type] || bookingSteps.flight;

        // Execute booking workflow
        for (const step of steps) {
            await this.executeBookingStep(step);
        }

        return { action: 'booking', type, status: 'initiated' };
    }

    /**
     * Monitor changes on page
     */
    async monitorChanges(action, target, condition) {
        const monitor = {
            id: Date.now().toString(),
            target: target,
            condition: condition,
            interval: 60000, // Check every minute
            active: true
        };

        // Start monitoring
        const intervalId = setInterval(async () => {
            const currentValue = await this.getMonitorValue(target);
            if (this.checkCondition(currentValue, condition)) {
                // Condition met - trigger alert
                this.triggerAlert({
                    message: `Condition met: ${target} ${condition}`,
                    value: currentValue
                });

                // Stop monitoring
                clearInterval(intervalId);
                monitor.active = false;
            }
        }, monitor.interval);

        // Store monitor
        this.context.monitors = this.context.monitors || new Map();
        this.context.monitors.set(monitor.id, { ...monitor, intervalId });

        return { action: 'monitor', id: monitor.id, target, condition };
    }

    /**
     * Interpret command using AI
     */
    async interpretWithAI(input) {
        // Use OpenAI to understand intent
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'interpretCommand',
                    command: input,
                    context: this.context
                });

                if (response.success) {
                    // Execute interpreted action
                    return await this.executeInterpretedAction(response.interpretation);
                }
            } catch (error) {
                console.error('AI interpretation failed:', error);
            }
        }

        // Fallback suggestion
        return {
            success: false,
            message: "I didn't understand that command. Try rephrasing or use 'help' for examples.",
            suggestions: this.getSimilarCommands(input)
        };
    }

    /**
     * Learn new command
     */
    async learnCommand(action, name) {
        // Record current page state and actions
        const learning = {
            name: name,
            pattern: action,
            steps: [],
            created: Date.now()
        };

        // Store in learned commands
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const stored = await chrome.storage.local.get('learnedCommands') || {};
            stored.learnedCommands = stored.learnedCommands || {};
            stored.learnedCommands[name] = learning;
            await chrome.storage.local.set(stored);
        }

        return { action: 'learn', name, status: 'learned' };
    }

    /**
     * Execute learned command
     */
    async executeLearned(command) {
        // Replay learned steps
        for (const step of command.steps) {
            await this.executeStep(step);
        }

        return { action: 'learned', name: command.name, steps: command.steps.length };
    }

    /**
     * Generate success message
     */
    generateSuccessMessage(action, result) {
        const messages = {
            navigateTo: `Navigated to ${result.destination}`,
            searchWeb: `Searching for "${result.query}" on ${result.engine}`,
            extractData: `Extracted ${result.count} ${result.dataType}`,
            fillForm: `Filled ${result.fields} form fields`,
            bookTravel: `Started ${result.type} booking process`,
            monitor: `Now monitoring ${result.target} for ${result.condition}`
        };

        return messages[action] || `Successfully completed ${action}`;
    }

    /**
     * Suggest alternative command
     */
    suggestAlternative(input, error) {
        // Find similar commands
        const similar = this.getSimilarCommands(input);

        if (similar.length > 0) {
            return `Did you mean: ${similar[0]}?`;
        }

        return 'Try rephrasing your command or type "help" for examples.';
    }

    /**
     * Get similar commands
     */
    getSimilarCommands(input) {
        const examples = [
            'open gmail',
            'search for restaurants on google',
            'download all PDFs from this page',
            'extract emails from this page',
            'fill contact form with my details',
            'research quantum computing and summarize',
            'monitor price for changes',
            'book flight to New York next Friday'
        ];

        // Simple similarity check (could use more sophisticated algorithm)
        return examples.filter(example => {
            const inputWords = input.toLowerCase().split(' ');
            const exampleWords = example.toLowerCase().split(' ');
            return inputWords.some(word => exampleWords.includes(word));
        });
    }
}

// Initialize AI command processor
const aiCommandProcessor = new AICommandProcessor();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICommandProcessor;
}