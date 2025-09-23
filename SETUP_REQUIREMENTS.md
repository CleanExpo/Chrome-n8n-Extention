# 🚀 Chrome Extension Setup Requirements
## Moving from 85% to 100% Functionality

This document provides all the details and credentials you need to complete the extension setup.

---

## 1. 🔐 Google OAuth2 & API Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" → Name it "Chrome Extension AI Assistant"
3. Note your **Project ID**: `your-project-id`

### Step 2: Enable Required APIs
Navigate to "APIs & Services" → "Library" and enable:
- ✅ Google Drive API
- ✅ Google Sheets API
- ✅ Google Calendar API
- ✅ Gmail API
- ✅ Google People API (for contacts)

### Step 3: Create OAuth2 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen:
   - User Type: External
   - App name: "Chrome Extension AI Assistant"
   - Support email: your-email@gmail.com
   - Add scopes:
     ```
     https://www.googleapis.com/auth/drive
     https://www.googleapis.com/auth/spreadsheets
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/gmail.modify
     https://www.googleapis.com/auth/userinfo.profile
     ```

4. Create OAuth client ID:
   - Application type: **Chrome Extension**
   - Item ID: Your extension ID (get from chrome://extensions/)

5. **Save these credentials:**
   ```json
   {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "client_secret": "YOUR_CLIENT_SECRET",
     "project_id": "your-project-id"
   }
   ```

### Step 4: Add to Manifest.json
```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.modify"
  ]
}
```

---

## 2. 🔄 n8n Webhook Setup

### Option A: Local n8n Setup
1. **Install n8n locally:**
   ```bash
   npm install -g n8n
   n8n start
   ```
   - Access at: http://localhost:5678
   - Default webhook URL: `http://localhost:5678/webhook/`

2. **Create a test webhook workflow:**
   - Open n8n dashboard
   - Create new workflow
   - Add "Webhook" node
   - Set HTTP Method: POST
   - Path: `chrome-extension`
   - **Webhook URL**: `http://localhost:5678/webhook/chrome-extension`

### Option B: n8n Cloud (Free tier)
1. Sign up at [n8n.cloud](https://n8n.cloud)
2. Create new workflow with webhook
3. **Your webhook URL**: `https://YOUR-INSTANCE.n8n.cloud/webhook/chrome-extension`

### Configure in Extension:
```javascript
// In background-fixed.js or settings
const N8N_CONFIG = {
  webhookUrl: 'http://localhost:5678/webhook/chrome-extension', // or your cloud URL
  apiKey: 'optional-api-key-if-secured',
  testEndpoint: '/webhook-test/chrome-extension'
};
```

---

## 3. 🤖 OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account and add billing (required)
3. Generate API key: Settings → API Keys → Create new secret key
4. **Save your key**: `sk-...` (starts with sk-)

### Configure in Extension:
```javascript
const OPENAI_CONFIG = {
  apiKey: 'sk-YOUR-API-KEY',
  model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo'
  maxTokens: 2000,
  temperature: 0.7
};
```

---

## 4. 🌐 WebSocket Server Setup

### Local WebSocket Server:
```bash
cd desktop-assistant
npm install
node websocket-server.js
```
- Default URL: `ws://localhost:8765`

### Production WebSocket (Optional):
Use a service like [Ably](https://ably.com) or [Pusher](https://pusher.com):
- Sign up for free tier
- Get connection credentials
- Update WebSocket URL in settings

---

## 5. 🎭 MCP/Playwright Setup

### Install Playwright MCP Server:
```bash
cd desktop-assistant
npm install @modelcontextprotocol/server-playwright
npm run mcp:start
```

### Configure in Extension:
```javascript
const MCP_CONFIG = {
  serverUrl: 'http://localhost:3000',
  capabilities: ['browser_control', 'screenshot', 'automation']
};
```

---

## 6. 🎤 Voice Recognition API

### Option A: Web Speech API (Free, built-in)
Already implemented! No setup needed.

### Option B: Google Cloud Speech-to-Text (Better accuracy)
1. Enable Speech-to-Text API in Google Cloud Console
2. Use existing OAuth2 credentials
3. Add to manifest permissions:
   ```json
   "permissions": ["microphone"]
   ```

---

## 7. 📦 Build & Packaging

### Install build tools:
```bash
npm install --save-dev webpack webpack-cli
npm install --save-dev @types/chrome
npm install --save-dev zip-webpack-plugin
```

### Create webpack.config.js:
```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
  entry: {
    background: './background-fixed.js',
    popup: './popup/popup-futuristic-fixed.js',
    content: './content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json' },
        { from: 'images', to: 'images' },
        { from: 'popup/*.html', to: 'popup/[name][ext]' },
        { from: 'popup/*.css', to: 'popup/[name][ext]' }
      ]
    }),
    new ZipPlugin({
      filename: 'chrome-extension.zip'
    })
  ]
};
```

### Build commands:
```bash
npm run build        # Creates dist/ folder
npm run package      # Creates chrome-extension.zip
```

---

## 8. 🔑 Environment Variables Setup

### Create .env file:
```env
# Google APIs
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_PROJECT_ID=your-project-id

# OpenAI
OPENAI_API_KEY=sk-YOUR-API-KEY

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chrome-extension
N8N_API_KEY=optional-api-key

# WebSocket
WS_SERVER_URL=ws://localhost:8765

# MCP/Playwright
MCP_SERVER_URL=http://localhost:3000

# SEO APIs (Optional)
SEMRUSH_API_KEY=your-semrush-key
MOZ_API_KEY=your-moz-key
AHREFS_API_KEY=your-ahrefs-key
```

---

## 9. 🧪 Testing Credentials

### Test Gmail Account:
- Email: `chromeext.test@gmail.com`
- App Password: (generate in Google Account settings)

### Test n8n Webhook:
```bash
curl -X POST http://localhost:5678/webhook/chrome-extension \
  -H "Content-Type: application/json" \
  -d '{"test": "Hello from Chrome Extension"}'
```

### Test OpenAI:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

---

## 10. 📱 Chrome Web Store Publishing

### Developer Account:
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Pay one-time $5 registration fee
3. Verify your account

### Prepare for submission:
- 📸 Screenshots: 1280x800 or 640x400 (at least 1, max 5)
- 🎨 Icons: 128x128 PNG
- 📝 Description: Max 132 characters
- 📄 Detailed description: Explain all features
- 🏷️ Categories: Productivity, Developer Tools

### Privacy Policy Required:
Create a simple privacy policy explaining:
- What data you collect
- How you use it
- How users can contact you

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Start n8n
n8n start

# 3. Start WebSocket server
cd desktop-assistant && node websocket-server.js

# 4. Start MCP server (optional)
npm run mcp:start

# 5. Load extension in Chrome
# Go to chrome://extensions/
# Enable Developer mode
# Click "Load unpacked"
# Select your extension directory

# 6. Configure API keys in extension settings
# Click extension icon → Settings → Add your keys
```

---

## 📊 Service Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| Google APIs | 1M requests/month | $0.10/1000 requests |
| OpenAI GPT-3.5 | None | ~$0.002/1K tokens |
| OpenAI GPT-4 | None | ~$0.03/1K tokens |
| n8n Cloud | 5 workflows | $20/month |
| WebSocket (Ably) | 100k messages/month | $29/month |
| Chrome Web Store | $5 one-time | - |

---

## 🆘 Support & Resources

- **Google APIs Documentation**: https://developers.google.com/apis-explorer
- **n8n Documentation**: https://docs.n8n.io/
- **OpenAI API Reference**: https://platform.openai.com/docs
- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **MCP Documentation**: https://modelcontextprotocol.io/

---

## ✅ Verification Checklist

- [ ] Google Cloud Project created
- [ ] OAuth2 credentials configured
- [ ] APIs enabled (Drive, Sheets, Calendar, Gmail)
- [ ] n8n webhook URL working
- [ ] OpenAI API key valid
- [ ] WebSocket server running
- [ ] Extension loads without errors
- [ ] Can authenticate with Google
- [ ] Can send messages to n8n
- [ ] SEO analysis works on any website

---

## 🎯 Next Steps

1. **Immediate**: Set up Google OAuth2 and n8n webhooks
2. **Today**: Test all API connections
3. **This Week**: Implement remaining integrations
4. **Next Week**: Package and submit to Chrome Web Store

---

**Questions?** The extension is already 85% complete. These credentials will unlock the remaining functionality!