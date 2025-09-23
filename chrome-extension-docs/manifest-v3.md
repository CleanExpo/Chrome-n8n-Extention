# Chrome Extension Manifest V3 Documentation

## Manifest File Structure

The manifest.json file is the blueprint of your Chrome Extension. Manifest V3 is the latest version with enhanced security and performance.

### Basic Manifest Structure

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Extension description",

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },

  "background": {
    "service_worker": "background.js"
  },

  "permissions": [],
  "host_permissions": []
}
```

## Required Fields

### manifest_version
```json
"manifest_version": 3
```
Must be exactly `3` for Manifest V3.

### name
```json
"name": "My Extension"
```
- Maximum 45 characters
- Displayed in Chrome Web Store and extension management

### version
```json
"version": "1.0.0"
```
- One to four dot-separated integers
- Examples: "1", "1.0", "2.10.2", "3.1.2.4567"

## Recommended Fields

### description
```json
"description": "A brief description of the extension"
```
- Maximum 132 characters
- Shown in extension management page

### icons
```json
"icons": {
  "16": "icon16.png",
  "32": "icon32.png",
  "48": "icon48.png",
  "128": "icon128.png"
}
```
- 16x16: Favicon for extension pages
- 32x32: Windows computers often require this size
- 48x48: Extension management page
- 128x128: Chrome Web Store

## Optional Fields

### action (formerly browser_action/page_action)
```json
"action": {
  "default_popup": "popup.html",
  "default_title": "Click me!",
  "default_icon": {
    "16": "images/icon16.png",
    "24": "images/icon24.png",
    "32": "images/icon32.png"
  }
}
```

### background
```json
"background": {
  "service_worker": "background.js",
  "type": "module"  // Optional: for ES6 modules
}
```

### content_scripts
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_idle",
    "all_frames": false,
    "match_about_blank": false,
    "match_origin_as_fallback": false
  }
]
```

#### Match Patterns
```json
// Examples of match patterns
"matches": [
  "http://*/*",           // All HTTP sites
  "https://*.google.com/*", // All Google subdomains
  "*://mail.google.com/*", // Gmail on any protocol
  "<all_urls>"            // All URLs (requires broad host permission)
]
```

### permissions
```json
"permissions": [
  "storage",
  "tabs",
  "activeTab",
  "notifications",
  "contextMenus",
  "scripting",
  "alarms",
  "identity",
  "cookies",
  "webRequest",
  "declarativeNetRequest"
]
```

### host_permissions
```json
"host_permissions": [
  "https://*/",
  "http://localhost/*",
  "*://*.example.com/*"
]
```

### options_page / options_ui
```json
"options_page": "options.html",
// OR
"options_ui": {
  "page": "options.html",
  "open_in_tab": true
}
```

### web_accessible_resources
```json
"web_accessible_resources": [
  {
    "resources": ["images/*", "style.css", "script.js"],
    "matches": ["https://example.com/*"],
    "use_dynamic_url": true
  }
]
```

### declarative_net_request
```json
"declarative_net_request": {
  "rule_resources": [
    {
      "id": "ruleset_1",
      "enabled": true,
      "path": "rules.json"
    }
  ]
}
```

### externally_connectable
```json
"externally_connectable": {
  "matches": ["https://*.example.com/*"],
  "ids": ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
}
```

### commands
```json
"commands": {
  "_execute_action": {
    "suggested_key": {
      "default": "Ctrl+Shift+F",
      "mac": "MacCtrl+Shift+F"
    },
    "description": "Opens popup.html"
  },
  "toggle-feature": {
    "suggested_key": {
      "default": "Ctrl+Shift+Y",
      "mac": "Command+Shift+Y"
    },
    "description": "Toggle feature",
    "global": true
  }
}
```

### content_security_policy
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'",
  "sandbox": "sandbox allow-scripts allow-forms allow-popups allow-modals"
}
```

### minimum_chrome_version
```json
"minimum_chrome_version": "102"
```

### storage
```json
"storage": {
  "managed_schema": "schema.json"
}
```

## Manifest V3 Changes from V2

### Service Workers Instead of Background Pages
```json
// V2 (deprecated)
"background": {
  "scripts": ["background.js"],
  "persistent": false
}

// V3 (current)
"background": {
  "service_worker": "background.js"
}
```

### Action API Unified
```json
// V2 (deprecated)
"browser_action": { ... }
"page_action": { ... }

// V3 (current)
"action": { ... }
```

### Host Permissions Separated
```json
// V2 (deprecated)
"permissions": [
  "tabs",
  "https://example.com/*"
]

// V3 (current)
"permissions": ["tabs"],
"host_permissions": ["https://example.com/*"]
```

### Content Security Policy
```json
// V2
"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'"

// V3 (no unsafe-eval allowed)
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Web Accessible Resources
```json
// V2
"web_accessible_resources": [
  "images/my-image.png"
]

// V3
"web_accessible_resources": [
  {
    "resources": ["images/my-image.png"],
    "matches": ["https://example.com/*"]
  }
]
```

## Complete Example

```json
{
  "manifest_version": 3,
  "name": "Complete Extension Example",
  "version": "1.0.0",
  "description": "A complete Chrome Extension example",

  "minimum_chrome_version": "102",

  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "notifications",
    "contextMenus",
    "scripting",
    "alarms"
  ],

  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_title": "Click to open popup",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "web_accessible_resources": [
    {
      "resources": ["inject.js", "styles/*.css"],
      "matches": ["<all_urls>"]
    }
  ],

  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "MacCtrl+Shift+F"
      }
    },
    "run-command": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      },
      "description": "Run custom command"
    }
  },

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

## Best Practices

1. **Use minimal permissions**: Only request permissions you actually need
2. **Specify narrow host permissions**: Avoid `<all_urls>` unless necessary
3. **Use activeTab**: Instead of broad tabs permission when possible
4. **Declare optional permissions**: For features not always needed
5. **Version properly**: Use semantic versioning
6. **Keep descriptions concise**: Stay within character limits
7. **Optimize icons**: Use PNG format, proper sizes
8. **Test thoroughly**: Validate manifest before publishing

## Common Issues and Solutions

### Issue: Extension not loading
- Check JSON syntax (no trailing commas)
- Ensure manifest_version is 3
- Verify file paths are correct

### Issue: Permissions not working
- Host permissions must be in `host_permissions` not `permissions`
- Some APIs require both permission and host permission

### Issue: Background script not running
- Must use service worker, not background page
- Check for console errors in service worker

### Issue: Content script not injecting
- Verify match patterns are correct
- Check run_at timing
- Ensure content script file exists

This documentation provides the foundation for understanding Chrome Extension Manifest V3.