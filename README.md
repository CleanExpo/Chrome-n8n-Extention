# Chrome Extension Template (Manifest V3)

A modern, feature-rich Chrome Extension template built with Manifest V3. This template includes all essential components and demonstrates best practices for building Chrome extensions.

## Features

- ✅ **Manifest V3** - Latest Chrome extension manifest version
- ✅ **Popup Interface** - Interactive popup with modern UI
- ✅ **Options Page** - Comprehensive settings management
- ✅ **Background Service Worker** - Handles background tasks and messaging
- ✅ **Content Script** - Interacts with web page content
- ✅ **Message Passing** - Communication between components
- ✅ **Chrome Storage API** - Persistent settings storage
- ✅ **Context Menus** - Right-click menu integration
- ✅ **Modern Styling** - Clean, responsive design
- ✅ **Error Handling** - Robust error management

## Project Structure

```
chrome-extension-template/
│
├── manifest.json           # Extension manifest (V3)
├── background.js          # Service worker for background tasks
├── content.js            # Content script for page interaction
│
├── popup/                # Popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
│
├── options/              # Options page
│   ├── options.html
│   ├── options.js
│   └── options.css
│
├── images/              # Extension icons
│   └── README.md       # Icon guidelines
│
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Quick Start

### Prerequisites

- Google Chrome browser (version 88 or higher)
- Basic knowledge of HTML, CSS, and JavaScript
- Text editor or IDE

### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/chrome-extension-template.git
   cd chrome-extension-template
   ```

2. **Create icon files**
   - Navigate to the `images/` folder
   - Create three PNG files: `icon-16.png`, `icon-48.png`, `icon-128.png`
   - Or use any icon generator to create placeholder icons

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

4. **Test the extension**
   - Click the extension icon in the toolbar to open the popup
   - Right-click to see context menu options
   - Visit any website to see the content script in action
   - Click the Settings link in the popup to access options

## Features Demonstration

### Popup Interface
- **Status Indicator**: Shows if extension is active
- **Quick Actions**: Analyze current page button
- **Statistics**: Displays usage statistics
- **Settings Link**: Quick access to options page

### Options Page
- **General Settings**: Auto-analyze, notifications, delays
- **Appearance**: Theme selection, badge color
- **Advanced**: Debug mode, history limits
- **Data Management**: Import/export settings, reset options

### Background Service Worker
- Handles extension lifecycle events
- Manages message passing between components
- Stores and retrieves data using Chrome Storage API
- Creates and manages context menus

### Content Script
- Runs on all web pages (configurable)
- Page analysis functionality
- Visual indicators and notifications
- Responds to user interactions

## Message Passing Examples

### Popup → Content Script
```javascript
// From popup.js
chrome.tabs.sendMessage(tab.id, {
    action: 'analyze',
    url: tab.url
});
```

### Content Script → Background
```javascript
// From content.js
chrome.runtime.sendMessage({
    action: 'storeAnalysis',
    data: analysisData
});
```

### Background → All Components
```javascript
// From background.js
chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: newSettings
        });
    });
});
```

## Chrome Storage API Usage

### Save Settings
```javascript
chrome.storage.sync.set({
    enabled: true,
    theme: 'dark',
    autoAnalyze: false
});
```

### Load Settings
```javascript
chrome.storage.sync.get(['enabled', 'theme'], (result) => {
    console.log('Settings:', result);
});
```

## Development Tips

1. **Auto-reload Extension**
   - After making changes, go to `chrome://extensions/`
   - Click the refresh icon on your extension card
   - Or use extensions like "Extension Reloader" for auto-refresh

2. **Debugging**
   - **Popup**: Right-click the popup and select "Inspect"
   - **Background**: Click "service worker" link in `chrome://extensions/`
   - **Content Script**: Use regular DevTools on any web page
   - **Options Page**: Right-click and inspect like any web page

3. **Console Logging**
   - Enable debug mode in options for verbose logging
   - Check different consoles for different components

4. **Testing**
   - Test on different websites
   - Test with extension enabled/disabled
   - Test settings persistence
   - Test error scenarios

## Customization Guide

### Changing Extension Name and Description
Edit `manifest.json`:
```json
{
  "name": "Your Extension Name",
  "description": "Your description here"
}
```

### Adding New Permissions
Add to the `permissions` array in `manifest.json`:
```json
"permissions": [
  "storage",
  "tabs",
  "notifications"  // Add new permission
]
```

### Modifying Content Script Matching
Edit `content_scripts` in `manifest.json`:
```json
"content_scripts": [{
  "matches": ["https://*.example.com/*"],  // Specific sites
  "js": ["content.js"]
}]
```

### Adding New Features
1. Create new JavaScript files
2. Add to manifest.json if needed
3. Implement message passing for communication
4. Update UI components accordingly

## Publishing to Chrome Web Store

1. **Create proper icons** (16x16, 48x48, 128x128 PNG files)
2. **Test thoroughly** on different websites and scenarios
3. **Create screenshots** for store listing (1280x800 or 640x400)
4. **Write store description** and prepare promotional materials
5. **Package extension**:
   ```bash
   npm run package
   ```
   Or manually create a ZIP file excluding unnecessary files
6. **Upload to Chrome Web Store Developer Dashboard**
7. **Pay one-time developer fee** ($5 USD)
8. **Submit for review**

## Troubleshooting

### Extension Not Loading
- Ensure all icon files exist in `images/` folder
- Check for syntax errors in manifest.json
- Verify Chrome version compatibility

### Popup Not Opening
- Check for JavaScript errors in popup.js
- Ensure popup.html path is correct in manifest.json

### Content Script Not Running
- Verify URL matches patterns in manifest.json
- Check for JavaScript errors in content.js
- Ensure permissions are properly set

### Storage Not Persisting
- Check storage permissions in manifest.json
- Verify storage quota hasn't been exceeded
- Use chrome.storage.sync for cross-device sync

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome APIs Reference](https://developer.chrome.com/docs/extensions/reference/)
- [Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

## License

MIT License - feel free to use this template for your own extensions!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review Chrome Extensions documentation
3. Open an issue on GitHub

---

**Happy Extension Building! 🚀**