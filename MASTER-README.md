# n8n AI Assistant System - Complete Architecture

A comprehensive AI assistant system consisting of three integrated components: Chrome Extension, Desktop Assistant (Electron), and Integration Server.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chrome Extension                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Popup   │  │ Floating │  │ Content  │  │   Screen     │  │
│  │   Chat   │  │  Widget  │  │Extractor │  │   Capture    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ WebSocket (Port 8765)
┌───────────────────────┴─────────────────────────────────────────┐
│                      Desktop Assistant                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ System   │  │   AI     │  │  Voice   │  │    File      │  │
│  │  Tray    │  │ Process  │  │  Recog   │  │   System     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP/WebSocket (Port 3000/8766)
┌───────────────────────┴─────────────────────────────────────────┐
│                     Integration Server                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   n8n    │  │  Google  │  │ Webhooks │  │     API      │  │
│  │ Webhooks │  │   APIs   │  │ Handler  │  │   Gateway    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 Components Overview

### 1. Chrome Extension (`/`)
The browser interface that users interact with directly.

**Features:**
- 💬 **Chat Interface**: Modern popup with AI chat capabilities
- 🎯 **Floating Widget**: Persistent assistant on any webpage
- 📸 **Screen Capture**: Capture tabs and specific areas
- 📝 **Content Extraction**: Extract text, forms, YouTube transcripts, emails
- 🔄 **Form Auto-fill**: Smart form detection and filling
- 🔌 **WebSocket Client**: Real-time communication with desktop app
- 🔐 **Google Auth**: OAuth integration for Google services

### 2. Desktop Assistant (`/desktop-assistant`)
Electron app providing system-level capabilities.

**Features:**
- 🖥️ **System Tray**: Always accessible from system tray
- 🔊 **Voice Recognition**: Speech-to-text capabilities
- 🎤 **Voice Synthesis**: Text-to-speech with ElevenLabs
- 🤖 **AI Processing**: OpenAI/Claude API integration
- 📁 **File System**: Read/write local files
- 🔐 **Secure Storage**: Keytar for API keys
- 📷 **Desktop Capture**: Full desktop screenshots
- 🔌 **WebSocket Server**: Bridge for Chrome Extension

### 3. Integration Server (`/integration-server`)
Central hub for external service integrations.

**Features:**
- 🔗 **n8n Integration**: Webhook endpoints for workflows
- 🌐 **Google APIs**: Gmail, Drive, Calendar, etc.
- 📨 **Webhook Handler**: Process incoming webhooks
- 🔄 **API Gateway**: Proxy for external services
- 💾 **Data Storage**: MongoDB/Redis support
- 🔒 **Authentication**: JWT-based auth system
- 📡 **WebSocket**: Real-time updates

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Google Chrome 88+
- Windows/Mac/Linux OS
- n8n instance (optional)
- API Keys: OpenAI, ElevenLabs, Google Cloud (optional)

### Part 1: Chrome Extension Setup

1. **Prepare the extension:**
   ```bash
   cd "D:\Chrome Extention n8n"
   npm install  # Optional, for dev tools
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the main directory

3. **Test features:**
   - Click extension icon for popup chat
   - Visit any website to see floating widget
   - Test screen capture and content extraction

### Part 2: Desktop Assistant Setup

1. **Install dependencies:**
   ```bash
   cd desktop-assistant
   npm install
   ```

2. **Configure API keys:**
   Create `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   GOOGLE_CLOUD_KEY=your_google_key
   ```

3. **Run the app:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Build for distribution:**
   ```bash
   npm run build
   # Creates installers in /dist
   ```

### Part 3: Integration Server Setup

1. **Install dependencies:**
   ```bash
   cd integration-server
   npm install
   ```

2. **Configure environment:**
   Create `.env` file:
   ```env
   PORT=3000
   WS_PORT=8766
   N8N_WEBHOOK_URL=http://localhost:5678
   MONGODB_URI=mongodb://localhost:27017/n8n-assistant
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   ```

3. **Run the server:**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## 🔧 Configuration

### Chrome Extension Settings
Access via popup settings or `chrome://extensions` → Details → Extension options

- **Auto-detect forms**: Enable automatic form detection
- **Voice commands**: Enable/disable voice input
- **Save history**: Persist chat history
- **Desktop port**: WebSocket port (default: 8765)

### Desktop Assistant Configuration
Access via system tray → Settings

- **WebSocket Port**: Default 8765
- **Minimize to tray**: Keep running in background
- **Launch at startup**: Auto-start with system
- **API Keys**: Securely stored credentials

### Integration Server Configuration
Edit `.env` file or use environment variables

- **Ports**: HTTP and WebSocket ports
- **n8n URL**: Your n8n instance webhook URL
- **Database**: MongoDB/Redis connections
- **API Keys**: Service credentials

## 📡 Communication Flow

### User Query Flow
1. User types/speaks in Chrome Extension
2. Message sent via WebSocket to Desktop Assistant
3. Desktop app processes with AI (OpenAI/Claude)
4. Response sent back to Chrome Extension
5. Optional: Trigger n8n workflow via Integration Server

### Content Extraction Flow
1. User clicks extract on webpage
2. Content script extracts data
3. Data sent to Desktop Assistant for processing
4. Processed data can be saved locally or sent to n8n

### Voice Command Flow
1. User clicks voice button
2. Desktop app starts recording
3. Audio sent to Google Speech-to-Text
4. Transcription sent to AI for processing
5. Response converted to speech via ElevenLabs
6. Audio played through desktop app

## 🔌 API Integrations

### Required APIs
- **OpenAI**: GPT-4 for AI responses
- **Google Cloud**: Speech-to-Text, Translate, Vision
- **ElevenLabs**: Text-to-Speech synthesis

### Optional APIs
- **n8n Webhooks**: Workflow automation
- **Google Workspace**: Gmail, Drive, Calendar
- **MongoDB Atlas**: Cloud database
- **Redis Cloud**: Caching and sessions

## 🛠️ Development

### Chrome Extension Development
```bash
# Watch for changes (if build tools added)
npm run watch

# Reload extension in Chrome after changes
# Go to chrome://extensions and click refresh
```

### Desktop Assistant Development
```bash
cd desktop-assistant
npm run dev  # Runs with auto-reload
```

### Integration Server Development
```bash
cd integration-server
npm run dev  # Uses nodemon for auto-reload
```

## 📝 Usage Examples

### Extract YouTube Transcript
1. Navigate to YouTube video
2. Click floating widget or use popup
3. Select "Extract Page Content"
4. Transcript automatically extracted and processed

### Auto-fill Forms
1. Navigate to a form page
2. Click "Auto-fill Forms" in quick actions
3. Review and confirm auto-filled data
4. Submit form

### Voice Assistant
1. Ensure Desktop Assistant is running
2. Click microphone button in popup
3. Speak your command
4. Receive voice response

### Trigger n8n Workflow
1. Set up webhook in n8n
2. Configure webhook URL in Integration Server
3. Use chat command: "Run workflow: [name]"
4. Workflow triggered with context data

## 🔒 Security Considerations

- **API Keys**: Stored securely using keytar (Desktop) or Chrome storage (Extension)
- **WebSocket**: Local connections only by default
- **CORS**: Configured for specific origins
- **Content Security Policy**: Strict CSP in extension
- **Data Privacy**: All processing can be done locally
- **Encryption**: Sensitive data encrypted in transit

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure all icon files exist in `/images`
- Check manifest.json for syntax errors
- Verify Chrome version compatibility

### Desktop App Not Connecting
- Check if port 8765 is available
- Verify Windows Firewall/antivirus settings
- Run as administrator if needed

### Voice Recognition Not Working
- Check microphone permissions
- Verify Google Cloud credentials
- Ensure Desktop Assistant is running

### Integration Server Issues
- Verify all ports are available
- Check MongoDB/Redis connections
- Review server logs for errors

## 📊 Performance Tips

- **Limit content extraction** to necessary data
- **Use caching** in Integration Server
- **Batch API requests** when possible
- **Optimize WebSocket** message size
- **Clean chat history** periodically

## 🚦 Status Indicators

### Chrome Extension
- 🟢 Green dot: Desktop app connected
- 🔴 Red dot: Desktop app disconnected
- 📷 Blue flash: Screenshot captured
- 🎤 Red pulse: Recording active

### Desktop Assistant
- System tray icon changes based on status
- ✓ Server running on port XXXX
- ✗ Server not running

## 📚 Additional Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Google Cloud APIs](https://cloud.google.com/apis)

## 📄 License

MIT License - See individual component licenses for dependencies.

## 🤝 Contributing

Contributions welcome! Please follow:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 💡 Future Enhancements

- [ ] Multi-language support
- [ ] Cloud sync for settings
- [ ] Mobile app companion
- [ ] Advanced workflow templates
- [ ] Plugin system for extensions
- [ ] Batch processing mode
- [ ] Offline AI model support
- [ ] Enhanced security features

---

**Built with ❤️ for the n8n community**