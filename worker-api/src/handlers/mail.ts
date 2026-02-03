import { IRequest } from 'itty-router';
import { Env, AuthenticatedRequest, UserMail } from '../types';

/**
 * Handler for GET /api/mailbox/list
 */
export const handleGetMail = async (request: AuthenticatedRequest, env: Env) => {
    const user_id = request.user.id;

    // In a real implementation, this would query the User_Mailbox table.
    // SELECT * FROM User_Mailbox WHERE (user_id = ? OR user_id = 'ALL') AND expires_at > NOW() AND is_claimed = FALSE
    
    // For PoC, we return a mock mail item.
    const mockMail: UserMail[] = [
        {
            mail_id: 1,
            user_id: user_id,
            title: "환영 선물!",
            message_body: "아카이브 에디터에 오신 것을 환영합니다. 작은 선물을 드립니다.",
            product_id: "welcome_gift_1000_ink", // This product would be defined in Shop_Products
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
            is_claimed: false,
        }
    ];

    return new Response(JSON.stringify({ status: "success", mail: mockMail }), { headers: { 'Content-Type': 'application/json' } });
};

/**
 * Handler for POST /api/mailbox/claim
 */
export const handleClaimMail = async (request: AuthenticatedRequest, env: Env) => {
    const user_id = request.user.id;
    const { mail_id } = await request.json();

    if (!mail_id) {
        return new Response(JSON.stringify({ status: "error", message: "mail_id가 필요합니다." }), { status: 400 });
    }

    // In a real implementation, this would be a D1 transaction:
    // 1. Find the mail in User_Mailbox for the given mail_id and user_id.
    // 2. Check if is_claimed is FALSE.
    // 3. If it has a product_id, look up the items in Product_Items.
    // 4. Create a D1 batch to add the items to User_Stats and set is_claimed to TRUE.
    // 5. Execute the batch.

    // For PoC, we simulate success.
    if (typeof mail_id === 'number') {
        return new Response(JSON.stringify({
            status: "success",
            message: `우편 #${mail_id}의 보상을 수령했습니다.`,
            rewards: [ // The actual rewards would be returned
                { item_id: "INK", quantity: 1000 }
            ]
        }), { headers: { 'Content-Type': 'application/json' } });
    } else {
        return new Response(JSON.stringify({ status: "error", message: "유효하지 않은 mail_id입니다." }), { status: 400 });
    }
};
