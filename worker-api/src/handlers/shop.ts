import { IRequest } from 'itty-router';
import { Env, AuthenticatedRequest, ShopProduct, ProductItem } from '../types';

// Placeholder for Google Play validation
async function validateGooglePurchase(token: string): Promise<{ success: boolean; productId: string; error?: string }> {
    // This would make a server-to-server call to Google Play Developer API
    if (token === "valid_google_token") {
        return { success: true, productId: "remove_ads_pack" }; // Mock response
    }
    return { success: false, error: "Invalid token" };
}

/**
 * Handler for GET /api/shop/products
 */
export const handleGetShopProducts = async (request: AuthenticatedRequest, env: Env) => {
    // This handler would fetch user's VIP level and then query D1 for available products.
    // For PoC, we will return a mock list.
    const mockProducts: ShopProduct[] = [
        {
            product_id: "remove_ads_pack",
            google_play_id: "com.example.remove_ads",
            title: "광고 제거 패키지",
            description: "모든 광고를 영구적으로 제거합니다.",
            price_amount: 9.99,
            price_currency: 'USD',
            purchase_limit: 1,
            is_active: true,
            required_vip_level: 0,
            available_from: null,
            available_until: null,
        },
        {
            product_id: "mileage_sss_ticket",
            google_play_id: "", // Not a real money purchase
            title: "SSS 스킨 선택권",
            description: "원하는 SSS 스킨 1개를 선택하여 획득합니다.",
            price_amount: 2000,
            price_currency: 'MILEAGE',
            purchase_limit: -1, // Unlimited
            is_active: true,
            required_vip_level: 0,
            available_from: null,
            available_until: null,
        }
    ];
    return new Response(JSON.stringify({ status: "success", products: mockProducts }), { headers: { 'Content-Type': 'application/json' } });
};

/**
 * Handler for POST /api/shop/validate_purchase
 */
export const handleValidatePurchase = async (request: AuthenticatedRequest, env: Env) => {
    const user_id = request.user.id;
    const { product_id, purchase_token } = await request.json();

    // 1. Get product info from DB
    // const product: ShopProduct | null = await env.D1_DATABASE.prepare("...").bind(product_id).first();
    // For PoC, we assume product exists and check its currency type.
    
    // MOCK
    const product = { price_currency: 'USD', price_amount: 9.99 }; // Assume we fetched this

    if (product.price_currency === 'USD') {
        const validation = await validateGooglePurchase(purchase_token);
        if (!validation.success || validation.productId !== product_id) {
            return new Response(JSON.stringify({ status: "error", message: "Google Play 결제 검증에 실패했습니다." }), { status: 400 });
        }
        // ... Grant item logic ...
        // ... Add price to user's total_spent ...
        
    } else if (product.price_currency === 'MILEAGE') {
        // ... Check if user has enough mileage points from D1 ...
        // ... Deduct mileage and grant item ...
    } else {
        return new Response(JSON.stringify({ status: "error", message: "지원하지 않는 결제 통화입니다." }), { status: 400 });
    }

    return new Response(JSON.stringify({ status: "success", message: "구매가 완료되었습니다." }), { headers: { 'Content-Type': 'application/json' } });
};

/**
 * Handler for POST /api/coupon/redeem
 */
export const handleRedeemCoupon = async (request: AuthenticatedRequest, env: Env) => {
    const user_id = request.user.id;
    const { coupon_code } = await request.json();

    // In a real implementation:
    // 1. Check 'Coupons' table for the code's validity (active, not expired, uses < max_uses).
    // 2. Check 'User_Redeemed_Coupons' to see if this user already used it.
    // 3. If valid, call a helper function to create a new mail in 'User_Mailbox' with the coupon's 'product_id'.
    // 4. Update 'Coupons.current_uses' and add a record to 'User_Redeemed_Coupons'.
    // This should all happen in a D1 transaction.

    if (coupon_code === "WELCOME2024") {
        // For PoC, we simulate success and creating a mail item.
        // This would call the mail sending logic.
        return new Response(JSON.stringify({ status: "success", message: "쿠폰이 등록되었습니다. 우편함을 확인해주세요." }), { headers: { 'Content-Type': 'application/json' } });
    } else {
        return new Response(JSON.stringify({ status: "error", message: "유효하지 않은 쿠폰입니다." }), { status: 400 });
    }
};
