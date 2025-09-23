# 🔐 Google API Authentication Setup Guide

## 🎯 **Complete Guide to Client ID & Secret Configuration**

This guide covers how to properly set up authentication for your Google APIs integration.

## 🚀 **Step 1: Google Cloud Console Setup**

### 1. **Create/Select Project**
```bash
1. Visit: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: "Chrome Extension Automation" (or your preferred name)
4. Click "Create"
```

### 2. **Enable APIs**
```bash
1. Go to "APIs & Services" → "Library"
2. Search and enable each API you want:
   - Google Gemini API
   - Google Notebooks API  
   - Google Drive API (future)
   - Gmail API (future)
   - Google Sheets API (future)
   - etc.
```

## 🔑 **Step 2: Create Credentials**

### **Option A: Service Account (Recommended for Server-to-Server)**

#### **Create Service Account:**
```bash
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Service account name: "chrome-extension-automation"
4. Description: "Service account for Chrome extension automation"
5. Click "Create and Continue"
```

#### **Assign Roles:**
```bash
6. Add these roles:
   - "Editor" (for general API access)
   - "Storage Admin" (for Drive API)
   - "BigQuery User" (for data analysis)
7. Click "Continue" → "Done"
```

#### **Generate Key:**
```bash
8. Click on your new service account
9. Go to "Keys" tab
10. Click "Add Key" → "Create new key"
11. Select "JSON" format
12. Click "Create"
13. Save the JSON file as "google-service-account.json"
```

### **Option B: OAuth 2.0 (For User Authentication)**

#### **Create OAuth Credentials:**
```bash
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first
4. Application type: "Desktop application"
5. Name: "Chrome Extension Automation Client"
6. Click "Create"
7. Copy the Client ID and Client Secret
```

## 📁 **Step 3: Secure Credential Storage**

### **Method 1: Environment Variables (Recommended)**

Create a `.env` file in your project root:
```bash
# .env file (keep this secret - add to .gitignore)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json

# For Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# For other specific APIs
GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
GOOGLE_GMAIL_CLIENT_ID=your_gmail_client_id
```

### **Method 2: Config File**
```javascript
// config/google-credentials.js (add to .gitignore)
module.exports = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'your_client_id_here',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret_here',
  serviceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './google-service-account.json',
  geminiApiKey: process.env.GEMINI_API_KEY || 'your_gemini_key_here'
};
```

## 🔧 **Step 4: Integration Code**

### **Update native_host.py**
```python
import os
import json
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

class GoogleAPIManager:
    def __init__(self):
        self.credentials = None
        self.services = {}
        self.setup_credentials()
    
    def setup_credentials(self):
        """Setup Google API credentials"""
        # Method 1: Service Account (for server-to-server)
        service_account_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_PATH', './google-service-account.json')
        
        if os.path.exists(service_account_path):
            self.credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=[
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/gmail.modify',
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/cloud-platform'
                ]
            )
        else:
            # Method 2: OAuth 2.0 (for user authentication)
            self.setup_oauth_credentials()
    
    def setup_oauth_credentials(self):
        """Setup OAuth 2.0 credentials for user authentication"""
        SCOPES = [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/calendar'
        ]
        
        creds = None
        token_path = 'token.json'
        
        # Load existing token
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                # Create credentials.json with your OAuth info
                client_config = {
                    "installed": {
                        "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                        "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token"
                    }
                }
                
                flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        
        self.credentials = creds
    
    def get_service(self, service_name, version='v1'):
        """Get or create a Google API service"""
        service_key = f"{service_name}_{version}"
        
        if service_key not in self.services:
            self.services[service_key] = build(service_name, version, credentials=self.credentials)
        
        return self.services[service_key]
    
    def gemini_request(self, prompt):
        """Make request to Gemini API"""
        import requests
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return {'error': 'Gemini API key not configured'}
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Implement Gemini API call here
        # (Exact implementation depends on Gemini API structure)
        pass

# Initialize in your native_host.py
google_api_manager = GoogleAPIManager()

# Example usage in automation handlers
def handle_drive_automation(request):
    drive_service = google_api_manager.get_service('drive', 'v3')
    # Use drive_service for automation...

def handle_gmail_automation(request):
    gmail_service = google_api_manager.get_service('gmail', 'v1')
    # Use gmail_service for automation...

def handle_gemini_automation(request):
    result = google_api_manager.gemini_request(request.get('prompt'))
    return result
```

### **Environment Setup Script**
```python
# setup_environment.py
import os

def setup_google_credentials():
    """Interactive setup for Google API credentials"""
    print("🔐 Google API Credentials Setup")
    print("=" * 40)
    
    # Get credentials from user
    client_id = input("Enter Google Client ID: ").strip()
    client_secret = input("Enter Google Client Secret: ").strip()
    gemini_api_key = input("Enter Gemini API Key (optional): ").strip()
    
    # Create .env file
    env_content = f"""# Google API Credentials
GOOGLE_CLIENT_ID={client_id}
GOOGLE_CLIENT_SECRET={client_secret}
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
GEMINI_API_KEY={gemini_api_key}

# Security: Add .env to .gitignore
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    # Create .gitignore entry
    gitignore_entries = [
        '.env',
        'google-service-account.json',
        'token.json',
        '__pycache__/',
        '*.pyc'
    ]
    
    with open('.gitignore', 'a') as f:
        f.write('\n# Google API Credentials\n')
        for entry in gitignore_entries:
            f.write(f"{entry}\n")
    
    print("✅ Environment configured successfully!")
    print("📁 Place your google-service-account.json in the project root")
    print("🔒 Credentials secured in .env file")

if __name__ == "__main__":
    setup_google_credentials()
```

## 🛡️ **Step 5: Security Best Practices**

### **Protect Your Credentials:**
```bash
# Add to .gitignore
.env
google-service-account.json
token.json
credentials.json
*.key
config/secrets.js
```

### **Environment Variable Loading:**
```python
# Install python-dotenv
pip install python-dotenv

# Load environment variables
from dotenv import load_dotenv
load_dotenv()  # Load .env file
```

### **Validate Credentials:**
```python
def validate_credentials():
    """Validate that all required credentials are available"""
    required_env_vars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All credentials configured correctly")
    return True
```

## ⚡ **Quick Setup Commands**

### **Run Setup:**
```bash
# 1. Install dependencies
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client python-dotenv

# 2. Run credential setup
python setup_environment.py

# 3. Place your service account JSON file in project root
# (Download from Google Cloud Console)

# 4. Test authentication
python -c "from native_host import GoogleAPIManager; gam = GoogleAPIManager(); print('✅ Authentication successful!')"
```

## 🎯 **API-Specific Setup**

### **For Gemini API:**
```bash
1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to .env: GEMINI_API_KEY=your_key_here
```

### **For Notebooks API:**
```bash
1. Enable "AI Platform Notebooks API" in Google Cloud Console
2. Use service account credentials
3. Ensure "Notebooks Admin" role is assigned
```

## 🧪 **Testing Your Setup**

### **Test Script:**
```python
# test_google_apis.py
import os
from native_host import GoogleAPIManager

def test_authentication():
    print("🧪 Testing Google API Authentication...")
    
    try:
        gam = GoogleAPIManager()
        
        # Test Drive API
        drive_service = gam.get_service('drive', 'v3')
        results = drive_service.files().list(pageSize=1).execute()
        print("✅ Drive API: Connected")
        
        # Test Gmail API  
        gmail_service = gam.get_service('gmail', 'v1')
        profile = gmail_service.users().getProfile(userId='me').execute()
        print(f"✅ Gmail API: Connected ({profile['emailAddress']})")
        
        print("🎉 All APIs authenticated successfully!")
        
    except Exception as e:
        print(f"❌ Authentication failed: {str(e)}")
        print("💡 Check your credentials and API enablement")

if __name__ == "__main__":
    test_authentication()
```

## 📋 **Troubleshooting**

### **Common Issues:**
1. **"API not enabled"** → Enable the API in Google Cloud Console
2. **"Invalid credentials"** → Check client ID/secret in .env file  
3. **"Permission denied"** → Ensure service account has proper roles
4. **"Quota exceeded"** → Check API quotas in Google Cloud Console

Your Google API authentication is now properly configured and secured! 🔐✅
