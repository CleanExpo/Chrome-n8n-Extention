# n8n Core Concepts

## What is n8n?

n8n is a free and open-source workflow automation tool that allows you to connect different services and automate tasks. It's self-hostable and provides a visual interface for creating workflows.

## Key Concepts

### 1. Workflows
A workflow is a collection of nodes connected together to automate a process. Each workflow:
- Has a unique ID and name
- Contains one or more nodes
- Defines the flow of data between nodes
- Can be triggered manually or automatically

### 2. Nodes
Nodes are the building blocks of workflows. Each node:
- Represents a specific action or service
- Has inputs and outputs
- Can transform, filter, or route data
- Connects to other nodes via connections

#### Node Types:
- **Trigger Nodes**: Start workflows (webhooks, schedules, etc.)
- **Action Nodes**: Perform operations (HTTP requests, database queries, etc.)
- **Logic Nodes**: Control flow (IF, Switch, Merge, etc.)

### 3. Connections
Connections link nodes together and define the flow of data:
- Main connection: Primary data flow
- Error connection: Handle errors from nodes
- Multiple outputs: Nodes can have multiple output branches

### 4. Executions
An execution is a single run of a workflow:
- Manual executions: Started by user
- Automatic executions: Started by triggers
- Each execution has a unique ID
- Execution data is stored for debugging

### 5. Items
Items are individual data units that flow through the workflow:
- JSON objects containing data
- Arrays of items can be processed
- Each node processes items individually or in batches

### 6. Expressions
n8n expressions allow dynamic data access:
```javascript
// Access data from previous nodes
{{ $node["NodeName"].json.fieldName }}

// Access current item data
{{ $json.fieldName }}

// Use JavaScript
{{ $json.price * 1.2 }}

// Access environment variables
{{ $env.API_KEY }}
```

### 7. Credentials
Secure storage for authentication details:
- OAuth2 credentials
- API keys
- Database connections
- Encrypted at rest
- Shared across workflows

## Workflow Execution Model

### Execution Order
1. Workflows start from trigger nodes
2. Data flows from left to right
3. Nodes execute sequentially unless parallel branches exist
4. Each node waits for previous nodes to complete

### Data Flow
```
Trigger → Transform → Action → Output
   ↓          ↓          ↓        ↓
  Data      Data       Data    Result
```

### Error Handling
- Nodes can have error outputs
- Error workflows can be triggered
- Retry logic can be configured
- Manual error recovery available

## Architecture

### Components
1. **Editor UI**: Visual workflow builder
2. **Execution Engine**: Runs workflows
3. **Database**: Stores workflows and execution data
4. **Queue**: Manages execution order (for scaled deployments)
5. **API**: REST API for external integration

### Deployment Options
- **Self-hosted**: On your own infrastructure
- **n8n Cloud**: Managed hosting
- **Docker**: Container deployment
- **npm**: Direct installation

## Variables and Data

### Variable Types
- **$json**: Current item's JSON data
- **$binary**: Binary data handling
- **$node**: Access other nodes' data
- **$workflow**: Workflow metadata
- **$execution**: Execution context
- **$env**: Environment variables
- **$now**: Current timestamp
- **$today**: Today's date

### Data Transformation
```javascript
// Map array
{{ $json.items.map(item => item.name) }}

// Filter
{{ $json.items.filter(item => item.active) }}

// Reduce
{{ $json.items.reduce((sum, item) => sum + item.price, 0) }}
```

## Workflow Patterns

### Common Patterns

1. **ETL (Extract, Transform, Load)**
```
API → Transform → Database
```

2. **Webhook Processing**
```
Webhook → Validate → Process → Response
```

3. **Scheduled Tasks**
```
Schedule → Fetch → Process → Notify
```

4. **Error Handling**
```
Main Flow → Error → Notification
```

5. **Conditional Routing**
```
Input → IF → Route A
          ↓
        Route B
```

## Best Practices

### Design Principles
1. **Keep workflows simple**: Break complex workflows into smaller ones
2. **Use sub-workflows**: Reusable workflow components
3. **Handle errors**: Always add error handling
4. **Document workflows**: Use notes and descriptions
5. **Test thoroughly**: Use test data before production

### Performance Tips
1. Limit items processed per execution
2. Use pagination for large datasets
3. Implement rate limiting for APIs
4. Cache frequently accessed data
5. Use binary data for large files

### Security
1. Use credentials instead of hardcoding
2. Validate webhook inputs
3. Sanitize user inputs
4. Limit webhook access with authentication
5. Regular credential rotation

## Advanced Features

### Sub-workflows
- Call other workflows from within a workflow
- Pass data between workflows
- Reuse common logic
- Modular workflow design

### Custom Functions
```javascript
// Custom function node
items = items.map(item => {
  return {
    json: {
      ...item.json,
      processed: true,
      timestamp: new Date().toISOString()
    }
  };
});
return items;
```

### Webhook Response
```javascript
// Custom webhook response
return {
  webhookResponse: {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data: items
    })
  }
};
```

## Integration Capabilities

### Supported Protocols
- REST API
- GraphQL
- WebSocket
- SOAP
- Database connections
- File systems
- Cloud storage

### Authentication Methods
- API Key
- OAuth 2.0
- Basic Auth
- JWT
- Custom headers
- Session-based

### Data Formats
- JSON
- XML
- CSV
- Binary
- Form data
- Multipart

This documentation provides the foundation for understanding n8n's architecture and capabilities.