# Context7 Integration Setup Guide

## 🚀 What is Context7?

Context7 provides up-to-date, version-specific documentation and code examples directly to your AI assistant. Instead of relying on outdated training data, Context7 fetches the latest documentation from the source.

## ✅ Integration Complete!

I've successfully integrated Context7 into your n8n Chrome Extension. Here's what was added:

### 1. **Context7 MCP Server**
- Installed `@upstash/context7-mcp` package
- Created server configuration in `/context7-mcp/server.js`

### 2. **Direct Integration**
- Created `context7-integration.js` for direct API access
- Integrated into the background script for AI assistant enhancement

### 3. **Automatic Documentation Fetching**
- The AI assistant now automatically detects when you mention a library/framework
- Fetches relevant documentation and includes it in the AI's context
- Supports popular libraries like React, Vue, Next.js, Express, MongoDB, and more

## 🔧 Configuration

### Getting Your Context7 API Key (Optional)

1. Visit [context7.com/dashboard](https://context7.com/dashboard)
2. Create a free account
3. Copy your API key
4. Add it to the extension settings:
   - Click the extension icon
   - Go to Settings / API Keys
   - Paste your Context7 API key
   - Click "Test Connection"
   - Save settings

**Note:** Context7 works without an API key, but having one provides higher rate limits.

## 📚 How It Works

When you chat with the AI assistant and mention a library or framework, Context7 automatically:

1. **Detects the library** in your message
2. **Fetches current documentation** from Context7's API
3. **Includes it in the AI's context** for more accurate responses

### Example Messages That Trigger Context7:

- "How do I create a React component with hooks?"
- "Show me how to set up routing in Next.js"
- "I need help with MongoDB aggregation pipeline"
- "How to configure Tailwind CSS with PostCSS?"

## 🎯 Supported Libraries

Context7 supports thousands of libraries. Here are some popular ones:

### Frontend
- React, Vue, Angular
- Next.js, Nuxt.js, Gatsby
- Tailwind CSS, Bootstrap
- TypeScript, JavaScript

### Backend
- Node.js, Express, Fastify
- Django, Flask, FastAPI
- MongoDB, PostgreSQL, Redis

### Cloud & DevOps
- Firebase, Supabase
- AWS SDK, Google Cloud
- Docker, Kubernetes

### And Many More!
Visit [context7.com](https://context7.com) to see the full list.

## 🛠️ Advanced Usage

### Manual Library Selection

If you know the exact library ID, you can specify it directly:

```javascript
const context7 = new Context7Integration(apiKey);
const docs = await context7.getLibraryDocs('/vercel/next.js', {
    topic: 'routing',
    tokens: 5000
});
```

### Testing Context7

1. Open the extension options page
2. Go to the API Keys section
3. Enter your Context7 API key (or leave blank for free tier)
4. Click "Test Connection"

### Debugging

To see Context7 in action:
1. Open the browser console (F12)
2. Chat with the AI assistant about a library
3. Look for "Context7 Documentation" messages in the console

## ⚡ Features

- **Automatic Detection**: Recognizes library mentions in your messages
- **Smart Caching**: Reduces API calls for repeated queries
- **Fallback System**: Works even without Context7 API key
- **Error Tolerance**: Continues working even if Context7 is unavailable

## 🔍 How to Verify It's Working

1. **Ask about a specific library**:
   ```
   "How do I use useState in React?"
   ```

2. **Check the console** (F12):
   - You should see: "Context7 Documentation for react"

3. **Compare responses**:
   - With Context7: More accurate, up-to-date code examples
   - Without: Generic responses based on training data

## 🚨 Troubleshooting

### Context7 Not Working?

1. **Check API Key**:
   - Go to Settings → API Keys
   - Verify Context7 API key is entered
   - Click "Test Connection"

2. **Check Console for Errors**:
   - Open F12 Developer Console
   - Look for Context7-related errors

3. **Verify Library Detection**:
   - Make sure you mention a library name in your message
   - Try common names like "react", "nodejs", "mongodb"

### Rate Limits

- **Without API Key**: Limited to ~10 requests per hour
- **With Free API Key**: 100 requests per hour
- **With Paid API Key**: Higher limits based on plan

## 📝 Examples

### Example 1: React Query
```
User: "How do I create a custom hook in React?"
AI: [With Context7 documentation for React hooks...]
```

### Example 2: Next.js Setup
```
User: "Setup API routes in Next.js 14"
AI: [With Context7 documentation for Next.js 14 API routes...]
```

### Example 3: MongoDB Operations
```
User: "How to use aggregation pipeline in MongoDB?"
AI: [With Context7 documentation for MongoDB aggregation...]
```

## 🎉 Benefits

- ✅ **Up-to-date code examples** - No more outdated syntax
- ✅ **Version-specific docs** - Get docs for the exact version you're using
- ✅ **No hallucinated APIs** - Real, working code from official docs
- ✅ **Faster development** - Accurate answers on the first try

## 🔗 Resources

- [Context7 Website](https://context7.com)
- [Context7 Dashboard](https://context7.com/dashboard)
- [Context7 GitHub](https://github.com/upstash/context7)
- [Documentation](https://docs.context7.com)

## 💡 Tips

1. **Be specific** about the library version if needed:
   - "React 18 concurrent features"
   - "Next.js 14 app router"

2. **Combine with questions**:
   - "How do I handle errors in Express middleware?"
   - "Best practices for Tailwind CSS responsive design"

3. **Use for configuration**:
   - "Configure ESLint for TypeScript project"
   - "Setup Prettier with Tailwind CSS"

Context7 is now ready to enhance your AI assistant with real-time documentation!