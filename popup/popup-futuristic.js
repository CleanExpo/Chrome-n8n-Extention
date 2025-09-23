/**
 * Futuristic Holographic Dashboard JavaScript
 * Integrates with Google Extension AI and provides interactive functionality
 */

class HolographicDashboard {
    constructor() {
        this.isVoiceActive = false;
        this.isAIThinking = false;
        this.currentTasks = [];
        this.apiUsage = 245;
        this.maxApiCalls = 1000;
        
        // Initialize dashboard
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Holographic Dashboard...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize AI assistant connection
        await this.initializeAI();
        
        // Start background animations
        this.startBackgroundEffects();
        
        // Load initial data
        await this.loadDashboardData();
        
        console.log('✅ Holographic Dashboard Ready!');
    }

    setupEventListeners() {
        // Voice Commands
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceCommand());
        }

        // Text Input
        const commandInput = document.getElementById('commandInput');
        if (commandInput) {
            commandInput.addEventListener('input', (e) => this.handleTextInput(e));
            commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    this.processTextCommand(e.target.value);
                }
            });
        }

        // Attach Button
        const attachBtn = document.getElementById('attachBtn');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => this.handleAttachment());
        }

        // Upload Zone
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.addEventListener('click', () => this.handleFileUpload());
            uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        }

        // AI Avatar
        const aiAvatar = document.getElementById('aiAvatar');
        if (aiAvatar) {
            aiAvatar.addEventListener('click', () => this.interactWithAI());
        }

        // Perform Button
        const performBtn = document.getElementById('performBtn');
        if (performBtn) {
            performBtn.addEventListener('click', () => this.executeMainAction());
        }

        // Expand Button
        const expandBtn = document.getElementById('expandBtn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => this.openFullscreen());
        }

        // Settings Button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async initializeAI() {
        try {
            console.log('🚀 Initializing AI connection...');
            
            // First try to get stats from background script
            const response = await this.sendMessageToBackground('getStats');
            
            if (response && response.success) {
                console.log('✅ Background script connected');
                const { stats, apiStatus } = response;
                
                // Update connection status based on background script
                const hasConnection = apiStatus.openai || apiStatus.n8n || apiStatus.integration;
                this.updateConnectionStatus(hasConnection, 'AI APIs');
                
                if (hasConnection) {
                    this.updateAIStatus('Connected', true);
                    this.showNotification('🤖 AI Assistant Connected!', 'success');
                } else {
                    this.updateAIStatus('No API Keys', false);
                    this.showNotification('⚠️ Configure API keys in Settings', 'warning');
                }
                
                // Update API usage from stats
                if (stats.messageCount) {
                    this.apiUsage = Math.min(stats.messageCount * 2, this.maxApiCalls);
                    this.updateApiUsage();
                }
            } else {
                console.warn('Background script not responding');
                this.updateAIStatus('Background Error', false);
                this.updateConnectionStatus(false, 'AI APIs');
                this.showNotification('❌ Extension needs reload', 'error');
            }
        } catch (error) {
            console.error('AI Initialization Error:', error);
            this.updateAIStatus('Connection Failed', false);
            this.updateConnectionStatus(false, 'AI APIs');
            this.showNotification('❌ Connection failed - reload extension', 'error');
        }
    }

    async sendMessageToBackground(action, data = {}) {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage({ action, ...data }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Background message error:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(response);
                    }
                });
            } catch (error) {
                console.error('Send message error:', error);
                resolve(null);
            }
        });
    }

    startBackgroundEffects() {
        // Animate particles
        this.animateParticles();
        
        // Update AI avatar expressions
        this.updateAvatarExpressions();
        
        // Animate energy rings
        this.animateEnergyRings();
        
        // Update task progress
        this.animateTaskProgress();
    }

    animateParticles() {
        // Enhanced particle system could be added here
        setInterval(() => {
            const particles = document.querySelector('.particles-bg');
            if (particles) {
                particles.style.animationDuration = `${18 + Math.random() * 4}s`;
            }
        }, 10000);
    }

    updateAvatarExpressions() {
        const avatar = document.getElementById('aiAvatar');
        const eyes = document.querySelectorAll('.eye');
        
        setInterval(() => {
            if (this.isAIThinking) {
                // Thinking expression
                eyes.forEach(eye => {
                    eye.style.background = '#00d4ff';
                    eye.style.boxShadow = '0 0 10px #00d4ff';
                });
            } else {
                // Normal expression
                eyes.forEach(eye => {
                    eye.style.background = '#ffffff';
                    eye.style.boxShadow = 'none';
                });
            }
        }, 500);
    }

    animateEnergyRings() {
        const rings = document.querySelectorAll('.energy-ring');
        let intensity = 0.3;
        
        setInterval(() => {
            intensity = 0.3 + Math.random() * 0.4;
            rings.forEach((ring, index) => {
                ring.style.opacity = intensity + (index * 0.1);
                ring.style.borderWidth = `${2 + Math.random() * 2}px`;
            });
        }, 2000);
    }

    animateTaskProgress() {
        const progressCircle = document.querySelector('.progress-circle');
        let progress = 75;
        
        setInterval(() => {
            if (this.currentTasks.length > 0) {
                progress = Math.min(progress + Math.random() * 2, 100);
                const circumference = 2 * Math.PI * 18;
                const offset = circumference - (progress / 100) * circumference;
                
                if (progressCircle) {
                    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
                    progressCircle.style.strokeDashoffset = offset;
                }
                
                const progressText = document.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = `${Math.round(progress)}%`;
                }
            }
        }, 3000);
    }

    // Voice Command Functionality
    async toggleVoiceCommand() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.querySelector('.voice-status');
        
        if (!this.isVoiceActive) {
            // Start listening
            this.isVoiceActive = true;
            voiceBtn.classList.add('active');
            voiceStatus.textContent = 'Listening...';
            
            try {
                if (typeof unifiedAssistant !== 'undefined') {
                    const result = await unifiedAssistant.voiceCommand();
                    if (result.success) {
                        voiceStatus.textContent = `Heard: "${result.text}"`;
                        await this.processVoiceCommand(result.text);
                    } else {
                        voiceStatus.textContent = 'No voice detected';
                    }
                }
            } catch (error) {
                console.error('Voice command error:', error);
                voiceStatus.textContent = 'Voice not available';
            }
            
            // Reset after 3 seconds
            setTimeout(() => {
                this.isVoiceActive = false;
                voiceBtn.classList.remove('active');
                voiceStatus.textContent = 'Ready to listen...';
            }, 3000);
        }
    }

    async processVoiceCommand(command) {
        this.showNotification(`🎤 Processing: "${command}"`, 'info');
        await this.executeCommand(command);
    }

    // Text Input Functionality
    handleTextInput(event) {
        const input = event.target;
        const inputGlow = input.parentNode.querySelector('.input-glow');
        
        if (input.value.length > 0) {
            inputGlow.style.opacity = '0.5';
        } else {
            inputGlow.style.opacity = '0';
        }
    }

    async processTextCommand(command) {
        if (!command.trim()) return;
        
        this.showNotification(`💬 Processing: "${command}"`, 'info');
        await this.executeCommand(command);
        
        // Clear input
        const commandInput = document.getElementById('commandInput');
        if (commandInput) {
            commandInput.value = '';
            this.handleTextInput({ target: commandInput });
        }
    }

    // File Upload Functionality
    handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt,.csv,.xlsx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processFileUpload(file);
            }
        };
        input.click();
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = '#00d4ff';
        event.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
    }

    handleFileDrop(event) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        files.forEach(file => this.processFileUpload(file));
        
        // Reset styling
        event.currentTarget.style.borderColor = '';
        event.currentTarget.style.background = '';
    }

    async processFileUpload(file) {
        this.showNotification(`📄 Uploading: ${file.name}`, 'info');
        
        // Simulate upload progress
        const progressBar = document.querySelector('.progress-bar');
        let progress = 0;
        
        const uploadInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(uploadInterval);
                this.showNotification(`✅ File uploaded: ${file.name}`, 'success');
            }
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }, 200);

        // Try to process with Document AI
        if (typeof unifiedAssistant !== 'undefined') {
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = btoa(e.target.result);
                    const result = await unifiedAssistant.documentAICommand('process_document', {
                        document_content: content,
                        mime_type: file.type
                    });
                    
                    if (result.success) {
                        this.addTask(`Analyzing ${file.name}`, true);
                        this.showNotification('🤖 Document processing started', 'success');
                    }
                };
                reader.readAsBinaryString(file);
            } catch (error) {
                console.error('Document processing error:', error);
            }
        }
    }

    handleAttachment() {
        this.showNotification('📎 Attaching Q3 report to email draft...', 'info');
        
        // Simulate attachment process
        setTimeout(() => {
            this.showNotification('✅ Q3 report attached successfully', 'success');
            this.addTask('Draft email with Q3 report', true);
        }, 1500);
    }

    // AI Interaction
    async interactWithAI() {
        const aiAvatar = document.getElementById('aiAvatar');
        const aiStatus = document.querySelector('.ai-status .status-text');
        
        // Add interaction animation
        aiAvatar.style.transform = 'scale(1.1)';
        setTimeout(() => {
            aiAvatar.style.transform = 'scale(1)';
        }, 200);
        
        // Cycle through AI responses
        const responses = [
            'How can I help you today?',
            'Ready for your next command!',
            'All systems operational!',
            'What would you like to automate?'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        aiStatus.textContent = randomResponse;
        
        // Voice response if available
        if (typeof unifiedAssistant !== 'undefined') {
            try {
                await unifiedAssistant.systemAutomation?.speak?.(randomResponse);
            } catch (error) {
                console.log('Voice not available');
            }
        }
        
        // Reset status after 3 seconds
        setTimeout(() => {
            aiStatus.textContent = 'AI Assistant Active';
        }, 3000);
    }

    // Main Command Processing
    async executeCommand(command) {
        if (!command) return;
        
        this.isAIThinking = true;
        this.updateAIStatus('Processing...', true);
        
        try {
            if (typeof unifiedAssistant !== 'undefined') {
                const result = await unifiedAssistant.execute(command);
                
                if (result.success) {
                    this.showNotification('✅ Command completed successfully', 'success');
                    this.addTask(`Completed: ${command}`, false);
                } else {
                    this.showNotification(`❌ Error: ${result.error}`, 'error');
                }
                
                // Update API usage
                this.updateApiUsage();
                
            } else {
                this.showNotification('⚠️ AI Assistant not connected', 'warning');
            }
        } catch (error) {
            console.error('Command execution error:', error);
            this.showNotification('❌ Command failed to execute', 'error');
        } finally {
            this.isAIThinking = false;
            this.updateAIStatus('AI Assistant Active', true);
        }
    }

    async executeMainAction() {
        const performBtn = document.getElementById('performBtn');
        const btnText = performBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        // Animation
        performBtn.style.transform = 'scale(0.95)';
        btnText.textContent = 'EXECUTING...';
        
        // Get current command or use default action
        const commandInput = document.getElementById('commandInput');
        const command = commandInput?.value?.trim() || 'morning routine';
        
        await this.executeCommand(command);
        
        // Reset button
        setTimeout(() => {
            performBtn.style.transform = 'scale(1)';
            btnText.textContent = originalText;
        }, 1000);
    }

    // Utility Functions
    addTask(taskName, isActive = false) {
        const taskList = document.querySelector('.task-list');
        if (!taskList) return;
        
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${isActive ? 'active' : ''}`;
        taskItem.innerHTML = `
            <div class="task-dot"></div>
            <span>${taskName}</span>
        `;
        
        // Add to beginning of list
        taskList.insertBefore(taskItem, taskList.firstChild);
        
        // Remove oldest task if more than 3
        const tasks = taskList.querySelectorAll('.task-item');
        if (tasks.length > 3) {
            tasks[tasks.length - 1].remove();
        }
        
        // Update current tasks array
        this.currentTasks.unshift({ name: taskName, active: isActive });
        if (this.currentTasks.length > 3) {
            this.currentTasks.pop();
        }
    }

    updateConnectionStatus(isConnected, service) {
        const statusDot = document.querySelector('.connection-status .status-dot');
        const statusText = document.querySelector('.connection-status span');
        
        if (statusDot) {
            statusDot.className = `status-dot ${isConnected ? 'connected' : 'disconnected'}`;
        }
        
        if (statusText) {
            statusText.textContent = `${service} ${isConnected ? 'Connected' : 'Disconnected'}`;
        }
    }

    updateAIStatus(message, isActive) {
        const statusText = document.querySelector('.ai-status .status-text');
        const statusIndicator = document.querySelector('.ai-status .status-indicator');
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${isActive ? 'pulsing' : ''}`;
        }
    }

    updateApiUsage() {
        this.apiUsage += Math.floor(Math.random() * 3) + 1;
        const usage = Math.min(this.apiUsage, this.maxApiCalls);
        const percentage = (usage / this.maxApiCalls) * 100;
        
        const usageText = document.querySelector('.api-usage span');
        const usageFill = document.querySelector('.usage-fill');
        
        if (usageText) {
            usageText.textContent = `API Usage: ${usage}/${this.maxApiCalls}`;
        }
        
        if (usageFill) {
            usageFill.style.width = `${percentage}%`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 12px 16px;
            color: var(--text-primary);
            font-size: 12px;
            backdrop-filter: blur(15px);
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 200px;
            word-wrap: break-word;
        `;
        
        // Type-specific styling
        switch (type) {
            case 'success':
                notification.style.borderColor = '#00ff88';
                notification.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.3)';
                break;
            case 'error':
                notification.style.borderColor = '#ff4444';
                notification.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.3)';
                break;
            case 'warning':
                notification.style.borderColor = '#ff9933';
                notification.style.boxShadow = '0 0 15px rgba(255, 153, 51, 0.3)';
                break;
            default:
                notification.style.borderColor = '#00d4ff';
                notification.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Space: Voice command
        if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
            event.preventDefault();
            this.toggleVoiceCommand();
        }
        
        // Ctrl/Cmd + Enter: Execute main action
        if ((event.ctrlKey || event.metaKey) && event.code === 'Enter') {
            event.preventDefault();
            this.executeMainAction();
        }
        
        // Escape: Clear input
        if (event.code === 'Escape') {
            const commandInput = document.getElementById('commandInput');
            if (commandInput) {
                commandInput.value = '';
                commandInput.blur();
            }
        }
    }

    // Settings functionality
    async openSettings() {
        this.showNotification('⚙️ Opening settings page...', 'info');
        
        try {
            // Open Chrome extension options page
            await chrome.runtime.openOptionsPage();
            
            // Close current popup
            window.close();
            
        } catch (error) {
            console.error('Failed to open settings:', error);
            
            // Fallback: try to open options page manually
            try {
                const optionsUrl = chrome.runtime.getURL('options/options-enhanced.html');
                await chrome.tabs.create({
                    url: optionsUrl,
                    active: true
                });
                window.close();
            } catch (fallbackError) {
                console.error('Fallback settings open failed:', fallbackError);
                this.showNotification('❌ Could not open settings page', 'error');
            }
        }
    }

    // Fullscreen functionality
    async openFullscreen() {
        this.showNotification('🚀 Opening in fullscreen mode...', 'info');
        
        try {
            // Create fullscreen URL
            const fullscreenUrl = chrome.runtime.getURL('popup/popup-futuristic.html?fullscreen=true');
            
            // Open in new tab
            await chrome.tabs.create({
                url: fullscreenUrl,
                active: true
            });
            
            // Close current popup
            window.close();
            
        } catch (error) {
            console.error('Failed to open fullscreen:', error);
            this.showNotification('❌ Could not open fullscreen mode', 'error');
        }
    }

    async loadDashboardData() {
        // Check if we're in fullscreen mode
        const urlParams = new URLSearchParams(window.location.search);
        const isFullscreen = urlParams.get('fullscreen') === 'true';
        
        if (isFullscreen) {
            // Hide resize handle in fullscreen mode
            const resizeHandle = document.getElementById('resizeHandle');
            if (resizeHandle) {
                resizeHandle.style.display = 'none';
            }
            
            // Update expand button text
            const expandBtn = document.getElementById('expandBtn');
            if (expandBtn) {
                expandBtn.innerHTML = '🗙 Close';
                expandBtn.title = 'Close fullscreen mode';
                expandBtn.onclick = () => window.close();
            }
            
            // Set initial fullscreen size
            document.body.style.width = '100vw';
            document.body.style.height = '100vh';
            const container = document.querySelector('.holographic-container');
            if (container) {
                container.style.width = '100vw';
                container.style.height = '100vh';
            }
            
            this.showNotification('🚀 Fullscreen mode active - Resize freely!', 'success');
        }
        
        // Simulate loading initial data
        this.showNotification('🚀 Loading dashboard data...', 'info');
        
        // Add some initial tasks
        setTimeout(() => {
            this.addTask('Generating Q3 report summary', true);
            this.addTask('Scheduling meeting to John', false);
            this.addTask('Researching market trends', false);
        }, 1000);
        
        // Check Google APIs connection
        setTimeout(async () => {
            if (typeof unifiedAssistant !== 'undefined') {
                try {
                    const status = unifiedAssistant.getStatus();
                    this.updateConnectionStatus(status.ready, 'Google APIs');
                    
                    if (status.capabilities.gmail) {
                        const emails = await unifiedAssistant.gmailCommand('list_messages', {
                            query: 'is:unread',
                            max_results: 5
                        });
                        
                        if (emails.success) {
                            this.showNotification(`📧 ${emails.messages?.length || 0} unread emails`, 'info');
                        }
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            }
        }, 2000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.holographicDashboard = new HolographicDashboard();
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HolographicDashboard;
}
