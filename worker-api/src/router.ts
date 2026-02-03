import { Router, IRequest, error, json } from 'itty-router';
import { Env, AuthenticatedRequest } from './types';

// Middleware
import { withAuth } from './middleware/auth';

// Handlers
import { handleLogin, handleUpgradeStat, handleGameProgress } from './handlers/user';
import { handleGachaPull } from './handlers/gacha';
import { handleGetShopProducts, handleValidatePurchase, handleRedeemCoupon } from './handlers/shop';
import { handleGetMail, handleClaimMail } from './handlers/mail';

// CORS Preflight-handling middleware
const withCORS = (request: IRequest) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow any origin
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
}

// Helper to add CORS headers to a response
const corsify = (response: Response) => {
    if (response.headers.get('Access-Control-Allow-Origin')) {
        return response; // Headers already present
    }
    response.headers.set('Access-control-allow-origin', '*');
    return response;
}

const router = Router<AuthenticatedRequest, [Env]>({
    before: [withCORS], // Apply CORS middleware to all requests
    finally: [ (response) => corsify(response) ], // Add CORS headers to all final responses
    catch: (err) => {
        console.error(err);
        return corsify(error(500, 'Internal Server Error'));
    }
});

//================================================================
// Public Routes (No authentication required)
//================================================================
router.post('/api/user/login', handleLogin);


//================================================================
// Authenticated Routes (withAuth middleware is applied)
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
// 404 Handler for all other requests
//================================================================
router.all('*', () => error(404, 'Not Found.'));

export default router;
