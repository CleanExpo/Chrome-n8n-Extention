/**
 * Private Authentication Module
 * This extension is restricted to specific authorized Gmail accounts only
 */

class PrivateAuthenticator {
    constructor() {
        // These will be loaded from secure storage or environment
        this.authorizedEmails = [];
        this.currentUser = null;
        this.initialized = false;
    }

    /**
     * Initialize the authenticator with authorized emails
     */
    async initialize() {
        try {
            // Load authorized emails from Chrome storage
            const config = await this.loadPrivateConfig();

            // If no config exists, create default with placeholders
            if (!config.authorizedEmails || config.authorizedEmails.length === 0) {
                // These should be replaced with your actual Gmail addresses
                await this.savePrivateConfig({
                    authorizedEmails: [
                        'your.email.1@gmail.com',  // Replace with your first Gmail
                        'your.email.2@gmail.com'   // Replace with your second Gmail
                    ],
                    strictMode: true,
                    allowLocalTesting: true
                });
                config.authorizedEmails = await this.loadPrivateConfig();
            }

            this.authorizedEmails = config.authorizedEmails;
            this.initialized = true;

            console.log('Private authenticator initialized for authorized users only');

            // Auto-authenticate on initialization
            await this.authenticate();

        } catch (error) {
            console.error('Failed to initialize private authenticator:', error);
            this.initialized = false;
        }
    }

    /**
     * Load private configuration from secure storage
     */
    async loadPrivateConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['privateConfig'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error loading private config:', chrome.runtime.lastError);
                    resolve({});
                } else {
                    resolve(result.privateConfig || {});
                }
            });
        });
    }

    /**
     * Save private configuration to secure storage
     */
    async savePrivateConfig(config) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ privateConfig: config }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving private config:', chrome.runtime.lastError);
                    resolve(false);
                } else {
                    console.log('Private config saved securely');
                    resolve(true);
                }
            });
        });
    }

    /**
     * Authenticate the current user
     */
    async authenticate() {
        try {
            // Use Chrome Identity API to get user info
            const userInfo = await this.getCurrentUser();

            if (!userInfo || !userInfo.email) {
                console.error('Unable to get user information');
                return { success: false, error: 'No user information available' };
            }

            // Check if user is authorized
            if (!this.isAuthorizedUser(userInfo.email)) {
                console.error(`Unauthorized access attempt: ${userInfo.email}`);
                await this.handleUnauthorizedAccess(userInfo.email);
                return {
                    success: false,
                    error: 'Access denied. This extension is private and restricted to authorized users only.'
                };
            }

            // User is authorized
            this.currentUser = userInfo;
            console.log(`Authorized user authenticated: ${userInfo.email}`);

            // Store authentication state
            await this.storeAuthState(userInfo);

            return {
                success: true,
                user: userInfo,
                message: 'Welcome, authorized user!'
            };

        } catch (error) {
            console.error('Authentication failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user using Chrome Identity API
     */
    async getCurrentUser() {
        return new Promise((resolve) => {
            // First try to get OAuth2 token
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    console.error('Failed to get auth token:', chrome.runtime.lastError);
                    // Fallback to profile info
                    chrome.identity.getProfileUserInfo((userInfo) => {
                        resolve(userInfo);
                    });
                    return;
                }

                // Get user info using the token
                fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => response.json())
                .then(userInfo => {
                    resolve({
                        email: userInfo.email,
                        id: userInfo.id,
                        name: userInfo.name,
                        picture: userInfo.picture,
                        verified: userInfo.verified_email
                    });
                })
                .catch(error => {
                    console.error('Failed to get user info:', error);
                    // Fallback to profile info
                    chrome.identity.getProfileUserInfo((userInfo) => {
                        resolve(userInfo);
                    });
                });
            });
        });
    }

    /**
     * Check if an email is authorized
     */
    isAuthorizedUser(email) {
        if (!email) return false;

        // Normalize email for comparison
        const normalizedEmail = email.toLowerCase().trim();

        // Check against authorized list
        return this.authorizedEmails.some(authorized =>
            authorized.toLowerCase().trim() === normalizedEmail
        );
    }

    /**
     * Handle unauthorized access attempts
     */
    async handleUnauthorizedAccess(email) {
        // Log the attempt
        const attempt = {
            email,
            timestamp: new Date().toISOString(),
            blocked: true
        };

        // Store unauthorized attempts
        const attempts = await this.getUnauthorizedAttempts();
        attempts.push(attempt);

        await chrome.storage.local.set({
            unauthorizedAttempts: attempts.slice(-100) // Keep last 100 attempts
        });

        // Disable the extension for unauthorized users
        this.disableExtensionForUnauthorized();
    }

    /**
     * Get list of unauthorized access attempts
     */
    async getUnauthorizedAttempts() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['unauthorizedAttempts'], (result) => {
                resolve(result.unauthorizedAttempts || []);
            });
        });
    }

    /**
     * Disable extension functionality for unauthorized users
     */
    disableExtensionForUnauthorized() {
        // Remove all extension functionality
        chrome.action.setPopup({ popup: '' });
        chrome.action.setBadgeText({ text: '🔒' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });

        // Show error on click
        chrome.action.onClicked.addListener(() => {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon-128.png',
                title: 'Access Denied',
                message: 'This extension is private and restricted to authorized users only.',
                priority: 2
            });
        });
    }

    /**
     * Store authentication state
     */
    async storeAuthState(userInfo) {
        const authState = {
            authenticated: true,
            user: userInfo,
            timestamp: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };

        await chrome.storage.session.set({ authState });
        return authState;
    }

    /**
     * Generate a secure session ID
     */
    generateSessionId() {
        return crypto.randomUUID ? crypto.randomUUID() :
               Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Revoke access (for logout)
     */
    async revokeAccess() {
        try {
            // Clear OAuth2 token
            await new Promise((resolve) => {
                chrome.identity.getAuthToken({ interactive: false }, (token) => {
                    if (token) {
                        chrome.identity.removeCachedAuthToken({ token }, resolve);
                    } else {
                        resolve();
                    }
                });
            });

            // Clear stored auth state
            await chrome.storage.session.clear();

            // Reset current user
            this.currentUser = null;

            console.log('Access revoked successfully');
            return { success: true };

        } catch (error) {
            console.error('Failed to revoke access:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if current session is valid
     */
    async isSessionValid() {
        const authState = await new Promise((resolve) => {
            chrome.storage.session.get(['authState'], (result) => {
                resolve(result.authState);
            });
        });

        if (!authState || !authState.authenticated) {
            return false;
        }

        // Check session age (expire after 24 hours)
        const sessionAge = Date.now() - new Date(authState.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return sessionAge < maxAge;
    }

    /**
     * Configure the extension for private use
     */
    async configureForPrivateUse(email1, email2) {
        if (!email1 || !email2) {
            throw new Error('Both email addresses are required');
        }

        const config = {
            authorizedEmails: [email1, email2],
            strictMode: true,
            allowLocalTesting: true,
            configuredAt: new Date().toISOString()
        };

        const saved = await this.savePrivateConfig(config);

        if (saved) {
            this.authorizedEmails = [email1, email2];
            console.log('Extension configured for private use');
            return { success: true, message: 'Private configuration saved' };
        }

        return { success: false, error: 'Failed to save configuration' };
    }

    /**
     * Get current authentication status
     */
    async getAuthStatus() {
        const isValid = await this.isSessionValid();

        return {
            initialized: this.initialized,
            authenticated: isValid && this.currentUser !== null,
            user: this.currentUser,
            authorizedEmails: this.authorizedEmails.map(email => {
                // Partially hide emails for security
                const [name, domain] = email.split('@');
                return `${name.substr(0, 3)}***@${domain}`;
            })
        };
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivateAuthenticator;
} else {
    window.PrivateAuthenticator = PrivateAuthenticator;
}