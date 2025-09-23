# n8n Nodes Reference Guide

## Core Nodes

### Trigger Nodes

#### Webhook
```javascript
{
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "webhook-path",
    "responseMode": "onReceived", // or "lastNode"
    "responseData": "allEntries",
    "responseHeaders": {
      "values": {
        "Content-Type": "application/json"
      }
    },
    "options": {
      "responseContentType": "application/json",
      "responsePropertyName": "data",
      "rawBody": false
    }
  }
}
```

#### Schedule Trigger
```javascript
{
  "name": "Schedule",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [{
        "field": "cronExpression",
        "expression": "0 */2 * * *" // Every 2 hours
      }]
    }
  }
}
```

#### Email Trigger (IMAP)
```javascript
{
  "name": "Email Trigger",
  "type": "n8n-nodes-base.emailReadImap",
  "parameters": {
    "mailbox": "INBOX",
    "format": "resolved",
    "options": {
      "customEmailConfig": "[Gmail]/All Mail",
      "allowUnauthorizedCerts": false,
      "forceReconnect": 60
    }
  }
}
```

### Data Transformation Nodes

#### Code Node
```javascript
// JavaScript Code
for (const item of $input.all()) {
  item.json.processed = true;
  item.json.timestamp = Date.now();
}
return $input.all();

// Python Code (when enabled)
items = []
for item in _input.all():
    item['json']['processed'] = True
    items.append(item)
return items
```

#### Set Node
```javascript
{
  "name": "Set",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "mode": "manual",
    "fields": {
      "values": [
        {
          "name": "status",
          "value": "active",
          "type": "string"
        },
        {
          "name": "timestamp",
          "value": "={{ $now }}",
          "type": "dateTime"
        },
        {
          "name": "count",
          "value": "={{ $json.items.length }}",
          "type": "number"
        }
      ]
    },
    "include": "all" // or "selected", "except"
  }
}
```

#### Function Node
```javascript
// Access methods
const items = $input.all(); // Get all items
const firstItem = $input.first(); // Get first item
const lastItem = $input.last(); // Get last item

// Helpers available
const helpers = {
  $executionId: $executionId,
  $workflow: $workflow,
  $now: DateTime.now(),
  $today: DateTime.now().startOf('day'),
  $jmespath: $jmespath
};

// Return format
return items.map(item => ({
  json: transformedData,
  binary: item.binary,
  pairedItem: item.pairedItem
}));
```

### Flow Control Nodes

#### IF Node
```javascript
{
  "name": "IF",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "value1": "={{ $json.status }}",
          "operation": "equals",
          "value2": "active"
        },
        {
          "combineOperation": "and",
          "value1": "={{ $json.amount }}",
          "operation": "largerEqual",
          "value2": 100
        }
      ]
    }
  }
}
```

#### Switch Node
```javascript
{
  "name": "Switch",
  "type": "n8n-nodes-base.switch",
  "parameters": {
    "mode": "expression",
    "value": "={{ $json.department }}",
    "rules": [
      {
        "operation": "equals",
        "value": "sales",
        "output": "sales"
      },
      {
        "operation": "equals",
        "value": "support",
        "output": "support"
      },
      {
        "operation": "contains",
        "value": "tech",
        "output": "technical"
      }
    ],
    "fallbackOutput": "other"
  }
}
```

#### Merge Node
```javascript
{
  "name": "Merge",
  "type": "n8n-nodes-base.merge",
  "parameters": {
    "mode": "combine", // Options: append, mergeByKey, mergeByPosition, multiplex, chooseBranch
    "combinationMode": "mergeByPosition",
    "options": {
      "includeUnpaired": true,
      "clashHandling": "preferInput2"
    }
  }
}
```

#### Split In Batches
```javascript
{
  "name": "Split In Batches",
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 10,
    "options": {
      "reset": false // Reset for new execution
    }
  }
}
```

### Database Nodes

#### PostgreSQL
```javascript
{
  "name": "Postgres",
  "type": "n8n-nodes-base.postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT * FROM users WHERE status = $1",
    "additionalFields": {
      "queryParams": "active",
      "mode": "independently", // or "transaction"
      "retryOnFail": true,
      "continueOnFail": false
    }
  }
}

// Insert operation
{
  "operation": "insert",
  "schema": "public",
  "table": "users",
  "columns": "name,email,status",
  "returnFields": "*"
}
```

#### MongoDB
```javascript
{
  "name": "MongoDB",
  "type": "n8n-nodes-base.mongoDb",
  "parameters": {
    "operation": "find",
    "collection": "users",
    "query": {
      "status": "active",
      "age": { "$gte": 18 }
    },
    "options": {
      "limit": 100,
      "sort": { "createdAt": -1 },
      "projection": { "password": 0 }
    }
  }
}

// Aggregate operation
{
  "operation": "aggregate",
  "collection": "orders",
  "pipeline": [
    { "$match": { "status": "completed" } },
    { "$group": {
      "_id": "$customerId",
      "total": { "$sum": "$amount" }
    }}
  ]
}
```

#### Redis
```javascript
{
  "name": "Redis",
  "type": "n8n-nodes-base.redis",
  "parameters": {
    "operation": "set",
    "key": "user:{{ $json.id }}",
    "value": "={{ JSON.stringify($json) }}",
    "expire": true,
    "ttl": 3600
  }
}
```

### Communication Nodes

#### HTTP Request
```javascript
{
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyType": "json",
    "jsonBody": "={{ JSON.stringify($json) }}",
    "options": {
      "retry": {
        "maxTries": 3,
        "waitBetweenTries": 1000,
        "maxRetryAfter": 5000,
        "retryOnStatusCode": "429,500,502,503,504"
      },
      "timeout": 10000,
      "followRedirects": true,
      "ignoreSSLIssues": false
    }
  }
}
```

#### GraphQL
```javascript
{
  "name": "GraphQL",
  "type": "n8n-nodes-base.graphql",
  "parameters": {
    "endpoint": "https://api.example.com/graphql",
    "requestFormat": "graphql",
    "query": `
      query GetUser($id: ID!) {
        user(id: $id) {
          name
          email
          posts {
            title
            content
          }
        }
      }
    `,
    "variables": {
      "id": "={{ $json.userId }}"
    }
  }
}
```

#### Email Send
```javascript
{
  "name": "Send Email",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "sender@example.com",
    "toEmail": "={{ $json.email }}",
    "subject": "Welcome {{ $json.name }}",
    "text": "Hello {{ $json.name }},\n\nWelcome to our service!",
    "html": "<h1>Hello {{ $json.name }}</h1><p>Welcome!</p>",
    "attachments": "data",
    "options": {
      "ccEmail": "cc@example.com",
      "bccEmail": "bcc@example.com",
      "replyTo": "noreply@example.com"
    }
  }
}
```

### File & Data Nodes

#### Read/Write Files From Disk
```javascript
// Read Binary File
{
  "name": "Read Binary File",
  "type": "n8n-nodes-base.readBinaryFile",
  "parameters": {
    "filePath": "/path/to/file.pdf",
    "dataPropertyName": "document"
  }
}

// Write Binary File
{
  "name": "Write Binary File",
  "type": "n8n-nodes-base.writeBinaryFile",
  "parameters": {
    "fileName": "/path/to/output.pdf",
    "dataPropertyName": "document",
    "options": {
      "append": false
    }
  }
}
```

#### Spreadsheet File
```javascript
{
  "name": "Spreadsheet File",
  "type": "n8n-nodes-base.spreadsheetFile",
  "parameters": {
    "operation": "fromFile",
    "fileFormat": "csv",
    "options": {
      "headerRow": true,
      "delimiter": ",",
      "fromLine": 1,
      "maxRows": 1000,
      "enableBooleanOutput": true
    }
  }
}
```

#### XML
```javascript
{
  "name": "XML",
  "type": "n8n-nodes-base.xml",
  "parameters": {
    "mode": "jsonToxml", // or "xmlToJson"
    "options": {
      "format": true,
      "headless": false,
      "ignoreAttributes": false,
      "mergeAttributes": true
    }
  }
}
```

### Utility Nodes

#### Date & Time
```javascript
{
  "name": "Date & Time",
  "type": "n8n-nodes-base.dateTime",
  "parameters": {
    "action": "calculate",
    "value": "={{ $json.date }}",
    "operation": "add",
    "duration": 7,
    "timeUnit": "days",
    "outputFieldName": "dueDate",
    "options": {
      "toFormat": "yyyy-MM-dd",
      "toTimezone": "America/New_York"
    }
  }
}
```

#### Crypto
```javascript
{
  "name": "Crypto",
  "type": "n8n-nodes-base.crypto",
  "parameters": {
    "action": "hash",
    "type": "SHA256",
    "value": "={{ $json.password }}",
    "encoding": "hex",
    "outputFieldName": "hashedPassword"
  }
}

// HMAC
{
  "action": "hmac",
  "type": "SHA256",
  "value": "={{ $json.data }}",
  "secret": "={{ $env.SECRET_KEY }}"
}
```

#### Wait
```javascript
{
  "name": "Wait",
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "resume": "timeInterval",
    "amount": 5,
    "unit": "seconds"
  }
}

// Wait for webhook
{
  "resume": "webhook",
  "options": {
    "httpMethod": "POST",
    "responseData": "allEntries",
    "waitTimeoutDuration": 3600
  }
}
```

### Integration Nodes

#### Slack
```javascript
{
  "name": "Slack",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "resource": "message",
    "operation": "post",
    "channel": "#general",
    "text": "New order received!",
    "attachments": [
      {
        "color": "#36a64f",
        "fields": [
          {
            "title": "Order ID",
            "value": "={{ $json.orderId }}",
            "short": true
          }
        ]
      }
    ],
    "otherOptions": {
      "thread_ts": "={{ $json.threadId }}",
      "mrkdwn": true
    }
  }
}
```

#### Google Sheets
```javascript
{
  "name": "Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "append",
    "documentId": "sheet-id-here",
    "sheetName": "Sheet1",
    "dataMode": "autoMapInputData",
    "options": {
      "cellFormat": "USER_ENTERED",
      "insertDataOption": "INSERT_ROWS",
      "insertUnmatchedColumns": false,
      "useAppend": true
    }
  }
}
```

#### AWS S3
```javascript
{
  "name": "AWS S3",
  "type": "n8n-nodes-base.awsS3",
  "parameters": {
    "operation": "upload",
    "bucketName": "my-bucket",
    "fileName": "={{ $json.filename }}",
    "binaryPropertyName": "data",
    "additionalFields": {
      "acl": "private",
      "storageClass": "STANDARD",
      "serverSideEncryption": "AES256",
      "tagsUi": {
        "tagsValues": [
          {
            "key": "environment",
            "value": "production"
          }
        ]
      }
    }
  }
}
```

## Custom Node Development

### Basic Structure
```javascript
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class MyCustomNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Custom Node',
    name: 'myCustomNode',
    group: ['transform'],
    version: 1,
    description: 'Custom node description',
    defaults: {
      name: 'My Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      // Node properties here
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      // Process each item
      returnData.push({
        json: processedData,
        binary: items[i].binary,
      });
    }

    return [returnData];
  }
}
```

This reference guide provides comprehensive examples of n8n's most commonly used nodes and their configurations.