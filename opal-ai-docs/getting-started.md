# Getting Started with Opal AI

## 🚀 Quick Start Guide

### Prerequisites
- Google account
- Web browser (Chrome recommended)
- Located in the United States (beta restriction)

### Step 1: Access Opal
1. Navigate to [opal.withgoogle.com](http://opal.withgoogle.com/)
2. Sign in with your Google account
3. Accept terms of service for Google Labs

### Step 2: Explore the Interface

#### Main Dashboard
- **Create New**: Start a new AI workflow
- **My Apps**: View your created applications
- **Gallery**: Browse community templates
- **Recent**: Access recently edited workflows

#### Workflow Canvas
- **Node Panel**: Available AI models and tools
- **Canvas Area**: Visual workflow builder
- **Properties Panel**: Configure selected nodes
- **Test Panel**: Run and debug workflows

## 🎓 Your First Opal App

### Tutorial: Creating a Simple Text Analyzer

#### Goal
Create an app that analyzes text sentiment and extracts key points.

#### Steps

1. **Start New Workflow**
   ```
   Click "Create New" → Choose "Blank Workflow"
   ```

2. **Add Input Node**
   - Drag "Text Input" to canvas
   - Label: "Text to Analyze"
   - Set as multiline input

3. **Add Sentiment Analysis**
   - Add "AI Model" node
   - Connect to Text Input
   - Configure prompt:
     ```
     Analyze the sentiment of this text:
     {input}

     Return: Positive, Negative, or Neutral
     ```

4. **Add Key Points Extraction**
   - Add another "AI Model" node
   - Connect to Text Input
   - Configure prompt:
     ```
     Extract 3 key points from this text:
     {input}

     Format as bullet points.
     ```

5. **Add Output Formatter**
   - Add "Output" node
   - Connect both AI models
   - Configure template:
     ```
     Sentiment: {sentiment}

     Key Points:
     {keypoints}
     ```

6. **Test Your App**
   - Click "Test" button
   - Enter sample text
   - Review results
   - Adjust prompts as needed

7. **Save and Share**
   - Name your app
   - Add description
   - Choose sharing settings
   - Click "Save"

## 💡 Core Concepts

### Nodes
Building blocks of your workflow:
- **Input Nodes**: Accept user data
- **Processing Nodes**: Transform data
- **AI Model Nodes**: Apply AI processing
- **Logic Nodes**: Control flow
- **Output Nodes**: Display results

### Connections
Define data flow between nodes:
- Click and drag from output to input
- Multiple connections allowed
- Data passes sequentially
- Parallel processing supported

### Variables
Pass data through workflow:
- `{input}`: Reference input data
- `{nodeName.output}`: Reference specific node output
- `{variable}`: Custom variables
- `{timestamp}`: System variables

## 🛠️ Working with AI Models

### Available Models
1. **Text Generation**
   - General purpose text AI
   - Creative writing
   - Code generation

2. **Analysis Models**
   - Sentiment analysis
   - Entity extraction
   - Classification

3. **Transformation Models**
   - Translation
   - Summarization
   - Style transfer

### Prompt Engineering Tips

#### Be Specific
```
Bad:  "Analyze this"
Good: "Analyze the sentiment and identify the main topic in 1-2 sentences"
```

#### Provide Context
```
Bad:  "Translate this"
Good: "Translate this English text to Spanish, maintaining formal tone"
```

#### Use Examples
```
Classify this review as Positive, Negative, or Neutral.

Examples:
"Great product!" → Positive
"Terrible service" → Negative
"It's okay" → Neutral

Review: {input}
```

## 🔄 Workflow Patterns

### Sequential Processing
```
Input → Process A → Process B → Output
```

### Parallel Processing
```
       ┌→ Process A ─┐
Input ─┤             ├→ Combine → Output
       └→ Process B ─┘
```

### Conditional Logic
```
Input → Condition → Yes → Process A → Output
                  → No  → Process B → Output
```

### Loop Pattern
```
Input → Process → Check → Not Done → Process (loop)
                        → Done → Output
```

## 🎨 Using the Visual Editor

### Canvas Controls
- **Pan**: Click and drag background
- **Zoom**: Scroll wheel or pinch
- **Select**: Click on nodes
- **Multi-select**: Shift + click or drag rectangle
- **Delete**: Select and press Delete key

### Node Operations
- **Add**: Drag from panel or right-click canvas
- **Configure**: Double-click node
- **Connect**: Drag from output to input port
- **Duplicate**: Ctrl+D (Cmd+D on Mac)
- **Align**: Select multiple and use alignment tools

### Keyboard Shortcuts
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+S`: Save
- `Ctrl+C/V`: Copy/Paste
- `Delete`: Remove selected
- `Space`: Pan mode

## 💬 Using Natural Language

### Conversation Mode
Instead of visual editing, describe your app:

```
"Create an app that takes a URL, fetches the content,
summarizes it, and translates the summary to Spanish"
```

### Refining with Natural Language
```
"Add a step that extracts key statistics"
"Make the summary shorter"
"Also translate to French"
"Add error handling for invalid URLs"
```

### Mixing Approaches
1. Start with natural language description
2. Fine-tune with visual editor
3. Use conversation for major changes
4. Visual editor for precise adjustments

## 📊 Testing Your App

### Test Panel Features
- **Sample Inputs**: Pre-defined test data
- **Custom Input**: Your own test cases
- **Step Debugging**: See output at each node
- **Performance Metrics**: Execution time
- **Error Messages**: Detailed error information

### Testing Best Practices
1. Test with various inputs
2. Include edge cases
3. Test error scenarios
4. Verify all paths in conditional logic
5. Check performance with large inputs

## 🚢 Sharing and Publishing

### Sharing Options

#### Private Sharing
- Share with specific Google accounts
- Recipients can view and run
- Optional edit permissions

#### Public Gallery
- Submit for public gallery
- Requires review process
- Include documentation
- Provide example inputs

### App Documentation
Include in your shared app:
- **Description**: What it does
- **Instructions**: How to use it
- **Examples**: Sample inputs/outputs
- **Limitations**: Known constraints
- **Credits**: If building on others' work

## 🐛 Troubleshooting

### Common Issues

#### "Model timeout"
- Simplify prompts
- Break into smaller steps
- Check input size limits

#### "Invalid connection"
- Verify data types match
- Check node compatibility
- Review connection logic

#### "No output"
- Check all connections
- Verify prompts return data
- Test each node individually

### Debugging Tips
1. Use step debugging
2. Add output nodes between steps
3. Simplify to isolate issues
4. Check example workflows
5. Review error messages carefully

## 📚 Next Steps

### Learn More
1. Explore gallery examples
2. Join community forums
3. Watch tutorial videos
4. Read best practices
5. Experiment with complex workflows

### Advanced Topics
- Custom logic implementation
- Multi-model orchestration
- Error handling strategies
- Performance optimization
- Integration patterns

### Build Your Skills
- Start with simple apps
- Gradually increase complexity
- Learn from community examples
- Share and get feedback
- Iterate and improve

---

*Remember: Opal is in beta. Features may change, and new capabilities are being added regularly. Stay updated through official channels.*