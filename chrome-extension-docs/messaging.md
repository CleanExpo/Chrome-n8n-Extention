# Chrome Extension Messaging Documentation

## Overview

Chrome Extensions use message passing to communicate between different components:
- Content scripts ↔ Background service worker
- Popup ↔ Background service worker
- Extension ↔ External websites
- Extension ↔ Other extensions

## Simple One-Time Requests

### Sending Messages

#### From Content Script to Background
```javascript
// content.js
chrome.runtime.sendMessage(
  { greeting: 'hello from content script' },
  (response) => {
    console.log('Response:', response);
  }
);

// With async/await (Chrome 99+)
async function sendMessageAsync() {
  const response = await chrome.runtime.sendMessage({
    action: 'getData',
    params: { id: 123 }
  });
  console.log('Response:', response);
}
```

#### From Background to Content Script
```javascript
// background.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { greeting: 'hello from background' },
    (response) => {
      console.log('Response:', response);
    }
  );
});
```

#### From Popup to Background
```javascript
// popup.js
chrome.runtime.sendMessage(
  { action: 'updateBadge', text: '5' },
  (response) => {
    console.log('Badge updated');
  }
);
```

### Receiving Messages

#### In Background Service Worker
```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message from:', sender.tab ?
    `content script (${sender.tab.url})` :
    'extension');

  if (request.greeting === 'hello') {
    sendResponse({ farewell: 'goodbye' });
  }

  // Return true for async response
  if (request.action === 'fetchData') {
    fetch('https://api.example.com/data')
      .then(response => response.json())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));

    return true; // Will respond asynchronously
  }
});
```

#### In Content Script
```javascript
// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  if (request.action === 'getPageInfo') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      content: document.body.innerText
    });
  }

  if (request.action === 'highlight') {
    document.body.style.backgroundColor = 'yellow';
    sendResponse({ success: true });
  }

  // Must return true for async response
  return true;
});
```

## Long-Lived Connections (Ports)

### Establishing Connection

#### From Content Script
```javascript
// content.js
const port = chrome.runtime.connect({ name: 'content-script' });

// Send message through port
port.postMessage({ action: 'init' });

// Listen for messages
port.onMessage.addListener((msg) => {
  console.log('Message received:', msg);
});

// Handle disconnect
port.onDisconnect.addListener(() => {
  console.log('Port disconnected');
});
```

#### From Background
```javascript
// background.js
// Connect to specific tab
chrome.tabs.connect(tabId, { name: 'background-connection' });

// Listen for connections
chrome.runtime.onConnect.addListener((port) => {
  console.log('Connection established:', port.name);

  port.onMessage.addListener((msg) => {
    console.log('Message on port:', msg);

    // Send response
    port.postMessage({ response: 'acknowledged' });
  });

  port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
  });
});
```

### Port Communication Pattern
```javascript
// background.js - Port manager
class PortManager {
  constructor() {
    this.ports = new Map();
    this.setupListeners();
  }

  setupListeners() {
    chrome.runtime.onConnect.addListener((port) => {
      const tabId = port.sender?.tab?.id || 'popup';
      this.ports.set(tabId, port);

      port.onMessage.addListener((msg) => {
        this.handleMessage(msg, port);
      });

      port.onDisconnect.addListener(() => {
        this.ports.delete(tabId);
      });
    });
  }

  handleMessage(msg, port) {
    switch (msg.action) {
      case 'subscribe':
        this.addSubscriber(port, msg.events);
        break;
      case 'unsubscribe':
        this.removeSubscriber(port, msg.events);
        break;
      default:
        // Handle other messages
        break;
    }
  }

  broadcast(event, data) {
    this.ports.forEach(port => {
      port.postMessage({ event, data });
    });
  }
}
```

## Cross-Extension Messaging

### Sending to Another Extension
```javascript
// Send message to specific extension
const extensionId = 'abcdefghijklmnopqrstuvwxyz';

chrome.runtime.sendMessage(
  extensionId,
  { greeting: 'hello from another extension' },
  (response) => {
    console.log('Response from other extension:', response);
  }
);
```

### Receiving from Another Extension
```javascript
// background.js
// Configure in manifest.json first:
// "externally_connectable": {
//   "ids": ["extensionId1", "extensionId2"]
// }

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log('Message from extension:', sender.id);

    // Verify sender
    const allowedExtensions = ['extension1id', 'extension2id'];
    if (!allowedExtensions.includes(sender.id)) {
      sendResponse({ error: 'Unauthorized' });
      return;
    }

    // Process message
    sendResponse({ received: true });
  }
);
```

## Web Page Messaging

### From Web Page to Extension
```javascript
// Web page script
// Extension must declare the site in externally_connectable

chrome.runtime.sendMessage(
  'your-extension-id',
  { action: 'authenticate', token: 'xyz' },
  (response) => {
    console.log('Extension response:', response);
  }
);
```

### From Extension to Web Page
```javascript
// content.js - Inject and communicate
// Method 1: Window.postMessage
window.postMessage({ type: 'FROM_EXTENSION', data: 'hello' }, '*');

// Listen for responses
window.addEventListener('message', (event) => {
  if (event.data.type === 'FROM_PAGE') {
    console.log('Page says:', event.data);
  }
});

// Method 2: Custom Events
document.dispatchEvent(new CustomEvent('extensionMessage', {
  detail: { message: 'Hello from extension' }
}));
```

## Advanced Messaging Patterns

### Request-Response with Promises
```javascript
// Promisified messaging
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Usage
async function getData() {
  try {
    const response = await sendMessage({ action: 'getData' });
    console.log('Data:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Message Router Pattern
```javascript
// background.js - Message router
class MessageRouter {
  constructor() {
    this.handlers = new Map();
    this.setupListener();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  setupListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const handler = this.handlers.get(request.action);

      if (!handler) {
        sendResponse({ error: 'Unknown action' });
        return;
      }

      // Handle async handlers
      const result = handler(request.data, sender);

      if (result instanceof Promise) {
        result
          .then(data => sendResponse({ success: true, data }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Async response
      } else {
        sendResponse({ success: true, data: result });
      }
    });
  }
}

// Usage
const router = new MessageRouter();

router.register('getData', async (data, sender) => {
  const result = await fetchData(data.id);
  return result;
});

router.register('saveData', (data, sender) => {
  return saveToStorage(data);
});
```

### Broadcast Pattern
```javascript
// background.js - Broadcast to all tabs
async function broadcastToAllTabs(message) {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      console.log(`Failed to send to tab ${tab.id}:`, error);
    }
  }
}

// Broadcast to specific tabs
async function broadcastToTabs(message, filter) {
  const tabs = await chrome.tabs.query(filter);

  const promises = tabs.map(tab =>
    chrome.tabs.sendMessage(tab.id, message)
      .catch(error => console.log(`Tab ${tab.id} failed:`, error))
  );

  await Promise.all(promises);
}
```

### Message Queue Pattern
```javascript
// For handling messages when service worker is not ready
class MessageQueue {
  constructor() {
    this.queue = [];
    this.ready = false;
  }

  enqueue(message) {
    if (this.ready) {
      this.send(message);
    } else {
      this.queue.push(message);
    }
  }

  setReady() {
    this.ready = true;
    this.flush();
  }

  flush() {
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      this.send(message);
    }
  }

  send(message) {
    chrome.runtime.sendMessage(message);
  }
}
```

## Error Handling

### Handling Connection Errors
```javascript
// Always check for errors
chrome.runtime.sendMessage({ action: 'test' }, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Message failed:', chrome.runtime.lastError.message);
    // Handle error - maybe extension was reloaded
    return;
  }

  console.log('Response:', response);
});

// Port error handling
const port = chrome.runtime.connect();

port.onDisconnect.addListener(() => {
  if (chrome.runtime.lastError) {
    console.error('Port disconnected:', chrome.runtime.lastError.message);
  }
  // Attempt reconnection
  setTimeout(() => {
    reconnect();
  }, 1000);
});
```

### Timeout Pattern
```javascript
function sendMessageWithTimeout(message, timeout = 5000) {
  return Promise.race([
    sendMessage(message),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Message timeout')), timeout)
    )
  ]);
}
```

## Best Practices

### 1. Message Structure
```javascript
// Use consistent message structure
const message = {
  action: 'actionName',     // Required action identifier
  data: {},                  // Optional payload
  timestamp: Date.now(),     // Optional timestamp
  id: generateId(),          // Optional unique ID for tracking
};
```

### 2. Sender Verification
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verify sender origin
  if (sender.origin !== 'https://trusted-site.com') {
    sendResponse({ error: 'Unauthorized origin' });
    return;
  }

  // Verify it's from content script
  if (!sender.tab) {
    sendResponse({ error: 'Must be from tab' });
    return;
  }

  // Process message
});
```

### 3. Type Safety
```javascript
// Define message types
const MessageTypes = {
  GET_DATA: 'GET_DATA',
  SET_DATA: 'SET_DATA',
  UPDATE_UI: 'UPDATE_UI',
};

// Type check messages
function isValidMessage(message) {
  return message &&
         typeof message === 'object' &&
         Object.values(MessageTypes).includes(message.action);
}
```

### 4. Cleanup
```javascript
// Clean up listeners when not needed
const listener = (request, sender, sendResponse) => {
  // Handle message
};

// Add listener
chrome.runtime.onMessage.addListener(listener);

// Remove listener when done
chrome.runtime.onMessage.removeListener(listener);
```

## Common Issues and Solutions

### Issue: "Could not establish connection"
```javascript
// Solution: Check if extension context is valid
if (chrome.runtime?.id) {
  chrome.runtime.sendMessage({ action: 'test' });
} else {
  console.log('Extension context invalidated');
  // Reload or notify user
}
```

### Issue: Message not received
```javascript
// Solution: Ensure content script is injected
chrome.tabs.query({ active: true }, async (tabs) => {
  try {
    // Try sending message
    await chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' });
  } catch (error) {
    // Inject content script if needed
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js']
    });
  }
});
```

### Issue: Async response not working
```javascript
// Solution: Always return true for async responses
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  someAsyncOperation().then(result => {
    sendResponse(result);
  });

  return true; // MUST return true for async response
});
```

This comprehensive guide covers Chrome Extension messaging patterns and best practices.