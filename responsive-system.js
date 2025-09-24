/**
 * Responsive System JavaScript utilities
 * Handles dynamic responsive behavior and viewport management
 */

class ResponsiveSystem {
    constructor() {
        this.breakpoints = {
            xs: 320,
            sm: 480,
            md: 768,
            lg: 1024,
            xl: 1200,
            '2xl': 1440
        };

        this.currentBreakpoint = 'xs';
        this.orientation = 'portrait';
        this.pixelRatio = window.devicePixelRatio || 1;
        this.touchDevice = this.detectTouchDevice();
        this.reducedMotion = this.checkReducedMotion();
        this.reducedData = this.checkReducedData();

        this.listeners = new Set();
        this.resizeObservers = new Map();
        this.mediaQueries = new Map();

        this.init();
    }

    init() {
        this.updateCurrentBreakpoint();
        this.updateOrientation();
        this.setupEventListeners();
        this.setupMediaQueries();
        this.injectResponsiveStyles();
        this.initializeViewportUnits();
    }

    // Breakpoint Detection
    updateCurrentBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint = 'xs';

        for (const [name, minWidth] of Object.entries(this.breakpoints).reverse()) {
            if (width >= minWidth) {
                newBreakpoint = name;
                break;
            }
        }

        const previousBreakpoint = this.currentBreakpoint;
        this.currentBreakpoint = newBreakpoint;

        if (previousBreakpoint !== newBreakpoint) {
            this.notifyBreakpointChange(newBreakpoint, previousBreakpoint);
        }

        document.documentElement.setAttribute('data-breakpoint', newBreakpoint);
        return newBreakpoint;
    }

    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }

    isBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    isBreakpointUp(breakpoint) {
        const currentWidth = window.innerWidth;
        const breakpointWidth = this.breakpoints[breakpoint];
        return currentWidth >= breakpointWidth;
    }

    isBreakpointDown(breakpoint) {
        const currentWidth = window.innerWidth;
        const breakpointWidth = this.breakpoints[breakpoint];
        return currentWidth < breakpointWidth;
    }

    // Orientation Management
    updateOrientation() {
        const previousOrientation = this.orientation;

        if (window.matchMedia('(orientation: landscape)').matches) {
            this.orientation = 'landscape';
        } else {
            this.orientation = 'portrait';
        }

        if (previousOrientation !== this.orientation) {
            this.notifyOrientationChange(this.orientation, previousOrientation);
        }

        document.documentElement.setAttribute('data-orientation', this.orientation);
        return this.orientation;
    }

    getOrientation() {
        return this.orientation;
    }

    isLandscape() {
        return this.orientation === 'landscape';
    }

    isPortrait() {
        return this.orientation === 'portrait';
    }

    // Device Detection
    detectTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }

    isTouchDevice() {
        return this.touchDevice;
    }

    isHighDPI() {
        return this.pixelRatio >= 2;
    }

    checkReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    checkReducedData() {
        return window.matchMedia('(prefers-reduced-data: reduce)').matches;
    }

    getDeviceInfo() {
        return {
            breakpoint: this.currentBreakpoint,
            orientation: this.orientation,
            pixelRatio: this.pixelRatio,
            isTouch: this.touchDevice,
            reducedMotion: this.reducedMotion,
            reducedData: this.reducedData,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    // Viewport Management
    initializeViewportUnits() {
        this.updateViewportUnits();
    }

    updateViewportUnits() {
        // Set CSS custom properties for accurate viewport units
        const vh = window.innerHeight * 0.01;
        const vw = window.innerWidth * 0.01;
        const vmin = Math.min(window.innerWidth, window.innerHeight) * 0.01;
        const vmax = Math.max(window.innerWidth, window.innerHeight) * 0.01;

        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--vw', `${vw}px`);
        document.documentElement.style.setProperty('--vmin', `${vmin}px`);
        document.documentElement.style.setProperty('--vmax', `${vmax}px`);

        // Set safe area insets if available
        if (CSS.supports('padding: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
            document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
            document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Resize listener with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCurrentBreakpoint();
                this.updateOrientation();
                this.updateViewportUnits();
                this.notifyResize();
            }, 150);
        });

        // Orientation change listener
        window.addEventListener('orientationchange', () => {
            // Delay to ensure proper measurement after orientation change
            setTimeout(() => {
                this.updateOrientation();
                this.updateViewportUnits();
                this.notifyOrientationChange(this.orientation);
            }, 100);
        });

        // Pixel ratio change listener
        const pixelRatioQuery = window.matchMedia(`(resolution: ${this.pixelRatio}dppx)`);
        pixelRatioQuery.addEventListener('change', () => {
            this.pixelRatio = window.devicePixelRatio || 1;
            this.notifyPixelRatioChange(this.pixelRatio);
        });
    }

    // Media Query Management
    setupMediaQueries() {
        // Breakpoint media queries
        for (const [name, minWidth] of Object.entries(this.breakpoints)) {
            const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);

            mediaQuery.addEventListener('change', () => {
                this.updateCurrentBreakpoint();
            });

            this.mediaQueries.set(name, mediaQuery);
        }

        // Orientation media query
        const orientationQuery = window.matchMedia('(orientation: landscape)');
        orientationQuery.addEventListener('change', () => {
            this.updateOrientation();
        });

        // Reduced motion media query
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            document.documentElement.toggleClass('reduced-motion', this.reducedMotion);
            this.notifyReducedMotionChange(this.reducedMotion);
        });

        // Reduced data media query
        const reducedDataQuery = window.matchMedia('(prefers-reduced-data: reduce)');
        reducedDataQuery.addEventListener('change', (e) => {
            this.reducedData = e.matches;
            document.documentElement.toggleClass('reduced-data', this.reducedData);
            this.notifyReducedDataChange(this.reducedData);
        });

        // Hover capability
        const hoverQuery = window.matchMedia('(hover: hover)');
        document.documentElement.toggleClass('can-hover', hoverQuery.matches);

        hoverQuery.addEventListener('change', (e) => {
            document.documentElement.toggleClass('can-hover', e.matches);
        });
    }

    // Element-specific Responsive Management
    makeResponsive(element, config = {}) {
        const {
            breakpoints = this.breakpoints,
            classes = {},
            styles = {},
            attributes = {},
            behavior = {}
        } = config;

        // Apply classes based on breakpoints
        const updateClasses = () => {
            const bp = this.getCurrentBreakpoint();

            // Remove all breakpoint classes
            Object.keys(classes).forEach(breakpoint => {
                if (classes[breakpoint]) {
                    element.classList.remove(...classes[breakpoint]);
                }
            });

            // Add current breakpoint classes
            if (classes[bp]) {
                element.classList.add(...classes[bp]);
            }
        };

        // Apply styles based on breakpoints
        const updateStyles = () => {
            const bp = this.getCurrentBreakpoint();

            if (styles[bp]) {
                Object.assign(element.style, styles[bp]);
            }
        };

        // Apply attributes based on breakpoints
        const updateAttributes = () => {
            const bp = this.getCurrentBreakpoint();

            if (attributes[bp]) {
                Object.entries(attributes[bp]).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
            }
        };

        // Execute behavior functions
        const updateBehavior = () => {
            const bp = this.getCurrentBreakpoint();

            if (behavior[bp] && typeof behavior[bp] === 'function') {
                behavior[bp](element, bp);
            }
        };

        // Initial setup
        updateClasses();
        updateStyles();
        updateAttributes();
        updateBehavior();

        // Listen for breakpoint changes
        const listener = () => {
            updateClasses();
            updateStyles();
            updateAttributes();
            updateBehavior();
        };

        this.addListener('breakpoint-change', listener);

        return {
            destroy: () => {
                this.removeListener('breakpoint-change', listener);
            }
        };
    }

    // Resize Observer Integration
    observeElement(element, callback) {
        if (!window.ResizeObserver) {
            console.warn('ResizeObserver not supported');
            return { disconnect: () => {} };
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                callback({
                    element: entry.target,
                    width,
                    height,
                    breakpoint: this.getBreakpointForWidth(width)
                });
            }
        });

        observer.observe(element);
        this.resizeObservers.set(element, observer);

        return {
            disconnect: () => {
                observer.disconnect();
                this.resizeObservers.delete(element);
            }
        };
    }

    getBreakpointForWidth(width) {
        for (const [name, minWidth] of Object.entries(this.breakpoints).reverse()) {
            if (width >= minWidth) {
                return name;
            }
        }
        return 'xs';
    }

    // Container Queries Polyfill (basic)
    setupContainerQueries(container, queries) {
        if (!container || !queries) return;

        const observer = this.observeElement(container, ({ width, height }) => {
            Object.entries(queries).forEach(([condition, callback]) => {
                const [type, value] = condition.split('-');
                const numValue = parseInt(value);

                let matches = false;
                if (type === 'min' && width >= numValue) matches = true;
                if (type === 'max' && width <= numValue) matches = true;

                if (matches) {
                    callback(container, { width, height });
                }
            });
        });

        return observer;
    }

    // Responsive Image Management
    updateResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');

        images.forEach(img => {
            const breakpoint = this.getCurrentBreakpoint();
            const srcSet = img.dataset[`src${breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}`];

            if (srcSet && img.src !== srcSet) {
                img.src = srcSet;
            }
        });
    }

    // Grid System Utilities
    calculateGridColumns(containerWidth, itemMinWidth = 280, gap = 16) {
        const availableWidth = containerWidth - gap;
        const itemWidthWithGap = itemMinWidth + gap;
        return Math.max(1, Math.floor(availableWidth / itemWidthWithGap));
    }

    calculateOptimalColumns(container, items, minItemWidth = 280) {
        const containerWidth = container.offsetWidth;
        const itemCount = items.length;
        const maxColumns = Math.floor(containerWidth / minItemWidth);

        // Find the most balanced distribution
        for (let cols = maxColumns; cols >= 1; cols--) {
            const rows = Math.ceil(itemCount / cols);
            const itemsInLastRow = itemCount % cols || cols;

            // Prefer layouts where the last row isn't too empty
            if (itemsInLastRow >= cols * 0.6) {
                return cols;
            }
        }

        return 1;
    }

    // Touch and Interaction Utilities
    setupTouchOptimizations() {
        if (!this.isTouchDevice()) return;

        // Improve touch targets
        const smallElements = document.querySelectorAll('button, a, input, select');
        smallElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
            }
        });

        // Disable hover effects on touch devices
        document.documentElement.classList.add('touch-device');

        // Add touch-friendly scroll behavior
        const scrollableElements = document.querySelectorAll('[data-scrollable]');
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.scrollBehavior = 'smooth';
        });
    }

    // Performance Optimizations
    optimizeForPerformance() {
        const bp = this.getCurrentBreakpoint();

        // Reduce animations on smaller screens or reduced motion
        if (['xs', 'sm'].includes(bp) || this.reducedMotion) {
            document.documentElement.classList.add('reduced-animations');
        } else {
            document.documentElement.classList.remove('reduced-animations');
        }

        // Optimize images for high DPI
        if (this.isHighDPI()) {
            const images = document.querySelectorAll('img[data-src-2x]');
            images.forEach(img => {
                if (img.dataset.src2x) {
                    img.src = img.dataset.src2x;
                }
            });
        }

        // Lazy load content on smaller screens
        if (['xs', 'sm'].includes(bp)) {
            this.setupLazyLoading();
        }
    }

    setupLazyLoading() {
        const lazyElements = document.querySelectorAll('[data-lazy-load]');

        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;

                        if (element.dataset.lazyLoad === 'image' && element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                        } else if (element.dataset.lazyLoad === 'content') {
                            element.style.display = 'block';
                        }

                        lazyObserver.unobserve(element);
                    }
                });
            });

            lazyElements.forEach(element => lazyObserver.observe(element));
        }
    }

    // CSS Injection
    injectResponsiveStyles() {
        if (document.getElementById('responsive-system-styles')) return;

        const link = document.createElement('link');
        link.id = 'responsive-system-styles';
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('responsive-system.css');

        document.head.appendChild(link);
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

    notifyBreakpointChange(newBreakpoint, previousBreakpoint) {
        this.notifyListeners('breakpoint-change', {
            current: newBreakpoint,
            previous: previousBreakpoint,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }

    notifyOrientationChange(newOrientation, previousOrientation) {
        this.notifyListeners('orientation-change', {
            current: newOrientation,
            previous: previousOrientation
        });
    }

    notifyResize() {
        this.notifyListeners('resize', {
            breakpoint: this.currentBreakpoint,
            orientation: this.orientation,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }

    notifyPixelRatioChange(pixelRatio) {
        this.notifyListeners('pixel-ratio-change', { pixelRatio });
    }

    notifyReducedMotionChange(reducedMotion) {
        this.notifyListeners('reduced-motion-change', { reducedMotion });
    }

    notifyReducedDataChange(reducedData) {
        this.notifyListeners('reduced-data-change', { reducedData });
    }

    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            if (listener.event === event || listener.event === '*') {
                try {
                    listener.callback(data, event);
                } catch (error) {
                    console.warn('Responsive system listener error:', error);
                }
            }
        }
    }

    // Utility Methods
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Cleanup
    destroy() {
        // Disconnect all resize observers
        for (const observer of this.resizeObservers.values()) {
            observer.disconnect();
        }
        this.resizeObservers.clear();

        // Clear listeners
        this.listeners.clear();

        // Remove injected styles
        const styleElement = document.getElementById('responsive-system-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }

    // Debug Utilities
    enableDebugMode() {
        document.documentElement.classList.add('debug-responsive');

        // Log breakpoint changes
        this.addListener('breakpoint-change', (data) => {
            console.log('Breakpoint changed:', data);
        });

        // Log orientation changes
        this.addListener('orientation-change', (data) => {
            console.log('Orientation changed:', data);
        });
    }

    getDebugInfo() {
        return {
            ...this.getDeviceInfo(),
            mediaQueries: Object.fromEntries(
                Array.from(this.mediaQueries.entries()).map(([name, mq]) => [name, mq.matches])
            ),
            activeListeners: this.listeners.size,
            activeObservers: this.resizeObservers.size
        };
    }
}

// Global instance
let globalResponsiveSystem = null;

// Auto-initialization
function initializeResponsiveSystem() {
    if (!globalResponsiveSystem) {
        globalResponsiveSystem = new ResponsiveSystem();
    }
    return globalResponsiveSystem;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResponsiveSystem, initializeResponsiveSystem };
} else if (typeof window !== 'undefined') {
    window.ResponsiveSystem = ResponsiveSystem;
    window.initializeResponsiveSystem = initializeResponsiveSystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeResponsiveSystem);
    } else {
        initializeResponsiveSystem();
    }
}

// Convenience methods
if (typeof window !== 'undefined') {
    window.getCurrentBreakpoint = () => {
        const system = window.responsiveSystem || initializeResponsiveSystem();
        return system.getCurrentBreakpoint();
    };

    window.isBreakpointUp = (breakpoint) => {
        const system = window.responsiveSystem || initializeResponsiveSystem();
        return system.isBreakpointUp(breakpoint);
    };

    window.makeResponsive = (element, config) => {
        const system = window.responsiveSystem || initializeResponsiveSystem();
        return system.makeResponsive(element, config);
    };

    // Set global reference
    window.responsiveSystem = globalResponsiveSystem;
}