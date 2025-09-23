/**
 * Private Background Service Worker
 * This extension is restricted to specific authorized Gmail accounts only
 */

import './private-auth.js';

// Initialize private authenticator
const privateAuth = new PrivateAuthenticator();

// Configuration for your private accounts
const PRIVATE_CONFIG = {
    // Your authorized Gmail addresses
    authorizedEmails: [
        'phill.mcgurk@gmail.com',     // Primary Gmail account
        'zenithfresh25@gmail.com'     // Secondary Gmail account
    ],

    // Security settings
    strictMode: true,              // Enforce strict authentication
    blockUnauthorized: true,        // Block unauthorized access completely
    logAttempts: true,             // Log all access attempts
    requireVerifiedEmail: true,    // Only allow verified Google accounts

    // Session settings
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    autoLock: true,                // Auto-lock after timeout
    requireReauth: false            // Require re-authentication each session
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Private Extension Installed:', details.reason);

    // Configure for private use
    await privateAuth.configureForPrivateUse(
        PRIVATE_CONFIG.authorizedEmails[0],
        PRIVATE_CONFIG.authorizedEmails[1]
    );

    // Immediately authenticate
    const authResult = await privateAuth.authenticate();

    if (!authResult.success) {
        console.error('Authentication failed during installation:', authResult.error);
        // Disable extension for unauthorized users
        chrome.action.setPopup({ popup: '' });
        chrome.action.setBadgeText({ text: '🔒' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
        console.log('Authorized user verified:', authResult.user.email);
        // Set up normal extension functionality
        await initializeExtension();
    }
});

// Check authentication on startup
chrome.runtime.onStartup.addListener(async () => {
    await privateAuth.initialize();

    // Verify user is still authorized
    const authResult = await privateAuth.authenticate();

    if (!authResult.success) {
        console.error('Unauthorized access blocked');
        blockUnauthorizedAccess();
    } else {
        console.log('Authorized session restored for:', authResult.user.email);
        await initializeExtension();
    }
});

// Block unauthorized access
function blockUnauthorizedAccess() {
    // Remove all functionality
    chrome.action.setPopup({ popup: '' });
    chrome.action.setBadgeText({ text: '🚫' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });

    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon-128.png',
        title: 'Access Denied',
        message: 'This extension is private and restricted to authorized Gmail accounts only.',
        priority: 2
    });

    // Clear all stored data
    chrome.storage.local.clear();
    chrome.storage.sync.clear();
    chrome.storage.session.clear();
}

// Initialize extension for authorized users
async function initializeExtension() {
    console.log('Initializing private extension for authorized user...');

    // Set authorized popup
    chrome.action.setPopup({ popup: 'popup/popup-futuristic.html' });
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });

    // Load existing background functionality
    await import('./background-fixed.js');

    // Add authentication check to all API calls
    interceptAPIRequests();
}

// Intercept and validate all API requests
function interceptAPIRequests() {
    // Override fetch to add authentication
    const originalFetch = global.fetch;
    global.fetch = async function(...args) {
        // Check if user is still authorized
        const isValid = await privateAuth.isSessionValid();

        if (!isValid) {
            console.error('Session expired or unauthorized');
            blockUnauthorizedAccess();
            throw new Error('Unauthorized: Session expired');
        }

        // Proceed with original request
        return originalFetch.apply(this, args);
    };
}

// Listen for messages and verify authentication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Always verify authentication first
    (async () => {
        const authStatus = await privateAuth.getAuthStatus();

        if (!authStatus.authenticated) {
            sendResponse({
                error: 'Unauthorized',
                message: 'This extension is restricted to authorized users only'
            });
            return;
        }

        // Handle authentication-specific messages
        switch (request.action) {
            case 'getAuthStatus':
                sendResponse(authStatus);
                break;

            case 'logout':
                await privateAuth.revokeAccess();
                blockUnauthorizedAccess();
                sendResponse({ success: true });
                break;

            case 'checkAuth':
                const authResult = await privateAuth.authenticate();
                sendResponse(authResult);
                break;

            default:
                // Pass to normal message handler if authenticated
                // This will be handled by background-fixed.js
                return false;
        }
    })();

    return true; // Will respond asynchronously
});

// Monitor for unauthorized access attempts
chrome.identity.onSignInChanged.addListener(async (account, signedIn) => {
    console.log('Sign-in state changed:', account, signedIn);

    if (!signedIn) {
        // User signed out - lock the extension
        blockUnauthorizedAccess();
    } else {
        // Re-authenticate
        const authResult = await privateAuth.authenticate();
        if (!authResult.success) {
            blockUnauthorizedAccess();
        }
    }
});

// Periodic authentication check
setInterval(async () => {
    const isValid = await privateAuth.isSessionValid();

    if (!isValid) {
        console.log('Session expired, re-authenticating...');
        const authResult = await privateAuth.authenticate();

        if (!authResult.success) {
            blockUnauthorizedAccess();
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Export for debugging (authorized users only)
if (typeof globalThis !== 'undefined') {
    globalThis.privateAuth = privateAuth;
    globalThis.PRIVATE_CONFIG = PRIVATE_CONFIG;
}

console.log('Private background service worker initialized');
console.log('Extension restricted to authorized Gmail accounts only');