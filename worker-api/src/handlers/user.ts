import { IRequest } from 'itty-router';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { Env, AuthenticatedRequest, UserStats } from '../types';

// NOTE: In a real project, this would be in a separate utility file.
// Placeholder for Google Auth logic
async function exchangeGoogleCodeForUserId(code: string): Promise<string | null> {
    // In a real implementation, this would make an HTTPS request to Google's OAuth2 servers.
    // For the PoC, we can use a mock implementation.
    if (code === "valid_google_code") {
        return "user_google_id_12345";
    }
    return null;
}

/**
 * Handler for POST /api/user/login
 */
export const handleLogin = async (request: IRequest, env: Env) => {
    try {
        const { server_auth_code, client_version } = await request.json();
        if (!server_auth_code || !client_version) {
             return new Response(JSON.stringify({ status: "error", message: "Missing required fields." }), { status: 400 });
        }

        const user_id = await exchangeGoogleCodeForUserId(server_auth_code);
        if (!user_id) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid auth code." }), { status: 401 });
        }

        const game_config_str = await env.KV_GAME_CONFIG.get("latest");
        const game_config = JSON.parse(game_config_str || '{}');
        // Version check logic...

        let user_stats: UserStats | null = await env.D1_DATABASE.prepare("SELECT * FROM User_Stats WHERE user_id = ?").bind(user_id).first();
        const current_time = new Date().toISOString();

        if (!user_stats) { // New user
            await env.D1_DATABASE.prepare("INSERT INTO User_Stats (user_id, last_login_at) VALUES (?, ?)").bind(user_id, current_time).run();
            user_stats = await env.D1_DATABASE.prepare("SELECT * FROM User_Stats WHERE user_id = ?").bind(user_id).first();
        } else { // Existing user
            // Offline reward calculation would go here...
            await env.D1_DATABASE.prepare("UPDATE User_Stats SET last_login_at = ? WHERE user_id = ?").bind(current_time, user_id).run();
        }

        const new_session_id = crypto.randomUUID();
        await env.D1_DATABASE.prepare(
            "INSERT INTO User_Active_Sessions (user_id, session_id, last_seen_at) VALUES (?, ?, ?) " +
            "ON CONFLICT(user_id) DO UPDATE SET session_id = excluded.session_id, last_seen_at = excluded.last_seen_at"
        ).bind(user_id, new_session_id, current_time).run();

        const token = await jwt.sign({ user_id, session_id: new_session_id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) }, env.JWT_SECRET);

        return new Response(JSON.stringify({ status: "success", jwt: token, user_data: { stats: user_stats }, game_config }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Login Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};

/**
 * Handler for POST /api/user/upgrade_stat
 */
export const handleUpgradeStat = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        const { stat_type, upgrade_amount } = await request.json();

        const valid_stat_types = ['attack_level', 'attack_speed_level', 'crit_chance_level', 'crit_damage_level'];
        if (!valid_stat_types.includes(stat_type) || !Number.isInteger(upgrade_amount) || upgrade_amount <= 0) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid request parameters." }), { status: 400 });
        }

        const stat_config_str = await env.KV_GAME_CONFIG.get(`stat_costs:${stat_type}`);
        const stat_config = JSON.parse(stat_config_str || '{}');
        
        const user_stats: UserStats | null = await env.D1_DATABASE.prepare(`SELECT rubies, ${stat_type} FROM User_Stats WHERE user_id = ?`).bind(user_id).first();

        if (!user_stats) return new Response(JSON.stringify({ status: "error", message: "User not found." }), { status: 404 });

        let total_cost = 0;
        const current_level = user_stats[stat_type as keyof UserStats] as number;
        for (let i = 0; i < upgrade_amount; i++) {
            total_cost += Math.floor(stat_config.base_cost * Math.pow(stat_config.growth_rate, (current_level + i) - 1));
        }

        if (user_stats.rubies < total_cost) {
            return new Response(JSON.stringify({ status: "error", message: "Insufficient rubies." }), { status: 400 });
        }

        const new_level = current_level + upgrade_amount;
        const updated_rubies = user_stats.rubies - total_cost;

        await env.D1_DATABASE.prepare(`UPDATE User_Stats SET ${stat_type} = ?, rubies = ? WHERE user_id = ?`).bind(new_level, updated_rubies, user_id).run();

        return new Response(JSON.stringify({ status: "success", updated_stats: { [stat_type]: new_level, rubies: updated_rubies } }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Upgrade Stat Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};

/**
 * Handler for POST /api/game/progress
 * Calculates idle rewards and updates user progress.
 */
export const handleGameProgress = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        const { client_highest_stage } = await request.json();

        const user_stats: UserStats | null = await env.D1_DATABASE.prepare("SELECT * FROM User_Stats WHERE user_id = ?").bind(user_id).first();
        if (!user_stats) {
            return new Response(JSON.stringify({ status: "error", message: "User not found." }), { status: 404 });
        }

        const game_config_str = await env.KV_GAME_CONFIG.get("base_config");
        const game_config = JSON.parse(game_config_str || '{"rubies_per_second_per_stage": 0.1}');
        
        const last_login = new Date(user_stats.last_login_at);
        const now = new Date();
        const offline_seconds = Math.floor((now.getTime() - last_login.getTime()) / 1000);

        // Simple reward calculation: (Rubies per Second) * (Highest Stage) * (Offline Time)
        // This is a basic model. A real game would have a more complex formula based on all stats.
        const rubies_per_second = game_config.rubies_per_second_per_stage * user_stats.highest_stage;
        const rubies_earned = Math.floor(rubies_per_second * offline_seconds);
        
        const updated_rubies = user_stats.rubies + rubies_earned;
        const updated_highest_stage = Math.max(user_stats.highest_stage, client_highest_stage || 0);

        await env.D1_DATABASE.prepare(
            "UPDATE User_Stats SET rubies = ?, highest_stage = ?, last_login_at = ? WHERE user_id = ?"
        ).bind(updated_rubies, updated_highest_stage, now.toISOString(), user_id).run();

        return new Response(JSON.stringify({ 
            status: "success", 
            rewards: {
                rubies_earned,
                offline_seconds
            },
            updated_stats: {
                rubies: updated_rubies,
                highest_stage: updated_highest_stage
            }
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Game Progress Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};
