import router from './router';
import { Env } from './types';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Handle preflight (OPTIONS) requests first, as they don't need to go through the router.
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        let response;
        try {
            // Pass the request to our router to handle it.
            response = await router.handle(request, env, ctx);
        } catch (err) {
            console.error('Fallback Error:', err);
            response = new Response('Internal Server Error', { status: 500 });
        }
        
        // Create a mutable copy of the response headers
        const newHeaders = new Headers(response.headers);
        
        // Add CORS headers to every response.
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
	},
};
