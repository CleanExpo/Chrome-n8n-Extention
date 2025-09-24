# 📚 Step-by-Step n8n Webhook Creation Guide

## 🎯 What You Need:
- Your n8n cloud instance: https://phillcarsi.app.n8n.cloud
- Your API key: Already have it ✅

## 📸 Visual Step-by-Step Instructions

### Step 1: Log into n8n Cloud
1. Go to: https://phillcarsi.app.n8n.cloud
2. Sign in with your credentials

### Step 2: Create New Workflow
1. Click the **"+ New"** button (top-left corner)
2. You'll see a blank canvas

### Step 3: Add Webhook Node
1. **Click the "+"** button on the canvas
2. In the search box, type: **"Webhook"**
3. Click on **"Webhook"** node to add it

### Step 4: Configure the Webhook
Double-click the Webhook node to open settings:

```
Configure these EXACT settings:

📝 Webhook Settings:
├── HTTP Method: POST ✅
├── Path: chrome-extension
├── Authentication: None
├── Response Mode: Immediately
├── Response Data: First Entry JSON
└── Response Code: 200
```

**IMPORTANT**: The path must be EXACTLY: `chrome-extension` (no slashes, no extra text)

### Step 5: Add a Response (Set Node)
1. Click the **"+"** after the Webhook node
2. Search for **"Set"**
3. Click **"Set"** to add it
4. Connect it to the Webhook node

### Step 6: Configure Set Node
Double-click the Set node and configure:

```json
Add these fields:
1. Name: success
   Value: true
   Type: Boolean

2. Name: reply
   Value: Hello from n8n! Message received: {{$json["message"]}}
   Type: String

3. Name: timestamp
   Value: {{$now.toISO()}}
   Type: String
```

### Step 7: Activate the Workflow
1. **CRUCIAL**: Click the **"Active"** toggle in the top-right corner
2. It should turn GREEN ✅
3. Click **"Save"** (give it a name like "Chrome Extension Webhook")

### Step 8: Get Your Webhook URL
Once activated, your webhook URL is automatically:
```
https://phillcarsi.app.n8n.cloud/webhook/chrome-extension
```

This URL is constructed as:
- Base: `https://phillcarsi.app.n8n.cloud`
- Path: `/webhook/`
- Your endpoint: `chrome-extension`

## ✅ Verification Checklist

- [ ] Workflow created
- [ ] Webhook node added
- [ ] Path set to: `chrome-extension`
- [ ] Set node connected for response
- [ ] Workflow is ACTIVE (green toggle)
- [ ] Workflow is SAVED

## 🧪 Test Your Webhook

### Method 1: Test from Extension
1. Open extension settings
2. Make sure webhook URL is: `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`
3. Add your n8n API key
4. Click "Save Settings"
5. Click "Test Connection"

### Method 2: Test with cURL (Command Line)
```bash
curl -X POST https://phillcarsi.app.n8n.cloud/webhook/chrome-extension \
  -H "Content-Type: application/json" \
  -d '{"message": "Test from command line"}'
```

### Method 3: Test from n8n Interface
1. In your workflow, click on the Webhook node
2. Click "Listen for Test Event"
3. Send a test request from the extension
4. You'll see the data appear in n8n

## 📊 What Success Looks Like

✅ **In Extension Settings:**
- n8n connection shows green checkmark
- Test returns: "n8n Cloud webhook connected successfully"

✅ **In n8n Workflow:**
- Executions tab shows incoming requests
- Each request has the data from your extension

## 🔴 Common Issues & Solutions

### "Webhook not found"
- **Cause**: Workflow not active or wrong path
- **Fix**: Make sure workflow is ACTIVE and path is exactly `chrome-extension`

### "Connection refused"
- **Cause**: Wrong URL format
- **Fix**: Use `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`

### "Authentication failed"
- **Cause**: Webhook has authentication enabled
- **Fix**: Set Webhook Authentication to "None" (or configure auth properly)

### No response from webhook
- **Cause**: Missing response node
- **Fix**: Add Set node after Webhook to send response

## 🚀 Advanced: Complete Working Workflow

Here's a complete workflow you can import:

1. In n8n, click **"..."** menu → **"Import from URL"**
2. Or create manually with this structure:

```
[Webhook]
    ↓
[Set Response]
    ↓
(Optional: Add more nodes here)
[OpenAI] → [Google Sheets] → [Email]
```

### Copy-Paste JSON Workflow:
```json
{
  "name": "Chrome Extension Handler",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chrome-extension",
        "responseMode": "responseNode",
        "responseCode": 200,
        "responseData": "firstEntryJson"
      },
      "id": "webhook-node",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "values": {
          "boolean": [
            {
              "name": "success",
              "value": true
            }
          ],
          "string": [
            {
              "name": "reply",
              "value": "=Message received: {{$json[\"message\"]}}"
            },
            {
              "name": "processedAt",
              "value": "={{$now.toISO()}}"
            }
          ]
        }
      },
      "id": "set-response",
      "name": "Set Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 2,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Set Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📝 Summary

Your webhook URL is constructed like this:
```
https://[your-instance].app.n8n.cloud/webhook/[your-path]
                ↓                              ↓
        phillcarsi.app.n8n.cloud      chrome-extension

Final URL: https://phillcarsi.app.n8n.cloud/webhook/chrome-extension
```

This is the URL you put in the extension settings!

---

🎉 **That's it!** Once your workflow is active, your Chrome extension can communicate with n8n!