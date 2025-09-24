/**
 * Auto-Reload Development Script
 * This script watches for file changes and automatically reloads the extension
 */

// Add this to your background script to enable hot reload in development
const ENABLE_HOT_RELOAD = true;
const CHECK_INTERVAL = 1000; // Check every second
const WATCH_FILES = [
    'manifest.json',
    'background-latest-models.js',
    'popup/popup-simple.html',
    'popup/popup-simple.js',
    'popup/popup-simple.css',
    'content-working.js'
];

let fileTimestamps = {};

// Initialize timestamps
async function initFileWatcher() {
    if (!ENABLE_HOT_RELOAD) return;

    console.log('🔥 Hot reload enabled - watching for changes...');

    // Get initial timestamps
    for (const file of WATCH_FILES) {
        try {
            const response = await fetch(chrome.runtime.getURL(file));
            fileTimestamps[file] = response.headers.get('last-modified');
        } catch (e) {
            console.log(`Could not get timestamp for ${file}`);
        }
    }

    // Start watching
    setInterval(checkForChanges, CHECK_INTERVAL);
}

// Check if files have changed
async function checkForChanges() {
    let hasChanges = false;

    for (const file of WATCH_FILES) {
        try {
            const response = await fetch(chrome.runtime.getURL(file));
            const lastModified = response.headers.get('last-modified');

            if (fileTimestamps[file] && fileTimestamps[file] !== lastModified) {
                console.log(`📝 Change detected in ${file}`);
                hasChanges = true;
            }

            fileTimestamps[file] = lastModified;
        } catch (e) {
            // File might not exist yet
        }
    }

    if (hasChanges) {
        console.log('🔄 Reloading extension...');
        chrome.runtime.reload();
    }
}

// Auto-update check
async function checkForUpdates() {
    try {
        // Check if there's a newer version available
        const response = await fetch(chrome.runtime.getURL('version.json'));
        const data = await response.json();

        const currentVersion = chrome.runtime.getManifest().version;
        if (data.version !== currentVersion) {
            console.log(`📦 New version available: ${data.version} (current: ${currentVersion})`);

            // Notify user
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon-128.png',
                title: 'Extension Update Available',
                message: `Version ${data.version} is ready. Click to reload.`,
                buttons: [{ title: 'Reload Now' }]
            });
        }
    } catch (e) {
        // Version file doesn't exist
    }
}

// Listen for notification clicks
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (btnIdx === 0) {
        chrome.runtime.reload();
    }
});

// Initialize if in development mode
if (ENABLE_HOT_RELOAD) {
    initFileWatcher();
    setInterval(checkForUpdates, 60000); // Check every minute
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initFileWatcher, checkForUpdates };
}