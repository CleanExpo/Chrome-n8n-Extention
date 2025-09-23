# n8n Cloud Setup for Chrome Extension

## Your n8n Cloud Instance
- **Instance URL**: https://phillcarsi.app.n8n.cloud
- **Status**: Active ✅

## Quick Setup Instructions

### Step 1: Log into n8n Cloud
1. Go to: https://phillcarsi.app.n8n.cloud/login
2. Log in with your n8n cloud credentials

### Step 2: Create Chrome Extension Webhook Workflow

1. **Create New Workflow**
   - Click "New" button
   - Name it: "Chrome Extension AI Assistant"

2. **Add Webhook Node**
   - Drag "Webhook" node from left panel
   - Configure:
     - **HTTP Method**: POST
     - **Path**: `chrome-extension`
     - **Authentication**: None (for now)
     - **Response Mode**: Immediately

3. **Add Processing Nodes** (Optional)
   You can add any of these nodes after the webhook:
   - **OpenAI** - For AI processing
   - **Google Sheets** - To log requests
   - **Email** - Send notifications
   - **Slack** - Send messages
   - **HTTP Request** - Call other APIs

4. **Example Workflow Structure**:
   ```
   [Webhook] → [OpenAI] → [Google Sheets] → [Respond to Webhook]
       ↓
   [Slack Notification]
   ```

5. **Activate the Workflow**
   - Click "Active" toggle in top-right
   - Your webhook is now live!

### Step 3: Get Your Webhook URL

Once activated, your webhook URL will be:
```
https://phillcarsi.app.n8n.cloud/webhook/chrome-extension
```

### Step 4: Configure Extension

1. **In Chrome Extension Settings**:
   - Open extension settings (click extension icon → Settings)
   - Enter n8n Webhook URL: `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`
   - Click "Test Connection"
   - Should show: ✅ Connected

2. **Test the Connection**:
   - Type a command in the extension
   - Check n8n workflow executions
   - You should see the request come through

## Example n8n Workflows

### 1. AI Assistant with Logging
```json
{
  "name": "Chrome Extension AI Assistant",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "path": "chrome-extension",
      "httpMethod": "POST"
    },
    {
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "operation": "text"
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "operation": "append"
    }
  ]
}
```

### 2. Task Automation
```json
{
  "name": "Chrome Task Automation",
  "nodes": [
    {
      "name": "Webhook",
      "path": "chrome-extension"
    },
    {
      "name": "Router",
      "type": "n8n-nodes-base.switch",
      "rules": [
        {"value": "email", "output": 0},
        {"value": "calendar", "output": 1},
        {"value": "sheet", "output": 2}
      ]
    },
    {
      "name": "Gmail",
      "type": "n8n-nodes-base.gmail"
    },
    {
      "name": "Google Calendar",
      "type": "n8n-nodes-base.googleCalendar"
    },
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets"
    }
  ]
}
```

## Webhook Payload Structure

The extension sends this structure to n8n:
```json
{
  "message": "User's command or query",
  "context": {
    "url": "Current page URL",
    "title": "Page title",
    "source": "popup | content | background",
    "timestamp": "2024-01-24T10:00:00Z"
  },
  "user": {
    "email": "phill.mcgurk@gmail.com or zenithfresh25@gmail.com"
  },
  "action": "assistant | automation | seo | command"
}
```

## n8n Response Format

Your workflow should return:
```json
{
  "success": true,
  "reply": "Response text to show user",
  "actions": [
    {
      "type": "notification | task | automation",
      "data": {}
    }
  ]
}
```

## Security Recommendations

1. **Add Authentication** (Optional but recommended):
   - In Webhook node settings
   - Enable "Authentication"
   - Choose "Header Auth"
   - Set header name: `X-Extension-Key`
   - Set expected value: Generate a random key
   - Add same key to extension settings

2. **IP Whitelisting**:
   - n8n Cloud doesn't support IP whitelisting
   - Use authentication headers instead

3. **Rate Limiting**:
   - Add a Rate Limit node after webhook
   - Limit to reasonable requests per minute

## Troubleshooting

### Connection Issues

1. **"Webhook not found"**
   - Make sure workflow is activated
   - Check webhook path is exactly: `chrome-extension`

2. **"Connection refused"**
   - Workflow might be deactivated
   - Check n8n cloud is accessible

3. **No response from n8n**
   - Check workflow execution logs
   - Ensure "Respond to Webhook" node is present

### Testing

1. **Manual Test**:
   ```bash
   curl -X POST https://phillcarsi.app.n8n.cloud/webhook/chrome-extension \
     -H "Content-Type: application/json" \
     -d '{"message": "Test from curl", "context": {"source": "test"}}'
   ```

2. **From Extension**:
   - Open extension popup
   - Type: "Test n8n connection"
   - Click Perform
   - Check n8n executions

## Advanced Features

### Connect to Your Services
n8n can connect to 400+ services:
- **Google Workspace**: Drive, Sheets, Calendar, Gmail
- **Productivity**: Notion, Trello, Asana, Monday.com
- **Communication**: Slack, Discord, Telegram, WhatsApp
- **AI**: OpenAI, Claude, Hugging Face, Replicate
- **Databases**: PostgreSQL, MySQL, MongoDB, Airtable
- **CRM**: HubSpot, Salesforce, Pipedrive

### Example Automations
1. **Email Draft**: Command → OpenAI → Gmail Draft
2. **Meeting Schedule**: Command → Extract Info → Google Calendar
3. **Task Creation**: Command → Parse → Notion/Trello
4. **Data Entry**: Command → Process → Google Sheets
5. **Research**: Command → Web Search → Summarize → Save

## Support

- **n8n Documentation**: https://docs.n8n.io/
- **n8n Community**: https://community.n8n.io/
- **Your Instance**: https://phillcarsi.app.n8n.cloud

---

Your n8n cloud instance is ready to supercharge your Chrome extension with powerful automation capabilities!