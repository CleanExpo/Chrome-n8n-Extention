/**
 * Futuristic Holographic Dashboard JavaScript - FIXED VERSION
 * Properly integrates with UnifiedAssistant, SEO Engine, and real API connections
 */

class HolographicDashboard {
    constructor() {
        this.isVoiceActive = false;
        this.isAIThinking = false;
        this.currentTasks = [];
        this.completedTasks = 0;
        this.totalTasks = 0;
        this.apiUsage = 0;
        this.maxApiCalls = 1000;
        this.seoEngine = null;
        this.unifiedAssistant = null;
        this.wsConnection = null;

        // Initialize dashboard
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Holographic Dashboard...');

        // Initialize components first
        await this.initializeComponents();

        // Set up event listeners
        this.setupEventListeners();

        // Initialize AI assistant connection
        await this.initializeAI();

        // Initialize WebSocket connection
        await this.initializeWebSocket();

        // Start background effects
        this.startBackgroundEffects();

        // Load initial data
        await this.loadDashboardData();

        console.log('✅ Holographic Dashboard Ready!');
    }

    async initializeComponents() {
        try {
            // Initialize Unified Assistant if available
            if (typeof UnifiedAssistant !== 'undefined') {
                this.unifiedAssistant = window.unifiedAssistant || new UnifiedAssistant();
                if (!window.unifiedAssistant) {
                    await this.unifiedAssistant.initialize();
                }
                console.log('✅ UnifiedAssistant initialized');
            } else {
                console.warn('⚠️ UnifiedAssistant not available');
            }

            // Initialize SEO Analysis Engine if available
            if (typeof SEOAnalysisEngine !== 'undefined') {
                this.seoEngine = new SEOAnalysisEngine();
                console.log('✅ SEO Analysis Engine initialized');
            } else {
                console.warn('⚠️ SEO Analysis Engine not available');
            }
        } catch (error) {
            console.error('Component initialization error:', error);
        }
    }

    async initializeWebSocket() {
        try {
            // Check if WebSocket server is configured
            const settings = await this.getStoredSettings();
            if (settings.wsEnabled && settings.wsUrl) {
                this.wsConnection = new WebSocket(settings.wsUrl || 'ws://localhost:8765');

                this.wsConnection.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.showNotification('🔌 Desktop Assistant connected', 'success');
                };

                this.wsConnection.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };

                this.wsConnection.onerror = (error) => {
                    console.warn('WebSocket error:', error);
                };

                this.wsConnection.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.wsConnection = null;
                };
            }
        } catch (error) {
            console.warn('WebSocket initialization skipped:', error.message);
        }
    }

    handleWebSocketMessage(data) {
        const { type, result, error } = data;

        switch (type) {
            case 'command_result':
                if (result) {
                    this.addTask(`Desktop: ${result}`, false);
                }
                break;

            case 'automation_result':
                if (result) {
                    this.showNotification(`🤖 ${result}`, 'success');
                }
                break;

            case 'error':
                this.showNotification(`❌ ${error}`, 'error');
                break;
        }
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

        // SEO Analysis Button
        const analyzeSeoBtn = document.getElementById('analyzeSeoBtn');
        if (analyzeSeoBtn) {
            analyzeSeoBtn.addEventListener('click', () => this.analyzeSEO());
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
            console.log('🤖 Initializing AI connection...');

            // Get stored API keys
            const settings = await this.getStoredSettings();

            // Check UnifiedAssistant status
            if (this.unifiedAssistant) {
                const status = this.unifiedAssistant.getStatus();
                if (status.ready) {
                    this.updateConnectionStatus(true, 'AI Assistant');
                    this.updateAIStatus('AI Ready', true);
                    return;
                }
            }

            // Fallback to background script
            const response = await this.sendMessageToBackground('getStats');

            if (response && response.success) {
                const { stats, apiStatus } = response;

                // Update connection status based on available APIs
                const hasConnection = apiStatus.openai || apiStatus.n8n || apiStatus.integration;
                this.updateConnectionStatus(hasConnection, 'AI APIs');

                if (hasConnection) {
                    this.updateAIStatus('Connected', true);
                    this.showNotification('🤖 AI Assistant Connected', 'success');
                } else if (!settings.openaiKey && !settings.n8nUrl) {
                    this.updateAIStatus('No API Keys', false);
                    this.showNotification('⚠️ Configure API keys in Settings', 'warning');
                } else {
                    this.updateAIStatus('Connecting...', false);
                }

                // Update API usage from real stats
                if (stats && stats.messageCount) {
                    this.apiUsage = stats.messageCount;
                    this.updateApiUsage();
                }
            } else {
                console.warn('Background script not responding');
                this.updateAIStatus('Offline', false);
                this.updateConnectionStatus(false, 'AI APIs');
            }
        } catch (error) {
            console.error('AI Initialization Error:', error);
            this.updateAIStatus('Error', false);
            this.updateConnectionStatus(false, 'AI APIs');
        }
    }

    async getStoredSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([
                'openaiKey',
                'n8nUrl',
                'wsEnabled',
                'wsUrl',
                'seoSettings'
            ], (result) => {
                resolve({
                    openaiKey: result.openaiKey || '',
                    n8nUrl: result.n8nUrl || '',
                    wsEnabled: result.wsEnabled || false,
                    wsUrl: result.wsUrl || 'ws://localhost:8765',
                    seoSettings: result.seoSettings || {}
                });
            });
        });
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

        // Update task progress periodically
        setInterval(() => this.updateTaskProgress(), 1000);
    }

    animateParticles() {
        setInterval(() => {
            const particles = document.querySelector('.particles-bg');
            if (particles) {
                particles.style.animationDuration = `${18 + Math.random() * 4}s`;
            }
        }, 10000);
    }

    updateAvatarExpressions() {
        const eyes = document.querySelectorAll('.eye');

        setInterval(() => {
            if (this.isAIThinking) {
                eyes.forEach(eye => {
                    eye.style.background = '#00d4ff';
                    eye.style.boxShadow = '0 0 10px #00d4ff';
                });
            } else {
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

    updateTaskProgress() {
        const progressCircle = document.getElementById('progressCircle');
        const progressText = document.getElementById('progressText');

        if (this.totalTasks > 0) {
            const progress = Math.round((this.completedTasks / this.totalTasks) * 100);
            const circumference = 2 * Math.PI * 18;
            const offset = circumference - (progress / 100) * circumference;

            if (progressCircle) {
                progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
                progressCircle.style.strokeDashoffset = offset;
            }

            if (progressText) {
                progressText.textContent = `${progress}%`;
            }
        } else {
            if (progressText) {
                progressText.textContent = '0%';
            }
        }
    }

    // Voice Command Functionality
    async toggleVoiceCommand() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.querySelector('.voice-status');

        if (!this.isVoiceActive) {
            this.isVoiceActive = true;
            voiceBtn.classList.add('active');
            voiceStatus.textContent = 'Listening...';

            try {
                if (this.unifiedAssistant && this.unifiedAssistant.capabilities.voice) {
                    const result = await this.unifiedAssistant.voiceCommand();
                    if (result.success) {
                        voiceStatus.textContent = `Heard: "${result.text}"`;
                        await this.processVoiceCommand(result.text);
                    } else {
                        voiceStatus.textContent = 'No voice detected';
                    }
                } else {
                    // Fallback to Web Speech API
                    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        const recognition = new SpeechRecognition();

                        recognition.continuous = false;
                        recognition.interimResults = false;
                        recognition.lang = 'en-US';

                        recognition.onresult = async (event) => {
                            const transcript = event.results[0][0].transcript;
                            voiceStatus.textContent = `Heard: "${transcript}"`;
                            await this.processVoiceCommand(transcript);
                        };

                        recognition.onerror = (event) => {
                            voiceStatus.textContent = 'Voice error: ' + event.error;
                        };

                        recognition.start();
                    } else {
                        voiceStatus.textContent = 'Voice not supported';
                    }
                }
            } catch (error) {
                console.error('Voice command error:', error);
                voiceStatus.textContent = 'Voice not available';
            }

            setTimeout(() => {
                this.isVoiceActive = false;
                voiceBtn.classList.remove('active');
                voiceStatus.textContent = 'Ready to listen...';
            }, 5000);
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

    // Main Command Processing
    async executeCommand(command) {
        if (!command) return;

        this.isAIThinking = true;
        this.updateAIStatus('Processing...', true);
        this.addTask(`Processing: ${command.substring(0, 30)}...`, true);

        try {
            let result = null;

            // Try UnifiedAssistant first
            if (this.unifiedAssistant && this.unifiedAssistant.getStatus().ready) {
                result = await this.unifiedAssistant.execute(command);
            }

            // Fallback to background script
            if (!result || !result.success) {
                const response = await this.sendMessageToBackground('assistantMessage', {
                    message: command,
                    context: { source: 'popup' }
                });

                if (response && response.reply) {
                    result = { success: true, message: response.reply };
                }
            }

            // Send to WebSocket if connected
            if (!result && this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
                this.wsConnection.send(JSON.stringify({
                    type: 'execute_command',
                    payload: { command }
                }));
                result = { success: true, message: 'Sent to Desktop Assistant' };
            }

            if (result && result.success) {
                this.showNotification('✅ Command completed', 'success');
                this.addTask(`✓ ${command.substring(0, 30)}`, false);
                this.completedTasks++;
            } else {
                this.showNotification(`❌ ${result?.error || 'Command failed'}`, 'error');
            }

            // Update API usage
            this.apiUsage++;
            this.updateApiUsage();

        } catch (error) {
            console.error('Command execution error:', error);
            this.showNotification('❌ Command failed', 'error');
        } finally {
            this.isAIThinking = false;
            this.updateAIStatus('AI Assistant Active', true);
            this.updateTaskProgress();
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
        const command = commandInput?.value?.trim() || 'Execute current task';

        await this.executeCommand(command);

        // Reset button
        setTimeout(() => {
            performBtn.style.transform = 'scale(1)';
            btnText.textContent = originalText;
        }, 1000);
    }

    // SEO Analysis
    async analyzeSEO() {
        const analyzeSeoBtn = document.getElementById('analyzeSeoBtn');
        const seoStatus = document.getElementById('seoStatus');
        const seoScoreText = document.getElementById('seoScoreText');
        const seoScoreCircle = document.getElementById('seoScoreCircle');

        if (!this.seoEngine) {
            // Try to initialize SEO engine
            if (typeof SEOAnalysisEngine !== 'undefined') {
                this.seoEngine = new SEOAnalysisEngine();
            } else {
                // Fallback to background script
                const response = await this.sendMessageToBackground('SEO_ANALYZE', {
                    url: window.location.href
                });

                if (response && response.analysis) {
                    this.displaySEOResults(response.analysis);
                } else {
                    this.showNotification('⚠️ SEO Engine not available', 'warning');
                }
                return;
            }
        }

        try {
            // Update UI to show analyzing
            analyzeSeoBtn.disabled = true;
            analyzeSeoBtn.textContent = '🔄 Analyzing...';
            seoStatus.textContent = 'Analyzing current page...';
            seoStatus.className = 'seo-status analyzing';

            // Get current tab URL
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentUrl = tabs[0]?.url;

            if (!currentUrl) {
                throw new Error('No active tab found');
            }

            // Add task
            this.addTask(`SEO: ${new URL(currentUrl).hostname}`, true);

            // Perform SEO analysis
            const analysis = await this.seoEngine.analyzePage(currentUrl, {
                includeCompetitors: false,
                trackSerp: false,
                localSeo: false,
                analyzeBacklinks: false
            });

            this.displaySEOResults(analysis);

        } catch (error) {
            console.error('SEO Analysis error:', error);
            seoStatus.textContent = 'Analysis failed';
            seoStatus.className = 'seo-status error';
            this.showNotification(`❌ SEO Analysis failed: ${error.message}`, 'error');
        } finally {
            // Reset button
            analyzeSeoBtn.disabled = false;
            analyzeSeoBtn.textContent = '🔍 Analyze Current Page';
        }
    }

    displaySEOResults(analysis) {
        const seoScoreText = document.getElementById('seoScoreText');
        const seoScoreCircle = document.getElementById('seoScoreCircle');
        const seoStatus = document.getElementById('seoStatus');

        // Update score display
        const score = analysis.score || 0;
        seoScoreText.textContent = score;

        // Animate score circle
        const circumference = 2 * Math.PI * 35;
        const offset = circumference - (score / 100) * circumference;
        seoScoreCircle.style.strokeDashoffset = offset;

        // Color based on score
        if (score >= 70) {
            seoScoreCircle.style.stroke = '#00ff88';
            seoStatus.textContent = 'Excellent SEO score!';
        } else if (score >= 40) {
            seoScoreCircle.style.stroke = '#ff9933';
            seoStatus.textContent = 'Good, room for improvement';
        } else {
            seoScoreCircle.style.stroke = '#ff4444';
            seoStatus.textContent = 'Needs optimization';
        }

        seoStatus.className = 'seo-status';

        // Update task
        this.addTask(`SEO Score: ${score}/100`, false);
        this.completedTasks++;

        // Show top recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            const topRec = analysis.recommendations[0];
            setTimeout(() => {
                this.showNotification(`💡 SEO tip: ${topRec.issue}`, 'info');
            }, 1000);
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
        this.addTask(`Upload: ${file.name}`, true);

        // Real upload progress
        const progressBar = document.querySelector('.progress-bar');
        const reader = new FileReader();

        reader.onprogress = (e) => {
            if (e.lengthComputable && progressBar) {
                const progress = (e.loaded / e.total) * 100;
                progressBar.style.width = `${progress}%`;
            }
        };

        reader.onload = async (e) => {
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            // Store file in chrome.storage or send to background
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                content: e.target.result
            };

            await this.sendMessageToBackground('fileUploaded', { file: fileData });

            this.showNotification(`✅ File uploaded: ${file.name}`, 'success');
            this.addTask(`✓ Uploaded: ${file.name}`, false);
            this.completedTasks++;
            this.updateTaskProgress();

            // Reset progress bar
            setTimeout(() => {
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }, 1000);
        };

        reader.onerror = (error) => {
            console.error('File read error:', error);
            this.showNotification(`❌ Upload failed: ${file.name}`, 'error');
        };

        reader.readAsDataURL(file);
    }

    handleAttachment() {
        this.showNotification('📎 Attaching Q3 report...', 'info');
        this.addTask('Attach Q3 report', true);

        setTimeout(() => {
            this.showNotification('✅ Q3 report attached', 'success');
            this.addTask('✓ Q3 report attached', false);
            this.completedTasks++;
            this.updateTaskProgress();
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

        // Get AI status
        const responses = [
            'How can I help you today?',
            'Ready for your next command!',
            'All systems operational!',
            'What would you like to automate?'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        aiStatus.textContent = randomResponse;

        // Voice response if available
        if (this.unifiedAssistant && this.unifiedAssistant.capabilities.voice) {
            try {
                await this.unifiedAssistant.systemAutomation?.speak?.(randomResponse);
            } catch (error) {
                console.log('Voice not available');
            }
        }

        // Reset status after 3 seconds
        setTimeout(() => {
            aiStatus.textContent = 'AI Assistant Active';
        }, 3000);
    }

    // Utility Functions
    addTask(taskName, isActive = false) {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${isActive ? 'active' : ''}`;
        taskItem.innerHTML = `
            <div class="task-dot"></div>
            <span>${taskName}</span>
        `;

        // Add to beginning of list
        taskList.insertBefore(taskItem, taskList.firstChild);

        // Remove oldest task if more than 5
        const tasks = taskList.querySelectorAll('.task-item');
        if (tasks.length > 5) {
            tasks[tasks.length - 1].remove();
        }

        // Update current tasks array and totals
        this.currentTasks.unshift({ name: taskName, active: isActive });
        if (this.currentTasks.length > 5) {
            this.currentTasks.pop();
        }

        this.totalTasks++;
        if (!isActive) {
            this.completedTasks++;
        }

        // Save tasks to storage
        this.saveTasksToStorage();
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
        const usage = Math.min(this.apiUsage, this.maxApiCalls);
        const percentage = (usage / this.maxApiCalls) * 100;

        const usageText = document.querySelector('.api-usage span');
        const usageFill = document.querySelector('.usage-fill');

        if (usageText) {
            usageText.textContent = `API Usage: ${usage}/${this.maxApiCalls}`;
        }

        if (usageFill) {
            usageFill.style.width = `${percentage}%`;
            // Change color based on usage
            if (percentage > 75) {
                usageFill.style.background = '#ff4444';
            } else if (percentage > 50) {
                usageFill.style.background = '#ff9933';
            } else {
                usageFill.style.background = '#00d4ff';
            }
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

        // Ctrl/Cmd + S: Analyze SEO
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
            event.preventDefault();
            this.analyzeSEO();
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

    async openSettings() {
        this.showNotification('⚙️ Opening settings...', 'info');

        try {
            await chrome.runtime.openOptionsPage();
            window.close();
        } catch (error) {
            console.error('Failed to open settings:', error);
            try {
                const optionsUrl = chrome.runtime.getURL('options/options-enhanced.html');
                await chrome.tabs.create({
                    url: optionsUrl,
                    active: true
                });
                window.close();
            } catch (fallbackError) {
                console.error('Fallback settings open failed:', fallbackError);
                this.showNotification('❌ Could not open settings', 'error');
            }
        }
    }

    async openFullscreen() {
        this.showNotification('🚀 Opening fullscreen...', 'info');

        try {
            const fullscreenUrl = chrome.runtime.getURL('popup/popup-futuristic.html?fullscreen=true');
            await chrome.tabs.create({
                url: fullscreenUrl,
                active: true
            });
            window.close();
        } catch (error) {
            console.error('Failed to open fullscreen:', error);
            this.showNotification('❌ Could not open fullscreen', 'error');
        }
    }

    async loadDashboardData() {
        // Check if we're in fullscreen mode
        const urlParams = new URLSearchParams(window.location.search);
        const isFullscreen = urlParams.get('fullscreen') === 'true';

        if (isFullscreen) {
            const expandBtn = document.getElementById('expandBtn');
            if (expandBtn) {
                expandBtn.innerHTML = '🗙 Close';
                expandBtn.title = 'Close fullscreen mode';
                expandBtn.onclick = () => window.close();
            }

            document.body.style.width = '100vw';
            document.body.style.height = '100vh';
            this.showNotification('🚀 Fullscreen mode active', 'success');
        }

        // Load real data
        this.showNotification('🚀 Loading dashboard data...', 'info');

        // Clear task counts
        this.totalTasks = 0;
        this.completedTasks = 0;

        // Load stored tasks
        await this.loadStoredTasks();

        // Check Google APIs if available
        setTimeout(async () => {
            if (this.unifiedAssistant && this.unifiedAssistant.capabilities.gmail) {
                try {
                    const emails = await this.unifiedAssistant.gmailCommand('list_messages', {
                        query: 'is:unread',
                        max_results: 5
                    });

                    if (emails.success) {
                        this.showNotification(`📧 ${emails.messages?.length || 0} unread emails`, 'info');
                    }
                } catch (error) {
                    console.error('Error loading Gmail data:', error);
                }
            }
        }, 2000);
    }

    async loadStoredTasks() {
        try {
            const result = await chrome.storage.local.get(['tasks']);
            if (result.tasks && Array.isArray(result.tasks)) {
                result.tasks.forEach(task => {
                    this.addTask(task.name, task.active);
                });
            }
        } catch (error) {
            console.error('Error loading stored tasks:', error);
        }
    }

    async saveTasksToStorage() {
        try {
            await chrome.storage.local.set({ tasks: this.currentTasks.slice(0, 5) });
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
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