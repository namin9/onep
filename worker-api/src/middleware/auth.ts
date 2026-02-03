import { IRequest } from 'itty-router';
import { verify } from 'jsonwebtoken';
import { Env, AuthenticatedRequest } from '../types';

// Define the structure of the JWT payload
interface JwtPayload {
    user_id: string;
    session_id: string;
    exp: number;
}

// This is our main authentication middleware function
export const withAuth = async (request: AuthenticatedRequest, env: Env) => {
    try {
        // 1. Get the 'Authorization' header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ status: "error", message: "Authorization header is missing or malformed." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Extract the JWT
        const token = authHeader.split(' ')[1];

        // 3. Verify the JWT
        const decoded = await verify(token, env.JWT_SECRET) as JwtPayload;
        if (!decoded || !decoded.user_id || !decoded.session_id) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid token payload." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { user_id, session_id } = decoded;

        // 4. Check the active session in the database
        const activeSession = await env.D1_DATABASE.prepare(
            "SELECT session_id FROM User_Active_Sessions WHERE user_id = ?"
        ).bind(user_id).first<{ session_id: string }>();
        
        if (!activeSession || activeSession.session_id !== session_id) {
            return new Response(JSON.stringify({
                status: "error",
                message: "Session expired. Another device may have logged in.",
                error_code: "SESSION_EXPIRED"
            }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // 5. Check if the user is banned
        const userStatus = await env.D1_DATABASE.prepare(
            "SELECT is_banned FROM User_Stats WHERE user_id = ?"
        ).bind(user_id).first<{ is_banned: boolean }>();

        if (userStatus && userStatus.is_banned) {
            return new Response(JSON.stringify({
                status: "error",
                message: "This account has been suspended.",
                error_code: "ACCOUNT_SUSPENDED"
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // 6. Authentication successful: Attach user info to the request object for later handlers
        request.user = { id: user_id };

    } catch (error: any) {
        // Handle specific JWT errors like expiration
        if (error.name === 'TokenExpiredError') {
             return new Response(JSON.stringify({ status: "error", message: "Token has expired.", error_code: "TOKEN_EXPIRED" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        console.error("Authentication Middleware Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Authentication failed." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
};
