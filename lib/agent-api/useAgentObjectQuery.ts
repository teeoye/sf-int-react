"use client"

import React from "react";
import { events } from 'fetch-event-stream';
import { AgentMessage, AgentMessageRole, AgentApiState } from "./types";
import { appendTextToAssistantMessage } from "./functions/assistant/appendTextToAssistantMessage";
import { getEmptyAssistantMessage } from "./functions/assistant/getEmptyAssistantMessage";
import { appendAssistantMessageToMessagesList } from "./functions/assistant/appendAssistantMessageToMessagesList";
import { appendToolResponseToAssistantMessage } from "./functions/assistant/appendToolResponseToAssistantMessage";
import { toast } from "sonner";
import shortUUID from "short-uuid";

export interface AgentQueryParams {
    authToken: string;
    database: string;
    schema: string;
    agentName: string;
    role?: string;
    experimental?: {
        EnableRelatedQueries?: boolean;
    };
}

/**
 * Hook for the Snowflake Cortex Agent Object API with thread support.
 *
 * Uses threads to persist conversation context server-side, eliminating
 * the need to send full message history on each request.
 */
export function useAgentObjectQuery(params: AgentQueryParams) {
    const { authToken, database, schema, agentName, role, experimental } = params;
        console.log('authToken', authToken);
        console.log('database', database);
        console.log('schema', schema);
        console.log('agentName', agentName);
        console.log('role', role);
        console.log('experimental', experimental);
    const [agentState, setAgentState] = React.useState<AgentApiState>(AgentApiState.IDLE);
    const [messages, setMessages] = React.useState<AgentMessage[]>([]);
    const [latestAssistantMessageId, setLatestAssistantMessageId] = React.useState<string | null>(null);

    // Thread state
    const [threadId, setThreadId] = React.useState<string | null>(null);
    const [parentMessageId, setParentMessageId] = React.useState<number>(0);

    const handleNewMessage = React.useCallback(async (input: string) => {
        console.log('[Agent API] handleNewMessage called:', { input, inputLength: input.length });
        
        if (!authToken) {
            console.error('[Agent API] Authorization failed: Token is not defined');
            toast.error("Authorization failed: Token is not defined");
            return;
        }

        if (!database || !schema || !agentName) {
            console.log('database', database);
            console.log('schema', schema);
            console.log('agentName', agentName);
            console.error('[Agent API] Missing Snowflake configuration:', { database, schema, agentName });
            toast.error("Missing Snowflake configuration");
            return;
        }

        console.log('[Agent API] Configuration valid, creating user message...');
        // Add user message to local state for display
        const newUserMessage: AgentMessage = {
            id: shortUUID.generate(),
            role: AgentMessageRole.USER,
            content: [{ type: "text", text: input }],
        };
        console.log('[Agent API] User message created:', { id: newUserMessage.id, text: input });
        setMessages(prev => {
            const updated = [...prev, newUserMessage];
            console.log('[Agent API] Messages updated, total count:', updated.length);
            return updated;
        });
        console.log('[Agent API] Setting state to LOADING');
        setAgentState(AgentApiState.LOADING);

        try {
            console.log('[Agent API] Starting message processing...');
            // Create thread if this is the first message
            let currentThreadId = threadId;
            if (!currentThreadId) {
                console.log('[Agent API] No thread ID found, creating new thread...');
                const threadResponse = await fetch('/api/threads', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                });

                console.log('[Agent API] Thread creation response:', { 
                    status: threadResponse.status, 
                    ok: threadResponse.ok 
                });

                if (!threadResponse.ok) {
                    const errorText = await threadResponse.text().catch(() => 'Unknown error');
                    console.error('[Agent API] Failed to create thread:', errorText);
                    throw new Error('Failed to create thread');
                }

                const threadData = await threadResponse.json();
                currentThreadId = threadData.thread_id || threadData;
                console.log('[Agent API] Thread created successfully:', { thread_id: currentThreadId });
                setThreadId(currentThreadId);
            } else {
                console.log('[Agent API] Using existing thread:', { thread_id: currentThreadId });
            }

            // Build request - only send the new message, thread handles history
            console.log('[Agent API] Building request...');
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            };
            if (role) {
                headers['X-Snowflake-Role'] = role;
                console.log('[Agent API] Role header added:', role);
            }

            const body: Record<string, unknown> = {
                database,
                schema,
                agentName,
                thread_id: currentThreadId,
                parent_message_id: parentMessageId,
                messages: [{
                    role: "user",
                    content: [{ type: "text", text: input }],
                }],
            };
            if (experimental) {
                body.experimental = experimental;
                console.log('[Agent API] Experimental options added:', experimental);
            }

            console.log('[Agent API] Request body:', { 
                database, 
                schema, 
                agentName, 
                thread_id: currentThreadId,
                parent_message_id: parentMessageId 
            });

            console.log('[Agent API] Sending request to /api/agent...');
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            console.log('[Agent API] Response received:', { 
                status: response.status, 
                statusText: response.statusText,
                ok: response.ok 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Agent API] Request failed:', { 
                    status: response.status, 
                    errorData 
                });
                toast.error(errorData.message || `Request failed: ${response.status}`);
                setAgentState(AgentApiState.IDLE);
                return;
            }

            // Prepare assistant message for streaming
            console.log('[Agent API] Preparing assistant message for streaming...');
            const assistantMessageId = shortUUID.generate();
            console.log('[Agent API] Assistant message ID:', assistantMessageId);
            setLatestAssistantMessageId(assistantMessageId);
            const assistantMessage = getEmptyAssistantMessage(assistantMessageId);

            // Process SSE stream
            console.log('[Agent API] Starting SSE stream processing...');
            let eventCount = 0;
            for await (const event of events(response)) {
                eventCount++;
                console.log(`[Agent API] SSE Event #${eventCount}:`, { 
                    event: event.event, 
                    dataLength: event.data?.length 
                });

                if (event.data === "[DONE]") {
                    console.log('[Agent API] Stream completed, setting state to IDLE');
                    setAgentState(AgentApiState.IDLE);
                    return;
                }

                let data: Record<string, unknown>;
                try {
                    data = JSON.parse(event.data!);
                    console.log('[Agent API] Event data parsed:', { event: event.event, dataKeys: Object.keys(data) });
                } catch (parseError) {
                    console.warn('[Agent API] Failed to parse event data:', { 
                        event: event.event, 
                        data: event.data,
                        error: parseError 
                    });
                    continue;
                }

                // Handle API errors
                if (data.code) {
                    console.error('[Agent API] API error in event:', { code: data.code, message: data.message });
                    toast.error((data.message as string) || "Agent API error");
                    setAgentState(AgentApiState.IDLE);
                    return;
                }

                const eventType = event.event;
                console.log('[Agent API] Processing event type:', eventType);

                switch (eventType) {
                    case 'metadata': {
                        console.log('[Agent API] Metadata event:', data);
                        // Track message IDs for thread continuity
                        const msgRole = data.role as string;
                        const msgId = data.message_id as number;
                        if (msgRole === 'assistant' && msgId) {
                            console.log('[Agent API] Updating parent message ID:', msgId);
                            setParentMessageId(msgId);
                        }
                        break;
                    }

                    case 'response.text.delta': {
                        const text = data.text as string;
                        console.log('[Agent API] Text delta received:', { textLength: text?.length, text });
                        if (text) {
                            appendTextToAssistantMessage(assistantMessage, text);
                            setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                            setAgentState(AgentApiState.STREAMING);
                        }
                        break;
                    }

                    case 'response.tool_use': {
                        console.log('[Agent API] Tool use event:', { toolName: data.name, toolType: data.type });
                        appendToolResponseToAssistantMessage(assistantMessage, {
                            type: 'tool_use',
                            tool_use: data,
                        });
                        setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                        setAgentState(AgentApiState.EXECUTING_TOOL);
                        break;
                    }

                    case 'response.tool_result': {
                        const toolName = data.name as string;
                        console.log('[Agent API] Tool result event:', { toolName, status: data.status });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const content = data.content as any[];

                        appendToolResponseToAssistantMessage(assistantMessage, {
                            type: 'tool_results',
                            tool_results: {
                                name: toolName,
                                content,
                            },
                        });

                        // Extract chart from data_to_chart tool result
                        if (toolName === 'data_to_chart' && content?.[0]?.json?.charts?.[0]) {
                            console.log('[Agent API] Extracting chart from tool result');
                            const chartSpec = content[0].json.charts[0];
                            assistantMessage.content.push({
                                type: 'chart',
                                chart: { chart_spec: chartSpec },
                            });
                        }

                        setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                        break;
                    }

                    case 'response.status': {
                        const status = data.status as string;
                        const message = data.message as string;
                        console.log('[Agent API] Status update:', { status, message });
                        if (status === 'planning' || status === 'reevaluating_plan') {
                            setAgentState(AgentApiState.PLANNING);
                        } else if (status === 'executing_tools' || status === 'extracting_tool_calls') {
                            setAgentState(AgentApiState.EXECUTING_TOOL);
                        } else if (status === 'proceeding_to_answer') {
                            setAgentState(AgentApiState.STREAMING);
                        }
                        break;
                    }

                    case 'response.tool_result.status': {
                        const status = data.status as string;
                        const toolType = data.tool_type as string;
                        console.log('[Agent API] Tool result status:', { status, toolType, message: data.message });
                        if (data.status === 'Executing SQL') {
                            setAgentState(AgentApiState.EXECUTING_SQL);
                        }
                        break;
                    }

                    case 'response.suggested_queries': {
                        const queries = (data.suggested_queries as Array<{ query: string }>);
                        console.log('[Agent API] Suggested queries received:', { count: queries?.length });
                        if (queries?.length) {
                            assistantMessage.content.push({
                                type: 'suggested_queries',
                                queries,
                            });
                            setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                        }
                        break;
                    }

                    // Ignored events
                    case 'response.thinking.delta':
                    case 'response.thinking':
                    case 'response.text':
                    case 'response':
                    case 'done':
                        console.log('[Agent API] Ignored event type:', eventType);
                        break;

                    default:
                        console.log('[Agent API] Unknown event type:', eventType, data);
                        break;
                }
            }

            console.log('[Agent API] Stream processing completed, setting state to IDLE');
            setAgentState(AgentApiState.IDLE);
        } catch (error) {
            console.error("[Agent API] Error:", error);
            if (error instanceof Error) {
                console.error("[Agent API] Error details:", {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
            }
            toast.error("Failed to communicate with agent");
            setAgentState(AgentApiState.IDLE);
        }
    }, [authToken, database, schema, agentName, role, experimental, threadId, parentMessageId]);

    return {
        agentState,
        messages,
        handleNewMessage,
        latestAssistantMessageId,
        threadId,
    };
}
