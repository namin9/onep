import { IRequest } from 'itty-router';
import { Env, AuthenticatedRequest, UserStats } from '../types';

// --- Helper Functions (would be in separate files in a larger project) ---

// Placeholder function to generate random options for a skin
function generateSkinOptions(gacha_config: any, grade: string): { type: string, value: number }[] {
    const options = [];
    const slots = gacha_config.options_per_grade[grade] || 0;
    for (let i = 0; i < slots; i++) {
        // This logic would be much more complex, rolling from weighted option pools
        options.push({ type: `RANDOM_OPTION_${i + 1}`, value: Math.random() * 10 });
    }
    return options;
}

// Placeholder to get a random skin ID of a specific grade
function getRandomSkin(skins_by_grade: any, grade: string): { id: number } {
    const skin_list = skins_by_grade[grade];
    if (!skin_list || skin_list.length === 0) {
        throw new Error(`No skins found for grade: ${grade}`);
    }
    const random_id = skin_list[Math.floor(Math.random() * skin_list.length)];
    return { id: random_id };
}

// Perform a single pull, considering pity system
function performSinglePull(gacha_config: any, skins_by_grade: any, s_pity: number, sss_pity: number): { id: number, grade: string } {
    if (sss_pity >= gacha_config.pity_limits.sss) {
        return { grade: 'SSS', ...getRandomSkin(skins_by_grade, 'SSS') };
    }
    if (s_pity >= gacha_config.pity_limits.s) {
        return { grade: 'S', ...getRandomSkin(skins_by_grade, 'S') };
    }

    const roll = Math.random();
    let cumulative_prob = 0;
    for (const item of gacha_config.probabilities) {
        cumulative_prob += item.prob;
        if (roll < cumulative_prob) {
            const determined_grade = item.grade;
            return { grade: determined_grade, ...getRandomSkin(skins_by_grade, determined_grade) };
        }
    }
    // Fallback to the lowest grade
    const lowest_grade = gacha_config.probabilities.at(-1).grade;
    return { grade: lowest_grade, ...getRandomSkin(skins_by_grade, lowest_grade) };
}


/**
 * Handler for POST /api/gacha/pull
 */
export const handleGachaPull = async (request: AuthenticatedRequest, env: Env) => {
    try {
        const user_id = request.user.id;
        const { pull_count } = await request.json();

        if (pull_count !== 1 && pull_count !== 10) {
            return new Response(JSON.stringify({ status: "error", message: "Invalid pull count." }), { status: 400 });
        }

        const [gacha_config_str, skins_by_grade_str] = await Promise.all([
            env.KV_GAME_CONFIG.get("gacha_config"),
            env.KV_GAME_CONFIG.get("skins_by_grade")
        ]);
        const gacha_config = JSON.parse(gacha_config_str || '{}');
        const skins_by_grade = JSON.parse(skins_by_grade_str || '{}');

        const user_stats: UserStats | null = await env.D1_DATABASE.prepare(
            "SELECT ink, mileage_points, s_pity_counter, sss_pity_counter FROM User_Stats WHERE user_id = ?"
        ).bind(user_id).first();

        if (!user_stats) return new Response(JSON.stringify({ status: "error", message: "User not found." }), { status: 404 });

        const total_cost = gacha_config.cost_per_pull * pull_count;
        if (user_stats.ink < total_cost) {
            return new Response(JSON.stringify({ status: "error", message: "Insufficient ink." }), { status: 400 });
        }

        const pull_results = [];
        let s_pity = user_stats.s_pity_counter;
        let sss_pity = user_stats.sss_pity_counter;

        for (let i = 0; i < pull_count; i++) {
            s_pity++;
            sss_pity++;
            const result_skin = performSinglePull(gacha_config, skins_by_grade, s_pity, sss_pity);
            pull_results.push(result_skin);
            if (['S', 'SS', 'SSS'].includes(result_skin.grade)) s_pity = 0;
            if (result_skin.grade === 'SSS') sss_pity = 0;
        }

        const statements: D1PreparedStatement[] = [];
        const new_ink = user_stats.ink - total_cost;
        const new_mileage = user_stats.mileage_points + pull_count;
        statements.push(env.D1_DATABASE.prepare(
            "UPDATE User_Stats SET ink = ?, mileage_points = ?, s_pity_counter = ?, sss_pity_counter = ? WHERE user_id = ?"
        ).bind(new_ink, new_mileage, s_pity, sss_pity, user_id));
        
        const obtained_skins_with_options: any[] = [];
        for (const skin of pull_results) {
            const skin_instance_id = crypto.randomUUID();
            statements.push(env.D1_DATABASE.prepare(
                "INSERT INTO User_Skins (instance_id, user_id, skin_id) VALUES (?, ?, ?)"
            ).bind(skin_instance_id, user_id, skin.id));
            
            const options = generateSkinOptions(gacha_config, skin.grade);
            for (const option of options) {
                statements.push(env.D1_DATABASE.prepare(
                    "INSERT INTO User_Skin_Options (skin_instance_id, option_type, option_value) VALUES (?, ?, ?)"
                ).bind(skin_instance_id, option.type, option.value));
            }
            obtained_skins_with_options.push({ ...skin, instance_id: skin_instance_id, options });
        }

        await env.D1_DATABASE.batch(statements);

        return new Response(JSON.stringify({
            status: "success",
            obtained_skins: obtained_skins_with_options,
            updated_stats: { ink: new_ink, mileage_points: new_mileage }
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Gacha Pull Error:", error);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), { status: 500 });
    }
};
