import crypto from 'node:crypto';
import {
  activateSubscription,
  updateSubscriptionStatus,
  findUserIdByPolarId,
} from './subscriptionService.js';

export function getPolarBaseUrl(): string {
  const server = process.env.POLAR_SERVER || (process.env.POLAR_ACCESS_TOKEN?.startsWith('polar_live_') ? 'production' : 'sandbox');
  return server === 'production' ? 'https://api.polar.sh/v1' : 'https://sandbox-api.polar.sh/v1';
}

export function getPolarAccessToken(): string {
  return process.env.POLAR_ACCESS_TOKEN || '';
}

export function getPolarWebhookSecret(): string {
  return process.env.POLAR_WEBHOOK_SECRET || '';
}

export function getPolarProductId(): string {
  return process.env.POLAR_PRODUCT_ID || 'prod_gittoscale_pro';
}

export function getFrontendUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

export interface CheckoutResult {
  url: string;
  id?: string;
  isMock?: boolean;
}

/**
 * Creates a Polar checkout session for a given user.
 * Returns the checkout URL to redirect the user to.
 */
export async function createPolarCheckoutSession(user: {
  id: string;
  email: string;
  fullName?: string;
}): Promise<CheckoutResult> {
  const token = getPolarAccessToken();
  const productId = getPolarProductId();
  const frontendUrl = getFrontendUrl();
  const successUrl = `${frontendUrl}/payment?status=success&session_id={CHECKOUT_ID}`;

  // If no Polar token is configured or in test mode, return a simulated checkout URL
  if (!token || token === 'mock' || process.env.NODE_ENV === 'test') {
    const mockCheckoutId = `chk_mock_${crypto.randomBytes(8).toString('hex')}`;
    return {
      url: `${frontendUrl}/payment?status=mock_checkout&session_id=${mockCheckoutId}&userId=${encodeURIComponent(user.id)}`,
      id: mockCheckoutId,
      isMock: true,
    };
  }

  const baseUrl = getPolarBaseUrl();

  // Call official Polar v1 Checkouts endpoint
  const response = await fetch(`${baseUrl}/checkouts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: [productId],
      success_url: successUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        fullName: user.fullName || '',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Polar Checkout API Error] HTTP ${response.status}:`, errText);
    throw new Error(`Polar checkout creation failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const checkoutUrl = data.url || data.client_secret;

  if (!checkoutUrl) {
    console.error('[Polar Checkout] No url in checkout response:', data);
    throw new Error('Polar did not return a valid checkout URL.');
  }

  return {
    url: checkoutUrl,
    id: data.id,
    isMock: false,
  };
}

/**
 * Verify Polar webhook cryptographic signature.
 * Supports Standard Webhooks (Svix) specification headers:
 * - webhook-id
 * - webhook-timestamp
 * - webhook-signature
 * as well as direct HMAC-SHA256 signature headers.
 */
export function verifyPolarWebhookSignature(
  rawBody: Buffer | string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  const secret = getPolarWebhookSecret();
  if (!secret) {
    console.warn('[Polar Webhook] POLAR_WEBHOOK_SECRET is not configured.');
    return false;
  }

  const rawBodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
  const rawBodyStr = rawBodyBuffer.toString('utf-8');

  // 1. Check Standard Webhooks headers
  const webhookId = (headers['webhook-id'] || headers['Webhook-Id']) as string | undefined;
  const webhookTimestamp = (headers['webhook-timestamp'] || headers['Webhook-Timestamp']) as string | undefined;
  const webhookSignature = (headers['webhook-signature'] || headers['Webhook-Signature']) as string | undefined;

  if (webhookId && webhookTimestamp && webhookSignature) {
    // Check timestamp freshness (within 5 minutes = 300 seconds)
    const timestampSec = parseInt(webhookTimestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 300) {
      console.warn('[Polar Webhook] Timestamp out of tolerance or invalid.');
      return false;
    }

    // Secret can be whsec_... (base64 encoded) or raw string
    let keyBuffer: Buffer;
    if (secret.startsWith('whsec_')) {
      keyBuffer = Buffer.from(secret.substring(6), 'base64');
    } else {
      keyBuffer = Buffer.from(secret, 'utf-8');
    }

    const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBodyStr}`;
    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(signedPayload);
    const expectedSig = hmac.digest('base64');

    // webhookSignature can be a list: "v1,sig1 v1,sig2"
    const sigTokens = webhookSignature.split(' ');
    for (const token of sigTokens) {
      const parts = token.split(',');
      if (parts.length >= 2 && parts[0] === 'v1') {
        const receivedSig = parts.slice(1).join(',');
        try {
          if (
            expectedSig.length === receivedSig.length &&
            crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig))
          ) {
            return true;
          }
        } catch {}
      }
    }
  }

  // 2. Direct HMAC-SHA256 signature header check (e.g., 'x-polar-signature')
  const directSig = (headers['x-polar-signature'] || headers['x-signature']) as string | undefined;
  if (directSig) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBodyBuffer);
    const expectedHex = hmac.digest('hex');
    const expectedBase64 = hmac.digest('base64');
    if (
      directSig === expectedHex ||
      directSig === expectedBase64 ||
      directSig === `sha256=${expectedHex}`
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Process a verified Polar webhook event.
 * Never trust client-side messages; only activate or update through backend webhook validation.
 */
export async function handlePolarWebhookEvent(event: any): Promise<{
  processed: boolean;
  event: string;
  userId?: string | null;
  message?: string;
}> {
  const eventType = event.type || event.event;
  const data = event.data || {};

  console.log(`[Polar Webhook] Received event: ${eventType}`);

  let userId =
    data.metadata?.userId ||
    data.metadata?.user_id ||
    data.customer?.metadata?.userId ||
    null;

  const polarSubscriptionId = data.subscription_id || (eventType.startsWith('subscription.') ? data.id : null);
  const polarCustomerId = data.customer_id || data.customer?.id || null;

  if (!userId) {
    // Try to find user from existing records by subscription or customer id
    userId = await findUserIdByPolarId({
      polarSubscriptionId: polarSubscriptionId || undefined,
      polarCustomerId: polarCustomerId || undefined,
    });
  }

  const expiresAt =
    data.current_period_end ||
    data.ends_at ||
    data.expires_at ||
    (data.current_period_end_timestamp ? new Date(data.current_period_end_timestamp * 1000).toISOString() : null);

  switch (eventType) {
    case 'order.created': {
      // One-time or first order for a subscription
      if (userId) {
        await activateSubscription({
          userId,
          polarCustomerId,
          polarSubscriptionId,
          expiresAt,
          plan: 'pro',
        });
        return { processed: true, event: eventType, userId, message: 'Subscription activated via order' };
      }
      break;
    }

    case 'subscription.created':
    case 'subscription.active': {
      if (userId) {
        await activateSubscription({
          userId,
          polarCustomerId,
          polarSubscriptionId: data.id || polarSubscriptionId,
          expiresAt,
          plan: 'pro',
        });
        return { processed: true, event: eventType, userId, message: 'Subscription activated' };
      }
      break;
    }

    case 'subscription.updated': {
      const status = data.status === 'active' ? 'active' : data.status === 'canceled' ? 'canceled' : 'active';
      const plan = status === 'active' ? 'pro' : 'free';
      await updateSubscriptionStatus({
        userId: userId || undefined,
        polarSubscriptionId: data.id || polarSubscriptionId,
        polarCustomerId,
        status,
        plan,
        expiresAt,
      });
      return { processed: true, event: eventType, userId, message: 'Subscription updated' };
    }

    case 'subscription.canceled': {
      await updateSubscriptionStatus({
        userId: userId || undefined,
        polarSubscriptionId: data.id || polarSubscriptionId,
        polarCustomerId,
        status: 'canceled',
        expiresAt,
      });
      return { processed: true, event: eventType, userId, message: 'Subscription canceled' };
    }

    case 'subscription.revoked': {
      await updateSubscriptionStatus({
        userId: userId || undefined,
        polarSubscriptionId: data.id || polarSubscriptionId,
        polarCustomerId,
        status: 'revoked',
        plan: 'free',
      });
      return { processed: true, event: eventType, userId, message: 'Subscription revoked' };
    }

    case 'checkout.created':
      return { processed: true, event: eventType, userId, message: 'Checkout session initiated' };

    default:
      console.log(`[Polar Webhook] Unhandled event type: ${eventType}`);
      return { processed: false, event: eventType, userId, message: 'Event ignored' };
  }

  return { processed: false, event: eventType, userId, message: 'User could not be identified' };
}
