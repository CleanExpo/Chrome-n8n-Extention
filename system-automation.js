/**
 * System Automation Controller
 * Communicates with native host for system-level control
 */

class SystemAutomation {
    constructor() {
        this.port = null;
        this.connected = false;
        this.callbacks = new Map();
        this.messageId = 0;
    }

    /**
     * Connect to native host
     */
    async connect() {
        try {
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                throw new Error('Chrome extension API not available');
            }

            this.port = chrome.runtime.connectNative('com.n8n.assistant');

            this.port.onMessage.addListener((message) => {
                this.handleResponse(message);
            });

            this.port.onDisconnect.addListener(() => {
                this.connected = false;
                console.error('Native host disconnected:', chrome.runtime.lastError);
            });

            this.connected = true;
            console.log('🔌 Connected to native host');

            return { success: true };

        } catch (error) {
            console.error('Failed to connect to native host:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send message to native host
     */
    sendMessage(action, data) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to native host'));
                return;
            }

            const id = this.messageId++;
            const message = { id, action, ...data };

            this.callbacks.set(id, { resolve, reject });
            this.port.postMessage(message);

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle response from native host
     */
    handleResponse(message) {
        if (message.id !== undefined && this.callbacks.has(message.id)) {
            const callback = this.callbacks.get(message.id);
            this.callbacks.delete(message.id);

            if (message.success) {
                callback.resolve(message);
            } else {
                callback.reject(new Error(message.error));
            }
        }
    }

    // ============= MOUSE CONTROL =============

    /**
     * Move mouse to position
     */
    async moveMouse(x, y, duration = 0.1) {
        return this.sendMessage('mouse', {
            data: { type: 'move', x, y, duration }
        });
    }

    /**
     * Click at position
     */
    async click(x, y, button = 'left', clicks = 1) {
        return this.sendMessage('mouse', {
            data: { type: 'click', x, y, button, clicks }
        });
    }

    /**
     * Drag from current position to target
     */
    async drag(x, y, duration = 0.5, button = 'left') {
        return this.sendMessage('mouse', {
            data: { type: 'drag', x, y, duration, button }
        });
    }

    /**
     * Scroll mouse wheel
     */
    async scroll(amount = 3) {
        return this.sendMessage('mouse', {
            data: { type: 'scroll', amount }
        });
    }

    // ============= KEYBOARD CONTROL =============

    /**
     * Type text
     */
    async type(text, interval = 0.05) {
        return this.sendMessage('keyboard', {
            data: { type: 'type', text, interval }
        });
    }

    /**
     * Press hotkey combination
     */
    async hotkey(...keys) {
        return this.sendMessage('keyboard', {
            data: { type: 'hotkey', keys }
        });
    }

    /**
     * Press single key
     */
    async pressKey(key) {
        return this.sendMessage('keyboard', {
            data: { type: 'press', key }
        });
    }

    // ============= SCREEN CAPTURE & OCR =============

    /**
     * Take screenshot
     */
    async screenshot(options = {}) {
        return this.sendMessage('screenshot', { options });
    }

    /**
     * Take screenshot with OCR
     */
    async screenshotWithOCR(region = null) {
        return this.sendMessage('screenshot', {
            options: { ocr: true, region }
        });
    }

    /**
     * Find and click element by image/text/color
     */
    async findAndClick(target) {
        return this.sendMessage('find_click', { target });
    }

    // ============= WINDOW MANAGEMENT =============

    /**
     * Get list of open windows
     */
    async listWindows() {
        return this.sendMessage('window', {
            data: { type: 'list' }
        });
    }

    /**
     * Focus window by title
     */
    async focusWindow(title) {
        return this.sendMessage('window', {
            data: { type: 'focus', title }
        });
    }

    /**
     * Minimize window
     */
    async minimizeWindow(title) {
        return this.sendMessage('window', {
            data: { type: 'minimize', title }
        });
    }

    /**
     * Maximize window
     */
    async maximizeWindow(title) {
        return this.sendMessage('window', {
            data: { type: 'maximize', title }
        });
    }

    /**
     * Close window
     */
    async closeWindow(title) {
        return this.sendMessage('window', {
            data: { type: 'close', title }
        });
    }

    // ============= APPLICATION CONTROL =============

    /**
     * Launch application
     */
    async launchApp(appName) {
        return this.sendMessage('launch', {
            app: { name: appName }
        });
    }

    /**
     * Execute shell command
     */
    async executeCommand(command) {
        return this.sendMessage('execute', {
            command: { type: 'shell', command }
        });
    }

    // ============= FILE OPERATIONS =============

    /**
     * Read file
     */
    async readFile(path) {
        return this.sendMessage('file', {
            operation: { type: 'read', path }
        });
    }

    /**
     * Write file
     */
    async writeFile(path, content) {
        return this.sendMessage('file', {
            operation: { type: 'write', path, content }
        });
    }

    /**
     * List directory
     */
    async listFiles(path) {
        return this.sendMessage('file', {
            operation: { type: 'list', path }
        });
    }

    // ============= VOICE CONTROL =============

    /**
     * Text to speech
     */
    async speak(text) {
        return this.sendMessage('voice', {
            data: { type: 'speak', text }
        });
    }

    /**
     * Speech to text
     */
    async listen() {
        return this.sendMessage('voice', {
            data: { type: 'listen' }
        });
    }

    // ============= SYSTEM INFO =============

    /**
     * Get system information
     */
    async getSystemInfo() {
        return this.sendMessage('system_info', {});
    }

    // ============= HIGH-LEVEL AUTOMATION =============

    /**
     * Open application and perform action
     */
    async automateApp(appName, actions) {
        // Launch app
        await this.launchApp(appName);

        // Wait for app to open
        await this.delay(2000);

        // Perform actions
        for (const action of actions) {
            await this.performAction(action);
        }
    }

    /**
     * Perform complex action
     */
    async performAction(action) {
        switch (action.type) {
            case 'type':
                await this.type(action.text);
                break;

            case 'click':
                await this.click(action.x, action.y);
                break;

            case 'hotkey':
                await this.hotkey(...action.keys);
                break;

            case 'wait':
                await this.delay(action.duration);
                break;

            case 'findClick':
                await this.findAndClick(action.target);
                break;

            default:
                console.warn('Unknown action type:', action.type);
        }
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============= POWERFUL AUTOMATION EXAMPLES =============

class PowerAutomation {
    constructor() {
        this.system = new SystemAutomation();
    }

    /**
     * Create professional presentation
     */
    async createPresentation(topic) {
        // Open PowerPoint
        await this.system.launchApp('powerpoint');
        await this.system.delay(3000);

        // Create new presentation
        await this.system.hotkey('ctrl', 'n');
        await this.system.delay(1000);

        // Add title slide
        await this.system.type(`${topic} Presentation`);
        await this.system.pressKey('tab');
        await this.system.type(`Created by AI Assistant\n${new Date().toLocaleDateString()}`);

        // Add content slides
        for (let i = 1; i <= 5; i++) {
            await this.system.hotkey('ctrl', 'enter'); // New slide
            await this.system.type(`Slide ${i}: Key Point`);
            await this.system.pressKey('tab');
            await this.system.type(`• Important detail ${i}\n• Supporting information\n• Action items`);
        }

        return { success: true, message: 'Presentation created' };
    }

    /**
     * Automate data entry across multiple applications
     */
    async crossAppDataEntry(data) {
        // Open Excel
        await this.system.launchApp('excel');
        await this.system.delay(2000);

        // Enter data in Excel
        for (const row of data) {
            await this.system.type(row.join('\t'));
            await this.system.pressKey('enter');
        }

        // Copy data
        await this.system.hotkey('ctrl', 'a');
        await this.system.hotkey('ctrl', 'c');

        // Open web browser
        await this.system.launchApp('chrome');
        await this.system.delay(2000);

        // Navigate to form
        await this.system.type('https://example.com/form');
        await this.system.pressKey('enter');
        await this.system.delay(3000);

        // Paste data
        await this.system.hotkey('ctrl', 'v');

        return { success: true, message: 'Data transferred' };
    }

    /**
     * Morning routine automation
     */
    async morningRoutine() {
        const tasks = [];

        // Open email
        await this.system.launchApp('chrome');
        await this.system.delay(2000);
        await this.system.type('gmail.com');
        await this.system.pressKey('enter');
        tasks.push('Email opened');

        // Open calendar in new tab
        await this.system.hotkey('ctrl', 't');
        await this.system.type('calendar.google.com');
        await this.system.pressKey('enter');
        tasks.push('Calendar opened');

        // Open task manager
        await this.system.hotkey('ctrl', 't');
        await this.system.type('todoist.com');
        await this.system.pressKey('enter');
        tasks.push('Task manager opened');

        // Open news
        await this.system.hotkey('ctrl', 't');
        await this.system.type('news.google.com');
        await this.system.pressKey('enter');
        tasks.push('News opened');

        // Speak greeting
        await this.system.speak('Good morning! Your workspace is ready.');

        return { success: true, tasks };
    }

    /**
     * Smart screenshot with analysis
     */
    async smartScreenshot() {
        // Take screenshot with OCR
        const result = await this.system.screenshotWithOCR();

        if (result.text) {
            // Analyze text
            const analysis = {
                wordCount: result.text.split(/\s+/).length,
                hasEmail: /\S+@\S+\.\S+/.test(result.text),
                hasPhone: /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(result.text),
                hasUrl: /https?:\/\/\S+/.test(result.text)
            };

            return {
                ...result,
                analysis
            };
        }

        return result;
    }

    /**
     * Voice-controlled automation
     */
    async voiceControl() {
        await this.system.speak('What would you like me to do?');
        const command = await this.system.listen();

        // Parse voice command
        if (command.text.includes('open')) {
            const app = command.text.split('open')[1].trim();
            await this.system.launchApp(app);
            await this.system.speak(`Opening ${app}`);
        } else if (command.text.includes('type')) {
            const text = command.text.split('type')[1].trim();
            await this.system.type(text);
        } else if (command.text.includes('search')) {
            const query = command.text.split('search')[1].trim();
            await this.system.type(`https://google.com/search?q=${query}`);
            await this.system.pressKey('enter');
        }

        return { command: command.text };
    }
}

// Initialize system automation
const systemAutomation = new SystemAutomation();
const powerAutomation = new PowerAutomation();

// Export for Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SystemAutomation, PowerAutomation };
}