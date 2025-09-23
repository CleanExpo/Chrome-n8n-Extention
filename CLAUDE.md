# CLAUDE.md - PRODUCTION STANDARDS

This file provides **MANDATORY** guidance to Claude Code when working with this repository. These are not suggestions - they are requirements for maintaining production-quality code.

## CRITICAL: Work Standards

### You are a world-class software engineer. This means:
1. **NEVER do partial fixes** - Fix ALL related issues comprehensively
2. **ALWAYS handle errors properly** - No unhandled promises, no ignored exceptions
3. **TEST everything** - Create test files, verify functionality
4. **THINK before coding** - Analyze the entire problem space first
5. **DOCUMENT critical decisions** - Explain why, not just what

### Error Handling Requirements
- **EVERY async function** must have try-catch blocks
- **EVERY API call** must have timeout and fallback logic
- **EVERY user-facing error** must have helpful messages
- **NEVER let errors crash the extension**

## Project Overview

This is a production-ready n8n AI Assistant Chrome Extension (Manifest V3) with:
- Integrated documentation systems (Chrome, n8n, Opal AI, Context7)
- Robust error handling and fallback chains
- Comprehensive API management
- Fixed popup rendering (420x650px)
- Enhanced floating widget with resize functionality
- MCP (Model Context Protocol) support for Playwright automation

## FIXED Issues (DO NOT REGRESS)

### 1. Popup Thin Strip Issue - PERMANENTLY FIXED
- **Problem**: Popup appeared as thin vertical strip
- **Solution**: Multiple enforcement layers in popup-fixed.html/css/js
- **Key Files**:
  - `popup/popup-fixed.html` - Inline styles force 420x650px
  - `popup/popup-fixed.js` - Runtime dimension enforcement
  - `manifest.json` - Points to fixed popup
- **NEVER** remove dimension enforcement code

### 2. API Connection Errors - PERMANENTLY FIXED
- **Problem**: Multiple 404/connection refused errors
- **Solution**: Proper API checking and graceful fallbacks
- **Key Files**:
  - `background-fixed.js` - Complete error handling
  - `context7-integration.js` - Availability checking
- **ALWAYS** check if service is configured before attempting connection
- **NEVER** let API errors crash the extension

### 3. Error Handling - COMPREHENSIVE
- **Every API call** has timeout (fetchWithTimeout)
- **Every async function** has try-catch
- **Every user action** has feedback
- **Fallback chain**: n8n → OpenAI → Error message

## Critical Files (DO NOT BREAK)

### Core Fixed Files
- `background-fixed.js` - Production-ready background script with complete error handling
- `popup/popup-fixed.html` - Properly sized popup (420x650px)
- `popup/popup-fixed.js` - Popup logic with API status checking
- `manifest.json` - MUST point to fixed versions

### API Integration Files
- `context7-integration.js` - Has availability checking
- `chrome-docs-integration.js` - Documentation provider
- `n8n-docs-integration.js` - n8n documentation
- `opal-docs-integration.js` - Opal AI documentation

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

**Background Service Worker (`background-fixed.js`)**
- Central message hub with complete error handling
- Proper API fallback chain (n8n → OpenAI → Error)
- Timeout handling for all API calls
- State management with ExtensionState object

**Floating Widget System (`floating-widget-enhanced.js`)**
- Self-contained chat interface with resize functionality
- Keyboard shortcuts (Ctrl+Arrow keys for resize)
- Visual resize handle with live dimension display
- Chrome API fallbacks for non-extension environments

**Content Script (`content.js`)**
- Cache-busting for script loading
- Error recovery mechanisms
- Proper message passing with error handling

### Documentation Integration Pattern

The extension automatically enhances AI responses by detecting keywords and fetching relevant documentation:

1. **Chrome Extension queries** → `ChromeDocsIntegration` class
2. **n8n workflow queries** → `N8nDocsIntegration` class
3. **Library/framework queries** → `Context7Integration` class
4. **Opal AI queries** → `OpalDocsIntegration` class

All documentation is injected into the AI prompt context before sending to OpenAI/n8n.

### Message Flow Architecture

```
User Input → Floating Widget → Window.postMessage → Content Script
    ↓
Background.js (handleAssistantMessage)
    ↓
Check API Configuration
    ↓
Build Enhanced Message (with docs)
    ↓
Try n8n (if configured) → Try OpenAI (if configured) → Fallback Message
    ↓
Response → Content Script → Floating Widget → User
```

### Storage Architecture

The extension uses a dual storage approach:
- **Primary**: `chrome.storage.sync` for cross-device sync
- **Fallback**: `localStorage` for non-extension contexts

### Enhanced UI System

Using fixed versions for stability:
- **Popup**: `popup-fixed.html`, `popup-fixed.css`, `popup-fixed.js`
- **Floating Widget**: `floating-widget-enhanced.js` with resize
- **Options**: `options-enhanced.html` with API testing

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

The `handleAssistantMessage` function in background-fixed.js:
1. Checks API configuration status
2. Builds enhanced message with documentation
3. Tries APIs in order with proper timeouts
4. Returns helpful error messages if all fail

### Error Handling Pattern

```javascript
async function apiCall() {
    try {
        const response = await fetchWithTimeout(url, options, timeout);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('API error (non-critical):', error.message);
        return null; // Graceful fallback
    }
}
```

## Configuration Files

- **manifest.json**: Points to fixed versions of scripts
- **.env files**: API keys and server URLs (not committed)
- **API_SETUP_GUIDE.md**: Comprehensive API configuration guide
- **POPUP-FIX-GUIDE.md**: Popup sizing fix documentation
- **TROUBLESHOOTING.md**: General troubleshooting guide

## Documentation Files

- `/n8n-docs/`: n8n workflow documentation
- `/chrome-extension-docs/`: Chrome Extension development docs
- `/opal-ai-docs/`: Opal AI documentation (Google Labs no-code AI)
- `test-extension-complete.html`: Comprehensive test suite

## MANDATORY Production Standards

### Code Quality Requirements
1. **COMPREHENSIVE FIXES ONLY** - Never do partial fixes
2. **ERROR HANDLING EVERYWHERE** - No exceptions
3. **TEST BEFORE DECLARING COMPLETE** - Always verify
4. **BACKWARD COMPATIBILITY** - Don't break existing functionality
5. **PERFORMANCE AWARE** - Consider load times and memory

### When Fixing Issues
1. **ANALYZE COMPLETELY** - Understand all related code
2. **FIX ROOT CAUSE** - Not just symptoms
3. **TEST THOROUGHLY** - Create test files
4. **DOCUMENT CHANGES** - Explain what and why
5. **UPDATE THIS FILE** - Add new fixes to FIXED Issues section

### API Handling Rules
1. **CHECK CONFIGURATION FIRST** - Don't attempt if not configured
2. **USE TIMEOUTS** - Maximum 30s for OpenAI, 10s for others
3. **PROVIDE FALLBACKS** - Always have plan B
4. **LOG APPROPRIATELY** - Errors as warnings, not crashes
5. **USER-FRIENDLY MESSAGES** - Explain what to do

### File Creation Rules
- **CREATE test files** - Testing is mandatory
- **CREATE fixed versions** - When original is broken
- **UPDATE existing files** - When possible
- **DOCUMENT in CLAUDE.md** - Critical changes only

## Testing Requirements

### Before Declaring Any Fix Complete
1. **Create test file** - `test-[feature].html`
2. **Verify in browser** - Actually load and test
3. **Check console** - No errors allowed
4. **Test error cases** - What happens when things fail?
5. **Document results** - What was tested and results

### Test Coverage Must Include
- **Happy path** - Normal operation
- **Error cases** - Invalid input, API failures
- **Edge cases** - Timeouts, rate limits
- **Recovery** - Can user recover from errors?

---

**REMEMBER**: You are a world-class engineer. Act like one. Every line of code matters. Every error must be handled. Every fix must be complete.