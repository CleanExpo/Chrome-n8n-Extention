/**
 * Advanced Animation System for Chrome Extension
 * JavaScript utilities for complex animations and interactions
 */

class AnimationSystem {
    constructor() {
        this.activeAnimations = new Map();
        this.observers = new Set();
        this.performanceMode = this.detectPerformanceMode();
        this.reducedMotion = this.checkReducedMotion();

        this.init();
    }

    init() {
        this.injectAnimationStyles();
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        this.setupReducedMotionListener();
    }

    // Core Animation Methods
    animate(element, animation, options = {}) {
        if (!element || this.reducedMotion) return Promise.resolve();

        const config = {
            duration: 300,
            easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
            fill: 'forwards',
            delay: 0,
            ...options
        };

        // Cancel existing animation on this element
        this.cancelAnimation(element);

        const animationId = this.generateId();
        let animationInstance;

        if (typeof animation === 'string') {
            // CSS class-based animation
            element.classList.add(animation);

            animationInstance = {
                element,
                type: 'class',
                className: animation,
                id: animationId
            };

            // Auto-remove class after animation completes
            const cleanup = () => {
                element.classList.remove(animation);
                this.activeAnimations.delete(animationId);
            };

            setTimeout(cleanup, config.duration);

        } else if (typeof animation === 'object') {
            // Web Animations API
            const webAnimation = element.animate(animation, config);

            animationInstance = {
                element,
                type: 'web',
                animation: webAnimation,
                id: animationId
            };

            webAnimation.addEventListener('finish', () => {
                this.activeAnimations.delete(animationId);
            });

        } else if (typeof animation === 'function') {
            // Custom animation function
            animationInstance = {
                element,
                type: 'custom',
                fn: animation,
                id: animationId
            };

            animation(element, config);
        }

        this.activeAnimations.set(animationId, animationInstance);

        return new Promise(resolve => {
            setTimeout(resolve, config.duration + config.delay);
        });
    }

    // Predefined Animation Methods
    fadeIn(element, options = {}) {
        const keyframes = [
            { opacity: 0 },
            { opacity: 1 }
        ];

        return this.animate(element, keyframes, {
            duration: 300,
            easing: 'ease-out',
            ...options
        });
    }

    fadeOut(element, options = {}) {
        const keyframes = [
            { opacity: 1 },
            { opacity: 0 }
        ];

        return this.animate(element, keyframes, {
            duration: 300,
            easing: 'ease-out',
            ...options
        });
    }

    slideIn(element, direction = 'up', options = {}) {
        const directions = {
            up: [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
            down: [{ transform: 'translateY(-20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
            left: [{ transform: 'translateX(20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
            right: [{ transform: 'translateX(-20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]
        };

        return this.animate(element, directions[direction], {
            duration: 400,
            easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
            ...options
        });
    }

    slideOut(element, direction = 'up', options = {}) {
        const directions = {
            up: [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-20px)', opacity: 0 }],
            down: [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(20px)', opacity: 0 }],
            left: [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-20px)', opacity: 0 }],
            right: [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(20px)', opacity: 0 }]
        };

        return this.animate(element, directions[direction], {
            duration: 400,
            easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
            ...options
        });
    }

    scaleIn(element, options = {}) {
        const keyframes = [
            { transform: 'scale(0.9)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ];

        return this.animate(element, keyframes, {
            duration: 300,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            ...options
        });
    }

    scaleOut(element, options = {}) {
        const keyframes = [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.9)', opacity: 0 }
        ];

        return this.animate(element, keyframes, {
            duration: 300,
            easing: 'ease-out',
            ...options
        });
    }

    bounce(element, options = {}) {
        const keyframes = [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-10px)' },
            { transform: 'translateY(0)' },
            { transform: 'translateY(-5px)' },
            { transform: 'translateY(0)' }
        ];

        return this.animate(element, keyframes, {
            duration: 600,
            easing: 'ease-out',
            ...options
        });
    }

    shake(element, options = {}) {
        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(0)' }
        ];

        return this.animate(element, keyframes, {
            duration: 500,
            easing: 'ease-out',
            ...options
        });
    }

    pulse(element, options = {}) {
        const keyframes = [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.05)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
        ];

        return this.animate(element, keyframes, {
            duration: 400,
            easing: 'ease-in-out',
            ...options
        });
    }

    // Complex Animation Sequences
    async sequence(animations) {
        for (const { element, animation, options } of animations) {
            await this.animate(element, animation, options);
        }
    }

    parallel(animations) {
        const promises = animations.map(({ element, animation, options }) =>
            this.animate(element, animation, options)
        );

        return Promise.all(promises);
    }

    stagger(elements, animation, options = {}) {
        const delay = options.staggerDelay || 100;
        const promises = [];

        elements.forEach((element, index) => {
            const staggerOptions = {
                ...options,
                delay: index * delay
            };

            promises.push(this.animate(element, animation, staggerOptions));
        });

        return Promise.all(promises);
    }

    // Scroll-based Animations
    setupScrollAnimations() {
        const scrollElements = document.querySelectorAll('[data-animate-on-scroll]');

        scrollElements.forEach(element => {
            this.observeForScroll(element);
        });
    }

    observeForScroll(element) {
        const animationType = element.dataset.animateOnScroll;
        const threshold = parseFloat(element.dataset.threshold) || 0.1;
        const once = element.dataset.once !== 'false';

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.triggerScrollAnimation(entry.target, animationType);

                        if (once) {
                            observer.unobserve(entry.target);
                        }
                    }
                });
            },
            { threshold }
        );

        observer.observe(element);
        this.observers.add(observer);
    }

    triggerScrollAnimation(element, type) {
        switch (type) {
            case 'fade-in':
                this.fadeIn(element);
                break;
            case 'slide-up':
                this.slideIn(element, 'up');
                break;
            case 'slide-down':
                this.slideIn(element, 'down');
                break;
            case 'slide-left':
                this.slideIn(element, 'left');
                break;
            case 'slide-right':
                this.slideIn(element, 'right');
                break;
            case 'scale-in':
                this.scaleIn(element);
                break;
            case 'bounce':
                this.bounce(element);
                break;
            default:
                this.fadeIn(element);
        }
    }

    // Interactive Animations
    setupHoverAnimations() {
        const hoverElements = document.querySelectorAll('[data-hover-animation]');

        hoverElements.forEach(element => {
            const animationType = element.dataset.hoverAnimation;

            element.addEventListener('mouseenter', () => {
                this.applyHoverAnimation(element, animationType, 'enter');
            });

            element.addEventListener('mouseleave', () => {
                this.applyHoverAnimation(element, animationType, 'leave');
            });
        });
    }

    applyHoverAnimation(element, type, phase) {
        const animations = {
            lift: {
                enter: [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }],
                leave: [{ transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }]
            },
            scale: {
                enter: [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }],
                leave: [{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }]
            },
            glow: {
                enter: [
                    { boxShadow: '0 0 0 rgba(99, 102, 241, 0)' },
                    { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }
                ],
                leave: [
                    { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
                    { boxShadow: '0 0 0 rgba(99, 102, 241, 0)' }
                ]
            }
        };

        if (animations[type] && animations[type][phase]) {
            this.animate(element, animations[type][phase], {
                duration: 200,
                easing: 'ease-out'
            });
        }
    }

    // Loading Animations
    createLoadingSpinner(container, type = 'default') {
        const spinners = {
            default: () => {
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                return spinner;
            },
            dots: () => {
                const container = document.createElement('div');
                container.className = 'spinner-dots';

                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('span');
                    container.appendChild(dot);
                }

                return container;
            },
            pulse: () => {
                const pulse = document.createElement('div');
                pulse.className = 'pulse';
                pulse.style.cssText = `
                    width: 40px;
                    height: 40px;
                    background: var(--primary-color);
                    border-radius: 50%;
                `;
                return pulse;
            }
        };

        const spinner = spinners[type]();
        container.appendChild(spinner);

        return {
            remove: () => spinner.remove(),
            element: spinner
        };
    }

    // Toast Animations
    showToast(message, type = 'info', options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            maxWidth: '300px',
            fontSize: '14px',
            lineHeight: '1.4'
        };

        Object.assign(toast.style, styles);

        document.body.appendChild(toast);

        // Animate in
        this.animate(toast, 'toast-enter');

        // Auto-remove after delay
        const duration = options.duration || 4000;
        setTimeout(async () => {
            await this.animate(toast, 'toast-exit');
            toast.remove();
        }, duration);

        return toast;
    }

    // Modal Animations
    animateModalOpen(modal, backdrop) {
        if (backdrop) {
            backdrop.classList.add('show');
        }

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('show');
        }

        return this.fadeIn(modal);
    }

    async animateModalClose(modal, backdrop) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('show');
        }

        if (backdrop) {
            backdrop.classList.remove('show');
        }

        await this.fadeOut(modal);
    }

    // Page Transitions
    async transitionPage(fromElement, toElement, type = 'slide') {
        const transitions = {
            slide: async () => {
                await this.parallel([
                    { element: fromElement, animation: 'page-exit' },
                    { element: toElement, animation: 'page-enter', options: { delay: 150 } }
                ]);
            },
            fade: async () => {
                await this.fadeOut(fromElement);
                await this.fadeIn(toElement);
            },
            scale: async () => {
                await this.scaleOut(fromElement);
                await this.scaleIn(toElement);
            }
        };

        if (transitions[type]) {
            await transitions[type]();
        }
    }

    // Tab Animations
    animateTabSwitch(fromTab, toTab) {
        if (fromTab) {
            fromTab.classList.remove('active');
        }

        if (toTab) {
            toTab.classList.add('active');
        }
    }

    // Progress Animations
    animateProgress(progressBar, percentage, duration = 1000) {
        const fill = progressBar.querySelector('.progress-fill');
        if (!fill) return;

        const keyframes = [
            { width: '0%' },
            { width: `${percentage}%` }
        ];

        return this.animate(fill, keyframes, {
            duration,
            easing: 'ease-out'
        });
    }

    // Form Animations
    animateFormError(field) {
        field.classList.add('form-error');

        setTimeout(() => {
            field.classList.remove('form-error');
        }, 600);

        return this.shake(field);
    }

    animateFormSuccess(field) {
        const originalBorder = field.style.borderColor;

        field.style.borderColor = 'var(--success)';
        field.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';

        setTimeout(() => {
            field.style.borderColor = originalBorder;
            field.style.boxShadow = '';
        }, 2000);
    }

    // Utility Methods
    cancelAnimation(element) {
        for (const [id, animation] of this.activeAnimations) {
            if (animation.element === element) {
                if (animation.type === 'web' && animation.animation) {
                    animation.animation.cancel();
                } else if (animation.type === 'class') {
                    element.classList.remove(animation.className);
                }
                this.activeAnimations.delete(id);
            }
        }
    }

    cancelAllAnimations() {
        for (const [id, animation] of this.activeAnimations) {
            if (animation.type === 'web' && animation.animation) {
                animation.animation.cancel();
            } else if (animation.type === 'class') {
                animation.element.classList.remove(animation.className);
            }
        }
        this.activeAnimations.clear();
    }

    // Performance Monitoring
    detectPerformanceMode() {
        // Basic performance detection
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection) {
            const slowConnections = ['slow-2g', '2g', '3g'];
            if (slowConnections.includes(connection.effectiveType)) {
                return 'low';
            }
        }

        // Check if device has limited memory
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            return 'low';
        }

        // Check for reduced motion preference
        if (this.checkReducedMotion()) {
            return 'minimal';
        }

        return 'high';
    }

    checkReducedMotion() {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    setupPerformanceMonitoring() {
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();

        const checkFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

                if (fps < 30 && this.performanceMode === 'high') {
                    this.performanceMode = 'low';
                    this.notifyPerformanceChange();
                }

                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(checkFrameRate);
        };

        requestAnimationFrame(checkFrameRate);
    }

    setupReducedMotionListener() {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;

            if (this.reducedMotion) {
                this.cancelAllAnimations();
            }
        });
    }

    notifyPerformanceChange() {
        // Reduce animation complexity based on performance
        if (this.performanceMode === 'low') {
            document.documentElement.classList.add('low-performance');
        } else {
            document.documentElement.classList.remove('low-performance');
        }
    }

    // Intersection Observer Setup
    setupIntersectionObserver() {
        this.setupScrollAnimations();
    }

    // CSS Injection
    injectAnimationStyles() {
        if (document.getElementById('animation-system-styles')) return;

        const link = document.createElement('link');
        link.id = 'animation-system-styles';
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('animation-system.css');

        document.head.appendChild(link);
    }

    // Cleanup
    destroy() {
        this.cancelAllAnimations();

        // Clean up observers
        for (const observer of this.observers) {
            observer.disconnect();
        }
        this.observers.clear();

        // Remove injected styles
        const styleElement = document.getElementById('animation-system-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }

    // Utility
    generateId() {
        return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API
    getActiveAnimations() {
        return Array.from(this.activeAnimations.values());
    }

    getPerformanceMode() {
        return this.performanceMode;
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;
        this.notifyPerformanceChange();
    }
}

// Global instance
let globalAnimationSystem = null;

// Auto-initialization
function initializeAnimationSystem() {
    if (!globalAnimationSystem) {
        globalAnimationSystem = new AnimationSystem();
    }
    return globalAnimationSystem;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationSystem, initializeAnimationSystem };
} else if (typeof window !== 'undefined') {
    window.AnimationSystem = AnimationSystem;
    window.initializeAnimationSystem = initializeAnimationSystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAnimationSystem);
    } else {
        initializeAnimationSystem();
    }
}

// Convenience methods for global usage
if (typeof window !== 'undefined') {
    window.animate = (element, animation, options) => {
        const system = window.animationSystem || initializeAnimationSystem();
        return system.animate(element, animation, options);
    };

    window.fadeIn = (element, options) => {
        const system = window.animationSystem || initializeAnimationSystem();
        return system.fadeIn(element, options);
    };

    window.fadeOut = (element, options) => {
        const system = window.animationSystem || initializeAnimationSystem();
        return system.fadeOut(element, options);
    };

    window.slideIn = (element, direction, options) => {
        const system = window.animationSystem || initializeAnimationSystem();
        return system.slideIn(element, direction, options);
    };

    window.showToast = (message, type, options) => {
        const system = window.animationSystem || initializeAnimationSystem();
        return system.showToast(message, type, options);
    };
}