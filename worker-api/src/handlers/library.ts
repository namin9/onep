import { IRequest } from 'itty-router';
import { Env, AuthenticatedRequest } from '../types';

/**
 * Handler for GET /api/library/codex
 * Returns the user's monster codex status.
 */
export const handleGetCodex = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        
        // Placeholder for fetching user's codex data
        const user_codex = await env.D1_DATABASE.prepare(
            `SELECT
                m.id as monster_id,
                m.name as monster_name,
                m.description,
                m.required_fragments,
                COALESCE(umf.collected_fragments, 0) as collected_fragments,
                COALESCE(umf.is_completed, 0) as is_completed
            FROM Monsters m
            LEFT JOIN User_Monster_Fragments umf ON m.id = umf.monster_id AND umf.user_id = ?`
        ).bind(user_id).all();

        return new Response(JSON.stringify({ status: "success", codex: user_codex.results }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Get Codex Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};

/**
 * Handler for POST /api/library/submit_fragments
 * Submits fragments obtained from hunting monsters.
 */
export const handleSubmitFragments = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        const { monster_id, fragments_to_add } = await request.json();

        if (!monster_id || !Number.isInteger(fragments_to_add) || fragments_to_add <= 0) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid request parameters." }), { status: 400 });
        }

        // Fetch monster's required fragments
        const monster = await env.D1_DATABASE.prepare("SELECT required_fragments FROM Monsters WHERE id = ?").bind(monster_id).first();
        if (!monster) {
            return new Response(JSON.stringify({ status: "error", message: "Monster not found." }), { status: 404 });
        }

        // Get or create user's fragment entry for this monster
        let user_fragment_entry: { collected_fragments: number, is_completed: number } | null = await env.D1_DATABASE.prepare(
            "SELECT collected_fragments, is_completed FROM User_Monster_Fragments WHERE user_id = ? AND monster_id = ?"
        ).bind(user_id, monster_id).first();

        let new_collected_fragments = (user_fragment_entry?.collected_fragments || 0) + fragments_to_add;
        let new_is_completed = 0;

        if (new_collected_fragments >= monster.required_fragments) {
            new_collected_fragments = monster.required_fragments; // Cap at required
            new_is_completed = 1;
        }

        if (!user_fragment_entry) {
            await env.D1_DATABASE.prepare(
                "INSERT INTO User_Monster_Fragments (user_id, monster_id, collected_fragments, is_completed) VALUES (?, ?, ?, ?)"
            ).bind(user_id, monster_id, new_collected_fragments, new_is_completed).run();
        } else {
            await env.D1_DATABASE.prepare(
                "UPDATE User_Monster_Fragments SET collected_fragments = ?, is_completed = ? WHERE user_id = ? AND monster_id = ?"
            ).bind(new_collected_fragments, new_is_completed, user_id, monster_id).run();
        }

        return new Response(JSON.stringify({
            status: "success",
            monster_id,
            fragments_added: fragments_to_add,
            collected_fragments: new_collected_fragments,
            is_completed: new_is_completed
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Submit Fragments Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};
