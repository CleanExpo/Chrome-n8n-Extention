/**
 * Advanced Theme System for Chrome Extension
 * Handles dynamic theme switching, system preferences, and theme persistence
 */

class ThemeSystem {
    constructor() {
        this.currentTheme = 'auto';
        this.systemPreference = 'light';
        this.listeners = new Set();
        this.transitions = new Map();

        this.init();
    }

    async init() {
        await this.loadThemePreference();
        this.setupSystemListener();
        this.setupTransitions();
        this.applyTheme(this.currentTheme);

        // Initialize theme for all contexts (popup, options, content)
        this.initializeAllContexts();
    }

    // Theme Loading and Persistence
    async loadThemePreference() {
        try {
            let stored = null;

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(['theme', 'defaultTheme']);
                stored = result.theme || result.defaultTheme || 'auto';
            } else {
                stored = localStorage.getItem('extensionTheme') || 'auto';
            }

            this.currentTheme = stored;
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
            this.currentTheme = 'auto';
        }
    }

    async saveThemePreference(theme) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ theme, defaultTheme: theme });
            } else {
                localStorage.setItem('extensionTheme', theme);
            }

            // Notify other extension contexts
            this.broadcastThemeChange(theme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    // System Theme Detection
    setupSystemListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            this.systemPreference = mediaQuery.matches ? 'dark' : 'light';

            mediaQuery.addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';

                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }

                this.notifyListeners('system-change', {
                    systemPreference: this.systemPreference,
                    effectiveTheme: this.getEffectiveTheme()
                });
            });
        }
    }

    // Theme Application
    applyTheme(theme, options = {}) {
        const { animate = true, context = 'current' } = options;

        this.currentTheme = theme;
        const effectiveTheme = this.getEffectiveTheme();

        if (animate) {
            this.animateThemeChange(effectiveTheme);
        } else {
            this.setThemeImmediate(effectiveTheme);
        }

        // Apply to all contexts if specified
        if (context === 'all') {
            this.applyToAllContexts(theme);
        }

        // Save preference
        this.saveThemePreference(theme);

        // Notify listeners
        this.notifyListeners('theme-change', {
            theme: this.currentTheme,
            effectiveTheme,
            systemPreference: this.systemPreference
        });

        return effectiveTheme;
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemPreference;
        }
        return this.currentTheme;
    }

    setThemeImmediate(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');

        // Update CSS custom properties for immediate effect
        this.updateThemeProperties(theme);
    }

    // Theme Animations
    setupTransitions() {
        const style = document.createElement('style');
        style.textContent = `
            /* Theme transition styles */
            .theme-transition * {
                transition:
                    background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    color 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            .theme-transition *::before,
            .theme-transition *::after {
                transition:
                    background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    color 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Fade transition overlay */
            .theme-fade-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--background);
                opacity: 0;
                pointer-events: none;
                z-index: 10000;
                transition: opacity 150ms ease-out;
            }

            .theme-fade-overlay.active {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }

    animateThemeChange(theme) {
        const body = document.body;
        const fadeOverlay = this.createFadeOverlay();

        // Add transition class
        body.classList.add('theme-transition');

        // Create fade effect
        fadeOverlay.classList.add('active');

        setTimeout(() => {
            this.setThemeImmediate(theme);

            setTimeout(() => {
                fadeOverlay.classList.remove('active');

                setTimeout(() => {
                    body.classList.remove('theme-transition');
                    fadeOverlay.remove();
                }, 150);
            }, 75);
        }, 150);
    }

    createFadeOverlay() {
        const existing = document.querySelector('.theme-fade-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'theme-fade-overlay';
        document.body.appendChild(overlay);
        return overlay;
    }

    // Theme Properties Update
    updateThemeProperties(theme) {
        const root = document.documentElement;
        const isDark = theme === 'dark';

        // Dynamic color updates
        if (isDark) {
            root.style.setProperty('--dynamic-bg', 'var(--dark-background)');
            root.style.setProperty('--dynamic-surface', 'var(--dark-surface)');
            root.style.setProperty('--dynamic-text', 'var(--dark-text-primary)');
            root.style.setProperty('--dynamic-border', 'var(--dark-border)');
        } else {
            root.style.setProperty('--dynamic-bg', 'var(--background)');
            root.style.setProperty('--dynamic-surface', 'var(--surface)');
            root.style.setProperty('--dynamic-text', 'var(--text-primary)');
            root.style.setProperty('--dynamic-border', 'var(--border)');
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');

        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }

        const colors = {
            light: '#ffffff',
            dark: '#0f1419'
        };

        themeColorMeta.content = colors[theme] || colors.light;
    }

    // Multi-Context Theme Management
    initializeAllContexts() {
        // Send theme to all extension contexts
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'themeInitialized',
                theme: this.currentTheme,
                effectiveTheme: this.getEffectiveTheme()
            }).catch(() => {
                // Silently fail if no listeners
            });
        }

        // Initialize content scripts theme
        this.initializeContentScriptTheme();
    }

    initializeContentScriptTheme() {
        // Inject theme variables into content script context
        const style = document.createElement('style');
        style.id = 'extension-theme-variables';
        style.textContent = this.generateThemeCSS(this.getEffectiveTheme());

        // Try to inject into document head, fallback to document.documentElement
        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.documentElement.appendChild(style);
        }
    }

    generateThemeCSS(theme) {
        const isDark = theme === 'dark';

        return `
            :root[data-extension-theme] {
                --ext-primary: #6366f1;
                --ext-background: ${isDark ? '#0f1419' : '#ffffff'};
                --ext-surface: ${isDark ? '#1a1f2e' : '#f8fafc'};
                --ext-text-primary: ${isDark ? '#f9fafb' : '#1f2937'};
                --ext-text-secondary: ${isDark ? '#d1d5db' : '#6b7280'};
                --ext-border: ${isDark ? '#374151' : '#e5e7eb'};
                --ext-shadow: ${isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
            }
        `;
    }

    applyToAllContexts(theme) {
        // Broadcast to all extension contexts
        this.broadcastThemeChange(theme);
    }

    broadcastThemeChange(theme) {
        const message = {
            action: 'themeChanged',
            theme: theme,
            effectiveTheme: this.getEffectiveTheme(),
            timestamp: Date.now()
        };

        // Send to extension runtime
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage(message).catch(() => {
                // Silently handle if no listeners
            });
        }

        // Send to all tabs (for content scripts)
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, message).catch(() => {
                        // Silently handle if content script not present
                    });
                });
            });
        }

        // Local storage broadcast for same-origin contexts
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('themeChangeEvent', JSON.stringify(message));
            localStorage.removeItem('themeChangeEvent');
        }

        // Window message for iframe contexts
        if (typeof window !== 'undefined') {
            window.postMessage(message, '*');
        }
    }

    // Theme Toggle Functions
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];

        return this.applyTheme(nextTheme);
    }

    setTheme(theme, options = {}) {
        const validThemes = ['light', 'dark', 'auto'];

        if (!validThemes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}. Using 'auto' instead.`);
            theme = 'auto';
        }

        return this.applyTheme(theme, options);
    }

    // Advanced Features
    createThemeToggleButton(container, options = {}) {
        const {
            showLabel = false,
            position = 'top-right',
            style = 'floating',
            size = 'medium'
        } = options;

        const button = document.createElement('button');
        button.className = `theme-toggle theme-toggle-${style} theme-toggle-${size}`;
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Switch between light, dark, and auto themes');

        const updateButtonState = (theme, effectiveTheme) => {
            const icons = {
                light: '☀️',
                dark: '🌙',
                auto: '🔄'
            };

            button.innerHTML = `
                <span class="theme-icon">${icons[theme]}</span>
                ${showLabel ? `<span class="theme-label">${theme.charAt(0).toUpperCase() + theme.slice(1)}</span>` : ''}
            `;

            button.setAttribute('data-theme', theme);
            button.setAttribute('data-effective-theme', effectiveTheme);
        };

        // Initialize button state
        updateButtonState(this.currentTheme, this.getEffectiveTheme());

        // Add click handler
        button.addEventListener('click', () => {
            const newTheme = this.toggleTheme();
            updateButtonState(this.currentTheme, newTheme);
        });

        // Listen for theme changes from other sources
        this.addListener('theme-change', ({ theme, effectiveTheme }) => {
            updateButtonState(theme, effectiveTheme);
        });

        // Add styles
        this.addToggleButtonStyles();

        // Position the button
        if (typeof container === 'string') {
            const element = document.querySelector(container);
            if (element) element.appendChild(button);
        } else if (container && container.appendChild) {
            container.appendChild(button);
        } else {
            document.body.appendChild(button);
        }

        return button;
    }

    addToggleButtonStyles() {
        if (document.getElementById('theme-toggle-styles')) return;

        const style = document.createElement('style');
        style.id = 'theme-toggle-styles';
        style.textContent = `
            .theme-toggle {
                background: var(--surface-elevated, #ffffff);
                border: 1px solid var(--border, #e5e7eb);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-family: inherit;
                transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 1000;
            }

            .theme-toggle:hover {
                background: var(--primary-color, #6366f1);
                border-color: var(--primary-color, #6366f1);
                color: white;
                transform: scale(1.05);
                box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
            }

            .theme-toggle:focus {
                outline: 2px solid var(--primary-color, #6366f1);
                outline-offset: 2px;
            }

            .theme-toggle:active {
                transform: scale(0.95);
            }

            .theme-toggle-small {
                width: 32px;
                height: 32px;
                font-size: 14px;
            }

            .theme-toggle-medium {
                width: 44px;
                height: 44px;
                font-size: 18px;
            }

            .theme-toggle-large {
                width: 56px;
                height: 56px;
                font-size: 22px;
            }

            .theme-toggle-floating {
                position: fixed;
                top: 20px;
                right: 20px;
            }

            .theme-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-label {
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
            }

            @media (max-width: 768px) {
                .theme-toggle-floating {
                    top: 10px;
                    right: 10px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Event System
    addListener(event, callback) {
        const listener = { event, callback };
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    removeListener(callback) {
        for (const listener of this.listeners) {
            if (listener.callback === callback) {
                this.listeners.delete(listener);
            }
        }
    }

    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            if (listener.event === event || listener.event === '*') {
                try {
                    listener.callback(data, event);
                } catch (error) {
                    console.warn('Theme listener error:', error);
                }
            }
        }
    }

    // Utility Methods
    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            systemPreference: this.systemPreference
        };
    }

    isSystemDark() {
        return this.systemPreference === 'dark';
    }

    isCurrentlyDark() {
        return this.getEffectiveTheme() === 'dark';
    }

    // Accessibility
    announceThemeChange(theme) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Theme changed to ${theme === 'auto' ? 'automatic' : theme} mode`;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Cleanup
    destroy() {
        this.listeners.clear();
        this.transitions.clear();

        // Remove injected styles
        const themeStyles = document.getElementById('theme-toggle-styles');
        if (themeStyles) themeStyles.remove();

        const themeVariables = document.getElementById('extension-theme-variables');
        if (themeVariables) themeVariables.remove();
    }
}

// Global theme system instance
let globalThemeSystem = null;

// Auto-initialize theme system
function initializeThemeSystem() {
    if (!globalThemeSystem) {
        globalThemeSystem = new ThemeSystem();
    }
    return globalThemeSystem;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeSystem, initializeThemeSystem };
} else if (typeof window !== 'undefined') {
    window.ThemeSystem = ThemeSystem;
    window.initializeThemeSystem = initializeThemeSystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeThemeSystem);
    } else {
        initializeThemeSystem();
    }
}

// Message listener for extension contexts
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'themeChanged' || message.action === 'themeInitialized') {
            if (globalThemeSystem) {
                globalThemeSystem.setTheme(message.theme, { animate: true, context: 'current' });
            }
        }

        if (message.action === 'getTheme') {
            if (globalThemeSystem) {
                sendResponse(globalThemeSystem.getCurrentTheme());
            }
        }
    });
}