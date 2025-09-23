# API Setup Guide - Fix Connection Errors

## 🔴 Common Error Messages

The following errors appear in the console and are **NORMAL** if you haven't configured these services:

```
Failed to load resource: localhost:3000 - net::ERR_CONNECTION_REFUSED
Failed to load resource: phillcarsi.app.n8n.cloud/signin - 404
Failed to load resource: api.context7.com/resolve - net::ERR_NAME_NOT_RESOLVED
```

## ✅ How to Fix Each Error

### 1. localhost:3000 Connection Refused

**What it means:** The extension is trying to connect to a local integration server that isn't running.

**Solution:**
- This is **OPTIONAL** - the extension works without it
- The extension will automatically fall back to direct OpenAI API
- To remove this error, you can:
  1. Leave it as is (harmless)
  2. Or set up the integration server (advanced users only)

### 2. n8n Cloud 404 Errors

**What it means:** The extension is checking for n8n workflow integration.

**Solution:**
- This is **OPTIONAL** - only needed if you use n8n workflows
- To fix:
  1. Go to extension settings (click extension icon → Settings)
  2. Leave "Integration Server URL" blank or remove the default
  3. The extension will skip n8n integration

### 3. Context7 API Not Resolved

**What it means:** Context7 provides real-time library documentation (optional feature).

**Solution:**
- This is **OPTIONAL** - the extension works without it
- Context7 may require:
  1. An API key from context7.com
  2. Or the service may not be publicly available yet
- The extension will work fine without Context7

## 🎯 Quick Setup (Minimal Configuration)

### Step 1: Open Extension Settings
1. Click the extension icon in Chrome toolbar
2. Click "🔧 Settings / API Keys"

### Step 2: Configure Only What You Need

#### Required (for AI responses):
- **OpenAI API Key**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Enter your key starting with `sk-...`

#### Optional (leave blank to avoid errors):
- **n8n API Key**: Leave blank unless you have n8n
- **n8n Webhook URL**: Leave blank unless you have n8n
- **Integration Server URL**: Clear this field or leave as is
- **Context7 API Key**: Leave blank unless you have Context7

### Step 3: Save Settings
Click "Save All Settings"

## 🚀 After Configuration

### Errors Should Stop
Once you save settings with only the required fields:
- No more 404 errors (services are skipped)
- No more connection refused (localhost attempts disabled)
- The extension uses direct OpenAI API

### Console Output Should Show
```
n8n integration skipped - using direct OpenAI
Context7 API not available, skipping library resolution
Using OpenAI directly for response
```

## 📋 Configuration Checklist

### Minimum Setup (Recommended)
- [ ] OpenAI API Key entered
- [ ] Integration Server URL cleared or left default
- [ ] n8n fields left blank
- [ ] Context7 field left blank
- [ ] Settings saved

### Full Setup (Advanced Users)
- [ ] OpenAI API Key
- [ ] n8n instance running and webhook URL configured
- [ ] Integration server deployed (if using)
- [ ] Context7 API key (if available)

## 🔍 Verify Configuration

### Test Your Setup
1. Open any webpage
2. Click the extension floating button
3. Type "Hello" in the chat
4. Should get a response using OpenAI directly

### Check Console
1. Right-click extension icon → Inspect popup
2. Go to Console tab
3. Should see: "Using OpenAI directly for response"
4. Should NOT see connection errors

## ⚡ API Priority Order

The extension tries APIs in this order:
1. **n8n Workflow** (if configured)
2. **OpenAI Direct** (if API key provided) ← Most users use this
3. **Fallback Message** (if nothing configured)

## 🛠️ Advanced: Setting Up Integration Server

**Note:** This is completely optional and for advanced users only.

If you want to run the local integration server:

```bash
# Navigate to integration-server folder
cd integration-server

# Install dependencies
npm install

# Create .env file with your keys
echo "OPENAI_API_KEY=your-key-here" > .env

# Start server
npm start
```

Then in extension settings:
- Integration Server URL: `http://localhost:3000`

## 💡 Tips

1. **Start Simple**: Just use OpenAI API key initially
2. **Ignore Harmless Errors**: The 404/connection errors don't affect functionality
3. **Add Services Later**: You can always add n8n or Context7 later
4. **Check API Key**: Make sure your OpenAI key is active and has credits

## ❓ FAQ

### Q: Do I need all these services?
**A:** No! You only need an OpenAI API key. Everything else is optional.

### Q: Will the errors affect the extension?
**A:** No, they're just connection attempts. The extension handles them gracefully.

### Q: Can I remove the error messages?
**A:** Yes, by clearing the optional service URLs in settings.

### Q: What's the Integration Server for?
**A:** It's an optional bridge for connecting to n8n workflows and other services.

### Q: Is Context7 required?
**A:** No, it's an optional service for fetching library documentation.

## 🔧 Troubleshooting

### Still Seeing Errors?
1. **Clear Browser Cache**: Ctrl+Shift+Delete → Cached images and files
2. **Reload Extension**: chrome://extensions → Reload
3. **Check Settings**: Ensure optional URLs are cleared
4. **Restart Chrome**: Sometimes needed after configuration changes

### Extension Not Responding?
1. Check OpenAI API key is valid
2. Verify you have API credits at platform.openai.com
3. Check console for specific error messages
4. Try the simple test: Type "What is 2+2?" in chat

---

**Remember:** The extension is designed to work with minimal configuration. Just add your OpenAI API key and you're ready to go! The error messages for optional services are harmless and can be ignored.