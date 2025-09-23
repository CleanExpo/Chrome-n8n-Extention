// Content Script - Runs on web pages and interacts with page content

console.log('n8n AI Assistant Content Script Loaded');

// Track if widget is already injected
let widgetInjected = false;

// Inject floating widget script
function injectFloatingWidget() {
    // Prevent multiple injections
    if (widgetInjected) {
        console.log('Widget already injected, skipping...');
        return;
    }

    // Check if widget already exists in DOM
    if (document.getElementById('n8n-assistant-widget')) {
        console.log('Widget already exists in DOM');
        widgetInjected = true;
        return;
    }

    const script = document.createElement('script');
    // Add cache buster to ensure fresh load
    const timestamp = new Date().getTime();
    script.src = chrome.runtime.getURL('floating-widget-enhanced.js') + '?v=' + timestamp;
    script.setAttribute('data-injected', 'true');
    script.onload = function() {
        widgetInjected = true;
        console.log('Floating widget script loaded successfully');
        this.remove();
    };
    script.onerror = function(error) {
        console.error('Failed to load floating widget script:', error);
        widgetInjected = false; // Reset flag to allow retry
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// Extension state
let extensionEnabled = true;
let settings = {};

// Initialize content script
(async function init() {
    // Load initial settings
    const result = await chrome.storage.sync.get(['enabled', 'assistantEnabled', 'debugMode']);
    extensionEnabled = result.enabled !== false;
    const assistantEnabled = result.assistantEnabled !== false;

    if (result.debugMode) {
        console.log('Extension initialized on:', window.location.href);
        console.log('Assistant enabled:', assistantEnabled);
    }

    // Load all settings
    loadSettings();

    // Inject floating widget if assistant is enabled
    if (assistantEnabled) {
        injectFloatingWidget();
    }

    // Set up mutation observer for dynamic content
    if (extensionEnabled) {
        setupObserver();
    }

    // Add visual indicator
    addPageIndicator();
})();

// Load settings from storage
async function loadSettings() {
    try {
        settings = await chrome.storage.sync.get(null);

        if (settings.debugMode) {
            console.log('Settings loaded:', settings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Listen for messages from background and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (settings.debugMode) {
        console.log('Content script received message:', request);
    }

    // Handle different message types
    if (request.type === 'openChat') {
        // Trigger chat opening
        const event = new CustomEvent('n8n-open-chat');
        window.dispatchEvent(event);
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'toggleAssistant') {
        // Toggle assistant state
        extensionEnabled = request.enabled;
        const event = new CustomEvent('n8n-toggle-assistant', {
            detail: { enabled: request.enabled }
        });
        window.dispatchEvent(event);
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'extractContent') {
        // Extract page content
        const content = document.body.innerText || document.body.textContent || '';
        sendResponse({ content: content.substring(0, 5000) }); // Limit content size
        return true;
    }

    switch (request.action) {
        case 'analyze':
            performAnalysis(request.url);
            sendResponse({ success: true, message: 'Analysis started' });
            break;

        case 'analyzeSelection':
            analyzeSelectedText(request.text);
            sendResponse({ success: true });
            break;

        case 'analyzeImage':
            analyzeImage(request.url);
            sendResponse({ success: true });
            break;

        case 'analyzeLink':
            analyzeLink(request.url);
            sendResponse({ success: true });
            break;

        case 'extensionToggled':
            handleExtensionToggle(request.enabled);
            sendResponse({ success: true });
            break;

        case 'settingsUpdated':
            settings = request.settings;
            applySettings();
            sendResponse({ success: true });
            break;

        case 'analysisComplete':
            displayAnalysisResults(request.data);
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }

    return true; // Keep message channel open for async response
});

// Perform page analysis
function performAnalysis(url) {
    console.log('Analyzing page:', url);

    // Collect page data
    const pageData = {
        url: url || window.location.href,
        title: document.title,
        timestamp: Date.now(),
        elements: {
            total: document.querySelectorAll('*').length,
            images: document.images.length,
            links: document.links.length,
            forms: document.forms.length,
            scripts: document.scripts.length
        },
        meta: extractMetaTags(),
        performance: getPagePerformance()
    };

    // Send to background for storage
    chrome.runtime.sendMessage({
        action: 'storeAnalysis',
        url: pageData.url,
        data: pageData
    });

    // Display results
    displayAnalysisResults(pageData);

    // Show notification
    showNotification('Page analyzed successfully!', 'success');
}

// Extract meta tags
function extractMetaTags() {
    const metaTags = {};
    const metas = document.getElementsByTagName('meta');

    for (let meta of metas) {
        if (meta.name) {
            metaTags[meta.name] = meta.content;
        } else if (meta.property) {
            metaTags[meta.property] = meta.content;
        }
    }

    return metaTags;
}

// Get page performance metrics
function getPagePerformance() {
    if (!window.performance) return null;

    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    return {
        loadTime: loadTime,
        domReadyTime: domReadyTime,
        renderTime: renderTime
    };
}

// Analyze selected text
function analyzeSelectedText(text) {
    console.log('Analyzing selected text:', text);

    const analysis = {
        text: text,
        length: text.length,
        words: text.split(/\s+/).filter(word => word.length > 0).length,
        sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    };

    // Highlight the selection
    highlightSelection();

    // Show analysis result
    showNotification(`Text analyzed: ${analysis.words} words, ${analysis.sentences} sentences`, 'info');
}

// Analyze image
function analyzeImage(imageUrl) {
    console.log('Analyzing image:', imageUrl);

    // Find image element
    const img = document.querySelector(`img[src="${imageUrl}"]`);

    if (img) {
        const analysis = {
            url: imageUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            alt: img.alt,
            title: img.title
        };

        // Add visual effect to image
        img.style.border = '3px solid #667eea';
        img.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';

        setTimeout(() => {
            img.style.border = '';
            img.style.boxShadow = '';
        }, 3000);

        showNotification(`Image: ${analysis.width}x${analysis.height}px`, 'info');
    }
}

// Analyze link
function analyzeLink(linkUrl) {
    console.log('Analyzing link:', linkUrl);

    // Find link element
    const link = document.querySelector(`a[href="${linkUrl}"]`);

    if (link) {
        const analysis = {
            url: linkUrl,
            text: link.textContent,
            target: link.target,
            rel: link.rel
        };

        // Highlight link
        link.style.backgroundColor = '#667eea';
        link.style.color = 'white';
        link.style.padding = '2px 5px';
        link.style.borderRadius = '3px';

        setTimeout(() => {
            link.style.backgroundColor = '';
            link.style.color = '';
            link.style.padding = '';
            link.style.borderRadius = '';
        }, 3000);

        showNotification(`Link analyzed: ${new URL(linkUrl).hostname}`, 'info');
    }
}

// Handle extension toggle
function handleExtensionToggle(enabled) {
    extensionEnabled = enabled;

    if (enabled) {
        setupObserver();
        showNotification('Extension enabled', 'success');
    } else {
        if (window.mutationObserver) {
            window.mutationObserver.disconnect();
        }
        showNotification('Extension disabled', 'info');
    }

    // Update page indicator
    updatePageIndicator();
}

// Apply settings
function applySettings() {
    console.log('Applying settings:', settings);

    // Re-setup observer if needed
    if (settings.autoAnalyze && extensionEnabled) {
        setupObserver();
    }
}

// Setup mutation observer for dynamic content
function setupObserver() {
    if (window.mutationObserver) {
        window.mutationObserver.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
        if (settings.debugMode) {
            console.log('Page mutations detected:', mutations.length);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
    });

    window.mutationObserver = observer;
}

// Add visual indicator to page
function addPageIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'chrome-extension-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 12px;
        height: 12px;
        background: ${extensionEnabled ? '#28a745' : '#dc3545'};
        border-radius: 50%;
        z-index: 999999;
        pointer-events: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(indicator);
}

// Update page indicator
function updatePageIndicator() {
    const indicator = document.getElementById('chrome-extension-indicator');
    if (indicator) {
        indicator.style.background = extensionEnabled ? '#28a745' : '#dc3545';
    }
}

// Display analysis results
function displayAnalysisResults(data) {
    // Create results overlay
    const overlay = document.createElement('div');
    overlay.id = 'analysis-results-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 999998;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    overlay.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Page Analysis Results</h3>
        <div style="color: #666; font-size: 14px; line-height: 1.6;">
            <p><strong>Title:</strong> ${data.title}</p>
            <p><strong>Elements:</strong> ${data.elements?.total || 'N/A'}</p>
            <p><strong>Images:</strong> ${data.elements?.images || 'N/A'}</p>
            <p><strong>Links:</strong> ${data.elements?.links || 'N/A'}</p>
            ${data.performance ? `<p><strong>Load Time:</strong> ${data.performance.loadTime}ms</p>` : ''}
        </div>
        <button id="close-analysis" style="
            margin-top: 15px;
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        ">Close</button>
    `;

    document.body.appendChild(overlay);

    // Add close functionality
    document.getElementById('close-analysis').addEventListener('click', () => {
        overlay.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.getElementById('analysis-results-overlay')) {
            overlay.remove();
        }
    }, 10000);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('extension-notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'extension-notification';

    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#667eea'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;

    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Highlight selected text
function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = 'rgba(102, 126, 234, 0.3)';
    span.style.padding = '2px';
    span.style.borderRadius = '3px';

    try {
        range.surroundContents(span);
    } catch (e) {
        // Fallback for complex selections
        console.log('Could not highlight selection');
    }

    // Remove highlight after 3 seconds
    setTimeout(() => {
        if (span.parentNode) {
            const parent = span.parentNode;
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
        }
    }, 3000);
}

// Log that content script is ready
console.log('Content script ready on:', window.location.href);