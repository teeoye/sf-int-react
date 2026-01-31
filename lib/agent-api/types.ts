import { TopLevelSpec } from 'vega-lite';

// ============================================================
// Core Types
// ============================================================

export enum AgentMessageRole {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant',
}

export enum AgentApiState {
    IDLE = "idle",
    LOADING = "loading",
    STREAMING = "streaming",
    PLANNING = "planning",
    EXECUTING_TOOL = "executing_tool",
    EXECUTING_SQL = "executing_sql",
    RUNNING_ANALYTICS = "running_analytics",
}

// ============================================================
// Message Content Types
// ============================================================

export interface AgentMessageTextContent {
    type: 'text';
    text: string;
}

export interface AgentMessageToolUseContent {
    type: 'tool_use';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tool_use: any;
}

export interface AgentMessageToolResultsContent {
    type: 'tool_results';
    tool_results: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: any[];
        name?: string;
    };
}

export interface AgentMessageChartContent {
    type: 'chart';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart: any;
}

export interface AgentMessageTableContent {
    type: 'table';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any;
}

export interface AgentMessageFetchedTableContent {
    type: 'fetched_table';
    tableMarkdown: string;
    toolResult: boolean;
}

export interface AgentMessageServerTableContent {
    type: 'server_table';
    columns: { name: string; type: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[][];
    tableMarkdown: string;
    query_id?: string;
    sql?: string;
}

export interface AgentMessageSuggestedQueriesContent {
    type: 'suggested_queries';
    queries: SuggestedQuery[];
}

export type AgentMessageContent =
    | AgentMessageTextContent
    | AgentMessageToolUseContent
    | AgentMessageToolResultsContent
    | AgentMessageChartContent
    | AgentMessageTableContent
    | AgentMessageFetchedTableContent
    | AgentMessageServerTableContent
    | AgentMessageSuggestedQueriesContent;

export interface AgentMessage {
    id: string;
    role: AgentMessageRole;
    content: AgentMessageContent[];
}

// ============================================================
// Request Types
// ============================================================

/**
 * Request body for the Snowflake Agent Object API.
 *
 * Endpoint: POST /api/v2/databases/{database}/schemas/{schema}/agents/{agent_name}:run
 *
 * @example
 * ```python
 * body = {
 *     "messages": [
 *         {"role": "user", "content": [{"type": "text", "text": "How many plants?"}]}
 *     ]
 * }
 * ```
 */
export interface SnowflakeAgentRequestBody {
    messages: AgentMessage[];
    thread_id?: string;
    experimental?: {
        EnableRelatedQueries?: boolean;
    };
}

/**
 * Request body for the /api/agent proxy endpoint.
 */
export interface AgentProxyRequestBody {
    database: string;
    schema: string;
    agentName: string;
    messages: AgentMessage[];
    thread_id?: string;
    experimental?: {
        EnableRelatedQueries?: boolean;
    };
}

// ============================================================
// SSE Event Types (from actual API responses)
// ============================================================

export type AgentSSEEventType =
    | 'response.status'
    | 'response.thinking.delta'
    | 'response.thinking'
    | 'response.text.delta'
    | 'response.text'
    | 'response.tool_use'
    | 'response.tool_result.status'
    | 'response.tool_result'
    | 'response'
    | 'done';

export type AgentStatusValue =
    | 'planning'
    | 'extracting_tool_calls'
    | 'executing_tools'
    | 'streaming_analyst_results'
    | 'reasoning_agent_stop'
    | 'reevaluating_plan'
    | 'proceeding_to_answer';

export type ToolResultStatusValue =
    | 'executing_tool'
    | 'interpreting_question'
    | 'generating_sql'
    | 'postprocessing_sql'
    | 'Executing SQL'
    | 'done';

// ============================================================
// SSE Event Data Structures
// ============================================================

export interface AgentTextDeltaEventData {
    content_index: number;
    text: string;
}

export interface AgentToolUseEventData {
    client_side_execute: boolean;
    content_index: number;
    input: Record<string, unknown>;
    name: string;
    tool_use_id: string;
    type: string;
}

export interface ResultSetMetaData {
    format: string;
    numRows: number;
    rowType: Array<{
        name: string;
        type: string;
        nullable: boolean;
    }>;
}

export interface CortexAnalystResultSet {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[][];
    resultSetMetaData: ResultSetMetaData;
    statementHandle: string;
}

export interface AgentToolResultEventData {
    content: Array<{
        type: 'json';
        json: {
            query_id: string;
            result_set: CortexAnalystResultSet;
            sql: string;
            text: string;
        };
    }>;
    content_index: number;
    name: string;
    status: 'success' | 'error';
    tool_use_id: string;
    type: string;
}

export interface TokenUsage {
    context_window: number;
    input_tokens: {
        cache_read: number;
        cache_write: number;
        total: number;
        uncached: number;
    };
    model_name: string;
    output_tokens: {
        total: number;
    };
}

// ============================================================
// Utility Types
// ============================================================

export interface Data2AnalyticsObject {
    explanation: string | null;
    chartSpec: TopLevelSpec | null;
}

export interface Citation {
    text: string;
    number: number;
}

export interface CortexSearchCitationSource {
    source_id: string | number;
    text: string;
    doc_id: string;
    doc_type: string;
}

export interface SuggestedQuery {
    query: string;
}
