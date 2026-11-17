import { getSql, isNeonConfigured } from './neon.js';

export interface UserSubscription {
  user_id: string;
  plan: 'free' | 'pro';
  subscription_status: 'free' | 'active' | 'canceled' | 'past_due' | 'revoked';
  polar_customer_id?: string | null;
  polar_subscription_id?: string | null;
  subscription_start_date?: string | null;
  subscription_expiration_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserUsage {
  user_id: string;
  ai_generation_count: number;
  ai_chat_count: number;
  meeting_creation_count: number;
  created_at?: string;
  updated_at?: string;
}

export const FREE_LIMITS = {
  AI_GENERATIONS: 3,
  MEETINGS: 3,
} as const;

export const inMemSubscriptions = new Map<string, UserSubscription>();
export const inMemUsage = new Map<string, UserUsage>();

let hasEnsuredSchema = false;

export async function ensureSubscriptionSchema(): Promise<void> {
  if (hasEnsuredSchema || !isNeonConfigured()) return;
  try {
    const db = getSql();
    await db`
      CREATE TABLE IF NOT EXISTS public.user_subscriptions (
        user_id TEXT PRIMARY KEY,
        plan TEXT NOT NULL DEFAULT 'free',
        subscription_status TEXT NOT NULL DEFAULT 'active',
        polar_customer_id TEXT,
        polar_subscription_id TEXT,
        subscription_start_date TIMESTAMPTZ,
        subscription_expiration_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `;

    await db`
      CREATE TABLE IF NOT EXISTS public.user_usage (
        user_id TEXT PRIMARY KEY,
        ai_generation_count INTEGER NOT NULL DEFAULT 0,
        ai_chat_count INTEGER NOT NULL DEFAULT 0,
        meeting_creation_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `;

    await db`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_sub ON public.user_subscriptions(polar_subscription_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_cust ON public.user_subscriptions(polar_customer_id);`;
    hasEnsuredSchema = true;
  } catch (err: any) {
    console.warn('[Subscription Schema] Migration warning (fallback to memory if offline):', err.message);
  }
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  if (!userId) {
    return {
      user_id: 'anonymous',
      plan: 'free',
      subscription_status: 'free',
    };
  }

  await ensureSubscriptionSchema();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.user_subscriptions
        WHERE user_id = ${userId}
        LIMIT 1;
      `;
      if (rows.length > 0) {
        return rows[0] as UserSubscription;
      }

      // Default new record
      const defaultSub: UserSubscription = {
        user_id: userId,
        plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db`
        INSERT INTO public.user_subscriptions (user_id, plan, subscription_status)
        VALUES (${userId}, 'free', 'active')
        ON CONFLICT (user_id) DO NOTHING;
      `;

      return defaultSub;
    } catch (err: any) {
      console.warn('[Subscription] Neon query failed, falling back to memory store:', err.message);
    }
  }

  // In-Memory store fallback
  let sub = inMemSubscriptions.get(userId);
  if (!sub) {
    sub = {
      user_id: userId,
      plan: 'free',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemSubscriptions.set(userId, sub);
  }
  return sub;
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  if (!userId) {
    return {
      user_id: 'anonymous',
      ai_generation_count: 0,
      ai_chat_count: 0,
      meeting_creation_count: 0,
    };
  }

  await ensureSubscriptionSchema();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.user_usage
        WHERE user_id = ${userId}
        LIMIT 1;
      `;
      if (rows.length > 0) {
        return rows[0] as UserUsage;
      }

      const defaultUsage: UserUsage = {
        user_id: userId,
        ai_generation_count: 0,
        ai_chat_count: 0,
        meeting_creation_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db`
        INSERT INTO public.user_usage (user_id, ai_generation_count, ai_chat_count, meeting_creation_count)
        VALUES (${userId}, 0, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
      `;

      return defaultUsage;
    } catch (err: any) {
      console.warn('[Usage] Neon query failed, falling back to memory store:', err.message);
    }
  }

  // Memory fallback
  let usage = inMemUsage.get(userId);
  if (!usage) {
    usage = {
      user_id: userId,
      ai_generation_count: 0,
      ai_chat_count: 0,
      meeting_creation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemUsage.set(userId, usage);
  }
  return usage;
}

export async function getSubscriptionAndUsage(userId: string): Promise<{
  subscription: UserSubscription;
  usage: UserUsage;
}> {
  const [subscription, usage] = await Promise.all([
    getUserSubscription(userId),
    getUserUsage(userId),
  ]);
  return { subscription, usage };
}

/**
 * Check and increment AI usage.
 * Counted when users:
 * - Generate a new architecture using AI (/api/recommend)
 * - Import or scan a GitHub repo using AI (/api/repository/analyze)
 * - Use AI Architect chat to generate or improve an architecture (/api/chat/message)
 * - Request AI modifications to an existing architecture
 */
export async function checkAndIncrementAiUsage(userId: string): Promise<{
  allowed: boolean;
  plan: 'free' | 'pro';
  used: number;
  limit: number | null;
  message?: string;
}> {
  const { subscription, usage } = await getSubscriptionAndUsage(userId);

  // Pro users have unlimited access
  if (subscription.plan === 'pro' && subscription.subscription_status === 'active') {
    // Record usage metrics without restriction
    await incrementAiUsage(userId);
    return {
      allowed: true,
      plan: 'pro',
      used: usage.ai_generation_count + 1,
      limit: null,
    };
  }

  // Free users: maximum 3 AI operations
  if (usage.ai_generation_count >= FREE_LIMITS.AI_GENERATIONS) {
    return {
      allowed: false,
      plan: 'free',
      used: usage.ai_generation_count,
      limit: FREE_LIMITS.AI_GENERATIONS,
      message: 'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.',
    };
  }

  // Increment usage
  const updatedUsed = await incrementAiUsage(userId);
  return {
    allowed: true,
    plan: 'free',
    used: updatedUsed,
    limit: FREE_LIMITS.AI_GENERATIONS,
  };
}

async function incrementAiUsage(userId: string): Promise<number> {
  if (isNeonConfigured()) {
    try {
      const db = getSql();
      const rows = await db`
        INSERT INTO public.user_usage (user_id, ai_generation_count, ai_chat_count, meeting_creation_count, updated_at)
        VALUES (${userId}, 1, 0, 0, timezone('utc'::text, now()))
        ON CONFLICT (user_id) DO UPDATE SET
          ai_generation_count = public.user_usage.ai_generation_count + 1,
          updated_at = timezone('utc'::text, now())
        RETURNING ai_generation_count;
      `;
      if (rows.length > 0) {
        return rows[0].ai_generation_count;
      }
    } catch (err: any) {
      console.warn('[Usage] Neon increment failed, using in-memory store:', err.message);
    }
  }

  let usage = inMemUsage.get(userId);
  if (!usage) {
    usage = {
      user_id: userId,
      ai_generation_count: 0,
      ai_chat_count: 0,
      meeting_creation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  usage.ai_generation_count += 1;
  usage.updated_at = new Date().toISOString();
  inMemUsage.set(userId, usage);
  return usage.ai_generation_count;
}

/**
 * Check and increment meeting creation usage.
 * Free users can create up to 3 live meetings.
 * Joining meetings is always unrestricted according to existing access rules.
 */
export async function checkAndIncrementMeetingUsage(userId: string): Promise<{
  allowed: boolean;
  plan: 'free' | 'pro';
  used: number;
  limit: number | null;
  message?: string;
}> {
  const { subscription, usage } = await getSubscriptionAndUsage(userId);

  if (subscription.plan === 'pro' && subscription.subscription_status === 'active') {
    await incrementMeetingUsage(userId);
    return {
      allowed: true,
      plan: 'pro',
      used: usage.meeting_creation_count + 1,
      limit: null,
    };
  }

  if (usage.meeting_creation_count >= FREE_LIMITS.MEETINGS) {
    return {
      allowed: false,
      plan: 'free',
      used: usage.meeting_creation_count,
      limit: FREE_LIMITS.MEETINGS,
      message: 'You have reached your free plan limit of 3 meetings. Upgrade your plan to continue hosting live collaborative meetings.',
    };
  }

  const updatedUsed = await incrementMeetingUsage(userId);
  return {
    allowed: true,
    plan: 'free',
    used: updatedUsed,
    limit: FREE_LIMITS.MEETINGS,
  };
}

async function incrementMeetingUsage(userId: string): Promise<number> {
  if (isNeonConfigured()) {
    try {
      const db = getSql();
      const rows = await db`
        INSERT INTO public.user_usage (user_id, ai_generation_count, ai_chat_count, meeting_creation_count, updated_at)
        VALUES (${userId}, 0, 0, 1, timezone('utc'::text, now()))
        ON CONFLICT (user_id) DO UPDATE SET
          meeting_creation_count = public.user_usage.meeting_creation_count + 1,
          updated_at = timezone('utc'::text, now())
        RETURNING meeting_creation_count;
      `;
      if (rows.length > 0) {
        return rows[0].meeting_creation_count;
      }
    } catch (err: any) {
      console.warn('[Usage] Neon meeting increment failed, using in-memory store:', err.message);
    }
  }

  let usage = inMemUsage.get(userId);
  if (!usage) {
    usage = {
      user_id: userId,
      ai_generation_count: 0,
      ai_chat_count: 0,
      meeting_creation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  usage.meeting_creation_count += 1;
  usage.updated_at = new Date().toISOString();
  inMemUsage.set(userId, usage);
  return usage.meeting_creation_count;
}

/**
 * Activate or upgrade user subscription to Pro
 */
export async function activateSubscription(params: {
  userId: string;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  expiresAt?: string | null;
  plan?: 'pro';
}): Promise<UserSubscription> {
  const { userId, polarCustomerId, polarSubscriptionId, expiresAt, plan = 'pro' } = params;

  await ensureSubscriptionSchema();

  const now = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      const rows = await db`
        INSERT INTO public.user_subscriptions (
          user_id, plan, subscription_status, polar_customer_id, polar_subscription_id,
          subscription_start_date, subscription_expiration_date, updated_at
        ) VALUES (
          ${userId}, ${plan}, 'active', ${polarCustomerId || null}, ${polarSubscriptionId || null},
          timezone('utc'::text, now()), ${expiresAt ? new Date(expiresAt).toISOString() : null}, timezone('utc'::text, now())
        )
        ON CONFLICT (user_id) DO UPDATE SET
          plan = ${plan},
          subscription_status = 'active',
          polar_customer_id = COALESCE(EXCLUDED.polar_customer_id, public.user_subscriptions.polar_customer_id),
          polar_subscription_id = COALESCE(EXCLUDED.polar_subscription_id, public.user_subscriptions.polar_subscription_id),
          subscription_start_date = COALESCE(public.user_subscriptions.subscription_start_date, timezone('utc'::text, now())),
          subscription_expiration_date = EXCLUDED.subscription_expiration_date,
          updated_at = timezone('utc'::text, now())
        RETURNING *;
      `;
      if (rows.length > 0) {
        return rows[0] as UserSubscription;
      }
    } catch (err: any) {
      console.warn('[Subscription] Neon activate failed, updating memory store:', err.message);
    }
  }

  // Memory fallback
  const sub: UserSubscription = {
    user_id: userId,
    plan: 'pro',
    subscription_status: 'active',
    polar_customer_id: polarCustomerId || null,
    polar_subscription_id: polarSubscriptionId || null,
    subscription_start_date: now,
    subscription_expiration_date: expiresAt || null,
    updated_at: now,
  };
  inMemSubscriptions.set(userId, sub);
  return sub;
}

/**
 * Update subscription status (canceled, revoked, past_due)
 */
export async function updateSubscriptionStatus(params: {
  userId?: string;
  polarSubscriptionId?: string;
  polarCustomerId?: string;
  status: 'active' | 'canceled' | 'revoked' | 'past_due';
  plan?: 'free' | 'pro';
  expiresAt?: string | null;
}): Promise<boolean> {
  const { userId, polarSubscriptionId, polarCustomerId, status, plan, expiresAt } = params;

  await ensureSubscriptionSchema();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      if (userId) {
        await db`
          UPDATE public.user_subscriptions
          SET
            subscription_status = ${status},
            plan = COALESCE(${plan || null}, plan),
            subscription_expiration_date = COALESCE(${expiresAt ? new Date(expiresAt).toISOString() : null}, subscription_expiration_date),
            updated_at = timezone('utc'::text, now())
          WHERE user_id = ${userId};
        `;
        return true;
      } else if (polarSubscriptionId) {
        await db`
          UPDATE public.user_subscriptions
          SET
            subscription_status = ${status},
            plan = COALESCE(${plan || null}, plan),
            subscription_expiration_date = COALESCE(${expiresAt ? new Date(expiresAt).toISOString() : null}, subscription_expiration_date),
            updated_at = timezone('utc'::text, now())
          WHERE polar_subscription_id = ${polarSubscriptionId};
        `;
        return true;
      } else if (polarCustomerId) {
        await db`
          UPDATE public.user_subscriptions
          SET
            subscription_status = ${status},
            plan = COALESCE(${plan || null}, plan),
            subscription_expiration_date = COALESCE(${expiresAt ? new Date(expiresAt).toISOString() : null}, subscription_expiration_date),
            updated_at = timezone('utc'::text, now())
          WHERE polar_customer_id = ${polarCustomerId};
        `;
        return true;
      }
    } catch (err: any) {
      console.warn('[Subscription] Neon status update failed, falling back to memory store:', err.message);
    }
  }

  // Memory fallback
  for (const [key, sub] of inMemSubscriptions.entries()) {
    if (
      (userId && key === userId) ||
      (polarSubscriptionId && sub.polar_subscription_id === polarSubscriptionId) ||
      (polarCustomerId && sub.polar_customer_id === polarCustomerId)
    ) {
      sub.subscription_status = status;
      if (plan) sub.plan = plan;
      if (expiresAt) sub.subscription_expiration_date = expiresAt;
      sub.updated_at = new Date().toISOString();
      inMemSubscriptions.set(key, sub);
      return true;
    }
  }

  return false;
}

/**
 * Find user id by Polar subscription ID or customer ID
 */
export async function findUserIdByPolarId(params: {
  polarSubscriptionId?: string;
  polarCustomerId?: string;
}): Promise<string | null> {
  const { polarSubscriptionId, polarCustomerId } = params;
  if (!polarSubscriptionId && !polarCustomerId) return null;

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      if (polarSubscriptionId) {
        const rows = await db`
          SELECT user_id FROM public.user_subscriptions
          WHERE polar_subscription_id = ${polarSubscriptionId}
          LIMIT 1;
        `;
        if (rows.length > 0) return rows[0].user_id;
      }
      if (polarCustomerId) {
        const rows = await db`
          SELECT user_id FROM public.user_subscriptions
          WHERE polar_customer_id = ${polarCustomerId}
          LIMIT 1;
        `;
        if (rows.length > 0) return rows[0].user_id;
      }
    } catch (err: any) {
      console.warn('[Subscription] Neon lookup failed:', err.message);
    }
  }

  for (const [key, sub] of inMemSubscriptions.entries()) {
    if (
      (polarSubscriptionId && sub.polar_subscription_id === polarSubscriptionId) ||
      (polarCustomerId && sub.polar_customer_id === polarCustomerId)
    ) {
      return key;
    }
  }

  return null;
}
