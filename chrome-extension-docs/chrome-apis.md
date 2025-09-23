# Chrome Extension APIs Reference

## Core APIs

### chrome.storage
Persist data across browser sessions.

```javascript
// Storage API types
chrome.storage.sync    // Synced across devices (100KB total)
chrome.storage.local   // Local only (10MB total)
chrome.storage.session // Cleared when browser closes
chrome.storage.managed // Read-only, set by admin

// Set data
chrome.storage.sync.set({ key: 'value' }, () => {
  console.log('Value saved');
});

// Get data
chrome.storage.sync.get(['key'], (result) => {
  console.log('Value:', result.key);
});

// Get multiple keys
chrome.storage.sync.get(['key1', 'key2'], (result) => {
  console.log(result.key1, result.key2);
});

// Get all data
chrome.storage.sync.get(null, (items) => {
  console.log('All items:', items);
});

// Remove data
chrome.storage.sync.remove('key');
chrome.storage.sync.remove(['key1', 'key2']);

// Clear all data
chrome.storage.sync.clear();

// Listen for changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${key}: ${oldValue} → ${newValue}`);
  }
});

// Get bytes in use
chrome.storage.sync.getBytesInUse(['key'], (bytes) => {
  console.log('Bytes used:', bytes);
});
```

### chrome.tabs
Interact with browser tabs.

```javascript
// Query tabs
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  let activeTab = tabs[0];
  console.log('Active tab:', activeTab.url);
});

// Create new tab
chrome.tabs.create({
  url: 'https://example.com',
  active: true,
  index: 0,  // Position
  pinned: false,
  windowId: chrome.windows.WINDOW_ID_CURRENT
});

// Update tab
chrome.tabs.update(tabId, {
  url: 'https://example.com',
  active: true,
  muted: false,
  pinned: true
});

// Remove tabs
chrome.tabs.remove(tabId);
chrome.tabs.remove([tabId1, tabId2]);

// Reload tab
chrome.tabs.reload(tabId, { bypassCache: true });

// Execute script in tab
chrome.tabs.executeScript(tabId, {
  code: 'document.body.style.backgroundColor="red"',
  file: 'script.js',
  allFrames: false,
  runAt: 'document_idle'
});

// Send message to tab
chrome.tabs.sendMessage(tabId, { action: 'doSomething' }, (response) => {
  console.log('Response:', response);
});

// Capture visible tab
chrome.tabs.captureVisibleTab(windowId, { format: 'png', quality: 100 }, (dataUrl) => {
  console.log('Screenshot:', dataUrl);
});

// Listen for tab events
chrome.tabs.onCreated.addListener((tab) => {});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {});
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {});
```

### chrome.runtime
Extension runtime and messaging.

```javascript
// Get extension details
chrome.runtime.getManifest();  // Returns manifest object
chrome.runtime.id;              // Extension ID
chrome.runtime.getURL('path/to/resource');  // Get resource URL

// Messaging
chrome.runtime.sendMessage({ greeting: 'hello' }, (response) => {
  console.log('Response:', response);
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message from:', sender.tab ? 'content script' : 'extension');

  if (request.greeting === 'hello') {
    sendResponse({ farewell: 'goodbye' });
  }

  return true;  // Will respond asynchronously
});

// Connect for long-lived connection
const port = chrome.runtime.connect({ name: 'knockknock' });
port.postMessage({ joke: 'Knock knock' });
port.onMessage.addListener((msg) => {
  console.log('Received:', msg);
});

// Native messaging
chrome.runtime.sendNativeMessage('com.example.app', { text: 'Hello' }, (response) => {
  console.log('Native app response:', response);
});

// Installation/update events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated from', details.previousVersion);
  }
});

// Suspend event (service worker)
chrome.runtime.onSuspend.addListener(() => {
  console.log('Service worker suspending');
});

// Open options page
chrome.runtime.openOptionsPage();

// Reload extension
chrome.runtime.reload();

// Get platform info
chrome.runtime.getPlatformInfo((info) => {
  console.log('OS:', info.os, 'Arch:', info.arch);
});
```

### chrome.action (formerly browserAction)
Extension toolbar button.

```javascript
// Set badge text
chrome.action.setBadgeText({ text: '5' });
chrome.action.setBadgeText({ text: '5', tabId: tabId });  // Tab-specific

// Set badge color
chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

// Set title (tooltip)
chrome.action.setTitle({ title: 'New tooltip' });

// Set icon
chrome.action.setIcon({
  path: {
    '16': 'icon16.png',
    '32': 'icon32.png'
  }
});

// Programmatic icon
chrome.action.setIcon({
  imageData: {
    '16': imageData16,
    '32': imageData32
  }
});

// Enable/disable
chrome.action.enable(tabId);
chrome.action.disable(tabId);

// Set popup
chrome.action.setPopup({ popup: 'popup.html' });

// Get badge text
chrome.action.getBadgeText({}, (result) => {
  console.log('Badge text:', result);
});

// Listen for clicks
chrome.action.onClicked.addListener((tab) => {
  console.log('Action clicked on tab:', tab.id);
});
```

### chrome.scripting
Execute scripts and insert CSS.

```javascript
// Execute script
chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: injectedFunction,
  args: ['arg1', 'arg2'],
  world: 'ISOLATED',  // or 'MAIN'
  injectImmediately: false
});

// Execute script in multiple tabs
chrome.scripting.executeScript({
  target: { tabIds: [tab1, tab2] },
  files: ['script.js']
});

// Execute in all frames
chrome.scripting.executeScript({
  target: { tabId: tabId, allFrames: true },
  func: () => document.body.style.border = '5px solid red'
});

// Insert CSS
chrome.scripting.insertCSS({
  target: { tabId: tabId },
  css: 'body { background-color: red; }',
  origin: 'USER'  // or 'AUTHOR'
});

// Insert CSS file
chrome.scripting.insertCSS({
  target: { tabId: tabId },
  files: ['style.css']
});

// Remove CSS
chrome.scripting.removeCSS({
  target: { tabId: tabId },
  css: 'body { background-color: red; }'
});

// Get registered content scripts
chrome.scripting.getRegisteredContentScripts();

// Register content script dynamically
chrome.scripting.registerContentScripts([{
  id: 'my-script',
  matches: ['https://*.example.com/*'],
  js: ['content.js'],
  css: ['content.css'],
  runAt: 'document_idle'
}]);

// Unregister content script
chrome.scripting.unregisterContentScripts(['my-script']);
```

### chrome.contextMenus
Right-click context menus.

```javascript
// Create context menu
chrome.contextMenus.create({
  id: 'myContextMenu',
  title: 'My Context Menu',
  contexts: ['selection', 'page', 'image', 'link'],
  parentId: 'parentMenu',  // Optional
  type: 'normal',  // normal, checkbox, radio, separator
  checked: false,
  enabled: true,
  visible: true,
  documentUrlPatterns: ['https://*.example.com/*']
});

// Update context menu
chrome.contextMenus.update('myContextMenu', {
  title: 'Updated Title',
  checked: true
});

// Remove context menu
chrome.contextMenus.remove('myContextMenu');
chrome.contextMenus.removeAll();

// Listen for clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  console.log('Selection text:', info.selectionText);
  console.log('Page URL:', info.pageUrl);
  console.log('Frame URL:', info.frameUrl);
  console.log('Link URL:', info.linkUrl);
  console.log('Image URL:', info.srcUrl);
});

// Context types
const contexts = [
  'all',        // All contexts
  'page',       // Page context
  'frame',      // Frame context
  'selection',  // Text selection
  'link',       // On a link
  'editable',   // Editable element
  'image',      // On an image
  'video',      // On a video
  'audio',      // On audio
  'launcher',   // Chrome OS launcher
  'browser_action',  // Action icon
  'page_action',     // Page action icon
  'action'      // Unified action
];
```

### chrome.alarms
Schedule code to run periodically or at a specified time.

```javascript
// Create alarm
chrome.alarms.create('myAlarm', {
  delayInMinutes: 5,
  periodInMinutes: 60  // Repeat every hour
});

// Create one-time alarm
chrome.alarms.create('oneTime', {
  when: Date.now() + 60000  // 1 minute from now
});

// Get alarm
chrome.alarms.get('myAlarm', (alarm) => {
  console.log('Alarm:', alarm);
});

// Get all alarms
chrome.alarms.getAll((alarms) => {
  console.log('All alarms:', alarms);
});

// Clear alarm
chrome.alarms.clear('myAlarm');
chrome.alarms.clearAll();

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm fired:', alarm.name);

  if (alarm.name === 'myAlarm') {
    // Do something
  }
});
```

### chrome.notifications
Display desktop notifications.

```javascript
// Create notification
chrome.notifications.create('notificationId', {
  type: 'basic',
  iconUrl: 'icon.png',
  title: 'Notification Title',
  message: 'Notification message',
  priority: 2,  // -2 to 2
  buttons: [
    { title: 'Button 1' },
    { title: 'Button 2' }
  ],
  expandedMessage: 'More details...',
  requireInteraction: false
});

// Notification types
const types = {
  basic: {
    title: 'Title',
    message: 'Message',
    iconUrl: 'icon.png'
  },
  image: {
    // ... basic fields
    imageUrl: 'image.png'
  },
  list: {
    // ... basic fields
    items: [
      { title: 'Item 1', message: 'Message 1' },
      { title: 'Item 2', message: 'Message 2' }
    ]
  },
  progress: {
    // ... basic fields
    progress: 50  // 0-100
  }
};

// Update notification
chrome.notifications.update('notificationId', {
  priority: 0
});

// Clear notification
chrome.notifications.clear('notificationId');

// Get all notifications
chrome.notifications.getAll((notifications) => {
  console.log('Active notifications:', notifications);
});

// Listen for events
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log('Button clicked:', buttonIndex);
});

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  console.log('Notification closed by user:', byUser);
});
```

### chrome.windows
Interact with browser windows.

```javascript
// Get current window
chrome.windows.getCurrent((window) => {
  console.log('Current window:', window);
});

// Get all windows
chrome.windows.getAll({ populate: true }, (windows) => {
  windows.forEach(window => {
    console.log('Window tabs:', window.tabs);
  });
});

// Create window
chrome.windows.create({
  url: 'https://example.com',
  type: 'popup',  // normal, popup, panel, detached_panel
  state: 'maximized',  // normal, minimized, maximized, fullscreen
  focused: true,
  incognito: false,
  width: 800,
  height: 600,
  left: 100,
  top: 100
});

// Update window
chrome.windows.update(windowId, {
  focused: true,
  state: 'maximized',
  left: 0,
  top: 0
});

// Remove window
chrome.windows.remove(windowId);

// Listen for events
chrome.windows.onCreated.addListener((window) => {});
chrome.windows.onRemoved.addListener((windowId) => {});
chrome.windows.onFocusChanged.addListener((windowId) => {});
```

### chrome.identity
OAuth2 authentication and user identity.

```javascript
// Get auth token
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  console.log('Auth token:', token);
});

// Remove cached token
chrome.identity.removeCachedAuthToken({ token: token }, () => {
  console.log('Token removed from cache');
});

// Get user info
chrome.identity.getProfileUserInfo((userInfo) => {
  console.log('Email:', userInfo.email);
  console.log('ID:', userInfo.id);
});

// Launch web auth flow
chrome.identity.launchWebAuthFlow({
  url: 'https://example.com/oauth/authorize?client_id=...',
  interactive: true
}, (redirectUrl) => {
  console.log('Redirect URL:', redirectUrl);
});

// Get redirect URL for OAuth
const redirectUrl = chrome.identity.getRedirectURL();
console.log('Redirect URL:', redirectUrl);
```

### chrome.permissions
Request optional permissions at runtime.

```javascript
// Request permissions
chrome.permissions.request({
  permissions: ['tabs'],
  origins: ['https://example.com/*']
}, (granted) => {
  if (granted) {
    console.log('Permissions granted');
  } else {
    console.log('Permissions denied');
  }
});

// Check permissions
chrome.permissions.contains({
  permissions: ['tabs'],
  origins: ['https://example.com/*']
}, (result) => {
  console.log('Has permissions:', result);
});

// Get all permissions
chrome.permissions.getAll((permissions) => {
  console.log('Permissions:', permissions.permissions);
  console.log('Origins:', permissions.origins);
});

// Remove permissions
chrome.permissions.remove({
  permissions: ['tabs'],
  origins: ['https://example.com/*']
}, (removed) => {
  console.log('Permissions removed:', removed);
});

// Listen for changes
chrome.permissions.onAdded.addListener((permissions) => {
  console.log('Permissions added:', permissions);
});

chrome.permissions.onRemoved.addListener((permissions) => {
  console.log('Permissions removed:', permissions);
});
```

## API Best Practices

1. **Check for API availability**: Some APIs need permissions
2. **Handle errors**: Always check `chrome.runtime.lastError`
3. **Use callbacks properly**: Many APIs are asynchronous
4. **Respect permissions**: Request only what you need
5. **Cache API results**: Reduce repeated calls
6. **Test across versions**: API availability may vary

## Error Handling

```javascript
// Always check for errors
chrome.tabs.query({}, (tabs) => {
  if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError.message);
    return;
  }
  // Process tabs
});

// With promises (where available)
chrome.tabs.query({})
  .then(tabs => {
    // Process tabs
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

This comprehensive guide covers the most commonly used Chrome Extension APIs.