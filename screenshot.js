// Screenshot capture functionality for the extension

class ScreenCapture {
    constructor() {
        this.captureInProgress = false;
    }

    // Capture visible tab
    async captureVisibleTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });
            return {
                success: true,
                dataUrl: screenshot,
                timestamp: Date.now(),
                tabInfo: {
                    url: tab.url,
                    title: tab.title
                }
            };
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Capture specific area (requires content script coordination)
    async captureArea(tabId, area) {
        try {
            // First capture the full tab
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });

            // Send to content script for cropping
            const response = await chrome.tabs.sendMessage(tabId, {
                action: 'cropScreenshot',
                screenshot: screenshot,
                area: area
            });

            return response;
        } catch (error) {
            console.error('Area capture failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Capture full page (scrolling capture)
    async captureFullPage(tabId) {
        try {
            // Get page dimensions from content script
            const dimensions = await chrome.tabs.sendMessage(tabId, {
                action: 'getPageDimensions'
            });

            const captures = [];
            const viewportHeight = dimensions.viewportHeight;
            const totalHeight = dimensions.scrollHeight;
            let currentScroll = 0;

            // Capture each viewport
            while (currentScroll < totalHeight) {
                await chrome.tabs.sendMessage(tabId, {
                    action: 'scrollTo',
                    position: currentScroll
                });

                // Wait for scroll to complete
                await new Promise(resolve => setTimeout(resolve, 300));

                const capture = await chrome.tabs.captureVisibleTab(null, {
                    format: 'png'
                });

                captures.push({
                    dataUrl: capture,
                    scrollPosition: currentScroll
                });

                currentScroll += viewportHeight;
            }

            // Combine captures (send to content script for processing)
            const combined = await chrome.tabs.sendMessage(tabId, {
                action: 'combineScreenshots',
                captures: captures,
                dimensions: dimensions
            });

            return combined;
        } catch (error) {
            console.error('Full page capture failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Save screenshot to downloads
    async saveScreenshot(dataUrl, filename) {
        try {
            // Remove data URL prefix
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

            // Convert to blob
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: 'image/png' });

            // Create download
            const url = URL.createObjectURL(blob);
            await chrome.downloads.download({
                url: url,
                filename: filename || `screenshot_${Date.now()}.png`
            });

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            return { success: true };
        } catch (error) {
            console.error('Save screenshot failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Convert screenshot to base64 for sending
    toBase64(dataUrl) {
        return dataUrl.replace(/^data:image\/png;base64,/, '');
    }

    // Get screenshot as blob
    async toBlob(dataUrl) {
        const response = await fetch(dataUrl);
        return await response.blob();
    }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenCapture;
}