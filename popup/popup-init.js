/**
 * Popup Initialization Script
 * Ensures proper popup dimensions and prevents the thin strip issue
 */

// Force popup dimensions on load
document.addEventListener('DOMContentLoaded', function() {
    // Set explicit dimensions to prevent thin strip issue
    const forcePopupSize = () => {
        // Force the html and body to the correct size
        document.documentElement.style.width = '420px';
        document.documentElement.style.height = '650px';
        document.documentElement.style.minWidth = '420px';
        document.documentElement.style.minHeight = '650px';
        document.documentElement.style.maxWidth = '420px';
        document.documentElement.style.maxHeight = '650px';
        document.documentElement.style.overflow = 'hidden';

        document.body.style.width = '420px';
        document.body.style.height = '650px';
        document.body.style.minWidth = '420px';
        document.body.style.minHeight = '650px';
        document.body.style.maxWidth = '420px';
        document.body.style.maxHeight = '650px';
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Also set container
        const container = document.querySelector('.container');
        if (container) {
            container.style.width = '420px';
            container.style.height = '650px';
            container.style.margin = '0';
            container.style.padding = '0';
        }

        console.log('Popup dimensions enforced: 420x650px');
    };

    // Force size immediately
    forcePopupSize();

    // Force size again after a short delay to override any late-loading styles
    setTimeout(forcePopupSize, 100);

    // Check and log actual dimensions
    setTimeout(() => {
        const actualWidth = window.innerWidth;
        const actualHeight = window.innerHeight;
        console.log(`Actual popup dimensions: ${actualWidth}x${actualHeight}px`);

        // If dimensions are wrong, try to fix
        if (actualWidth < 400 || actualHeight < 600) {
            console.warn('Popup dimensions incorrect, attempting to fix...');
            forcePopupSize();

            // Try resizing the window if possible
            if (chrome.windows && chrome.windows.getCurrent) {
                chrome.windows.getCurrent((window) => {
                    if (window.type === 'popup') {
                        chrome.windows.update(window.id, {
                            width: 420,
                            height: 650
                        });
                    }
                });
            }
        }
    }, 200);
});

// Also force size on window load
window.addEventListener('load', function() {
    document.documentElement.style.cssText = 'width: 420px !important; height: 650px !important; overflow: hidden !important;';
    document.body.style.cssText = 'width: 420px !important; height: 650px !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important;';
});

// Prevent any resize attempts
window.addEventListener('resize', function(e) {
    if (window.innerWidth !== 420 || window.innerHeight !== 650) {
        e.preventDefault();
        e.stopPropagation();
        document.documentElement.style.width = '420px';
        document.documentElement.style.height = '650px';
        document.body.style.width = '420px';
        document.body.style.height = '650px';
    }
});