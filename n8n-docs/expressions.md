# n8n Expressions Guide

## Expression Basics

n8n uses JavaScript expressions wrapped in `{{ }}` to access and transform data dynamically.

### Basic Syntax
```javascript
// Simple field access
{{ $json.fieldName }}

// Nested field access
{{ $json.user.profile.email }}

// Array access
{{ $json.items[0].name }}

// With default value
{{ $json.field || 'default value' }}
```

## Variables Reference

### $json
Current item's JSON data
```javascript
{{ $json }}                    // Entire JSON object
{{ $json.name }}               // Specific field
{{ $json["field-name"] }}      // Fields with special characters
```

### $input
Access input data
```javascript
{{ $input.all() }}             // All input items
{{ $input.first() }}           // First input item
{{ $input.last() }}            // Last input item
{{ $input.item }}              // Current input item (in loops)
```

### $node
Access data from other nodes
```javascript
{{ $node["NodeName"].json }}                     // JSON from specific node
{{ $node["NodeName"].json.field }}              // Field from specific node
{{ $node["NodeName"].all() }}                   // All items from node
{{ $node["NodeName"].first() }}                 // First item from node
{{ $node["NodeName"].last() }}                  // Last item from node
{{ $node["NodeName"].item(2).json }}            // Specific item by index
```

### $() Function (Alternative Syntax)
```javascript
{{ $('NodeName').first().json.field }}          // First item's field
{{ $('NodeName').last().json.field }}           // Last item's field
{{ $('NodeName').all()[0].json.field }}         // Item by index
{{ $('NodeName').item.json.field }}             // Current paired item
```

### $prevNode
Shortcut for previous node
```javascript
{{ $prevNode.json.field }}                      // Previous node's data
{{ $prevNode.all() }}                          // All items from previous node
```

### $workflow
Workflow metadata
```javascript
{{ $workflow.id }}                              // Workflow ID
{{ $workflow.name }}                            // Workflow name
{{ $workflow.active }}                          // Is workflow active
```

### $execution
Execution context
```javascript
{{ $execution.id }}                            // Execution ID
{{ $execution.mode }}                          // Execution mode (manual, trigger, etc.)
{{ $execution.resumeUrl }}                     // Resume URL for wait nodes
{{ $execution.resumeFormUrl }}                 // Form URL for wait nodes
```

### $env
Environment variables
```javascript
{{ $env.VARIABLE_NAME }}                       // Access environment variable
{{ $env["VARIABLE-NAME"] }}                    // Variable with special characters
```

### Date/Time Variables
```javascript
{{ $now }}                                      // Current DateTime object
{{ $today }}                                    // Today at midnight
{{ DateTime.now() }}                           // Current DateTime
{{ DateTime.local() }}                         // Local DateTime
```

### Other Variables
```javascript
{{ $itemIndex }}                               // Current item index (0-based)
{{ $runIndex }}                                // Current run index (for Split in Batches)
{{ $nodeVersion }}                             // Node version
{{ $position() }}                              // Item position (1-based)
{{ $context }}                                 // Context data (in sub-workflows)
```

## Data Transformation

### String Operations
```javascript
// Basic string methods
{{ $json.text.toUpperCase() }}                // Convert to uppercase
{{ $json.text.toLowerCase() }}                // Convert to lowercase
{{ $json.text.trim() }}                       // Remove whitespace
{{ $json.text.substring(0, 10) }}             // Get substring
{{ $json.text.replace('old', 'new') }}        // Replace text
{{ $json.text.split(',') }}                   // Split into array

// Template literals
{{ `Hello ${$json.name}!` }}                  // String interpolation
{{ `Total: $${$json.price * $json.quantity}` }}

// Regex
{{ $json.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)[0] }}
{{ $json.text.replace(/\s+/g, '-') }}         // Replace spaces with dashes
```

### Number Operations
```javascript
// Math operations
{{ $json.price * 1.2 }}                       // Multiplication
{{ $json.total / $json.count }}               // Division
{{ Math.round($json.value) }}                 // Round
{{ Math.floor($json.value) }}                 // Floor
{{ Math.ceil($json.value) }}                  // Ceiling
{{ parseFloat($json.text) }}                  // String to float
{{ parseInt($json.text) }}                    // String to integer

// Formatting
{{ $json.price.toFixed(2) }}                  // Fixed decimal places
{{ $json.number.toLocaleString() }}           // Locale formatting
```

### Array Operations
```javascript
// Array methods
{{ $json.items.length }}                      // Array length
{{ $json.items.join(', ') }}                  // Join array
{{ $json.items.reverse() }}                   // Reverse array
{{ $json.items.sort() }}                      // Sort array
{{ $json.items.slice(0, 5) }}                 // Get slice
{{ $json.items.includes('value') }}           // Check if includes

// Map
{{ $json.users.map(u => u.email) }}           // Extract emails
{{ $json.items.map(i => i.price * 1.2) }}     // Transform values

// Filter
{{ $json.items.filter(i => i.active) }}       // Filter active items
{{ $json.users.filter(u => u.age >= 18) }}    // Filter by condition

// Reduce
{{ $json.items.reduce((sum, i) => sum + i.price, 0) }}  // Sum prices
{{ $json.data.reduce((acc, i) => acc.concat(i.tags), []) }}  // Flatten

// Find
{{ $json.users.find(u => u.id === 123) }}     // Find single item
{{ $json.items.findIndex(i => i.id === $json.targetId) }}  // Find index
```

### Object Operations
```javascript
// Object methods
{{ Object.keys($json) }}                      // Get keys
{{ Object.values($json) }}                    // Get values
{{ Object.entries($json) }}                   // Get entries
{{ Object.assign({}, $json, {new: 'field'}) }}  // Merge objects

// Spread operator
{{ {...$json, status: 'updated'} }}           // Add/override field
{{ {...$json.user, ...($json.profile || {})} }}  // Merge with default

// Destructuring
{{ (({name, email}) => ({name, email}))($json) }}  // Pick fields
```

## Date & Time Expressions

### DateTime Luxon Library
```javascript
// Current date/time
{{ $now.toISO() }}                           // ISO format
{{ $now.toFormat('yyyy-MM-dd') }}            // Custom format
{{ $now.toFormat('HH:mm:ss') }}              // Time only
{{ $now.toMillis() }}                        // Unix timestamp (ms)
{{ $now.toSeconds() }}                       // Unix timestamp (s)

// Date math
{{ $now.plus({days: 7}) }}                   // Add 7 days
{{ $now.minus({hours: 2}) }}                 // Subtract 2 hours
{{ $now.startOf('day') }}                    // Start of day
{{ $now.endOf('month') }}                    // End of month

// Parsing dates
{{ DateTime.fromISO($json.date) }}           // Parse ISO date
{{ DateTime.fromMillis($json.timestamp) }}   // Parse timestamp
{{ DateTime.fromFormat($json.date, 'MM/dd/yyyy') }}  // Parse custom format

// Formatting
{{ DateTime.fromISO($json.date).toFormat('MMMM dd, yyyy') }}
{{ DateTime.fromISO($json.date).toRelative() }}  // "2 hours ago"
{{ DateTime.fromISO($json.date).toLocaleString() }}  // Locale format

// Comparisons
{{ DateTime.fromISO($json.date1) > DateTime.fromISO($json.date2) }}
{{ $now.diff(DateTime.fromISO($json.date), 'days').days }}  // Days difference
```

## Conditional Expressions

### Ternary Operator
```javascript
{{ $json.status === 'active' ? 'Yes' : 'No' }}
{{ $json.age >= 18 ? 'Adult' : 'Minor' }}
{{ $json.price > 100 ? $json.price * 0.9 : $json.price }}
```

### Logical Operators
```javascript
{{ $json.field1 && $json.field2 }}           // AND
{{ $json.field1 || $json.field2 }}           // OR
{{ !$json.isActive }}                        // NOT
{{ $json.field ?? 'default' }}               // Nullish coalescing
```

### Optional Chaining
```javascript
{{ $json.user?.profile?.email }}             // Safe navigation
{{ $json.data?.items?.[0]?.name }}           // Safe array access
{{ $json.func?.() }}                         // Safe function call
```

## Advanced Expressions

### Complex Transformations
```javascript
// Group by category
{{
  $input.all().reduce((acc, item) => {
    const key = item.json.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item.json);
    return acc;
  }, {})
}}

// Pivot table
{{
  $json.data.reduce((acc, row) => {
    const key = row.date;
    acc[key] = acc[key] || {};
    acc[key][row.metric] = row.value;
    return acc;
  }, {})
}}

// Flatten nested structure
{{
  $json.users.flatMap(user =>
    user.orders.map(order => ({
      userId: user.id,
      userName: user.name,
      orderId: order.id,
      orderTotal: order.total
    }))
  )
}}
```

### Error Handling
```javascript
// Try-catch in expressions
{{ (() => {
  try {
    return JSON.parse($json.jsonString);
  } catch(e) {
    return {};
  }
})() }}

// Safe JSON parsing
{{ $json.data ? JSON.parse($json.data) : {} }}

// Validation
{{
  $json.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($json.email)
    ? $json.email
    : 'invalid@example.com'
}}
```

### Custom Functions
```javascript
// IIFE for complex logic
{{ (() => {
  const tax = $json.price * 0.08;
  const shipping = $json.weight * 2;
  return $json.price + tax + shipping;
})() }}

// Reusable function
{{
  ((items) => {
    return items
      .filter(i => i.active)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  })($json.items)
}}
```

## JMESPath Support

n8n supports JMESPath for complex queries:
```javascript
{{ $jmespath($json, "users[?age > `18`].email") }}  // Filter users
{{ $jmespath($json, "sort_by(items, &price)") }}    // Sort items
{{ $jmespath($json, "max_by(products, &rating)") }} // Get highest rated
```

## Expression Tips

### Performance
1. Use `$prevNode` instead of `$node["Previous Node"]` when possible
2. Cache complex calculations in Set nodes
3. Avoid repeated expensive operations

### Debugging
```javascript
// Log to console (in Code nodes)
console.log('Debug:', $json);

// Return debug info
{{ JSON.stringify($json, null, 2) }}        // Pretty print JSON

// Check data type
{{ typeof $json.field }}                    // Get type
{{ Array.isArray($json.field) }}            // Check if array
{{ $json.field === null }}                  // Check null
{{ $json.field === undefined }}             // Check undefined
```

### Common Patterns
```javascript
// Default values
{{ $json.field || 'default' }}
{{ $json.field ?? 'default' }}              // Includes 0 and false

// Safe number conversion
{{ Number($json.field) || 0 }}
{{ parseInt($json.field) || 0 }}

// Boolean conversion
{{ !!$json.field }}
{{ $json.field === 'true' }}

// Unique values
{{ [...new Set($json.items)] }}

// URL encoding
{{ encodeURIComponent($json.query) }}
{{ encodeURI($json.url) }}

// Base64 encoding
{{ Buffer.from($json.text).toString('base64') }}
{{ Buffer.from($json.base64, 'base64').toString() }}
```

This comprehensive guide covers n8n's expression system and common usage patterns.