/**
 * Browser Automation Engine
 * Advanced browser control and automation capabilities
 */

class BrowserAutomation {
    constructor() {
        this.recordings = [];
        this.macros = new Map();
        this.isRecording = false;
        this.executionQueue = [];
        this.activeAutomation = null;
    }

    /**
     * Initialize browser automation
     */
    async initialize() {
        console.log('🤖 Browser Automation Engine initialized');

        // Set up event listeners for recording
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleAutomationCommand(request, sendResponse);
                return true; // Keep channel open for async response
            });
        }
    }

    /**
     * Handle automation commands
     */
    async handleAutomationCommand(request, sendResponse) {
        try {
            switch (request.action) {
                case 'startRecording':
                    const recordId = await this.startRecording();
                    sendResponse({ success: true, recordId });
                    break;

                case 'stopRecording':
                    const macro = await this.stopRecording(request.name);
                    sendResponse({ success: true, macro });
                    break;

                case 'playMacro':
                    await this.playMacro(request.macroId);
                    sendResponse({ success: true });
                    break;

                case 'automateTask':
                    const result = await this.automateTask(request.task);
                    sendResponse({ success: true, result });
                    break;

                case 'scrapeData':
                    const data = await this.intelligentScrape(request.config);
                    sendResponse({ success: true, data });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Start recording user actions
     */
    async startRecording() {
        this.isRecording = true;
        this.currentRecording = {
            id: Date.now().toString(),
            actions: [],
            startTime: Date.now(),
            url: window.location.href
        };

        // Record clicks
        document.addEventListener('click', this.recordClick);

        // Record form inputs
        document.addEventListener('input', this.recordInput);

        // Record keyboard shortcuts
        document.addEventListener('keydown', this.recordKeypress);

        // Record navigation
        window.addEventListener('beforeunload', this.recordNavigation);

        console.log('🔴 Recording started');
        return this.currentRecording.id;
    }

    /**
     * Stop recording and save macro
     */
    async stopRecording(name) {
        this.isRecording = false;

        // Remove event listeners
        document.removeEventListener('click', this.recordClick);
        document.removeEventListener('input', this.recordInput);
        document.removeEventListener('keydown', this.recordKeypress);
        window.removeEventListener('beforeunload', this.recordNavigation);

        // Save macro
        const macro = {
            ...this.currentRecording,
            name: name || `Macro_${Date.now()}`,
            endTime: Date.now(),
            duration: Date.now() - this.currentRecording.startTime
        };

        this.macros.set(macro.id, macro);

        // Save to storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({
                [`macro_${macro.id}`]: macro
            });
        }

        console.log('⏹️ Recording stopped', macro);
        return macro;
    }

    /**
     * Record click action
     */
    recordClick = (event) => {
        if (!this.isRecording) return;

        const action = {
            type: 'click',
            timestamp: Date.now(),
            target: this.getElementSelector(event.target),
            position: { x: event.clientX, y: event.clientY },
            button: event.button
        };

        this.currentRecording.actions.push(action);
    };

    /**
     * Record input action
     */
    recordInput = (event) => {
        if (!this.isRecording) return;

        const action = {
            type: 'input',
            timestamp: Date.now(),
            target: this.getElementSelector(event.target),
            value: event.target.value,
            inputType: event.inputType
        };

        this.currentRecording.actions.push(action);
    };

    /**
     * Record keypress action
     */
    recordKeypress = (event) => {
        if (!this.isRecording) return;

        // Only record special keys and shortcuts
        if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
            const action = {
                type: 'keypress',
                timestamp: Date.now(),
                key: event.key,
                modifiers: {
                    ctrl: event.ctrlKey,
                    alt: event.altKey,
                    shift: event.shiftKey,
                    meta: event.metaKey
                }
            };

            this.currentRecording.actions.push(action);
        }
    };

    /**
     * Play back a recorded macro
     */
    async playMacro(macroId) {
        const macro = this.macros.get(macroId);
        if (!macro) {
            throw new Error('Macro not found');
        }

        console.log('▶️ Playing macro:', macro.name);

        for (const action of macro.actions) {
            await this.executeAction(action);

            // Add delay between actions
            await this.delay(action.delay || 500);
        }

        console.log('✅ Macro completed');
    }

    /**
     * Execute a single action
     */
    async executeAction(action) {
        switch (action.type) {
            case 'click':
                await this.simulateClick(action);
                break;

            case 'input':
                await this.simulateInput(action);
                break;

            case 'keypress':
                await this.simulateKeypress(action);
                break;

            case 'navigation':
                await this.navigate(action.url);
                break;

            case 'wait':
                await this.delay(action.duration);
                break;

            case 'screenshot':
                await this.takeScreenshot(action);
                break;

            case 'extract':
                return await this.extractData(action);
        }
    }

    /**
     * Simulate click on element
     */
    async simulateClick(action) {
        const element = document.querySelector(action.target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(300);

            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: action.position?.x,
                clientY: action.position?.y,
                button: action.button || 0
            });

            element.dispatchEvent(event);
        }
    }

    /**
     * Simulate input on element
     */
    async simulateInput(action) {
        const element = document.querySelector(action.target);
        if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
            element.focus();
            element.value = action.value;

            // Trigger input event
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Intelligent web scraping
     */
    async intelligentScrape(config) {
        const results = {
            data: [],
            metadata: {
                url: window.location.href,
                timestamp: Date.now(),
                selector: config.selector
            }
        };

        // Auto-detect data patterns if selector not provided
        if (!config.selector) {
            config.selector = this.detectDataPatterns();
        }

        // Extract data
        const elements = document.querySelectorAll(config.selector);

        for (const element of elements) {
            const item = {};

            // Extract text content
            if (config.extractText !== false) {
                item.text = element.textContent.trim();
            }

            // Extract attributes
            if (config.attributes) {
                for (const attr of config.attributes) {
                    item[attr] = element.getAttribute(attr);
                }
            }

            // Extract links
            if (config.extractLinks) {
                const links = element.querySelectorAll('a');
                item.links = Array.from(links).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                }));
            }

            // Extract images
            if (config.extractImages) {
                const images = element.querySelectorAll('img');
                item.images = Array.from(images).map(img => ({
                    src: img.src,
                    alt: img.alt
                }));
            }

            // Custom extraction function
            if (config.customExtractor) {
                Object.assign(item, config.customExtractor(element));
            }

            results.data.push(item);
        }

        // Post-processing
        if (config.filter) {
            results.data = results.data.filter(config.filter);
        }

        if (config.transform) {
            results.data = results.data.map(config.transform);
        }

        return results;
    }

    /**
     * Detect common data patterns on the page
     */
    detectDataPatterns() {
        const patterns = [
            // Tables
            { selector: 'table tr', score: 0 },
            // Lists
            { selector: 'ul li, ol li', score: 0 },
            // Cards
            { selector: '[class*="card"], [class*="item"], [class*="product"]', score: 0 },
            // Articles
            { selector: 'article, [class*="article"], [class*="post"]', score: 0 },
            // Grid items
            { selector: '[class*="grid"] > *, [class*="flex"] > *', score: 0 }
        ];

        // Score each pattern
        for (const pattern of patterns) {
            const elements = document.querySelectorAll(pattern.selector);
            pattern.score = elements.length;
        }

        // Return the best pattern
        const bestPattern = patterns.sort((a, b) => b.score - a.score)[0];
        return bestPattern.score > 0 ? bestPattern.selector : '*';
    }

    /**
     * Advanced task automation
     */
    async automateTask(task) {
        console.log('🤖 Automating task:', task.name);

        const automation = {
            id: Date.now().toString(),
            task: task,
            status: 'running',
            results: []
        };

        this.activeAutomation = automation;

        try {
            // Parse task steps
            for (const step of task.steps) {
                const result = await this.executeStep(step);
                automation.results.push(result);

                // Check conditions
                if (step.condition && !this.evaluateCondition(step.condition, result)) {
                    console.log('Condition not met, skipping remaining steps');
                    break;
                }
            }

            automation.status = 'completed';
        } catch (error) {
            automation.status = 'failed';
            automation.error = error.message;
        }

        this.activeAutomation = null;
        return automation;
    }

    /**
     * Execute automation step
     */
    async executeStep(step) {
        switch (step.type) {
            case 'navigate':
                return await this.navigate(step.url);

            case 'fillForm':
                return await this.fillForm(step.formData);

            case 'extract':
                return await this.intelligentScrape(step.config);

            case 'download':
                return await this.downloadFiles(step.patterns);

            case 'waitFor':
                return await this.waitForElement(step.selector, step.timeout);

            case 'loop':
                return await this.executeLoop(step);

            case 'api':
                return await this.makeAPICall(step);

            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }

    /**
     * Fill form automatically
     */
    async fillForm(formData) {
        const results = [];

        for (const [selector, value] of Object.entries(formData)) {
            const element = document.querySelector(selector);

            if (element) {
                if (element.tagName === 'SELECT') {
                    // Handle select dropdown
                    element.value = value;
                } else if (element.type === 'checkbox' || element.type === 'radio') {
                    // Handle checkboxes and radio buttons
                    element.checked = value;
                } else {
                    // Handle text inputs
                    element.value = value;
                }

                // Trigger events
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));

                results.push({ selector, success: true });
            } else {
                results.push({ selector, success: false, error: 'Element not found' });
            }
        }

        return results;
    }

    /**
     * Download files matching patterns
     */
    async downloadFiles(patterns) {
        const links = document.querySelectorAll('a[href]');
        const downloads = [];

        for (const link of links) {
            const href = link.href;

            // Check if link matches any pattern
            for (const pattern of patterns) {
                const regex = new RegExp(pattern);
                if (regex.test(href)) {
                    // Trigger download
                    if (typeof chrome !== 'undefined' && chrome.downloads) {
                        chrome.downloads.download({
                            url: href,
                            filename: link.textContent.trim() || 'download'
                        });
                    } else {
                        // Fallback: open in new tab
                        window.open(href, '_blank');
                    }

                    downloads.push({
                        url: href,
                        text: link.textContent.trim()
                    });
                }
            }
        }

        return downloads;
    }

    /**
     * Wait for element to appear
     */
    async waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                return { found: true, element: this.getElementInfo(element) };
            }

            await this.delay(500);
        }

        return { found: false, timeout: true };
    }

    /**
     * Execute loop
     */
    async executeLoop(loopConfig) {
        const results = [];
        const { iterations, steps } = loopConfig;

        for (let i = 0; i < iterations; i++) {
            const iterationResults = [];

            for (const step of steps) {
                // Replace variables in step
                const processedStep = this.replaceVariables(step, { index: i });
                const result = await this.executeStep(processedStep);
                iterationResults.push(result);
            }

            results.push(iterationResults);

            // Add delay between iterations
            if (loopConfig.delay) {
                await this.delay(loopConfig.delay);
            }
        }

        return results;
    }

    /**
     * Get element selector
     */
    getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className.split(' ').filter(c => c);
            if (classes.length) {
                return `.${classes[0]}`;
            }
        }

        // Build path selector
        const path = [];
        let current = element;

        while (current && current.tagName) {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
                selector = `#${current.id}`;
                path.unshift(selector);
                break;
            }

            const siblings = current.parentElement ?
                Array.from(current.parentElement.children) : [];

            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }

            path.unshift(selector);
            current = current.parentElement;
        }

        return path.join(' > ');
    }

    /**
     * Helper: delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Replace variables in object
     */
    replaceVariables(obj, variables) {
        const json = JSON.stringify(obj);
        const replaced = json.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
        return JSON.parse(replaced);
    }

    /**
     * Get element info
     */
    getElementInfo(element) {
        return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            text: element.textContent.trim().substring(0, 100),
            href: element.href,
            src: element.src
        };
    }
}

// Initialize browser automation
const browserAutomation = new BrowserAutomation();
browserAutomation.initialize();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserAutomation;
}