// This file contains TypeScript type definitions for the project's data structures.

// 1. Environment Bindings
// This interface defines the types for the bindings we configured in wrangler.toml
export interface Env {
    D1_DATABASE: D1Database;
    KV_GAME_CONFIG: KVNamespace;
    JWT_SECRET: string;
    // R2 and other bindings would be added here as needed
}

// 2. API Request Payloads
// This adds type safety to our API handlers
export interface AuthenticatedRequest extends Request {
    user: {
        id: string; // The user_id validated by the middleware
    };
}

// 3. Database Table Schemas
// These interfaces directly correspond to the tables in gdd/database/schema.sql

export interface UserStats {
    user_id: string;
    attack_level: number;
    attack_speed_level: number;
    crit_chance_level: number;
    crit_damage_level: number;
    rubies: number;
    highest_stage: number;
    last_login_at: string; // ISO 8601 string format
    total_spent: number;
    has_ad_free: 0 | 1; // 0 for false, 1 for true
    mileage_points: number;
    is_banned: 0 | 1; // 0 for false, 1 for true
    s_pity_counter: number;
    sss_pity_counter: number;
}

export interface UserSkin {
    instance_id: string;
    user_id: string;
    skin_id: number;
    is_equipped: 0 | 1; // 0 for false, 1 for true
    level: number;
}

export interface UserSkinOption {
    skin_instance_id: string;
    option_type: string;
    option_value: number;
}

export interface ShopProduct {
    product_id: string;
    google_play_id: string;
    title: string;
    description: string | null;
    price_amount: number;
    price_currency: 'USD' | 'MILEAGE'; // Extendable
    purchase_limit: number;
    available_from: string | null;
    available_until: string | null;
    is_active: boolean;
    required_vip_level: number;
}

export interface ProductItem {
    id: number;
    product_id: string;
    item_type: string; // 'CURRENCY', 'SKIN_TICKET', etc.
    item_id: string; // 'RUBY', 'INK', 'SSS_SKIN', etc.
    quantity: number;
}

export interface UserMail {
    mail_id: number;
    user_id: string;
    title: string;
    message_body: string | null;
    product_id: string | null;
    sent_at: string;
    expires_at: string;
    is_claimed: boolean;
}

// ... other types for Cards, Talents, Coupons, etc. would be added here.
