import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { resolveUserFromRequest } from '../middleware/auth.js';
import {
  getUserSubscription,
  getUserUsage,
  activateSubscription,
  FREE_LIMITS,
} from '../services/subscriptionService.js';
import {
  createPolarCheckoutSession,
  verifyPolarWebhookSignature,
  handlePolarWebhookEvent,
  getPolarProductId,
} from '../services/polarService.js';

const router = Router();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'guest';
  return 'anon_' + crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
}

/**
 * GET /api/payment/status
 * Returns current user's plan, usage counts, limits, and subscription dates.
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromRequest(req);
    const userId = user?.id || getClientIdentifier(req);

    const subscription = await getUserSubscription(userId);
    const usage = await getUserUsage(userId);

    const isPro = subscription.plan === 'pro' && subscription.subscription_status === 'active';

    return res.json({
      success: true,
      userId,
      isAuthenticated: Boolean(user),
      plan: isPro ? 'pro' : 'free',
      subscriptionStatus: subscription.subscription_status || 'free',
      limits: {
        aiGenerations: {
          used: usage.ai_generation_count,
          limit: isPro ? null : FREE_LIMITS.AI_GENERATIONS,
          remaining: isPro ? null : Math.max(0, FREE_LIMITS.AI_GENERATIONS - usage.ai_generation_count),
        },
        meetings: {
          used: usage.meeting_creation_count,
          limit: isPro ? null : FREE_LIMITS.MEETINGS,
          remaining: isPro ? null : Math.max(0, FREE_LIMITS.MEETINGS - usage.meeting_creation_count),
        },
        manualEditing: {
          limit: null,
          unlimited: true,
        },
      },
      subscription: {
        polarCustomerId: subscription.polar_customer_id || null,
        polarSubscriptionId: subscription.polar_subscription_id || null,
        startDate: subscription.subscription_start_date || null,
        expirationDate: subscription.subscription_expiration_date || null,
      },
      product: {
        id: getPolarProductId(),
        name: 'GitToScale Pro',
        price: '₹299',
        originalPrice: '₹399',
        discount: '25% OFF',
        interval: 'month',
        currency: 'INR',
        description: 'Unlimited AI architecture generation, live collaborative meetings, and enterprise scaling simulator.',
        features: [
          '+ Everything included in Free',
          'Unlimited AI-assisted architecture generation',
          'Unlimited AI Architect chat usage',
          'Unlimited repository imports & AI architecture scans',
          'Unlimited live collaborative meetings',
          'Unlimited manual architecture editing',
        ],
      },
    });
  } catch (err: any) {
    console.error('[Payment API Status Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve subscription status' });
  }
});

/**
 * POST /api/payment/create-checkout
 * Creates a Polar checkout session and returns redirect URL.
 * Requires user authentication. Unauthenticated users are prompted to login.
 */
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Please sign in or register to upgrade your subscription.',
        redirect: '/login?redirect=/payment&action=checkout',
      });
    }

    const checkout = await createPolarCheckoutSession({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return res.json({
      success: true,
      url: checkout.url,
      checkoutId: checkout.id,
      isMock: checkout.isMock || false,
    });
  } catch (err: any) {
    console.error('[Payment API Checkout Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Checkout Failed',
      message: err.message || 'Unable to initialize checkout session with Polar.',
    });
  }
});

/**
 * POST /api/payment/webhook
 * Receives and cryptographically verifies Polar webhooks.
 * Never trust frontend status; only activate subscriptions when backend verifies event.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const headers = req.headers;

    // Check if signature is valid
    const allowMockWebhook =
      (process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true') &&
      headers['x-mock-webhook'] === 'true';

    let isSignatureValid = false;
    if (allowMockWebhook) {
      isSignatureValid = true;
    } else {
      isSignatureValid = verifyPolarWebhookSignature(rawBody, headers);
    }

    if (!isSignatureValid) {
      console.warn('[Polar Webhook] Signature verification failed.');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const result = await handlePolarWebhookEvent(req.body);
    return res.json({
      received: true,
      processed: result.processed,
      event: result.event,
    });
  } catch (err: any) {
    console.error('[Polar Webhook Error]', err);
    return res.status(500).json({ error: 'Webhook processing error', message: err.message });
  }
});

/**
 * POST /api/payment/mock-complete
 * For test and local development sandbox verification:
 * Allows completing a mock checkout session without live webhooks.
 */
router.post('/mock-complete', async (req: Request, res: Response) => {
  const allowMock = process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';
  if (!allowMock) {
    return res.status(403).json({ error: 'Forbidden in production' });
  }

  try {
    const user = await resolveUserFromRequest(req);
    const userId = user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await activateSubscription({
      userId,
      polarCustomerId: `cust_mock_${Date.now()}`,
      polarSubscriptionId: `sub_mock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      plan: 'pro',
    });

    return res.json({
      success: true,
      message: 'Mock subscription activated successfully',
      plan: 'pro',
    });
  } catch (err: any) {
    console.error('[Payment Mock Complete Error]', err);
    return res.status(500).json({ error: 'Failed to complete mock payment' });
  }
});

export default router;
