/**
 * Comprehensive Accessibility System for Chrome Extension
 * Implements WCAG 2.1 AA standards and provides accessibility utilities
 */

class AccessibilitySystem {
    constructor() {
        this.focusHistory = [];
        this.skipLinks = new Map();
        this.liveRegions = new Map();
        this.keyboardTraps = new Set();
        this.announcementQueue = [];
        this.highContrastMode = false;
        this.reducedMotion = false;
        this.screenReaderActive = false;

        this.keyHandlers = new Map();
        this.focusHandlers = new Map();

        this.init();
    }

    async init() {
        this.detectScreenReader();
        this.setupReducedMotionDetection();
        this.setupHighContrastDetection();
        this.injectAccessibilityStyles();
        this.setupGlobalKeyboardNavigation();
        this.setupFocusManagement();
        this.createLiveRegions();
        this.setupSkipLinks();
        this.enhanceExistingElements();
    }

    // Screen Reader Detection
    detectScreenReader() {
        // Check for common screen readers
        const userAgent = navigator.userAgent.toLowerCase();
        const screenReaders = [
            'nvda', 'jaws', 'voiceover', 'orca',
            'narrator', 'dragon', 'talkback'
        ];

        this.screenReaderActive = screenReaders.some(sr => userAgent.includes(sr));

        // Also check for assistive technology indicators
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            navigator.userAgentData.getHighEntropyValues(['architecture', 'platformVersion'])
                .then(values => {
                    // Additional detection logic based on high entropy values
                    this.notifyScreenReaderDetection();
                });
        } else {
            this.notifyScreenReaderDetection();
        }

        return this.screenReaderActive;
    }

    notifyScreenReaderDetection() {
        if (this.screenReaderActive) {
            document.documentElement.classList.add('screen-reader-active');
            this.announce('Screen reader support activated');
        }
    }

    // High Contrast Detection
    setupHighContrastDetection() {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

        this.highContrastMode = highContrastQuery.matches;
        document.documentElement.classList.toggle('high-contrast', this.highContrastMode);

        highContrastQuery.addEventListener('change', (e) => {
            this.highContrastMode = e.matches;
            document.documentElement.classList.toggle('high-contrast', this.highContrastMode);
            this.applyHighContrastStyles();
        });
    }

    applyHighContrastStyles() {
        if (this.highContrastMode) {
            const elements = document.querySelectorAll('*');
            elements.forEach(element => {
                const styles = window.getComputedStyle(element);

                // Ensure sufficient contrast for text
                if (styles.color && styles.backgroundColor) {
                    const contrast = this.calculateContrast(styles.color, styles.backgroundColor);
                    if (contrast < 4.5) {
                        element.style.color = '#000000';
                        element.style.backgroundColor = '#ffffff';
                    }
                }
            });
        }
    }

    // Reduced Motion Detection
    setupReducedMotionDetection() {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        this.reducedMotion = reducedMotionQuery.matches;
        document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);

        reducedMotionQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);

            if (this.reducedMotion) {
                this.disableAnimations();
            }
        });
    }

    disableAnimations() {
        const style = document.createElement('style');
        style.id = 'reduced-motion-override';
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;

        if (!document.getElementById('reduced-motion-override')) {
            document.head.appendChild(style);
        }
    }

    // Live Regions Management
    createLiveRegions() {
        // Create different types of live regions
        const liveRegions = [
            { id: 'announcements', type: 'polite' },
            { id: 'status', type: 'status' },
            { id: 'alerts', type: 'alert' },
            { id: 'errors', type: 'assertive' }
        ];

        liveRegions.forEach(({ id, type }) => {
            let region = document.getElementById(`aria-live-${id}`);

            if (!region) {
                region = document.createElement('div');
                region.id = `aria-live-${id}`;
                region.className = 'sr-only';
                region.setAttribute('aria-live', type === 'status' ? 'polite' : type);
                region.setAttribute('aria-atomic', 'true');

                if (type === 'status') {
                    region.setAttribute('role', 'status');
                } else if (type === 'alert') {
                    region.setAttribute('role', 'alert');
                }

                document.body.appendChild(region);
            }

            this.liveRegions.set(id, region);
        });
    }

    announce(message, type = 'announcements', priority = 'low') {
        const region = this.liveRegions.get(type);
        if (!region) return;

        // Queue announcements to avoid overwhelming screen readers
        this.announcementQueue.push({ message, region, priority });
        this.processAnnouncementQueue();
    }

    processAnnouncementQueue() {
        if (this.processingAnnouncements) return;

        this.processingAnnouncements = true;

        const processNext = () => {
            if (this.announcementQueue.length === 0) {
                this.processingAnnouncements = false;
                return;
            }

            const { message, region, priority } = this.announcementQueue.shift();

            // Clear previous message
            region.textContent = '';

            // Add new message with slight delay to ensure it's announced
            setTimeout(() => {
                region.textContent = message;

                // Schedule next announcement
                const delay = priority === 'high' ? 500 : 1000;
                setTimeout(processNext, delay);
            }, 100);
        };

        processNext();
    }

    // Focus Management
    setupFocusManagement() {
        // Track focus history for restoration
        document.addEventListener('focusin', (e) => {
            if (e.target !== document.body) {
                this.focusHistory.push(e.target);

                // Limit history size
                if (this.focusHistory.length > 10) {
                    this.focusHistory.shift();
                }
            }
        });

        // Enhanced focus visibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.documentElement.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.documentElement.classList.remove('keyboard-navigation');
        });
    }

    manageFocus(element, options = {}) {
        const {
            preventScroll = false,
            restoreOnEscape = true,
            trapFocus = false,
            announceChange = true
        } = options;

        if (!element) return;

        // Store previous focus for restoration
        const previousFocus = document.activeElement;

        // Focus the element
        element.focus({ preventScroll });

        if (announceChange) {
            const label = this.getAccessibleLabel(element);
            if (label) {
                this.announce(`Focused on ${label}`);
            }
        }

        // Set up focus trap if requested
        if (trapFocus) {
            this.trapFocus(element);
        }

        // Set up escape key to restore focus
        if (restoreOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    previousFocus?.focus();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };

            document.addEventListener('keydown', escapeHandler);
        }

        return {
            restore: () => previousFocus?.focus(),
            element: previousFocus
        };
    }

    trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const trapHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        };

        container.addEventListener('keydown', trapHandler);
        this.keyboardTraps.add({ container, handler: trapHandler });

        return {
            release: () => {
                container.removeEventListener('keydown', trapHandler);
                this.keyboardTraps.delete({ container, handler: trapHandler });
            }
        };
    }

    getFocusableElements(container = document) {
        const selector = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
            'audio[controls]',
            'video[controls]',
            'details > summary'
        ].join(', ');

        return Array.from(container.querySelectorAll(selector))
            .filter(element => {
                return this.isVisible(element) && !this.isHidden(element);
            });
    }

    // Skip Links
    setupSkipLinks() {
        const mainContent = document.querySelector('main, #main, .main-content');
        const navigation = document.querySelector('nav, #nav, .navigation');

        if (mainContent || navigation) {
            this.createSkipLinks([
                { target: navigation, text: 'Skip to navigation' },
                { target: mainContent, text: 'Skip to main content' }
            ]);
        }
    }

    createSkipLinks(links) {
        const skipContainer = document.createElement('div');
        skipContainer.className = 'skip-links';
        skipContainer.setAttribute('role', 'navigation');
        skipContainer.setAttribute('aria-label', 'Skip links');

        links.forEach(({ target, text, id }) => {
            if (!target) return;

            // Ensure target has an id
            if (!target.id) {
                target.id = id || `skip-target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            const skipLink = document.createElement('a');
            skipLink.href = `#${target.id}`;
            skipLink.textContent = text;
            skipLink.className = 'skip-link';

            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                target.focus();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                this.announce(`Skipped to ${text.toLowerCase()}`);
            });

            skipContainer.appendChild(skipLink);
            this.skipLinks.set(text, skipLink);
        });

        document.body.insertBefore(skipContainer, document.body.firstChild);
    }

    // Keyboard Navigation
    setupGlobalKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Global keyboard shortcuts
            const shortcuts = {
                // Alt + M: Main content
                'Alt+KeyM': () => {
                    const main = document.querySelector('main, #main, .main-content');
                    if (main) {
                        this.manageFocus(main);
                    }
                },

                // Alt + N: Navigation
                'Alt+KeyN': () => {
                    const nav = document.querySelector('nav, #nav, .navigation');
                    if (nav) {
                        this.manageFocus(nav);
                    }
                },

                // Alt + H: Headings menu
                'Alt+KeyH': () => {
                    this.showHeadingsMenu();
                },

                // Alt + L: Landmarks menu
                'Alt+KeyL': () => {
                    this.showLandmarksMenu();
                },

                // Escape: Close modals and menus
                'Escape': () => {
                    this.closeActiveModals();
                },

                // F6: Cycle through page sections
                'F6': () => {
                    this.cycleThroughSections();
                }
            };

            const key = (e.altKey ? 'Alt+' : '') + (e.ctrlKey ? 'Ctrl+' : '') +
                       (e.shiftKey ? 'Shift+' : '') + (e.code || e.key);

            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
            }
        });
    }

    addKeyboardShortcut(keys, handler, description) {
        const keyString = Array.isArray(keys) ? keys.join('+') : keys;

        this.keyHandlers.set(keyString, {
            handler,
            description,
            enabled: true
        });

        document.addEventListener('keydown', (e) => {
            const pressedKey = (e.altKey ? 'Alt+' : '') + (e.ctrlKey ? 'Ctrl+' : '') +
                             (e.shiftKey ? 'Shift+' : '') + (e.code || e.key);

            const shortcut = this.keyHandlers.get(pressedKey);
            if (shortcut && shortcut.enabled) {
                e.preventDefault();
                shortcut.handler(e);
            }
        });
    }

    showHeadingsMenu() {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(heading => ({
                level: parseInt(heading.tagName.substr(1)),
                text: heading.textContent.trim(),
                element: heading
            }));

        if (headings.length === 0) {
            this.announce('No headings found on this page');
            return;
        }

        this.createQuickMenu('headings', 'Page Headings', headings.map(heading => ({
            text: `${'  '.repeat(heading.level - 1)}${heading.text}`,
            action: () => this.manageFocus(heading.element)
        })));
    }

    showLandmarksMenu() {
        const landmarks = Array.from(document.querySelectorAll(
            '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'
        )).map(landmark => ({
            role: landmark.getAttribute('role') || landmark.tagName.toLowerCase(),
            label: this.getAccessibleLabel(landmark),
            element: landmark
        }));

        if (landmarks.length === 0) {
            this.announce('No landmarks found on this page');
            return;
        }

        this.createQuickMenu('landmarks', 'Page Landmarks', landmarks.map(landmark => ({
            text: `${landmark.role}: ${landmark.label || 'Unlabeled'}`,
            action: () => this.manageFocus(landmark.element)
        })));
    }

    createQuickMenu(id, title, items) {
        // Remove existing menu
        const existing = document.getElementById(`accessibility-menu-${id}`);
        if (existing) {
            existing.remove();
        }

        const menu = document.createElement('div');
        menu.id = `accessibility-menu-${id}`;
        menu.className = 'accessibility-quick-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', title);

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.className = 'menu-title';
        menu.appendChild(titleElement);

        const list = document.createElement('ul');
        list.setAttribute('role', 'none');

        items.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('role', 'none');

            const button = document.createElement('button');
            button.textContent = item.text;
            button.className = 'menu-item';
            button.setAttribute('role', 'menuitem');
            button.setAttribute('tabindex', index === 0 ? '0' : '-1');

            button.addEventListener('click', () => {
                item.action();
                menu.remove();
            });

            listItem.appendChild(button);
            list.appendChild(listItem);
        });

        menu.appendChild(list);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'menu-close';
        closeButton.addEventListener('click', () => menu.remove());

        menu.appendChild(closeButton);

        // Position and show menu
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.zIndex = '10000';

        document.body.appendChild(menu);

        // Focus first item and set up keyboard navigation
        const firstItem = menu.querySelector('.menu-item');
        if (firstItem) {
            this.manageFocus(firstItem, { trapFocus: true });
        }

        this.setupMenuNavigation(menu);
    }

    setupMenuNavigation(menu) {
        const items = Array.from(menu.querySelectorAll('.menu-item'));

        menu.addEventListener('keydown', (e) => {
            const currentIndex = items.indexOf(document.activeElement);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + items.length) % items.length;
                    items[prevIndex].focus();
                    break;

                case 'Home':
                    e.preventDefault();
                    items[0].focus();
                    break;

                case 'End':
                    e.preventDefault();
                    items[items.length - 1].focus();
                    break;

                case 'Escape':
                    e.preventDefault();
                    menu.remove();
                    break;
            }
        });
    }

    cycleThroughSections() {
        const sections = Array.from(document.querySelectorAll(
            'main, nav, aside, header, footer, section, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]'
        ));

        if (sections.length === 0) return;

        const currentIndex = sections.indexOf(document.activeElement) || 0;
        const nextIndex = (currentIndex + 1) % sections.length;
        const nextSection = sections[nextIndex];

        this.manageFocus(nextSection);

        const label = this.getAccessibleLabel(nextSection) || nextSection.tagName.toLowerCase();
        this.announce(`Focused on ${label}`);
    }

    closeActiveModals() {
        const modals = document.querySelectorAll('.modal.show, [role="dialog"][aria-hidden="false"]');
        modals.forEach(modal => {
            // Try to find and trigger close button
            const closeButton = modal.querySelector('.close, .modal-close, [aria-label*="close"]');
            if (closeButton) {
                closeButton.click();
            } else {
                // Hide modal directly
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Element Enhancement
    enhanceExistingElements() {
        // Enhance buttons
        this.enhanceButtons();

        // Enhance forms
        this.enhanceForms();

        // Enhance images
        this.enhanceImages();

        // Enhance links
        this.enhanceLinks();

        // Enhance tables
        this.enhanceTables();

        // Enhance custom elements
        this.enhanceCustomElements();
    }

    enhanceButtons() {
        const buttons = document.querySelectorAll('button, [role="button"]');

        buttons.forEach(button => {
            // Ensure proper role
            if (!button.hasAttribute('role') && button.tagName !== 'BUTTON') {
                button.setAttribute('role', 'button');
            }

            // Ensure keyboard accessibility
            if (button.tagName !== 'BUTTON' && !button.hasAttribute('tabindex')) {
                button.setAttribute('tabindex', '0');
            }

            // Add keyboard event handlers for non-button elements
            if (button.tagName !== 'BUTTON') {
                button.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        button.click();
                    }
                });
            }

            // Enhance loading states
            const observer = new MutationObserver(() => {
                if (button.hasAttribute('disabled') || button.classList.contains('loading')) {
                    button.setAttribute('aria-busy', 'true');
                    this.announce('Button is loading');
                } else {
                    button.removeAttribute('aria-busy');
                }
            });

            observer.observe(button, {
                attributes: true,
                attributeFilter: ['disabled', 'class']
            });
        });
    }

    enhanceForms() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            // Add form landmark role if not present
            if (!form.hasAttribute('role')) {
                form.setAttribute('role', 'form');
            }

            // Enhance form fields
            const fields = form.querySelectorAll('input, select, textarea');

            fields.forEach(field => {
                this.enhanceFormField(field);
            });

            // Add form submission feedback
            form.addEventListener('submit', () => {
                this.announce('Form submitted', 'status');
            });
        });
    }

    enhanceFormField(field) {
        // Associate labels
        const label = this.findLabel(field);
        if (label && !field.hasAttribute('aria-labelledby')) {
            if (!label.id) {
                label.id = `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            field.setAttribute('aria-labelledby', label.id);
        }

        // Add error messaging
        field.addEventListener('invalid', (e) => {
            const errorMessage = field.validationMessage;
            this.announce(`Error in ${this.getAccessibleLabel(field)}: ${errorMessage}`, 'errors');
        });

        // Add required field indication
        if (field.hasAttribute('required')) {
            const label = this.findLabel(field);
            if (label && !label.textContent.includes('*')) {
                label.innerHTML += ' <span aria-label="required">*</span>';
            }
            field.setAttribute('aria-required', 'true');
        }

        // Add character count for maxlength fields
        if (field.hasAttribute('maxlength')) {
            const maxLength = parseInt(field.getAttribute('maxlength'));
            const countId = `char-count-${field.id || Date.now()}`;

            const counter = document.createElement('div');
            counter.id = countId;
            counter.className = 'character-count';
            counter.setAttribute('aria-live', 'polite');

            const updateCount = () => {
                const remaining = maxLength - field.value.length;
                counter.textContent = `${remaining} characters remaining`;

                if (remaining < 10) {
                    counter.setAttribute('aria-live', 'assertive');
                } else {
                    counter.setAttribute('aria-live', 'polite');
                }
            };

            field.addEventListener('input', updateCount);
            updateCount();

            field.parentNode.insertBefore(counter, field.nextSibling);
            field.setAttribute('aria-describedby', countId);
        }
    }

    enhanceImages() {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Check for missing alt text
            if (!img.hasAttribute('alt')) {
                console.warn('Image missing alt text:', img.src);
                img.setAttribute('alt', 'Image'); // Fallback
            }

            // Mark decorative images
            if (img.getAttribute('alt') === '' || img.hasAttribute('data-decorative')) {
                img.setAttribute('role', 'presentation');
            }

            // Handle loading states
            if (img.loading === 'lazy') {
                img.addEventListener('load', () => {
                    this.announce('Image loaded');
                });
            }
        });
    }

    enhanceLinks() {
        const links = document.querySelectorAll('a');

        links.forEach(link => {
            // Indicate external links
            if (this.isExternalLink(link)) {
                link.setAttribute('aria-label', `${link.textContent} (opens in new window)`);

                if (!link.querySelector('.external-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'external-indicator sr-only';
                    indicator.textContent = ' (external link)';
                    link.appendChild(indicator);
                }
            }

            // Indicate download links
            if (link.hasAttribute('download')) {
                link.setAttribute('aria-label', `${link.textContent} (download)`);
            }

            // Enhance empty links
            if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                const href = link.getAttribute('href') || '';
                link.setAttribute('aria-label', `Link to ${href}`);
            }
        });
    }

    enhanceTables() {
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            // Add table role
            if (!table.hasAttribute('role')) {
                table.setAttribute('role', 'table');
            }

            // Add caption if missing
            if (!table.querySelector('caption') && !table.hasAttribute('aria-label')) {
                const caption = document.createElement('caption');
                caption.textContent = 'Data table';
                caption.className = 'sr-only';
                table.insertBefore(caption, table.firstChild);
            }

            // Enhance headers
            const headers = table.querySelectorAll('th');
            headers.forEach(th => {
                if (!th.hasAttribute('scope')) {
                    // Determine scope based on position
                    const row = th.closest('tr');
                    const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(row);
                    const cellIndex = Array.from(row.children).indexOf(th);

                    if (rowIndex === 0) {
                        th.setAttribute('scope', 'col');
                    } else if (cellIndex === 0) {
                        th.setAttribute('scope', 'row');
                    }
                }
            });
        });
    }

    enhanceCustomElements() {
        // Enhance custom dropdowns
        const customSelects = document.querySelectorAll('.custom-select, [data-role="select"]');
        customSelects.forEach(select => {
            this.makeSelectAccessible(select);
        });

        // Enhance tabs
        const tabLists = document.querySelectorAll('.tab-list, [role="tablist"]');
        tabLists.forEach(tabList => {
            this.makeTabsAccessible(tabList);
        });

        // Enhance modals
        const modals = document.querySelectorAll('.modal, [role="dialog"]');
        modals.forEach(modal => {
            this.makeModalAccessible(modal);
        });
    }

    makeSelectAccessible(select) {
        select.setAttribute('role', 'combobox');
        select.setAttribute('aria-expanded', 'false');
        select.setAttribute('aria-haspopup', 'listbox');

        const trigger = select.querySelector('.select-trigger, .select-button');
        const dropdown = select.querySelector('.select-dropdown, .select-options');

        if (trigger && dropdown) {
            trigger.addEventListener('click', () => {
                const expanded = select.getAttribute('aria-expanded') === 'true';
                select.setAttribute('aria-expanded', !expanded);

                if (!expanded) {
                    const firstOption = dropdown.querySelector('[role="option"]');
                    if (firstOption) {
                        firstOption.focus();
                    }
                }
            });

            // Add keyboard navigation
            select.addEventListener('keydown', (e) => {
                const options = Array.from(dropdown.querySelectorAll('[role="option"]'));
                const currentIndex = options.indexOf(document.activeElement);

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = Math.min(currentIndex + 1, options.length - 1);
                        options[nextIndex]?.focus();
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = Math.max(currentIndex - 1, 0);
                        options[prevIndex]?.focus();
                        break;

                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        document.activeElement.click();
                        select.setAttribute('aria-expanded', 'false');
                        break;

                    case 'Escape':
                        select.setAttribute('aria-expanded', 'false');
                        trigger.focus();
                        break;
                }
            });
        }
    }

    makeTabsAccessible(tabList) {
        tabList.setAttribute('role', 'tablist');

        const tabs = Array.from(tabList.querySelectorAll('.tab, [role="tab"]'));
        const panels = Array.from(document.querySelectorAll('.tab-panel, [role="tabpanel"]'));

        tabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', '-1');

            if (index === 0) {
                tab.setAttribute('aria-selected', 'true');
                tab.setAttribute('tabindex', '0');
            }

            // Associate with panel
            const panel = panels[index];
            if (panel) {
                const tabId = tab.id || `tab-${index}`;
                const panelId = panel.id || `panel-${index}`;

                tab.id = tabId;
                panel.id = panelId;

                tab.setAttribute('aria-controls', panelId);
                panel.setAttribute('aria-labelledby', tabId);
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('tabindex', '0');
            }
        });

        // Add keyboard navigation
        tabList.addEventListener('keydown', (e) => {
            const currentIndex = tabs.indexOf(document.activeElement);

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % tabs.length;
                    this.activateTab(tabs[nextIndex], tabs, panels);
                    break;

                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                    this.activateTab(tabs[prevIndex], tabs, panels);
                    break;

                case 'Home':
                    e.preventDefault();
                    this.activateTab(tabs[0], tabs, panels);
                    break;

                case 'End':
                    e.preventDefault();
                    this.activateTab(tabs[tabs.length - 1], tabs, panels);
                    break;
            }
        });
    }

    activateTab(activeTab, allTabs, allPanels) {
        const activeIndex = allTabs.indexOf(activeTab);

        allTabs.forEach((tab, index) => {
            const isActive = index === activeIndex;
            tab.setAttribute('aria-selected', isActive);
            tab.setAttribute('tabindex', isActive ? '0' : '-1');

            if (isActive) {
                tab.focus();
            }
        });

        allPanels.forEach((panel, index) => {
            const isActive = index === activeIndex;
            panel.style.display = isActive ? 'block' : 'none';
            panel.setAttribute('aria-hidden', !isActive);
        });

        this.announce(`${activeTab.textContent} tab selected`);
    }

    makeModalAccessible(modal) {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        // Find or create title
        const title = modal.querySelector('h1, h2, h3, .modal-title');
        if (title) {
            if (!title.id) {
                title.id = `modal-title-${Date.now()}`;
            }
            modal.setAttribute('aria-labelledby', title.id);
        }

        // Find description
        const description = modal.querySelector('.modal-description, .modal-body p:first-child');
        if (description) {
            if (!description.id) {
                description.id = `modal-desc-${Date.now()}`;
            }
            modal.setAttribute('aria-describedby', description.id);
        }

        // Set up focus management
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'aria-hidden' ||
                    mutation.attributeName === 'style') {
                    const isVisible = modal.getAttribute('aria-hidden') !== 'true' &&
                                    modal.style.display !== 'none';

                    if (isVisible) {
                        const focusableElement = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                        if (focusableElement) {
                            this.manageFocus(focusableElement, { trapFocus: true });
                        }
                    }
                }
            });
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['aria-hidden', 'style']
        });
    }

    // Utility Methods
    getAccessibleLabel(element) {
        // Try aria-label first
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }

        // Try aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) {
                return labelElement.textContent.trim();
            }
        }

        // Try associated label
        const label = this.findLabel(element);
        if (label) {
            return label.textContent.trim();
        }

        // Try title attribute
        if (element.title) {
            return element.title;
        }

        // Try text content for certain elements
        if (['BUTTON', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
            return element.textContent.trim();
        }

        // Try placeholder for inputs
        if (element.placeholder) {
            return element.placeholder;
        }

        return null;
    }

    findLabel(element) {
        // Try explicit label association
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label;
        }

        // Try implicit label association
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel;

        // Try adjacent label
        const previousElement = element.previousElementSibling;
        if (previousElement && previousElement.tagName === 'LABEL') {
            return previousElement;
        }

        return null;
    }

    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }

    isHidden(element) {
        return element.hidden ||
               element.getAttribute('aria-hidden') === 'true' ||
               element.hasAttribute('inert');
    }

    isExternalLink(link) {
        const href = link.getAttribute('href');
        if (!href) return false;

        return href.startsWith('http') &&
               !href.startsWith(window.location.origin);
    }

    calculateContrast(color1, color2) {
        // Simplified contrast calculation
        // In a real implementation, you'd parse the colors and calculate proper WCAG contrast
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);

        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);

        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    parseColor(color) {
        // Simplified color parsing - in production, use a proper color parsing library
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            return {
                r: parseInt(hex.slice(0, 2), 16) / 255,
                g: parseInt(hex.slice(2, 4), 16) / 255,
                b: parseInt(hex.slice(4, 6), 16) / 255
            };
        }

        // Default to black
        return { r: 0, g: 0, b: 0 };
    }

    getLuminance({ r, g, b }) {
        const [rs, gs, bs] = [r, g, b].map(c =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // CSS Injection
    injectAccessibilityStyles() {
        if (document.getElementById('accessibility-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'accessibility-system-styles';
        style.textContent = `
            /* Screen reader only content */
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }

            /* Skip links */
            .skip-links {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 10001;
            }

            .skip-link {
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
                background: var(--primary-color, #007acc);
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
            }

            .skip-link:focus {
                position: static;
                width: auto;
                height: auto;
                left: auto;
                top: auto;
            }

            /* Focus indicators */
            .keyboard-navigation *:focus {
                outline: 2px solid var(--focus-color, #007acc) !important;
                outline-offset: 2px !important;
            }

            .keyboard-navigation *:focus:not(:focus-visible) {
                outline: none !important;
            }

            /* High contrast mode */
            .high-contrast {
                filter: contrast(1.5);
            }

            .high-contrast * {
                border-color: currentColor !important;
            }

            /* Quick menu styles */
            .accessibility-quick-menu {
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 16px;
                max-width: 400px;
                max-height: 500px;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .accessibility-quick-menu .menu-title {
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: bold;
            }

            .accessibility-quick-menu ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .accessibility-quick-menu .menu-item {
                display: block;
                width: 100%;
                padding: 8px 12px;
                text-align: left;
                background: none;
                border: 1px solid transparent;
                border-radius: 4px;
                cursor: pointer;
            }

            .accessibility-quick-menu .menu-item:hover,
            .accessibility-quick-menu .menu-item:focus {
                background: #f0f0f0;
                border-color: #007acc;
            }

            .accessibility-quick-menu .menu-close {
                margin-top: 16px;
                padding: 8px 16px;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            /* Character count */
            .character-count {
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
                margin-top: 4px;
            }

            /* External link indicator */
            .external-indicator::after {
                content: " ↗";
                font-size: 0.8em;
            }

            /* Reduced motion styles */
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }

            /* Touch device optimizations */
            .touch-device button,
            .touch-device input,
            .touch-device select,
            .touch-device textarea,
            .touch-device [role="button"] {
                min-height: 44px;
                min-width: 44px;
            }

            /* Live region styling */
            [aria-live] {
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            }
        `;

        document.head.appendChild(style);
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        this.keyboardTraps.forEach(trap => {
            trap.container.removeEventListener('keydown', trap.handler);
        });
        this.keyboardTraps.clear();

        // Clear handlers
        this.keyHandlers.clear();
        this.focusHandlers.clear();

        // Remove live regions
        this.liveRegions.forEach(region => {
            if (region.parentNode) {
                region.parentNode.removeChild(region);
            }
        });
        this.liveRegions.clear();

        // Remove injected styles
        const styleElement = document.getElementById('accessibility-system-styles');
        if (styleElement) {
            styleElement.remove();
        }

        // Clear announcement queue
        this.announcementQueue = [];
    }

    // Debug and Testing
    runAccessibilityAudit() {
        const issues = [];

        // Check for missing alt text
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }

        // Check for missing form labels
        const unlabeledInputs = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(input => !this.getAccessibleLabel(input));
        if (unlabeledInputs.length > 0) {
            issues.push(`${unlabeledInputs.length} form fields missing labels`);
        }

        // Check for missing heading structure
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const levels = headings.map(h => parseInt(h.tagName[1]));
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] > levels[i - 1] + 1) {
                issues.push('Heading structure skips levels');
                break;
            }
        }

        // Check for color contrast (simplified)
        const lowContrastElements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
                const style = window.getComputedStyle(el);
                const hasText = el.textContent.trim().length > 0;
                const hasColors = style.color && style.backgroundColor;

                if (hasText && hasColors) {
                    const contrast = this.calculateContrast(style.color, style.backgroundColor);
                    return contrast < 4.5; // WCAG AA standard
                }

                return false;
            });

        if (lowContrastElements.length > 0) {
            issues.push(`${lowContrastElements.length} elements may have insufficient color contrast`);
        }

        return {
            issues,
            score: Math.max(0, 100 - (issues.length * 10)),
            passed: issues.length === 0
        };
    }
}

// Global instance
let globalAccessibilitySystem = null;

// Auto-initialization
function initializeAccessibilitySystem() {
    if (!globalAccessibilitySystem) {
        globalAccessibilitySystem = new AccessibilitySystem();
    }
    return globalAccessibilitySystem;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccessibilitySystem, initializeAccessibilitySystem };
} else if (typeof window !== 'undefined') {
    window.AccessibilitySystem = AccessibilitySystem;
    window.initializeAccessibilitySystem = initializeAccessibilitySystem;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAccessibilitySystem);
    } else {
        initializeAccessibilitySystem();
    }
}

// Convenience methods
if (typeof window !== 'undefined') {
    window.announce = (message, type, priority) => {
        const system = window.accessibilitySystem || initializeAccessibilitySystem();
        return system.announce(message, type, priority);
    };

    window.manageFocus = (element, options) => {
        const system = window.accessibilitySystem || initializeAccessibilitySystem();
        return system.manageFocus(element, options);
    };

    window.trapFocus = (container) => {
        const system = window.accessibilitySystem || initializeAccessibilitySystem();
        return system.trapFocus(container);
    };

    // Set global reference
    window.accessibilitySystem = globalAccessibilitySystem;
}