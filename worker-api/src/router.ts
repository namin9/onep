import { Router, IRequest, error } from 'itty-router';
import { Env, AuthenticatedRequest } from './types';

// Middleware
import { withAuth } from './middleware/auth';

// Handlers
import { handleLogin, handleUpgradeStat, handleGameProgress } from './handlers/user';
import { handleGachaPull } from './handlers/gacha';
import { handleGetShopProducts, handleValidatePurchase, handleRedeemCoupon } from './handlers/shop';
import { handleGetMail, handleClaimMail } from './handlers/mail';


// Helper to add CORS headers to any response
const withCORS = (response: Response): Response => {
    // Ensure we don't overwrite existing headers
    if (!response.headers.has('Access-Control-Allow-Origin')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    return response;
}

const router = Router<AuthenticatedRequest, [Env]>({
    // Add CORS headers to all successful responses
    finally: [ (response) => withCORS(response) ], 
    // Add CORS headers to all error responses
    catch: (err) => {
        console.error(err);
        const errorResponse = error(500, 'Internal Server Error');
        return withCORS(errorResponse);
    }
});

// Explicitly handle all preflight (OPTIONS) requests
router.options('*', () => new Response(null, {
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
}));


//================================================================
// Public Routes
//================================================================
router.post('/api/user/login', handleLogin);


//================================================================
// Authenticated Routes
//================================================================
router.post('/api/game/progress', withAuth, handleGameProgress);
router.post('/api/user/upgrade_stat', withAuth, handleUpgradeStat);
router.post('/api/gacha/pull', withAuth, handleGachaPull);
router.get('/api/shop/products', withAuth, handleGetShopProducts);
router.post('/api/shop/validate_purchase', withAuth, handleValidatePurchase);
router.post('/api/coupon/redeem', withAuth, handleRedeemCoupon);
router.get('/api/mailbox/list', withAuth, handleGetMail);
router.post('/api/mailbox/claim', withAuth, handleClaimMail);


//================================================================
// 404 Handler
//================================================================
router.all('*', () => error(404, 'Not Found.'));

export default router;
