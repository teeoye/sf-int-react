# Snowflake Cortex Agents API

## Endpoints

### Snowflake Agent Object API (Direct)

```
POST /api/v2/databases/{database}/schemas/{schema}/agents/{agent_name}:run
```

### Next.js Proxy (Used by Frontend)

```
POST /api/agent    # Run agent with message
POST /api/threads  # Create conversation thread
```

The proxy forwards to Snowflake, avoiding CORS issues.

## Threads

Threads persist conversation context server-side, so you don't need to send full message history.

### Create Thread
```
POST /api/v2/cortex/threads
→ Returns: thread_id (UUID string)
```

### Using Threads
1. Create thread → get `thread_id`
2. First message: `{thread_id, parent_message_id: 0, messages: [user msg]}`
3. Response `metadata` events include `message_id` for user & assistant
4. Follow-up: `{thread_id, parent_message_id: <last_assistant_id>, messages: [new msg]}`

## Authentication

```
Authorization: Bearer <jwt_token>
X-Snowflake-Authorization-Token-Type: KEYPAIR_JWT
```

Get JWT from `/api/jwt`.

## Request Body

### Proxy API (`/api/agent`)

```json
{
  "database": "DEV_GOLD",
  "schema": "SENAEI",
  "agentName": "PLANTS",
  "messages": [
    {"role": "user", "content": [{"type": "text", "text": "How many plants?"}]}
  ],
  "thread_id": "optional-for-continuity",
  "experimental": {"EnableRelatedQueries": true}
}
```

### Direct Snowflake API

Same as above but without `database`, `schema`, `agentName` (those are in the URL).

## SSE Response Events

The API returns Server-Sent Events. Format: `event: <type>\ndata: <json>\n\n`

### `response.status`

Agent status updates.

```json
{"message": "Planning the next steps", "status": "planning"}
{"message": "Choosing data sources to use", "status": "extracting_tool_calls"}
{"message": "Getting additional context", "status": "executing_tools"}
{"message": "Forming the answer", "status": "proceeding_to_answer"}
```

### `response.text.delta`

Streaming response text.

```json
{"content_index": 1, "text": "There are **12,859**"}
```

### `response.tool_use`

Tool invocation.

```json
{
  "client_side_execute": false,
  "content_index": 1,
  "input": {"query": "How many plants?"},
  "name": "PLANTS",
  "tool_use_id": "toolu_bdrk_...",
  "type": "cortex_analyst_text_to_sql"
}
```

### `response.tool_result.status`

Tool execution progress.

```json
{"message": "Generating SQL", "status": "generating_sql", "tool_type": "cortex_analyst_text_to_sql", "tool_use_id": "..."}
{"message": "Query ID: 01c2...", "status": "Executing SQL", "details": {"QueryID": "01c2..."}}
```

### `response.tool_result`

Tool results.

```json
{
  "content": [{
    "type": "json",
    "json": {
      "query_id": "01c2...",
      "result_set": {"data": [["12859"]], "resultSetMetaData": {...}},
      "sql": "SELECT COUNT(*) ...",
      "text": "The question is clear..."
    }
  }],
  "name": "PLANTS",
  "status": "success",
  "tool_use_id": "toolu_bdrk_..."
}
```

### `response.suggested_queries`

Follow-up question suggestions (when `EnableRelatedQueries: true`).

```json
{
  "content_index": 9,
  "suggested_queries": [
    {"query": "What types of products are most common?"},
    {"query": "How many plants are in industrial cities?"}
  ]
}
```

### `response.thinking.delta` / `response.thinking`

Agent reasoning (can be ignored or displayed).

### `response`

Final complete response with all content blocks and token usage.

### `done`

End of stream: `data: [DONE]`

## Python Example

```python
import requests
from sseclient import SSEClient

# Get JWT
token = requests.get("http://localhost:3000/api/jwt").json()["token"]["token"]

# Call proxy
response = requests.post(
    "http://localhost:3000/api/agent",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    },
    json={
        "database": "DEV_GOLD",
        "schema": "SENAEI",
        "agentName": "PLANTS",
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": "How many plants?"}]}
        ]
    },
    stream=True
)

for event in SSEClient(response).events():
    print(f"{event.event}: {event.data}")
```

## TypeScript Types

See `lib/agent-api/types.ts` for:

- `AgentMessage` - Message structure
- `AgentApiState` - UI states (idle, loading, streaming, etc.)
- `SnowflakeAgentRequestBody` - Direct API request
- `AgentProxyRequestBody` - Proxy request
- SSE event data types
