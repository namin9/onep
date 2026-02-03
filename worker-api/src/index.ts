/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import router from './router';
import { Env } from './types';

// Export a default object containing event handlers
export default {
	/**
	 * The fetch handler is the main entry point for your Worker.
	 * It receives all incoming HTTP requests.
	 * @param request The incoming request.
	 * @param env The environment bindings (D1, KV, secrets).
	 * @param ctx The execution context.
	 * @returns A Response object.
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Pass the request to our router to handle it.
		return router.handle(request, env, ctx);
	},
};
