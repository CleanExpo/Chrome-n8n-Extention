# 🚀 n8n Cloud Quick Setup - 5 Minutes

## Your n8n Details
- **Instance**: https://phillcarsi.app.n8n.cloud
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (stored securely)

## Step 1: Add to Extension Settings (30 seconds)

1. Open extension settings (click extension icon → Settings)
2. Enter:
   - **n8n Webhook URL**: `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`
   - **n8n API Key**: Your API key (already have it)
3. Click "Test Connection"

## Step 2: Create Webhook in n8n (2 minutes)

1. **Go to**: https://phillcarsi.app.n8n.cloud
2. **Click** "New" → Create workflow
3. **Add Webhook Node**:
   ```
   Settings:
   - HTTP Method: POST
   - Path: chrome-extension
   - Authentication: None
   - Response Mode: Immediately
   - Response Data: First Entry JSON
   ```

4. **Add Response Node** (Set Node):
   ```javascript
   {
     "success": true,
     "reply": "Hello from n8n! I received: {{$json["message"]}}",
     "timestamp": "{{$now.toISO()}}"
   }
   ```

5. **Click "Active"** toggle (top-right)

## Step 3: Test It! (30 seconds)

1. **In Extension**:
   - Click extension icon
   - Type: "Test n8n"
   - Click Perform

2. **Check n8n**:
   - Go to Executions tab
   - You should see your message!

## 🎯 Quick Workflow Templates

### Simple Echo Bot (Copy & Paste)
```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chrome-extension",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "reply",
              "value": "=Received: {{$json[\"message\"]}}"
            }
          ]
        },
        "options": {}
      },
      "name": "Set Response",
      "type": "n8n-nodes-base.set",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Set Response", "type": "main", "index": 0}]]
    }
  }
}
```

### AI Assistant (with OpenAI)
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "chrome-extension",
        "httpMethod": "POST"
      }
    },
    {
      "name": "OpenAI",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "parameters": {
        "model": "gpt-3.5-turbo",
        "prompt": "={{$json[\"message\"]}}"
      }
    },
    {
      "name": "Response",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "reply": "={{$json[\"output\"]}}"
        }
      }
    }
  ]
}
```

## ✅ Success Checklist

- [ ] n8n webhook URL in extension settings
- [ ] n8n API key in extension settings
- [ ] Webhook workflow created in n8n
- [ ] Workflow is ACTIVE
- [ ] Test message works

## 🔥 Advanced Ideas

Once connected, you can:
- **Email Automation**: "Draft email to John" → Creates Gmail draft
- **Calendar**: "Schedule meeting tomorrow 3pm" → Creates event
- **Sheets**: "Log expense $50 coffee" → Adds to spreadsheet
- **AI Research**: "Research quantum computing" → Web search + summary
- **Task Management**: "Add task: Review proposal" → Creates in Notion/Trello

## Troubleshooting

**"Webhook not found"**
- Make sure workflow is ACTIVE
- Check path is exactly: `chrome-extension`

**"Connection failed"**
- Verify URL: `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`
- Check API key is entered correctly

**No response from n8n**
- Add "Respond to Webhook" node at the end
- Set Response Mode to "Immediately"

---

🎉 **That's it! Your AI assistant now has automation superpowers!**