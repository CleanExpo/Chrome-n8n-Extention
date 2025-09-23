/**
 * Private Extension Initializer
 * Automatically configures the extension for authorized accounts
 */

console.log('🔒 Initializing Private AI Assistant');
console.log('Authorized for: phill.mcgurk@gmail.com and zenithfresh25@gmail.com');

// Authorized account configuration
const AUTHORIZED_ACCOUNTS = {
    'phill.mcgurk@gmail.com': {
        name: 'Phill McGurk',
        role: 'primary',
        theme: 'holographic',
        features: ['all']
    },
    'zenithfresh25@gmail.com': {
        name: 'Zenith Fresh',
        role: 'secondary',
        theme: 'holographic',
        features: ['all']
    }
};

// Initialize on extension load
(async function initializePrivateExtension() {
    try {
        // Check if running in Chrome extension context
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.error('Not running in Chrome extension context');
            return;
        }

        // Get current user identity
        chrome.identity.getProfileUserInfo((userInfo) => {
            if (!userInfo || !userInfo.email) {
                console.error('Unable to get user identity');
                showUnauthorizedMessage();
                return;
            }

            const userEmail = userInfo.email.toLowerCase();
            console.log('Current user:', userEmail);

            // Check if user is authorized
            if (!AUTHORIZED_ACCOUNTS[userEmail]) {
                console.error('❌ UNAUTHORIZED ACCESS ATTEMPT:', userEmail);
                blockUnauthorizedUser(userEmail);
                return;
            }

            // User is authorized!
            console.log('✅ Authorized user confirmed:', userEmail);
            const userConfig = AUTHORIZED_ACCOUNTS[userEmail];

            // Configure extension for this user
            configureForUser(userEmail, userConfig);

            // Show welcome message
            showWelcomeMessage(userConfig.name);
        });

    } catch (error) {
        console.error('Initialization error:', error);
    }
})();

// Configure extension for authorized user
async function configureForUser(email, config) {
    console.log(`Configuring extension for ${config.name}...`);

    // Store user configuration
    await chrome.storage.local.set({
        currentUser: {
            email: email,
            name: config.name,
            role: config.role,
            authorizedAt: new Date().toISOString()
        },
        userPreferences: {
            theme: config.theme,
            features: config.features
        }
    });

    // Enable extension features
    chrome.action.setPopup({ popup: 'popup/popup-futuristic.html' });
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });

    // Set user-specific theme
    if (config.theme === 'holographic') {
        chrome.action.setTitle({
            title: `Private AI Assistant - ${config.name}`
        });
    }

    console.log('Extension configured successfully for', config.name);
}

// Block unauthorized user
function blockUnauthorizedUser(email) {
    console.error('Blocking unauthorized user:', email);

    // Log the attempt
    const timestamp = new Date().toISOString();
    chrome.storage.local.get(['unauthorizedAttempts'], (result) => {
        const attempts = result.unauthorizedAttempts || [];
        attempts.push({
            email: email,
            timestamp: timestamp,
            blocked: true
        });

        // Keep last 100 attempts
        chrome.storage.local.set({
            unauthorizedAttempts: attempts.slice(-100)
        });
    });

    // Disable all extension features
    chrome.action.setPopup({ popup: '' });
    chrome.action.setBadgeText({ text: '🚫' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    chrome.action.setTitle({
        title: 'Access Denied - This extension is private'
    });

    // Show unauthorized message
    showUnauthorizedMessage();
}

// Show unauthorized access message
function showUnauthorizedMessage() {
    if (chrome.notifications) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('images/icon-128.png'),
            title: '🚫 Access Denied',
            message: 'This extension is private and restricted to authorized Gmail accounts only.',
            priority: 2,
            requireInteraction: true
        });
    }

    // Also show as alert if in popup context
    if (typeof alert !== 'undefined') {
        alert('⛔ ACCESS DENIED\n\nThis extension is private and exclusively for:\n• phill.mcgurk@gmail.com\n• zenithfresh25@gmail.com\n\nYour access attempt has been logged.');
    }
}

// Show welcome message for authorized users
function showWelcomeMessage(userName) {
    if (chrome.notifications) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('images/icon-128.png'),
            title: `Welcome, ${userName}!`,
            message: 'Your Private AI Assistant is ready. All features are enabled.',
            priority: 1
        });
    }

    console.log(`🎉 Welcome back, ${userName}!`);
    console.log('All features are enabled for your account.');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AUTHORIZED_ACCOUNTS,
        initializePrivateExtension: initializePrivateExtension
    };
} else {
    window.AUTHORIZED_ACCOUNTS = AUTHORIZED_ACCOUNTS;
}