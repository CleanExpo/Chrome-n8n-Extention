# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n AI Assistant Chrome Extension (Manifest V3) with integrated documentation systems and MCP (Model Context Protocol) support for Playwright automation. The extension provides an AI-powered chat interface that automatically fetches relevant documentation for n8n workflows, Chrome Extension development, and modern JavaScript libraries.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Package extension for distribution (excludes dev files)
npm run package

# Lint JavaScript files
npm run lint

# Format all code files
npm run format
```

### MCP/Playwright Commands
```bash
# Start Playwright MCP server (headless)
npm run mcp:start

# Start with visible browser
npm run mcp:headed

# Run in isolated mode
npm run mcp:isolated

# Debug mode with traces
npm run mcp:debug
```

### Loading the Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project directory

## Architecture Overview

### Core Components

**Background Service Worker (`background.js`)**
- Central message hub handling all communication between components
- Integrates three documentation systems: Context7 (library docs), n8n docs, and Chrome Extension docs
- Manages AI assistant messages with fallback from n8n workflow to direct OpenAI API
- Handles WebSocket connections, screenshot capture, and Chrome API operations

**Floating Widget System (`floating-widget-enhanced.js`)**
- Self-contained chat interface injected into web pages
- Implements sidebar dock mode that shifts page content
- Handles Chrome API fallbacks for non-extension environments
- Manages its own message passing and state

**Content Script (`content.js`)**
- Injects the floating widget script
- Bridges communication between page context and extension context
- Handles custom events for widget control

### Documentation Integration Pattern

The extension automatically enhances AI responses by detecting keywords and fetching relevant documentation:

1. **Chrome Extension queries** → `ChromeDocsIntegration` class fetches from `/chrome-extension-docs/*.md`
2. **n8n workflow queries** → `N8nDocsIntegration` class fetches from `/n8n-docs/*.md`
3. **Library/framework queries** → `Context7Integration` class fetches from Context7 API

All documentation is injected into the AI prompt context before sending to OpenAI/n8n.

### Message Flow Architecture

```
User Input → Floating Widget → Window.postMessage → Content Script
    ↓
Background.js (handleAssistantMessage)
    ↓
Documentation Fetching (parallel):
    - Context7 API (if library detected)
    - n8n Docs (if workflow keywords)
    - Chrome Docs (if extension keywords)
    ↓
n8n Webhook (primary) → Fallback → OpenAI API
    ↓
Response → Content Script → Floating Widget → User
```

### Storage Architecture

The extension uses a dual storage approach:
- **Primary**: `chrome.storage.sync` for cross-device sync
- **Fallback**: `localStorage` for non-extension contexts

All Chrome APIs have fallback implementations to support testing environments.

### Enhanced UI System

Two parallel UI systems exist:
1. **Original** (`popup.html`, `options.html`, `floating-widget.js`)
2. **Enhanced** (`popup-enhanced.html`, `options-enhanced.html`, `floating-widget-enhanced.js`)

The enhanced versions include modern CSS with variables, dark mode support, animations, and glassmorphism effects. Currently using enhanced versions in manifest.json.

## Key Implementation Details

### Chrome API Compatibility Layer

All components check for Chrome API availability before use:
```javascript
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    // Use Chrome API
} else {
    // Use fallback (localStorage, window.postMessage, etc.)
}
```

### AI Assistant Message Enhancement

The `handleAssistantMessage` function in background.js:
1. Detects keywords for Chrome/n8n/library documentation
2. Fetches relevant docs in parallel
3. Appends documentation to user message
4. Tries n8n webhook first, falls back to OpenAI API

### MCP Integration

Playwright MCP server (`/playwright-mcp/`) uses Server-Sent Events for communication. The `mcp-sse-client.js` handles the SSE protocol for browser automation tasks.

## Configuration Files

- **manifest.json**: Main Chrome Extension configuration (using enhanced UI files)
- **manifest-enhanced.json**: Backup with additional permissions
- **.env files**: API keys and server URLs (not committed)
- **AI_ASSISTANT_SETUP.md**: User setup guide for API configuration

## Documentation Files

- `/n8n-docs/`: n8n workflow documentation (4 files)
- `/chrome-extension-docs/`: Chrome Extension development docs (3 files)
- `CONTEXT7_SETUP.md`: Context7 integration guide
- `N8N_DOCS_INTEGRATION.md`: n8n documentation integration guide
- `CHROME_DOCS_INTEGRATION.md`: Chrome docs integration guide