import { IRequest } from 'itty-router';
import { Env, AuthenticatedRequest, UserStats } from '../types';

/**
 * Handler for POST /api/soul/rebirth
 * Resets certain user progress and grants Soul Essence.
 */
export const handleRebirth = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;

        // Fetch user stats
        const user_stats: UserStats | null = await env.D1_DATABASE.prepare("SELECT * FROM User_Stats WHERE user_id = ?").bind(user_id).first();
        if (!user_stats) {
            return new Response(JSON.stringify({ status: "error", message: "User not found." }), { status: 404 });
        }

        // Calculate earned Soul Essence based on highest_stage (simplified for PoC)
        // In a real game, this would be a more complex calculation based on many factors.
        const gained_soul_essence = Math.floor(user_stats.highest_stage / 100) + 1; // Example: 1 essence per 100 stages

        // Reset certain stats (simplified: rubies, ink, highest_stage, stat levels to 1)
        // Keep mileage, total_spent, is_banned, etc.
        const reset_stats_query = `
            UPDATE User_Stats SET
                rubies = 0,
                ink = 0,
                highest_stage = 1,
                attack_level = 1,
                attack_speed_level = 1,
                crit_chance_level = 1,
                crit_damage_level = 1,
                s_pity_counter = 0,
                sss_pity_counter = 0,
                soul_essence = soul_essence + ?
            WHERE user_id = ?`;

        await env.D1_DATABASE.prepare(reset_stats_query).bind(gained_soul_essence, user_id).run();

        // Optionally, delete User_Skins and User_Monster_Fragments etc. depending on game design
        // For PoC, let's keep them.

        return new Response(JSON.stringify({
            status: "success",
            message: "Rebirth successful!",
            gained_soul_essence: gained_soul_essence
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Rebirth Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};

/**
 * Handler for POST /api/soul/unlock_talent
 * Allows a user to unlock a talent from the talent tree.
 */
export const handleUnlockTalent = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        const { talent_id } = await request.json();

        if (!talent_id || !Number.isInteger(talent_id)) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid talent ID." }), { status: 400 });
        }

        // Fetch talent details
        const talent = await env.D1_DATABASE.prepare("SELECT * FROM Talents WHERE id = ?").bind(talent_id).first();
        if (!talent) {
            return new Response(JSON.stringify({ status: "error", message: "Talent not found." }), { status: 404 });
        }

        // Fetch user stats and unlocked talents
        const [user_stats_result, unlocked_talents_result] = await env.D1_DATABASE.batch([
            env.D1_DATABASE.prepare("SELECT soul_essence FROM User_Stats WHERE user_id = ?").bind(user_id),
            env.D1_DATABASE.prepare("SELECT talent_id FROM User_Talents WHERE user_id = ?").bind(user_id)
        ]);
        
        const user_stats: UserStats | null = user_stats_result.results[0];
        const unlocked_talents: { talent_id: number }[] = unlocked_talents_result.results;

        if (!user_stats) {
            return new Response(JSON.stringify({ status: "error", message: "User not found." }), { status: 404 });
        }

        // Check if already unlocked
        if (unlocked_talents.some(t => t.talent_id === talent_id)) {
            return new Response(JSON.stringify({ status: "error", message: "Talent already unlocked." }), { status: 400 });
        }

        // Check prerequisites (if any)
        if (talent.prerequisite_talent_id && !unlocked_talents.some(t => t.talent_id === talent.prerequisite_talent_id)) {
            return new Response(JSON.stringify({ status: "error", message: "Prerequisite talent not unlocked." }), { status: 400 });
        }

        // Check cost
        if (user_stats.soul_essence < talent.cost) {
            return new Response(JSON.stringify({ status: "error", message: "Insufficient Soul Essence." }), { status: 400 });
        }

        // Deduct cost and unlock talent
        await env.D1_DATABASE.batch([
            env.D1_DATABASE.prepare("UPDATE User_Stats SET soul_essence = soul_essence - ? WHERE user_id = ?").bind(talent.cost, user_id),
            env.D1_DATABASE.prepare("INSERT INTO User_Talents (user_id, talent_id) VALUES (?, ?)").bind(user_id, talent_id)
        ]);

        return new Response(JSON.stringify({
            status: "success",
            message: "Talent unlocked!",
            talent_id: talent_id,
            remaining_soul_essence: user_stats.soul_essence - talent.cost
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Unlock Talent Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};

/**
 * Handler for GET /api/soul/talents
 * Returns the user's unlocked talents and the full talent tree structure.
 */
export const handleGetTalentTree = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;

        const [all_talents_result, user_talents_result] = await env.D1_DATABASE.batch([
            env.D1_DATABASE.prepare("SELECT * FROM Talents"),
            env.D1_DATABASE.prepare("SELECT talent_id FROM User_Talents WHERE user_id = ?").bind(user_id)
        ]);

        const all_talents = all_talents_result.results;
        const user_unlocked_talent_ids = user_talents_result.results.map((t: { talent_id: number }) => t.talent_id);

        return new Response(JSON.stringify({
            status: "success",
            all_talents: all_talents,
            unlocked_talent_ids: user_unlocked_talent_ids
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Get Talent Tree Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};