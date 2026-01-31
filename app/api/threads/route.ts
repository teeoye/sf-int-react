import { NextRequest } from 'next/server';

/**
 * POST /api/threads - Create a new conversation thread
 *
 * Creates a thread in Snowflake that persists conversation context,
 * eliminating the need to send full message history on each request.
 */
export async function POST(request: NextRequest) {
    console.log('[Threads API] POST request received - Creating new thread');
    try {
        const authHeader = request.headers.get('Authorization');
        console.log('[Threads API] Auth header check:', { hasAuth: !!authHeader });
        
        const snowflakeUrl = process.env.NEXT_PUBLIC_SNOWFLAKE_URL;
        console.log('[Threads API] Snowflake URL check:', { hasUrl: !!snowflakeUrl });

        if (!snowflakeUrl) {
            console.error('[Threads API] Missing Snowflake URL configuration');
            return new Response(
                JSON.stringify({ error: 'Missing Snowflake URL configuration' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
        };

        if (authHeader) {
            headers['Authorization'] = authHeader;
            console.log('[Threads API] Authorization header added');
        }

        const threadUrl = `${snowflakeUrl}/api/v2/cortex/threads`;
        const requestBody = { origin_application: 'cortex-react' };
        console.log('[Threads API] Requesting thread creation:', { url: threadUrl, body: requestBody });

        const response = await fetch(threadUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });

        console.log('[Threads API] Response received:', { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Threads API] Error:', response.status, errorText);
            return new Response(errorText, {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('[Threads API] Parsing response data...');
        const data = await response.json();
        console.log('[Threads API] Thread created successfully:', data);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[Threads API] Error:', error);
        if (error instanceof Error) {
            console.error('[Threads API] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        return new Response(
            JSON.stringify({ error: 'Failed to create thread', details: String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
