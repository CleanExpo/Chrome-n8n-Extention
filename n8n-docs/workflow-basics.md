# n8n Workflow Basics

## Creating Your First Workflow

### Step 1: Add a Trigger Node
Every workflow needs a starting point:

1. Click the "+" button to add a node
2. Search for a trigger (e.g., "Webhook", "Schedule", "Manual")
3. Configure the trigger settings
4. Click "Execute Node" to test

### Step 2: Add Action Nodes
Add nodes to process data:

1. Click the "+" after your trigger
2. Search for the service you want (e.g., "HTTP Request", "Postgres", "Slack")
3. Connect to the previous node
4. Configure the node settings

### Step 3: Connect and Test
1. Draw connections between nodes
2. Click "Execute Workflow" to test
3. Check the execution data
4. Fix any errors

## Common Trigger Nodes

### Manual Trigger
```json
{
  "name": "Manual Trigger",
  "type": "n8n-nodes-base.manualTrigger",
  "position": [250, 300]
}
```
- Start workflows manually
- Good for testing
- Can accept input data

### Webhook Trigger
```json
{
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "my-webhook-path",
    "responseMode": "onReceived",
    "responseData": "allEntries"
  }
}
```
- Receives HTTP requests
- Returns customizable responses
- Supports GET, POST, PUT, DELETE

### Schedule Trigger (Cron)
```json
{
  "name": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 1
        }
      ]
    }
  }
}
```
- Run workflows on schedule
- Cron expressions supported
- Timezone configuration

## Essential Action Nodes

### HTTP Request Node
```javascript
// Configuration
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "responseFormat": "json",
  "options": {
    "timeout": 10000,
    "retry": {
      "maxTries": 3,
      "waitBetweenTries": 1000
    }
  }
}
```

### Code Node (JavaScript)
```javascript
// Transform data with JavaScript
const items = $input.all();

return items.map(item => {
  return {
    json: {
      id: item.json.id,
      name: item.json.name.toUpperCase(),
      timestamp: new Date().toISOString(),
      processed: true
    }
  };
});
```

### Set Node
```javascript
// Set or transform fields
{
  "mode": "manual",
  "fields": {
    "values": [
      {
        "name": "status",
        "value": "processed"
      },
      {
        "name": "timestamp",
        "value": "={{ $now.toISO() }}"
      }
    ]
  }
}
```

### IF Node (Conditional)
```javascript
// Branch based on conditions
{
  "conditions": {
    "conditions": [
      {
        "value1": "={{ $json.status }}",
        "operation": "equals",
        "value2": "active"
      }
    ]
  }
}
```

### Switch Node
```javascript
// Multiple routing options
{
  "mode": "expression",
  "value": "={{ $json.category }}",
  "rules": [
    {
      "operation": "equals",
      "value": "sales",
      "output": 0
    },
    {
      "operation": "equals",
      "value": "support",
      "output": 1
    }
  ],
  "fallbackOutput": 2
}
```

## Working with Data

### Accessing Node Data
```javascript
// Current node's data
{{ $json.fieldName }}

// Previous node's data
{{ $node["HTTP Request"].json.response }}

// First item from previous node
{{ $node["HTTP Request"].first().json.field }}

// All items from previous node
{{ $node["HTTP Request"].all() }}

// Using $() function
{{ $('HTTP Request').item.json.field }}
```

### Data Transformation Examples

#### Mapping Arrays
```javascript
// In Code node
const users = $json.users;
return users.map(user => ({
  json: {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email.toLowerCase(),
    isActive: user.status === 'active'
  }
}));
```

#### Filtering Data
```javascript
// Filter active users
const items = $input.all();
return items.filter(item =>
  item.json.status === 'active' &&
  item.json.age >= 18
);
```

#### Aggregating Data
```javascript
// Calculate totals
const items = $input.all();
const total = items.reduce((sum, item) =>
  sum + item.json.amount, 0
);

return [{
  json: {
    totalAmount: total,
    itemCount: items.length,
    average: total / items.length
  }
}];
```

## Error Handling

### Error Workflow
```javascript
// Set error workflow in workflow settings
{
  "errorWorkflow": "workflow_id_here"
}
```

### Try-Catch in Code Node
```javascript
try {
  // Your code here
  const result = await makeAPICall();
  return [{json: result}];
} catch (error) {
  return [{
    json: {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }];
}
```

### Error Output
Connect error output to handle failures:
```
Node → Success Output → Next Node
  ↓
Error Output → Error Handler
```

## Workflow Patterns

### Pattern 1: Data Enrichment
```
Trigger → Fetch Data → Enrich → Transform → Store
```

### Pattern 2: Notification Pipeline
```
Webhook → Validate → Process → Notify (Email/Slack/SMS)
```

### Pattern 3: ETL Pipeline
```
Schedule → Extract (API) → Transform (Code) → Load (Database)
```

### Pattern 4: Approval Workflow
```
Request → Send for Approval → Wait → Approved? → Process
                                         ↓
                                      Rejected
```

## Advanced Techniques

### Looping Through Items
```javascript
// Split In Batches node for pagination
{
  "batchSize": 10,
  "options": {
    "reset": false
  }
}
```

### Parallel Processing
```
        → Branch 1 →
Input →              → Merge
        → Branch 2 →
```

### Sub-workflows
```javascript
// Execute Workflow node
{
  "source": "database",
  "workflowId": "123",
  "passInput": true
}
```

### Custom Webhook Responses
```javascript
// In Code node after Webhook
return {
  json: {
    success: true,
    data: processedData
  },
  webhookResponse: {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'value'
    }
  }
};
```

## Performance Optimization

### 1. Batch Processing
```javascript
// Process items in batches
const batchSize = 100;
const batches = [];

for (let i = 0; i < items.length; i += batchSize) {
  batches.push(items.slice(i, i + batchSize));
}
```

### 2. Rate Limiting
```javascript
// Add delay between API calls
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

for (const item of items) {
  await processItem(item);
  await delay(1000); // 1 second delay
}
```

### 3. Memory Management
```javascript
// Clear large variables when done
let largeData = await fetchLargeDataset();
// Process data
processedData = transform(largeData);
largeData = null; // Clear memory
```

## Debugging Workflows

### Execution Data
- Click on nodes to see input/output
- Check execution history
- Use console.log in Code nodes
- Enable "Save Execution Progress"

### Common Issues
1. **No data passing**: Check connections
2. **Expression errors**: Verify field names
3. **Authentication failures**: Check credentials
4. **Timeout errors**: Increase timeout settings
5. **Memory issues**: Reduce batch sizes

### Debug Techniques
```javascript
// Add debug node
console.log('Input data:', $input.all());
console.log('Current item:', $json);

// Return debug info
return [{
  json: {
    debug: {
      inputCount: $input.all().length,
      firstItem: $input.first().json,
      timestamp: new Date().toISOString()
    },
    ...originalData
  }
}];
```

## Best Practices

1. **Name nodes descriptively**: "Get Customer Data" not "HTTP Request"
2. **Add notes**: Document complex logic
3. **Use consistent patterns**: Standardize error handling
4. **Test with sample data**: Before production
5. **Version control**: Export and backup workflows
6. **Monitor executions**: Set up alerts for failures
7. **Optimize for scale**: Consider execution limits
8. **Secure sensitive data**: Use credentials, not hardcoded values

This guide covers the essential concepts for building effective n8n workflows.