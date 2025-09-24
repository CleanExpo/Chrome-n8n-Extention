/**
 * Google Cloud Authentication Manager
 * Handles OAuth 2.0, Service Account, and API Key authentication
 */

class GoogleAuthManager {
    constructor() {
        this.authMethods = {
            oauth: null,
            serviceAccount: null,
            apiKey: null
        };
        this.currentAuth = null;
        this.tokenRefreshInterval = null;
    }

    /**
     * Initialize OAuth 2.0 authentication
     */
    async initializeOAuth(config) {
        try {
            this.authMethods.oauth = {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: config.redirectUri || chrome.identity.getRedirectURL(),
                scopes: config.scopes || [
                    'https://www.googleapis.com/auth/cloud-platform',
                    'https://www.googleapis.com/auth/cloud-translation',
                    'https://www.googleapis.com/auth/analytics.readonly',
                    'https://www.googleapis.com/auth/bigquery',
                    'https://www.googleapis.com/auth/monitoring.read',
                    'https://www.googleapis.com/auth/cloudsecuritycenter.readonly'
                ],
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            };

            console.log('OAuth 2.0 authentication initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize OAuth 2.0:', error);
            throw error;
        }
    }

    /**
     * Initialize Service Account authentication
     */
    async initializeServiceAccount(serviceAccountKey) {
        try {
            if (typeof serviceAccountKey === 'string') {
                serviceAccountKey = JSON.parse(serviceAccountKey);
            }

            this.authMethods.serviceAccount = {
                type: serviceAccountKey.type,
                projectId: serviceAccountKey.project_id,
                privateKeyId: serviceAccountKey.private_key_id,
                privateKey: serviceAccountKey.private_key,
                clientEmail: serviceAccountKey.client_email,
                clientId: serviceAccountKey.client_id,
                authUri: serviceAccountKey.auth_uri,
                tokenUri: serviceAccountKey.token_uri,
                accessToken: null,
                expiresAt: null
            };

            console.log('Service Account authentication initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Service Account:', error);
            throw error;
        }
    }

    /**
     * Set API Key for services that support it
     */
    setAPIKey(apiKey) {
        this.authMethods.apiKey = apiKey;
        console.log('API Key authentication configured');
    }

    /**
     * Perform OAuth 2.0 login flow
     */
    async loginWithOAuth() {
        try {
            if (!this.authMethods.oauth) {
                throw new Error('OAuth not initialized');
            }

            const oauth = this.authMethods.oauth;

            // Build authorization URL
            const authUrl = new URL('https://accounts.google.com/oauth2/v2/auth');
            authUrl.searchParams.append('client_id', oauth.clientId);
            authUrl.searchParams.append('redirect_uri', oauth.redirectUri);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('scope', oauth.scopes.join(' '));
            authUrl.searchParams.append('access_type', 'offline');
            authUrl.searchParams.append('prompt', 'consent');

            // Launch OAuth flow
            const redirectUrl = await chrome.identity.launchWebAuthFlow({
                url: authUrl.toString(),
                interactive: true
            });

            // Extract authorization code
            const urlParams = new URL(redirectUrl).searchParams;
            const code = urlParams.get('code');

            if (!code) {
                throw new Error('Authorization code not received');
            }

            // Exchange code for tokens
            const tokenResponse = await this.exchangeCodeForTokens(code);

            oauth.accessToken = tokenResponse.access_token;
            oauth.refreshToken = tokenResponse.refresh_token;
            oauth.expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

            this.currentAuth = 'oauth';
            this.startTokenRefreshTimer();

            console.log('OAuth 2.0 login successful');
            return tokenResponse;
        } catch (error) {
            console.error('OAuth login failed:', error);
            throw error;
        }
    }

    /**
     * Exchange authorization code for access tokens
     */
    async exchangeCodeForTokens(code) {
        const oauth = this.authMethods.oauth;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: oauth.clientId,
                client_secret: oauth.clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: oauth.redirectUri
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
        }

        return await tokenResponse.json();
    }

    /**
     * Generate Service Account JWT token
     */
    async generateServiceAccountToken(scopes = ['https://www.googleapis.com/auth/cloud-platform']) {
        try {
            if (!this.authMethods.serviceAccount) {
                throw new Error('Service Account not initialized');
            }

            const sa = this.authMethods.serviceAccount;
            const now = Math.floor(Date.now() / 1000);
            const expiry = now + 3600; // 1 hour

            const header = {
                alg: 'RS256',
                typ: 'JWT',
                kid: sa.privateKeyId
            };

            const payload = {
                iss: sa.clientEmail,
                scope: scopes.join(' '),
                aud: 'https://oauth2.googleapis.com/token',
                exp: expiry,
                iat: now
            };

            // Note: In a real implementation, you'd need a JWT library for RS256 signing
            // For now, we'll simulate the token request
            const assertion = await this.createJWTAssertion(header, payload, sa.privateKey);

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: assertion
                })
            });

            if (!tokenResponse.ok) {
                throw new Error(`Service Account token request failed: ${tokenResponse.statusText}`);
            }

            const tokenData = await tokenResponse.json();
            sa.accessToken = tokenData.access_token;
            sa.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            this.currentAuth = 'serviceAccount';
            return tokenData.access_token;
        } catch (error) {
            console.error('Service Account token generation failed:', error);
            throw error;
        }
    }

    /**
     * Create JWT assertion (simplified - would need proper JWT library in production)
     */
    async createJWTAssertion(header, payload, privateKey) {
        // This is a simplified implementation
        // In production, use a proper JWT library like jose or jsonwebtoken
        try {
            const headerB64 = btoa(JSON.stringify(header));
            const payloadB64 = btoa(JSON.stringify(payload));
            const signatureInput = `${headerB64}.${payloadB64}`;

            // Note: This would require proper RS256 signing in production
            // For now, return a placeholder that would work with proper implementation
            return `${headerB64}.${payloadB64}.signature_placeholder`;
        } catch (error) {
            throw new Error('JWT assertion creation failed: ' + error.message);
        }
    }

    /**
     * Get current access token
     */
    async getAccessToken() {
        if (this.currentAuth === 'oauth') {
            const oauth = this.authMethods.oauth;

            // Check if token needs refresh
            if (oauth.expiresAt && Date.now() >= oauth.expiresAt - 60000) { // Refresh 1 min early
                await this.refreshOAuthToken();
            }

            return oauth.accessToken;
        } else if (this.currentAuth === 'serviceAccount') {
            const sa = this.authMethods.serviceAccount;

            // Check if token needs refresh
            if (sa.expiresAt && Date.now() >= sa.expiresAt - 60000) {
                await this.generateServiceAccountToken();
            }

            return sa.accessToken;
        } else if (this.authMethods.apiKey) {
            return this.authMethods.apiKey;
        }

        throw new Error('No valid authentication method configured');
    }

    /**
     * Refresh OAuth access token
     */
    async refreshOAuthToken() {
        try {
            const oauth = this.authMethods.oauth;

            if (!oauth.refreshToken) {
                throw new Error('No refresh token available');
            }

            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: oauth.clientId,
                    client_secret: oauth.clientSecret,
                    refresh_token: oauth.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!refreshResponse.ok) {
                throw new Error(`Token refresh failed: ${refreshResponse.statusText}`);
            }

            const tokenData = await refreshResponse.json();
            oauth.accessToken = tokenData.access_token;
            oauth.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            console.log('OAuth token refreshed successfully');
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }

    /**
     * Start automatic token refresh timer
     */
    startTokenRefreshTimer() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }

        // Check every 5 minutes if token needs refresh
        this.tokenRefreshInterval = setInterval(async () => {
            try {
                await this.getAccessToken(); // This will trigger refresh if needed
            } catch (error) {
                console.error('Automatic token refresh failed:', error);
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Get authorization headers for API requests
     */
    async getAuthHeaders() {
        try {
            const token = await this.getAccessToken();

            if (this.currentAuth === 'apiKey') {
                return {
                    'X-goog-api-key': token
                };
            } else {
                return {
                    'Authorization': `Bearer ${token}`
                };
            }
        } catch (error) {
            console.error('Failed to get auth headers:', error);
            throw error;
        }
    }

    /**
     * Check authentication status
     */
    getAuthStatus() {
        return {
            currentAuth: this.currentAuth,
            oauth: this.authMethods.oauth ? {
                configured: true,
                hasToken: !!this.authMethods.oauth.accessToken,
                expiresAt: this.authMethods.oauth.expiresAt
            } : { configured: false },
            serviceAccount: this.authMethods.serviceAccount ? {
                configured: true,
                hasToken: !!this.authMethods.serviceAccount.accessToken,
                expiresAt: this.authMethods.serviceAccount.expiresAt
            } : { configured: false },
            apiKey: {
                configured: !!this.authMethods.apiKey
            }
        };
    }

    /**
     * Logout and clear tokens
     */
    async logout() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }

        if (this.authMethods.oauth) {
            this.authMethods.oauth.accessToken = null;
            this.authMethods.oauth.refreshToken = null;
            this.authMethods.oauth.expiresAt = null;
        }

        if (this.authMethods.serviceAccount) {
            this.authMethods.serviceAccount.accessToken = null;
            this.authMethods.serviceAccount.expiresAt = null;
        }

        this.currentAuth = null;
        console.log('Authentication cleared');
    }
}

// Singleton instance
const googleAuthManager = new GoogleAuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleAuthManager, googleAuthManager };
} else {
    window.GoogleAuthManager = GoogleAuthManager;
    window.googleAuthManager = googleAuthManager;
}