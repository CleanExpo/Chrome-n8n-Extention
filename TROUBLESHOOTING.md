# n8n Chrome Extension Troubleshooting Guide

## Version Information
- Current Version: 1.0.1
- Last Updated: Fixed syntax errors and added comprehensive error handling

## Common Issues and Solutions

### 1. Extension Not Loading

**Symptoms:**
- Widget toggle button not appearing
- Console errors about undefined variables

**Solutions:**
1. **Reload the Extension:**
   - Go to `chrome://extensions/`
   - Find "n8n Professional Agent"
   - Click the reload button (circular arrow icon)

2. **Clear Browser Cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Clear data

3. **Check Console for Errors:**
   - Press `F12` to open DevTools
   - Go to Console tab
   - Look for errors starting with "n8n" or "FloatingAssistant"

### 2. Widget Not Appearing

**Check Version:**
Open the console and look for: `FloatingAssistant v1.0.1 loading...`

If you see an older version or no version message:
1. Reload the extension (see above)
2. Hard refresh the page: `Ctrl+F5` or `Cmd+Shift+R`

### 3. JavaScript Errors

**Common Error Messages:**
- `Uncaught SyntaxError: Unexpected token`
- `Uncaught ReferenceError`

**Solutions:**
1. The latest version (1.0.1) includes fixes for these issues
2. Make sure you're loading the updated `floating-widget-enhanced.js`
3. Check the console for the version message

### 4. Testing the Extension

1. **Open the Test Page:**
   - Open `test-extension.html` in Chrome
   - Click "Check Extension Status"
   - Verify all components are loaded

2. **Manual Test:**
   - Open any website
   - Look for the floating button in the bottom-right corner
   - Click to open the assistant
   - Check console for any errors

### 5. Debug Mode

Enable debug mode for detailed logging:
1. Click the extension icon in toolbar
2. Go to Settings
3. Enable "Debug Mode"
4. Reload the page

### 6. Console Commands for Debugging

Open DevTools Console (F12) and run:

```javascript
// Check if extension is loaded
console.log('Extension loaded:', typeof chrome !== 'undefined' && chrome.runtime);

// Check widget instance
console.log('Widget instance:', window.__n8nAssistantInstance);

// Check widget element
console.log('Widget in DOM:', document.getElementById('n8n-assistant-widget'));

// Manually open widget
if (window.__n8nAssistantInstance && !window.__n8nAssistantInstance.isOpen) {
    window.__n8nAssistantInstance.toggleChat();
}
```

### 7. Error Reporting

If you encounter persistent issues:

1. **Collect Information:**
   - Extension version (check popup footer)
   - Browser version (chrome://version/)
   - Console error messages
   - Steps to reproduce

2. **Check Console Output:**
   - Look for messages starting with:
     - `FloatingAssistant`
     - `n8n Assistant`
     - `Chrome runtime error`

3. **Report Format:**
   ```
   Version: 1.0.1
   Browser: Chrome [version]
   Error: [error message]
   Steps: [how to reproduce]
   ```

## Quick Fixes

### Force Reload Extension:
```javascript
// Run in console on any page
location.reload(true);
```

### Reset Extension Settings:
1. Go to extension options page
2. Click "Reset to Defaults"
3. Reload the extension

### Clear Extension Storage:
```javascript
// Run in extension's background page console
chrome.storage.sync.clear(() => {
    console.log('Storage cleared');
});
```

## File Structure Verification

Ensure these files exist and are properly formatted:
- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `content.js` - Content script with cache-busting
- `floating-widget-enhanced.js` - Main widget (v1.0.1)
- `popup/popup-enhanced.html` - Popup interface
- `options/options-enhanced.html` - Options page

## Version Changelog

### v1.0.1
- Fixed syntax errors in floating-widget-enhanced.js
- Added comprehensive error handling
- Added cache-busting to prevent loading old versions
- Added version logging for debugging
- Added global error handler for runtime errors

### v1.0.0
- Initial release with enhanced UI/UX
- Chrome Extension documentation integration
- n8n documentation integration
- Context7 MCP server integration