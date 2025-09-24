# How to Load the AI Assistant Extension

## Quick Steps

1. **Open Chrome Extensions Page**
   - Navigate to: `chrome://extensions/`
   - Or: Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle ON "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to: `D:\Chrome Extention n8n`
   - Select this folder and click "Select Folder"

4. **Verify Installation**
   - You should see "Private AI Assistant - McGurk & Zenith" in your extensions list
   - The extension icon should appear in your toolbar
   - Status should show "Enabled"

5. **Test the Extension**
   - Click the extension icon in toolbar - popup should open
   - Navigate to any website (like google.com)
   - Look for the floating AI robot icon (🤖) in the bottom-right corner
   - Click the robot icon to open the chat interface

## Troubleshooting

### Extension Not Loading
- Make sure Developer mode is ON
- Check for errors in the extension card
- Click "Reload" button on the extension card

### Widget Not Appearing
- Refresh the webpage (F5)
- Check that the extension is enabled
- Try navigating to a different website
- Check console for errors (F12 → Console tab)

### Chat Not Working
- Verify API keys are configured:
  - Click extension icon → Settings
  - Enter your API keys
  - Save settings

## Files Being Used
- **Background Script**: `background-latest-models.js`
- **Content Script**: `content-working.js`
- **Popup**: `popup/popup-simple.html`
- **Options**: `options/options-enhanced.html`