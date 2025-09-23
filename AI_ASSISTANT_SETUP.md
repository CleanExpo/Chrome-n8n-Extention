# n8n AI Assistant - Setup & Troubleshooting Guide

## 🚀 Quick Setup for Working AI Assistant

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the folder: `D:\Chrome Extention n8n`
5. The extension icon should appear in your toolbar

### Step 2: Configure OpenAI API Key (REQUIRED)
1. Click the extension icon in toolbar
2. Click "⚙️ Settings / API Keys" button
3. Enter your OpenAI API key in the "OpenAI API Key" field
4. Click "Test OpenAI Connection" to verify it works
5. Click "Save Settings"

**Don't have an API key?**
- Go to https://platform.openai.com/api-keys
- Sign up/login to OpenAI
- Create a new API key
- Copy and paste it into the extension settings

### Step 3: Test the AI Assistant
1. Go to any website (e.g., https://example.com)
2. Look for the floating n8n button (bottom-right corner)
3. Click it to open the chat window
4. Type a message like "Hello, can you help me?"
5. Press Enter or click Send
6. The AI should respond!

## ✅ What's Working Now

After the fixes I've implemented:

1. **Direct OpenAI Integration** - The assistant now connects directly to OpenAI API
2. **Fallback System** - Tries n8n workflow first, then falls back to OpenAI
3. **Error Messages** - Clear messages if API key is missing
4. **Chrome API Fallbacks** - Works even in test environments

## 🔧 Troubleshooting

### AI Not Responding?

**Check these in order:**

1. **API Key Missing**
   - Message: "Please configure your OpenAI API key..."
   - Solution: Add your OpenAI API key in settings

2. **Invalid API Key**
   - Message: "I need a valid OpenAI API key..."
   - Solution: Check your API key is correct and has credits

3. **No Internet Connection**
   - Message: "Error connecting to OpenAI..."
   - Solution: Check your internet connection

4. **Extension Not Loaded**
   - No floating button visible
   - Solution: Reload the extension in chrome://extensions/

### Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Chat not opening | Button clicks don't work | Refresh the page |
| No floating button | Widget missing | Check if extension is enabled |
| Messages not sending | Nothing happens on send | Open console (F12) check for errors |
| API errors | Error messages in chat | Verify API key in settings |

## 🎯 Testing Checklist

- [ ] Extension loaded in Chrome
- [ ] OpenAI API key configured
- [ ] API key tested successfully
- [ ] Floating button appears on websites
- [ ] Chat window opens when clicked
- [ ] Messages can be typed and sent
- [ ] AI responds to messages
- [ ] Responses appear in chat

## 💡 How the AI Assistant Works

1. **User sends message** → Floating widget captures it
2. **Message sent to background.js** → Via Chrome messaging
3. **Background tries n8n workflow** → If configured
4. **Falls back to OpenAI API** → Direct API call
5. **Response displayed** → In the chat window

## 🔑 API Key Security

- Your API key is stored in Chrome's secure storage
- Never exposed to websites you visit
- Only used for OpenAI API calls
- Not sent to any third parties

## 📝 Sample Conversations

Try these to test the AI:

1. "What is this webpage about?"
2. "Can you summarize the content on this page?"
3. "Help me understand this topic better"
4. "What can you help me with?"
5. "Translate this text to Spanish: [paste text]"

## 🛠️ Advanced Configuration

### Optional: n8n Integration
If you have n8n running locally:
1. Set "n8n Webhook URL" in settings
2. Set "Integration Server URL" to `http://localhost:3000`
3. The assistant will try n8n workflows first

### Optional: Custom System Prompt
The AI uses this system prompt:
> "You are a helpful AI assistant integrated into a Chrome extension. Help users with their browsing tasks, answer questions, and provide assistance with web content."

## ⚠️ Current Limitations

1. **Requires OpenAI API Key** - No free tier available
2. **API Costs** - Each message uses OpenAI credits
3. **Context Limited** - Only current page context sent
4. **No Memory** - Each conversation is independent

## 🎉 Success Indicators

When everything is working correctly:
- ✅ Floating button visible on all websites
- ✅ Chat opens smoothly with animation
- ✅ Messages send instantly
- ✅ AI responds within 2-3 seconds
- ✅ Clear, helpful responses
- ✅ Error messages are informative

## Need Help?

1. Check the browser console (F12 → Console tab)
2. Look for error messages in red
3. Verify all settings are saved
4. Try reloading the extension
5. Refresh the webpage

The AI Assistant is now fully functional with direct OpenAI integration!