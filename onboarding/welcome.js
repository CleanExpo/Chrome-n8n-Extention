/**
 * Onboarding wizard JavaScript
 * Handles step navigation, API testing, and preference saving
 */

let currentStep = 1;
const totalSteps = 4;
let settings = {};

// Initialize onboarding
document.addEventListener('DOMContentLoaded', () => {
    // Check if returning user
    checkReturningUser();

    // Set initial progress
    updateProgress();
});

/**
 * Check if this is a returning user
 */
async function checkReturningUser() {
    if (chrome.storage) {
        const stored = await chrome.storage.sync.get(['onboardingCompleted']);
        if (stored.onboardingCompleted) {
            // Skip to settings if already completed
            window.location.href = chrome.runtime.getURL('options/options-enhanced.html');
        }
    }
}

/**
 * Navigate to next step
 */
function nextStep() {
    if (currentStep < totalSteps) {
        // Validate current step before proceeding
        if (!validateStep(currentStep)) {
            return;
        }

        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`step${currentStep}`).classList.add('active');

        updateProgress();
        updateStepIndicators();
    }
}

/**
 * Navigate to previous step
 */
function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`step${currentStep}`).classList.add('active');

        updateProgress();
        updateStepIndicators();
    }
}

/**
 * Skip current step
 */
function skipStep() {
    nextStep();
}

/**
 * Update progress bar
 */
function updateProgress() {
    const progressPercent = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
}

/**
 * Update step indicators
 */
function updateStepIndicators() {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

/**
 * Validate current step
 */
function validateStep(step) {
    switch(step) {
        case 2:
            // Check if at least one API is configured
            const hasOpenAI = document.getElementById('openaiKey').value.trim() !== '';
            const hasN8n = document.getElementById('n8nWebhook').value.trim() !== '';

            if (!hasOpenAI && !hasN8n) {
                showMessage('Please configure at least one API service or click "Skip for now"', 'error');
                return false;
            }

            // Save API settings
            saveAPISettings();
            return true;

        case 3:
            // Save preferences
            savePreferences();
            return true;

        default:
            return true;
    }
}

/**
 * Test OpenAI connection
 */
async function testOpenAI() {
    const apiKey = document.getElementById('openaiKey').value.trim();
    const statusDiv = document.getElementById('openaiStatus');

    if (!apiKey) {
        showStatus(statusDiv, 'Please enter an API key', 'error');
        return;
    }

    showStatus(statusDiv, 'Testing connection...', 'info');

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            showStatus(statusDiv, '✅ Connection successful! API key is valid.', 'success');
            settings.openaiKey = apiKey;

            // Enable continue button
            document.getElementById('continueBtn').disabled = false;
        } else {
            showStatus(statusDiv, '❌ Invalid API key. Please check and try again.', 'error');
        }
    } catch (error) {
        showStatus(statusDiv, '❌ Connection failed. Please check your internet connection.', 'error');
    }
}

/**
 * Test n8n connection
 */
async function testN8n() {
    const webhookUrl = document.getElementById('n8nWebhook').value.trim();
    const apiKey = document.getElementById('n8nApiKey').value.trim();
    const statusDiv = document.getElementById('n8nStatus');

    if (!webhookUrl) {
        showStatus(statusDiv, 'Please enter a webhook URL', 'error');
        return;
    }

    showStatus(statusDiv, 'Testing connection...', 'info');

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey && webhookUrl.includes('n8n.cloud')) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                test: true,
                source: 'onboarding'
            })
        });

        if (response.ok || response.status === 404) {
            showStatus(statusDiv, '✅ Webhook configured successfully!', 'success');
            settings.n8nWebhookUrl = webhookUrl;
            if (apiKey) settings.n8nApiKey = apiKey;

            // Enable continue button
            document.getElementById('continueBtn').disabled = false;
        } else {
            showStatus(statusDiv, '❌ Connection failed. Please check your webhook URL.', 'error');
        }
    } catch (error) {
        showStatus(statusDiv, '❌ Cannot reach webhook. Please check the URL.', 'error');
    }
}

/**
 * Show status message
 */
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

/**
 * Show general message
 */
function showMessage(message, type) {
    // You could show a toast notification here
    alert(message);
}

/**
 * Select theme
 */
function selectTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    settings.theme = theme;
}

/**
 * Save API settings
 */
function saveAPISettings() {
    const openaiKey = document.getElementById('openaiKey').value.trim();
    const n8nWebhook = document.getElementById('n8nWebhook').value.trim();
    const n8nApiKey = document.getElementById('n8nApiKey').value.trim();

    if (openaiKey) settings.openaiKey = openaiKey;
    if (n8nWebhook) settings.n8nWebhookUrl = n8nWebhook;
    if (n8nApiKey) settings.n8nApiKey = n8nApiKey;
}

/**
 * Save preferences
 */
function savePreferences() {
    // Get selected quick actions
    const quickActions = [];
    document.querySelectorAll('.checkbox-label input:checked').forEach(checkbox => {
        const action = checkbox.parentElement.textContent.trim();
        if (action.includes('Summarize')) quickActions.push('summarize');
        if (action.includes('Explain')) quickActions.push('explain');
        if (action.includes('Translate')) quickActions.push('translate');
        if (action.includes('Improve')) quickActions.push('improve');
    });
    settings.quickActions = quickActions;

    // Get notification preference
    const notifications = document.querySelector('.toggle-label input').checked;
    settings.enableNotifications = notifications;
}

/**
 * Complete onboarding
 */
async function completeOnboarding() {
    // Mark onboarding as completed
    settings.onboardingCompleted = true;
    settings.onboardingDate = new Date().toISOString();

    // Save all settings
    if (chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set(settings);

        // Notify background script
        chrome.runtime.sendMessage({ action: 'onboardingComplete', settings });
    }

    // Close tab and open extension
    window.close();
}

/**
 * Open tutorial
 */
function openTutorial() {
    window.open('https://github.com/your-extension/tutorial', '_blank');
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        nextStep();
    } else if (e.key === 'Escape') {
        if (confirm('Are you sure you want to exit setup?')) {
            window.close();
        }
    }
});