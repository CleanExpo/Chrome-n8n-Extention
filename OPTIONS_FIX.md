# ⚡ Quick Fix Instructions for Chrome Extension Settings

## 🔧 Two Issues to Fix:

### 1. **Wrong n8n Webhook URL**
- **Current (WRONG)**: `https://phillcarsi.app.n8n.cloud/signin`
- **Correct URL**: `https://phillcarsi.app.n8n.cloud/webhook/chrome-extension`

### 2. **n8n API Key Not Being Saved**
- The save function is missing from options-enhanced.js

## ✅ Quick Fix Steps:

### Step 1: Update n8n Webhook URL in Settings
1. Open extension settings
2. In "n8n Webhook URL" field, replace with:
   ```
   https://phillcarsi.app.n8n.cloud/webhook/chrome-extension
   ```

### Step 2: Add Your n8n API Key
1. In the API Keys section
2. Find "n8n API Key" field
3. Paste your key:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDk1YzQzOS1hYWY5LTQwNDYtYTM4MS0wYzNmN2JhYzNlMDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4NjIwNzk3fQ.Sxd7Oytth6E0A1Fhj_Z20GvoIZ4-7VqPk_Koj2Li6WA
   ```

### Step 3: Save Settings
Click "Save Settings" button at the bottom

## 🚨 If Settings Don't Save:

The save function might be missing. I need to add it to the JavaScript file.

## 📝 After Fixing:

1. Test n8n connection - should show ✅
2. Create webhook workflow in n8n cloud
3. Activate the workflow
4. Test from extension

---

**Note**: The signin URL was the problem - it should be the webhook endpoint URL!