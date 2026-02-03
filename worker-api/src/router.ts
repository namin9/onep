import { Router, IRequest } from 'itty-router';
import { Env, AuthenticatedRequest } from './types';

// Middleware
import { withAuth } from './middleware/auth';

// Handlers (we will create these files next)
import { handleLogin, handleUpgradeStat, handleGameProgress } from './handlers/user';
import { handleGachaPull } from './handlers/gacha';
import { handleGetShopProducts, handleValidatePurchase, handleRedeemCoupon } from './handlers/shop';
import { handleGetMail, handleClaimMail } from './handlers/mail';

// Create a new router
const router = Router<AuthenticatedRequest, [Env]>();

//================================================================
// Public Routes (No authentication required)
//================================================================
router.post('/api/user/login', handleLogin);


//================================================================
// Authenticated Routes (withAuth middleware is applied)
//================================================================
// All routes defined below will first pass through the 'withAuth' middleware.
// If authentication fails, the middleware will return an error and the actual handler won't be called.

// -- User Progression --
router.post('/api/game/progress', withAuth, handleGameProgress);
router.post('/api/user/upgrade_stat', withAuth, handleUpgradeStat);

// -- Gacha --
router.post('/api/gacha/pull', withAuth, handleGachaPull);

// -- Shop & Monetization --
router.get('/api/shop/products', withAuth, handleGetShopProducts);
router.post('/api/shop/validate_purchase', withAuth, handleValidatePurchase);

// -- Operations --
router.post('/api/coupon/redeem', withAuth, handleRedeemCoupon);
router.get('/api/mailbox/list', withAuth, handleGetMail);
router.post('/api/mailbox/claim', withAuth, handleClaimMail);


//================================================================
// 404 Handler for all other requests
//================================================================
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
