import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import {
  isNeonConfigured,
  getSql,
  insertArchitectureHistory,
} from '../services/neon.js';
import { generateAIChatReply, streamAIChatReply } from '../services/aiChatService.js';
import { resolveUserFromRequest } from '../middleware/auth.js';
import { checkAndIncrementAiUsage } from '../services/subscriptionService.js';

const router = Router();

// In-memory cache for chat sessions (fallback when no DB is available)
interface InMemChatSession {
  sessionId: string;
  userId?: string;
  prompt: string;
  messages: any[];
  selectedAnswers: any;
  architectureData?: any;
  updatedAt: string;
}

const inMemoryChatStore = new Map<string, InMemChatSession>();

/**
 * Helper to extract user ID from Authorization header if present
 */
async function getUserIdFromReq(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const allowMockAuth =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';

  if (token.startsWith('mock_jwt_')) {
    if (!allowMockAuth) return null;
    try {
      const payloadBase64 = token.replace('mock_jwt_', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      return payload.id || null;
    } catch {
      return null;
    }
  }

  if (isServerSupabaseConfigured) {
    try {
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (!error && user) return user.id;
    } catch (e) {
      // ignore
    }
  }
  return null;
}

/**
 * POST /api/chat/save
 * Persist or update the chat session (up to 200 messages) in DB / memory
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = await getUserIdFromReq(req);
    // Never trust client-supplied userId for database persistence.
    // Unauthenticated sessions are saved in-memory only.
    const userId = authenticatedUserId || 'anonymous';
    const {
      projectId,
      prompt = 'Scalable distributed cloud architecture',
      messages = [],
      selectedAnswers = {},
      architectureData = {},
    } = req.body;

    const promptText = (prompt || '').trim();
    const sessionId =
      req.body.sessionId ||
      (projectId
        ? `chat_${projectId}`
        : `chat_${Buffer.from(promptText || 'default').toString('base64url').slice(0, 32)}`);

    // Cap context at 200 messages
    const cappedMessages = Array.isArray(messages) ? messages.slice(-200) : [];

    const recordData = {
      user_id: userId,
      title: promptText.slice(0, 60),
      prompt: promptText,
      generation_config: {
        chatSessionId: sessionId,
        projectId: projectId || undefined,
        chatMessages: cappedMessages,
        selectedAnswers,
        messageCount: cappedMessages.length,
      },
      architecture_data: architectureData,
      status: 'completed',
    };

    // 1. Neon PostgreSQL
    if (isNeonConfigured() && userId !== 'anonymous') {
      try {
        const db = getSql();
        // Check if existing record for this prompt/session/project exists
        const existing = await db`
          SELECT id FROM public.architecture_history
          WHERE user_id = ${userId}
            AND (
              generation_config->>'chatSessionId' = ${sessionId}
              OR (${projectId || null}::text IS NOT NULL AND generation_config->>'projectId' = ${projectId})
              OR prompt = ${promptText}
            )
          ORDER BY updated_at DESC
          LIMIT 1;
        `;

        if (existing.length > 0) {
          const updated = await db`
            UPDATE public.architecture_history
            SET
              generation_config = ${JSON.stringify(recordData.generation_config)}::jsonb,
              architecture_data = ${JSON.stringify(recordData.architecture_data)}::jsonb,
              updated_at = timezone('utc'::text, now())
            WHERE id = ${existing[0].id}
            RETURNING *;
          `;
          return res.json({ success: true, id: updated[0].id, count: cappedMessages.length });
        } else if (architectureData?.nodes?.length && promptText && promptText.trim().length > 0) {
          const inserted = await insertArchitectureHistory(recordData);
          return res.json({ success: true, id: inserted.id, count: cappedMessages.length });
        } else {
          return res.json({ success: true, id: sessionId, count: cappedMessages.length });
        }
      } catch (err: any) {
        console.warn('[Chat API] Neon save error:', err.message);
      }
    }

    // 2. Supabase PostgreSQL
    if (isServerSupabaseConfigured && userId !== 'anonymous') {
      try {
        let existingQuery = supabaseServer
          .from('architecture_history')
          .select('id')
          .eq('user_id', userId);

        if (projectId) {
          existingQuery = existingQuery.or(
            `generation_config->>projectId.eq.${projectId},generation_config->>chatSessionId.eq.${sessionId},prompt.eq.${promptText}`
          );
        } else {
          existingQuery = existingQuery.or(
            `generation_config->>chatSessionId.eq.${sessionId},prompt.eq.${promptText}`
          );
        }

        const { data: existing } = await existingQuery
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          await supabaseServer
            .from('architecture_history')
            .update({
              generation_config: recordData.generation_config,
              architecture_data: recordData.architecture_data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          return res.json({ success: true, id: existing.id, count: cappedMessages.length });
        } else if (architectureData?.nodes?.length && promptText && promptText.trim().length > 0) {
          const { data: inserted, error } = await supabaseServer
            .from('architecture_history')
            .insert(recordData)
            .select()
            .single();
          if (!error && inserted) {
            return res.json({ success: true, id: inserted.id, count: cappedMessages.length });
          }
        } else {
          return res.json({ success: true, id: sessionId, count: cappedMessages.length });
        }
      } catch (err: any) {
        console.warn('[Chat API] Supabase save error:', err.message);
      }
    }

    // 3. Fallback In-Memory Store
    const sessionKey = `${userId}:${sessionId}`;
    inMemoryChatStore.set(sessionKey, {
      sessionId,
      userId,
      prompt,
      messages: cappedMessages,
      selectedAnswers,
      architectureData,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      id: sessionId,
      count: cappedMessages.length,
      storage: 'memory',
    });
  } catch (err: any) {
    console.error('[Chat API Save Error]', err);
    return res.status(500).json({ error: 'Failed to save chat history', message: err.message });
  }
});

/**
 * GET /api/chat/history
 * Retrieve stored chat messages (up to 200) for user or session
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = await getUserIdFromReq(req);
    const sessionId = (req.query.sessionId as string) || '';

    // If not authenticated, do not query DB by arbitrary query params; query in-memory store only.
    if (!authenticatedUserId) {
      const sessionKey = `anonymous:${sessionId}`;
      const inMem = inMemoryChatStore.get(sessionKey) || (sessionId ? inMemoryChatStore.get(sessionId) : undefined);
      if (inMem) {
        return res.json({
          success: true,
          sessionId: inMem.sessionId,
          prompt: inMem.prompt,
          messages: inMem.messages.slice(-200),
          selectedAnswers: inMem.selectedAnswers,
          architectureData: inMem.architectureData,
          storage: 'memory',
        });
      }
      return res.json({
        success: true,
        messages: [],
        selectedAnswers: {},
        sessionId,
        storage: 'memory',
      });
    }

    const userId = authenticatedUserId;

    // 1. Neon PostgreSQL
    if (isNeonConfigured() && userId !== 'anonymous') {
      try {
        const db = getSql();
        let rows: any[] = [];
        if (sessionId) {
          rows = await db`
            SELECT * FROM public.architecture_history
            WHERE user_id = ${userId}
              AND generation_config->>'chatSessionId' = ${sessionId}
            ORDER BY updated_at DESC
            LIMIT 1;
          `;
        }
        if (rows.length === 0) {
          rows = await db`
            SELECT * FROM public.architecture_history
            WHERE user_id = ${userId}
              AND generation_config ? 'chatMessages'
            ORDER BY updated_at DESC
            LIMIT 1;
          `;
        }

        if (rows.length > 0) {
          const genConfig = rows[0].generation_config || {};
          const messages = Array.isArray(genConfig.chatMessages) ? genConfig.chatMessages.slice(-200) : [];
          return res.json({
            success: true,
            sessionId: genConfig.chatSessionId || rows[0].id,
            prompt: rows[0].prompt,
            messages,
            selectedAnswers: genConfig.selectedAnswers || {},
            architectureData: rows[0].architecture_data || {},
          });
        }
      } catch (err: any) {
        console.warn('[Chat API] Neon history fetch error:', err.message);
      }
    }

    // 2. Supabase PostgreSQL
    if (isServerSupabaseConfigured && userId !== 'anonymous') {
      try {
        let query = supabaseServer
          .from('architecture_history')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (sessionId) {
          query = query.eq('generation_config->>chatSessionId', sessionId);
        }

        const { data } = await query;
        if (data && data.length > 0) {
          const genConfig = data[0].generation_config || {};
          const messages = Array.isArray(genConfig.chatMessages) ? genConfig.chatMessages.slice(-200) : [];
          return res.json({
            success: true,
            sessionId: genConfig.chatSessionId || data[0].id,
            prompt: data[0].prompt,
            messages,
            selectedAnswers: genConfig.selectedAnswers || {},
            architectureData: data[0].architecture_data || {},
          });
        }
      } catch (err: any) {
        console.warn('[Chat API] Supabase history fetch error:', err.message);
      }
    }

    // 3. Fallback In-Memory
    const sessionKey = `${userId}:${sessionId}`;
    const inMem = inMemoryChatStore.get(sessionKey);
    if (inMem) {
      return res.json({
        success: true,
        sessionId: inMem.sessionId,
        prompt: inMem.prompt,
        messages: inMem.messages.slice(-200),
        selectedAnswers: inMem.selectedAnswers,
        architectureData: inMem.architectureData,
      });
    }

    return res.json({
      success: true,
      messages: [],
      selectedAnswers: {},
      sessionId,
    });
  } catch (err: any) {
    console.error('[Chat API History Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve chat history', message: err.message });
  }
});

function getChatClientIdentifier(req: Request): string {
  if (process.env.NODE_ENV === 'test') {
    return 'anon_test_' + (req.headers['x-test-session-id'] || crypto.randomUUID());
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'guest';
  return 'anon_' + crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
}

/**
 * POST /api/chat/message
 * Generates an authentic AI response with live playground architecture context.
 * Supports token-by-token streaming via SSE when stream=true or Accept: text/event-stream
 */
router.post('/message', async (req: Request, res: Response) => {
  const {
    message = '',
    history = [],
    architectureContext = {},
    llmConfig = {},
    stream = false,
  } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const user = await resolveUserFromRequest(req);
  const userId = user?.id || (await getUserIdFromReq(req)) || getChatClientIdentifier(req);

  const check = await checkAndIncrementAiUsage(userId);
  if (!check.allowed) {
    return res.status(403).json({
      error: 'PLAN_LIMIT_REACHED',
      message: 'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.',
      upgradeUrl: '/payment',
      plan: check.plan,
      used: check.used,
      limit: check.limit,
    });
  }

  const wantsStream = Boolean(
    stream ||
    req.headers.accept?.includes('text/event-stream') ||
    req.query.stream === 'true'
  );

  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let accumulated = '';
    try {
      const aiResult = await streamAIChatReply(
        {
          message: message.trim(),
          history,
          architectureContext,
          llmConfig,
        },
        (token: string) => {
          accumulated += token;
          res.write(`data: ${JSON.stringify({ token, fullText: accumulated })}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({ done: true, reply: aiResult.reply, actionDone: aiResult.actionDone })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    } catch (err: any) {
      console.error('[Chat API Streaming Error]', err);
      const fallbackMsg = 'Traffic is more than expected. Please retry later.';
      if (!accumulated) {
        res.write(`data: ${JSON.stringify({ token: fallbackMsg, fullText: fallbackMsg, done: true, reply: fallbackMsg })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ done: true, reply: accumulated })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
  }

  try {
    const aiResult = await generateAIChatReply({
      message: message.trim(),
      history,
      architectureContext,
      llmConfig,
    });

    return res.json({
      success: true,
      reply: aiResult.reply,
      actionDone: aiResult.actionDone,
    });
  } catch (err: any) {
    console.error('[Chat API Message Error]', err);
    return res.status(200).json({
      success: true,
      reply: 'Traffic is more than expected. Please retry later.',
    });
  }
});

export default router;

