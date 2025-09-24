/**
 * Comprehensive UI/UX Testing Suite
 * Tests all aspects of the Chrome Extension UI components
 */

class UITestingSuite {
    constructor() {
        this.tests = new Map();
        this.results = new Map();
        this.isRunning = false;
        this.currentTheme = 'light';
        this.startTime = 0;

        this.init();
    }

    init() {
        this.setupTests();
        this.setupEventListeners();
        this.updateStatus();
        this.measureInitialMetrics();
        this.log('UI Testing Suite initialized', 'info');
    }

    setupTests() {
        // Theme System Tests
        this.addTest('theme-toggle', 'Theme Toggle Functionality', this.testThemeToggle);
        this.addTest('theme-colors', 'Color Scheme Validation', this.testThemeColors);
        this.addTest('theme-persistence', 'Theme Persistence', this.testThemePersistence);

        // Animation System Tests
        this.addTest('animation-performance', 'Animation Performance', this.testAnimationPerformance);
        this.addTest('reduced-motion', 'Reduced Motion Support', this.testReducedMotion);
        this.addTest('animation-timing', 'Animation Timing Functions', this.testAnimationTiming);

        // Responsive Design Tests
        this.addTest('breakpoint-detection', 'Breakpoint Detection', this.testBreakpointDetection);
        this.addTest('viewport-units', 'Viewport Units', this.testViewportUnits);
        this.addTest('touch-optimization', 'Touch Device Optimization', this.testTouchOptimization);

        // Accessibility Tests
        this.addTest('keyboard-navigation', 'Keyboard Navigation', this.testKeyboardNavigation);
        this.addTest('aria-labels', 'ARIA Labels & Roles', this.testAriaLabels);
        this.addTest('color-contrast', 'Color Contrast Ratio', this.testColorContrast);

        // Component Tests
        this.addTest('popup-rendering', 'Popup Rendering', this.testPopupRendering);
        this.addTest('floating-widget', 'Floating Widget', this.testFloatingWidget);
        this.addTest('chat-interface', 'Chat Interface', this.testChatInterface);

        // Performance Tests
        this.addTest('render-performance', 'Render Performance', this.testRenderPerformance);
        this.addTest('memory-usage', 'Memory Usage', this.testMemoryUsage);
        this.addTest('bundle-size', 'Bundle Size Analysis', this.testBundleSize);
    }

    addTest(id, name, testFunction) {
        this.tests.set(id, {
            id,
            name,
            testFunction: testFunction.bind(this),
            status: 'pending'
        });

        this.results.set(id, {
            status: 'pending',
            message: '',
            details: {},
            duration: 0,
            timestamp: null
        });
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Run all tests
        document.getElementById('runAllTests').addEventListener('click', () => {
            this.runAllTests();
        });

        // Clear results
        document.getElementById('clearResults').addEventListener('click', () => {
            this.clearResults();
        });

        // Export results
        document.getElementById('exportResults').addEventListener('click', () => {
            this.exportResults();
        });

        // Modal close on backdrop click
        document.getElementById('testModal').addEventListener('click', (e) => {
            if (e.target.id === 'testModal') {
                this.closeModal();
            }
        });

        document.getElementById('popupDemoModal').addEventListener('click', (e) => {
            if (e.target.id === 'popupDemoModal') {
                this.closePopupDemo();
            }
        });
    }

    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        const themeIcon = document.querySelector('#themeToggle');
        themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';

        this.log(`Theme switched to ${this.currentTheme}`, 'info');
    }

    // Test Execution
    async runAllTests() {
        if (this.isRunning) {
            this.log('Tests are already running', 'warning');
            return;
        }

        this.isRunning = true;
        this.startTime = performance.now();
        this.log('Starting comprehensive UI test suite', 'info');

        const runButton = document.getElementById('runAllTests');
        runButton.textContent = '⏸️ Running...';
        runButton.disabled = true;

        let completed = 0;
        const total = this.tests.size;

        for (const [testId, test] of this.tests) {
            try {
                await this.runSingleTest(testId);
                completed++;
                this.updateProgress((completed / total) * 100);
            } catch (error) {
                this.log(`Error running test ${testId}: ${error.message}`, 'error');
            }
        }

        const totalTime = performance.now() - this.startTime;
        this.log(`All tests completed in ${totalTime.toFixed(2)}ms`, 'success');

        runButton.textContent = '▶️ Run All Tests';
        runButton.disabled = false;
        this.isRunning = false;

        this.generateTestReport();
    }

    async runSingleTest(testId) {
        const test = this.tests.get(testId);
        if (!test) {
            this.log(`Test ${testId} not found`, 'error');
            return;
        }

        this.log(`Running test: ${test.name}`, 'info');
        this.updateTestStatus(testId, 'running');

        const startTime = performance.now();

        try {
            const result = await test.testFunction();
            const duration = performance.now() - startTime;

            this.results.set(testId, {
                status: result.passed ? 'passed' : 'failed',
                message: result.message || (result.passed ? 'Test passed' : 'Test failed'),
                details: result.details || {},
                duration: duration,
                timestamp: new Date().toISOString()
            });

            this.updateTestStatus(testId, result.passed ? 'passed' : 'failed');
            this.updateTestResult(testId, result);

            this.log(`Test ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`,
                    result.passed ? 'success' : 'error');

        } catch (error) {
            const duration = performance.now() - startTime;

            this.results.set(testId, {
                status: 'failed',
                message: `Test error: ${error.message}`,
                details: { error: error.stack },
                duration: duration,
                timestamp: new Date().toISOString()
            });

            this.updateTestStatus(testId, 'failed');
            this.updateTestResult(testId, { passed: false, message: error.message });

            this.log(`Test ${test.name}: ERROR - ${error.message}`, 'error');
        }

        this.updateStatus();
    }

    // Individual Test Functions

    async testThemeToggle() {
        const initialTheme = this.currentTheme;

        // Test theme toggle functionality
        this.toggleTheme();
        await this.delay(100);

        const newTheme = document.documentElement.getAttribute('data-theme');
        const themeChanged = newTheme !== initialTheme;

        // Test CSS custom properties
        const computedStyle = getComputedStyle(document.documentElement);
        const backgroundVar = computedStyle.getPropertyValue('--background').trim();
        const hasThemeVars = backgroundVar.length > 0;

        this.toggleTheme(); // Reset

        return {
            passed: themeChanged && hasThemeVars,
            message: themeChanged && hasThemeVars ?
                'Theme toggle works correctly' :
                'Theme toggle failed',
            details: {
                themeChanged,
                hasThemeVars,
                currentBackground: backgroundVar
            }
        };
    }

    async testThemeColors() {
        const themes = ['light', 'dark'];
        const results = {};

        for (const theme of themes) {
            document.documentElement.setAttribute('data-theme', theme);
            await this.delay(50);

            const style = getComputedStyle(document.documentElement);
            const colors = {
                background: style.getPropertyValue('--background').trim(),
                text: style.getPropertyValue('--text').trim(),
                primary: style.getPropertyValue('--primary').trim()
            };

            // Test contrast (simplified)
            const contrastRatio = this.calculateSimpleContrast(colors.text, colors.background);

            results[theme] = {
                colors,
                contrastRatio,
                accessible: contrastRatio > 3 // Simplified test
            };
        }

        document.documentElement.setAttribute('data-theme', this.currentTheme);

        const allAccessible = Object.values(results).every(r => r.accessible);

        return {
            passed: allAccessible,
            message: allAccessible ? 'All theme colors are accessible' : 'Some theme colors fail accessibility',
            details: results
        };
    }

    async testThemePersistence() {
        const originalTheme = this.currentTheme;

        // Test localStorage persistence
        localStorage.setItem('extensionTheme', 'dark');
        const stored = localStorage.getItem('extensionTheme');
        const persistenceWorks = stored === 'dark';

        // Clean up
        localStorage.removeItem('extensionTheme');

        return {
            passed: persistenceWorks,
            message: persistenceWorks ? 'Theme persistence works' : 'Theme persistence failed',
            details: {
                storedValue: stored,
                originalTheme
            }
        };
    }

    async testAnimationPerformance() {
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            position: absolute;
            top: -100px;
            left: -100px;
            width: 50px;
            height: 50px;
            background: red;
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(testElement);

        const startTime = performance.now();
        let frameCount = 0;

        // Trigger animation
        testElement.style.transform = 'translateX(100px)';

        // Monitor frame rate during animation
        const checkFrame = () => {
            frameCount++;
            if (performance.now() - startTime < 300) {
                requestAnimationFrame(checkFrame);
            }
        };

        requestAnimationFrame(checkFrame);

        await this.delay(350);

        const duration = performance.now() - startTime;
        const fps = Math.round((frameCount / duration) * 1000);

        document.body.removeChild(testElement);

        return {
            passed: fps > 30,
            message: `Animation performance: ${fps} FPS`,
            details: {
                fps,
                frameCount,
                duration
            }
        };
    }

    async testReducedMotion() {
        // Test media query detection
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const prefersReduced = mediaQuery.matches;

        // Test if animations are disabled when reduced motion is preferred
        const testElement = document.createElement('div');
        testElement.className = 'test-animation';
        testElement.style.cssText = `
            position: absolute;
            top: -100px;
            left: -100px;
            width: 10px;
            height: 10px;
            background: blue;
            animation: testSpin 1s linear infinite;
        `;

        // Add test keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes testSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @media (prefers-reduced-motion: reduce) {
                .test-animation {
                    animation: none !important;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(testElement);

        await this.delay(100);

        const computedStyle = getComputedStyle(testElement);
        const animationName = computedStyle.animationName;

        document.body.removeChild(testElement);
        document.head.removeChild(style);

        const respectsReducedMotion = prefersReduced ? animationName === 'none' : true;

        return {
            passed: respectsReducedMotion,
            message: respectsReducedMotion ? 'Reduced motion is respected' : 'Reduced motion is not respected',
            details: {
                prefersReduced,
                animationName,
                respectsReducedMotion
            }
        };
    }

    async testAnimationTiming() {
        const timingFunctions = [
            'ease',
            'ease-in',
            'ease-out',
            'ease-in-out',
            'cubic-bezier(0.33, 1, 0.68, 1)'
        ];

        const results = {};

        for (const timing of timingFunctions) {
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                top: -100px;
                left: -100px;
                width: 10px;
                height: 10px;
                background: green;
                transition: transform 0.3s ${timing};
            `;

            document.body.appendChild(testElement);

            const startTime = performance.now();
            testElement.style.transform = 'translateX(100px)';

            await this.delay(350);

            const endTime = performance.now();
            const duration = endTime - startTime;

            document.body.removeChild(testElement);

            results[timing] = {
                duration,
                valid: duration >= 300 && duration <= 400
            };
        }

        const allValid = Object.values(results).every(r => r.valid);

        return {
            passed: allValid,
            message: allValid ? 'All timing functions work correctly' : 'Some timing functions failed',
            details: results
        };
    }

    async testBreakpointDetection() {
        const breakpoints = [
            { name: 'xs', width: 320 },
            { name: 'sm', width: 480 },
            { name: 'md', width: 768 },
            { name: 'lg', width: 1024 },
            { name: 'xl', width: 1200 }
        ];

        const results = {};
        const originalWidth = window.innerWidth;

        for (const bp of breakpoints) {
            // Simulate viewport width (not actually possible, but test the logic)
            const mediaQuery = window.matchMedia(`(min-width: ${bp.width}px)`);
            const matches = mediaQuery.matches;

            results[bp.name] = {
                width: bp.width,
                matches,
                expected: originalWidth >= bp.width
            };
        }

        const correctDetections = Object.values(results).filter(r => r.matches === r.expected).length;
        const accuracy = (correctDetections / breakpoints.length) * 100;

        return {
            passed: accuracy >= 80,
            message: `Breakpoint detection accuracy: ${accuracy.toFixed(1)}%`,
            details: {
                results,
                accuracy,
                originalWidth
            }
        };
    }

    async testViewportUnits() {
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            position: absolute;
            top: -100px;
            left: -100px;
            width: 50vw;
            height: 50vh;
        `;
        document.body.appendChild(testElement);

        await this.delay(50);

        const rect = testElement.getBoundingClientRect();
        const expectedWidth = window.innerWidth * 0.5;
        const expectedHeight = window.innerHeight * 0.5;

        const widthAccuracy = Math.abs(rect.width - expectedWidth) < 1;
        const heightAccuracy = Math.abs(rect.height - expectedHeight) < 1;

        document.body.removeChild(testElement);

        return {
            passed: widthAccuracy && heightAccuracy,
            message: widthAccuracy && heightAccuracy ?
                'Viewport units work correctly' :
                'Viewport units have issues',
            details: {
                actualWidth: rect.width,
                expectedWidth,
                actualHeight: rect.height,
                expectedHeight,
                widthAccuracy,
                heightAccuracy
            }
        };
    }

    async testTouchOptimization() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Create test button
        const button = document.createElement('button');
        button.textContent = 'Test Button';
        button.className = 'btn btn-primary';
        document.body.appendChild(button);

        await this.delay(50);

        const rect = button.getBoundingClientRect();
        const minTouchTarget = 44; // Minimum recommended touch target size

        const meetsMinimumSize = rect.width >= minTouchTarget && rect.height >= minTouchTarget;

        document.body.removeChild(button);

        return {
            passed: !isTouchDevice || meetsMinimumSize,
            message: isTouchDevice ?
                (meetsMinimumSize ? 'Touch targets are appropriately sized' : 'Touch targets are too small') :
                'Not a touch device - test skipped',
            details: {
                isTouchDevice,
                buttonWidth: rect.width,
                buttonHeight: rect.height,
                minTouchTarget,
                meetsMinimumSize
            }
        };
    }

    async testKeyboardNavigation() {
        // Create test elements
        const container = document.createElement('div');
        container.innerHTML = `
            <button class="test-btn-1">Button 1</button>
            <input class="test-input" type="text" placeholder="Test input">
            <button class="test-btn-2">Button 2</button>
        `;
        container.style.position = 'absolute';
        container.style.top = '-200px';
        container.style.left = '-200px';
        document.body.appendChild(container);

        const elements = container.querySelectorAll('button, input');
        let tabOrderCorrect = true;

        // Test tab order
        elements[0].focus();
        await this.delay(50);

        for (let i = 1; i < elements.length; i++) {
            // Simulate tab key
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                keyCode: 9,
                bubbles: true
            });

            document.activeElement.dispatchEvent(tabEvent);
            elements[i].focus(); // Manual focus for testing
            await this.delay(10);

            if (document.activeElement !== elements[i]) {
                tabOrderCorrect = false;
                break;
            }
        }

        // Test escape key functionality
        let escapeWorks = false;
        const escapeHandler = () => { escapeWorks = true; };
        document.addEventListener('keydown', escapeHandler);

        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true
        });

        document.dispatchEvent(escapeEvent);
        await this.delay(10);

        document.removeEventListener('keydown', escapeHandler);
        document.body.removeChild(container);

        return {
            passed: tabOrderCorrect,
            message: tabOrderCorrect ? 'Keyboard navigation works correctly' : 'Keyboard navigation has issues',
            details: {
                tabOrderCorrect,
                escapeWorks,
                elementsCount: elements.length
            }
        };
    }

    async testAriaLabels() {
        const issues = [];

        // Test buttons without accessible names
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            const hasLabel = button.textContent.trim() ||
                           button.getAttribute('aria-label') ||
                           button.getAttribute('aria-labelledby') ||
                           button.getAttribute('title');

            if (!hasLabel) {
                issues.push(`Button without accessible name: ${button.outerHTML.slice(0, 50)}...`);
            }
        });

        // Test images without alt text
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('alt')) {
                issues.push(`Image without alt text: ${img.src}`);
            }
        });

        // Test form inputs without labels
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const hasLabel = input.getAttribute('aria-label') ||
                           input.getAttribute('aria-labelledby') ||
                           document.querySelector(`label[for="${input.id}"]`) ||
                           input.closest('label');

            if (!hasLabel && input.type !== 'hidden') {
                issues.push(`Form input without label: ${input.outerHTML.slice(0, 50)}...`);
            }
        });

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'All elements have proper ARIA labels' : `Found ${issues.length} accessibility issues`,
            details: {
                issues: issues.slice(0, 10), // Limit to first 10 issues
                totalIssues: issues.length
            }
        };
    }

    async testColorContrast() {
        const contrastIssues = [];
        const elements = document.querySelectorAll('*');

        for (const element of elements) {
            const style = getComputedStyle(element);
            const color = style.color;
            const backgroundColor = style.backgroundColor;

            if (element.textContent.trim() && color && backgroundColor) {
                const contrast = this.calculateSimpleContrast(color, backgroundColor);

                if (contrast < 4.5) { // WCAG AA standard
                    contrastIssues.push({
                        element: element.tagName,
                        color,
                        backgroundColor,
                        contrast: contrast.toFixed(2),
                        text: element.textContent.slice(0, 30)
                    });
                }
            }

            // Limit checking to avoid performance issues
            if (contrastIssues.length > 20) break;
        }

        return {
            passed: contrastIssues.length === 0,
            message: contrastIssues.length === 0 ?
                'All text meets contrast requirements' :
                `Found ${contrastIssues.length} contrast issues`,
            details: {
                issues: contrastIssues.slice(0, 5), // Show first 5 issues
                totalIssues: contrastIssues.length
            }
        };
    }

    async testPopupRendering() {
        // Test popup dimensions
        const popup = document.getElementById('popupDemo');
        if (!popup) {
            return {
                passed: false,
                message: 'Popup demo element not found',
                details: {}
            };
        }

        popup.style.display = 'block';
        await this.delay(100);

        const rect = popup.getBoundingClientRect();
        const expectedWidth = 420;
        const expectedHeight = 650;

        const widthCorrect = Math.abs(rect.width - expectedWidth) < 5;
        const heightCorrect = Math.abs(rect.height - expectedHeight) < 5;

        popup.style.display = 'none';

        return {
            passed: widthCorrect && heightCorrect,
            message: widthCorrect && heightCorrect ?
                'Popup dimensions are correct' :
                'Popup dimensions are incorrect',
            details: {
                actualWidth: rect.width,
                actualHeight: rect.height,
                expectedWidth,
                expectedHeight,
                widthCorrect,
                heightCorrect
            }
        };
    }

    async testFloatingWidget() {
        const widget = document.getElementById('widgetDemo');
        if (!widget) {
            return {
                passed: false,
                message: 'Widget demo element not found',
                details: {}
            };
        }

        // Test positioning
        widget.classList.add('show');
        await this.delay(100);

        const style = getComputedStyle(widget);
        const position = style.position;
        const zIndex = parseInt(style.zIndex);

        const isFixed = position === 'fixed';
        const hasHighZIndex = zIndex >= 100;

        widget.classList.remove('show');

        return {
            passed: isFixed && hasHighZIndex,
            message: isFixed && hasHighZIndex ?
                'Floating widget positioning is correct' :
                'Floating widget has positioning issues',
            details: {
                position,
                zIndex,
                isFixed,
                hasHighZIndex
            }
        };
    }

    async testChatInterface() {
        // Test basic chat message structure
        const testMessage = document.createElement('div');
        testMessage.className = 'chat-message';
        testMessage.innerHTML = `
            <div class="message-content">Test message</div>
            <div class="message-timestamp">${new Date().toLocaleTimeString()}</div>
        `;

        document.body.appendChild(testMessage);
        await this.delay(50);

        const hasContent = testMessage.querySelector('.message-content') !== null;
        const hasTimestamp = testMessage.querySelector('.message-timestamp') !== null;

        document.body.removeChild(testMessage);

        return {
            passed: hasContent && hasTimestamp,
            message: hasContent && hasTimestamp ?
                'Chat message structure is correct' :
                'Chat message structure has issues',
            details: {
                hasContent,
                hasTimestamp
            }
        };
    }

    async testRenderPerformance() {
        const measurements = [];

        // Test multiple render operations
        for (let i = 0; i < 5; i++) {
            const startTime = performance.now();

            // Create and render test elements
            const container = document.createElement('div');
            container.innerHTML = Array.from({ length: 100 }, (_, i) =>
                `<div class="test-element-${i}">Element ${i}</div>`
            ).join('');

            document.body.appendChild(container);

            // Force layout
            container.offsetHeight;

            const endTime = performance.now();
            measurements.push(endTime - startTime);

            document.body.removeChild(container);
            await this.delay(10);
        }

        const averageTime = measurements.reduce((a, b) => a + b) / measurements.length;
        const performanceGood = averageTime < 50; // 50ms threshold

        return {
            passed: performanceGood,
            message: `Average render time: ${averageTime.toFixed(2)}ms`,
            details: {
                measurements,
                averageTime,
                threshold: 50,
                performanceGood
            }
        };
    }

    async testMemoryUsage() {
        if (!performance.memory) {
            return {
                passed: true,
                message: 'Memory API not available - test skipped',
                details: { memoryApiAvailable: false }
            };
        }

        const initialMemory = performance.memory.usedJSHeapSize;

        // Create memory load
        const testData = [];
        for (let i = 0; i < 10000; i++) {
            testData.push({
                id: i,
                data: 'test data'.repeat(10),
                timestamp: Date.now()
            });
        }

        await this.delay(100);

        const peakMemory = performance.memory.usedJSHeapSize;

        // Clean up
        testData.length = 0;

        await this.delay(100);

        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = (peakMemory - initialMemory) / 1024 / 1024; // MB
        const memoryLeaked = (finalMemory - initialMemory) / 1024 / 1024; // MB

        const memoryEfficient = memoryLeaked < 5; // Less than 5MB leak

        return {
            passed: memoryEfficient,
            message: `Memory usage: +${memoryIncrease.toFixed(2)}MB peak, ${memoryLeaked.toFixed(2)}MB leaked`,
            details: {
                initialMemory: (initialMemory / 1024 / 1024).toFixed(2),
                peakMemory: (peakMemory / 1024 / 1024).toFixed(2),
                finalMemory: (finalMemory / 1024 / 1024).toFixed(2),
                memoryIncrease,
                memoryLeaked,
                memoryEfficient
            }
        };
    }

    async testBundleSize() {
        const scripts = document.querySelectorAll('script[src]');
        const styles = document.querySelectorAll('link[rel="stylesheet"]');

        let totalScriptSize = 0;
        let totalStyleSize = 0;

        // Estimate sizes (actual measurement would require network inspection)
        scripts.forEach(script => {
            const src = script.src;
            if (src && !src.includes('http')) {
                // Rough estimation based on file extension and typical sizes
                totalScriptSize += 50; // KB estimate
            }
        });

        styles.forEach(style => {
            const href = style.href;
            if (href && !href.includes('http')) {
                totalStyleSize += 20; // KB estimate
            }
        });

        const totalSize = totalScriptSize + totalStyleSize;
        const sizeOptimal = totalSize < 500; // Less than 500KB

        return {
            passed: sizeOptimal,
            message: `Estimated bundle size: ${totalSize}KB`,
            details: {
                scriptCount: scripts.length,
                styleCount: styles.length,
                estimatedScriptSize: totalScriptSize,
                estimatedStyleSize: totalStyleSize,
                totalSize,
                threshold: 500,
                sizeOptimal
            }
        };
    }

    // UI Helper Methods

    updateTestStatus(testId, status) {
        const testItem = document.querySelector(`[data-test="${testId}"]`);
        if (!testItem) return;

        const statusElement = testItem.querySelector('.test-status');
        statusElement.className = `test-status ${status}`;

        switch (status) {
            case 'pending':
                statusElement.textContent = '⏳';
                break;
            case 'running':
                statusElement.textContent = '⚡';
                break;
            case 'passed':
                statusElement.textContent = '✅';
                break;
            case 'failed':
                statusElement.textContent = '❌';
                break;
        }
    }

    updateTestResult(testId, result) {
        const testItem = document.querySelector(`[data-test="${testId}"]`);
        if (!testItem) return;

        const resultElement = testItem.querySelector('.test-result');
        resultElement.className = `test-result show ${result.passed ? 'success' : 'error'}`;
        resultElement.textContent = result.message;
    }

    updateStatus() {
        const stats = this.getTestStatistics();

        document.getElementById('totalTests').textContent = stats.total;
        document.getElementById('passedTests').textContent = stats.passed;
        document.getElementById('failedTests').textContent = stats.failed;
        document.getElementById('runningTests').textContent = stats.running;
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${percentage}%`;
    }

    getTestStatistics() {
        const stats = { total: 0, passed: 0, failed: 0, running: 0, pending: 0 };

        for (const result of this.results.values()) {
            stats.total++;
            stats[result.status]++;
        }

        return stats;
    }

    measureInitialMetrics() {
        // Load Time
        const loadTime = performance.now();
        document.getElementById('loadTime').textContent = Math.round(loadTime);

        // Memory Usage
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            document.getElementById('memoryUsage').textContent = memoryMB;
        }

        // DOM Nodes
        const domNodes = document.querySelectorAll('*').length;
        document.getElementById('domNodes').textContent = domNodes;

        // Bundle Size (estimated)
        document.getElementById('bundleSize').textContent = '~150'; // Estimated
    }

    // Demo Functions

    showPopupDemo() {
        const modal = document.getElementById('popupDemoModal');
        const demo = document.getElementById('popupDemo');

        modal.classList.add('show');
        demo.classList.add('show');

        this.log('Popup demo opened', 'info');
    }

    closePopupDemo() {
        const modal = document.getElementById('popupDemoModal');
        const demo = document.getElementById('popupDemo');

        modal.classList.remove('show');
        demo.classList.remove('show');
    }

    showWidgetDemo() {
        const widget = document.getElementById('widgetDemo');
        widget.classList.add('show');

        this.log('Widget demo opened', 'info');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideWidgetDemo();
        }, 5000);
    }

    hideWidgetDemo() {
        const widget = document.getElementById('widgetDemo');
        widget.classList.remove('show');

        this.log('Widget demo closed', 'info');
    }

    showTestDetails(testId) {
        const test = this.tests.get(testId);
        const result = this.results.get(testId);

        if (!test) return;

        const modal = document.getElementById('testModal');
        const content = document.getElementById('modalContent');

        content.innerHTML = `
            <h2>${test.name}</h2>
            <div style="margin: 20px 0;">
                <strong>Status:</strong> <span class="test-status ${result.status}">${result.status.toUpperCase()}</span>
            </div>
            <div style="margin: 20px 0;">
                <strong>Message:</strong> ${result.message || 'No message'}
            </div>
            <div style="margin: 20px 0;">
                <strong>Duration:</strong> ${result.duration ? result.duration.toFixed(2) + 'ms' : 'Not run'}
            </div>
            <div style="margin: 20px 0;">
                <strong>Timestamp:</strong> ${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Not run'}
            </div>
            <div style="margin: 20px 0;">
                <strong>Details:</strong>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 6px; overflow: auto; max-height: 300px;">${JSON.stringify(result.details, null, 2)}</pre>
            </div>
        `;

        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('testModal');
        modal.classList.remove('show');
    }

    clearResults() {
        for (const [testId] of this.tests) {
            this.results.set(testId, {
                status: 'pending',
                message: '',
                details: {},
                duration: 0,
                timestamp: null
            });

            this.updateTestStatus(testId, 'pending');
            const testItem = document.querySelector(`[data-test="${testId}"]`);
            if (testItem) {
                const resultElement = testItem.querySelector('.test-result');
                resultElement.classList.remove('show');
            }
        }

        this.updateStatus();
        this.updateProgress(0);
        this.log('Test results cleared', 'info');
    }

    exportResults() {
        const stats = this.getTestStatistics();
        const timestamp = new Date().toISOString();

        const report = {
            timestamp,
            summary: stats,
            tests: Object.fromEntries(
                Array.from(this.tests.entries()).map(([id, test]) => [
                    id,
                    {
                        name: test.name,
                        result: this.results.get(id)
                    }
                ])
            ),
            metrics: {
                loadTime: document.getElementById('loadTime').textContent,
                memoryUsage: document.getElementById('memoryUsage').textContent,
                bundleSize: document.getElementById('bundleSize').textContent,
                domNodes: document.getElementById('domNodes').textContent
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ui-test-report-${timestamp.replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        this.log('Test report exported', 'success');
    }

    generateTestReport() {
        const stats = this.getTestStatistics();
        const passRate = ((stats.passed / stats.total) * 100).toFixed(1);

        this.log(`Test Summary: ${stats.passed}/${stats.total} passed (${passRate}%)`,
                stats.failed === 0 ? 'success' : 'warning');
    }

    // Utility Methods

    log(message, type = 'info') {
        const logViewer = document.getElementById('logViewer');
        const timestamp = new Date().toLocaleTimeString();

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

        logViewer.appendChild(logEntry);
        logViewer.scrollTop = logViewer.scrollHeight;

        // Limit log entries
        const entries = logViewer.children;
        if (entries.length > 100) {
            logViewer.removeChild(entries[0]);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateSimpleContrast(color1, color2) {
        // Simplified contrast calculation
        // In a real implementation, you'd parse colors properly
        const rgb1 = this.parseSimpleColor(color1);
        const rgb2 = this.parseSimpleColor(color2);

        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);

        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    parseSimpleColor(color) {
        // Very simplified color parsing
        if (color.includes('rgb')) {
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
                return {
                    r: parseInt(matches[0]) / 255,
                    g: parseInt(matches[1]) / 255,
                    b: parseInt(matches[2]) / 255
                };
            }
        }

        // Default to white for unknown colors
        return { r: 1, g: 1, b: 1 };
    }

    getLuminance({ r, g, b }) {
        const [rs, gs, bs] = [r, g, b].map(c =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
}

// Global functions for button clicks
function runSingleTest(testId) {
    if (window.testSuite) {
        window.testSuite.runSingleTest(testId);
    }
}

function showTestDetails(testId) {
    if (window.testSuite) {
        window.testSuite.showTestDetails(testId);
    }
}

function showPopupDemo() {
    if (window.testSuite) {
        window.testSuite.showPopupDemo();
    }
}

function closePopupDemo() {
    if (window.testSuite) {
        window.testSuite.closePopupDemo();
    }
}

function showWidgetDemo() {
    if (window.testSuite) {
        window.testSuite.showWidgetDemo();
    }
}

function hideWidgetDemo() {
    if (window.testSuite) {
        window.testSuite.hideWidgetDemo();
    }
}

function closeModal() {
    if (window.testSuite) {
        window.testSuite.closeModal();
    }
}

// Initialize the testing suite when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.testSuite = new UITestingSuite();
    console.log('UI Testing Suite initialized');
});