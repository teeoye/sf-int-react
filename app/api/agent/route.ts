import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('[Agent Proxy] POST request received');
    try {
        console.log('[Agent Proxy] Parsing request body...');
        const body = await request.json();
        console.log('[Agent Proxy] Request body parsed:', { 
            database: body.database, 
            schema: body.schema, 
            agentName: body.agentName,
            thread_id: body.thread_id,
            messagesCount: body.messages?.length 
        });
        
        const authHeader = request.headers.get('Authorization');
        const roleHeader = request.headers.get('X-Snowflake-Role');
        console.log('[Agent Proxy] Headers:', { 
            hasAuth: !!authHeader, 
            hasRole: !!roleHeader 
        });

        // Get agent config from request body
        const { database, schema, agentName, messages, thread_id, experimental } = body;

        const snowflakeUrl = process.env.NEXT_PUBLIC_SNOWFLAKE_URL;
        console.log('[Agent Proxy] Environment check:', { 
            hasSnowflakeUrl: !!snowflakeUrl,
            database: !!database,
            schema: !!schema,
            agentName: !!agentName
        });

        if (!snowflakeUrl || !database || !schema || !agentName) {
            console.error('[Agent Proxy] Missing required configuration:', {
                snowflakeUrl: !!snowflakeUrl,
                database: !!database,
                schema: !!schema,
                agentName: !!agentName
            });
            return new Response(
                JSON.stringify({ error: 'Missing required configuration' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const agentEndpoint = `${snowflakeUrl}/api/v2/databases/${encodeURIComponent(database)}/schemas/${encodeURIComponent(schema)}/agents/${encodeURIComponent(agentName)}:run`;
        console.log('[Agent Proxy] Agent endpoint constructed:', agentEndpoint);

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
        };

        if (authHeader) {
            headers['Authorization'] = authHeader;
            console.log('[Agent Proxy] Authorization header added');
        }

        if (roleHeader) {
            headers['X-Snowflake-Role'] = roleHeader;
            console.log('[Agent Proxy] Role header added:', roleHeader);
        }

        // Build the request body for Snowflake
        const agentBody: Record<string, unknown> = { messages };
        if (thread_id) {
            agentBody.thread_id = thread_id;
            // parent_message_id is required when using threads
            agentBody.parent_message_id = body.parent_message_id ?? 0;
            console.log('[Agent Proxy] Thread ID added:', { thread_id, parent_message_id: agentBody.parent_message_id });
        }
        if (experimental) {
            agentBody.experimental = experimental;
            console.log('[Agent Proxy] Experimental options added:', experimental);
        }

        console.log('[Agent Proxy] Forwarding to:', agentEndpoint);
        console.log('[Agent Proxy] Request body:', JSON.stringify(agentBody, null, 2));

        const response = await fetch(agentEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(agentBody),
        });

        console.log('[Agent Proxy] Response received:', { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok 
        });

        // Stream the response back
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Agent Proxy] Error response:', response.status, errorText);
            return new Response(errorText, {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('[Agent Proxy] Streaming response back to client');
        // Forward the streaming response
        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('[Agent Proxy] Error:', error);
        if (error instanceof Error) {
            console.error('[Agent Proxy] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        return new Response(
            JSON.stringify({ error: 'Proxy error', details: String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
