import { Router, Request, Response } from 'express';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import {
  isNeonConfigured,
  getSql,
  insertArchitectureHistory,
  queryArchitectureHistory,
} from '../services/neon.js';

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
  const token = authHeader.split(' ')[1];
  if (!token) return null;

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
    const userId = await getUserIdFromReq(req) || req.body.userId || 'anonymous';
    const {
      sessionId = `chat_${Date.now()}`,
      prompt = 'Scalable distributed cloud architecture',
      messages = [],
      selectedAnswers = {},
      architectureData = {},
    } = req.body;

    // Cap context at 200 messages
    const cappedMessages = Array.isArray(messages) ? messages.slice(-200) : [];

    const recordData = {
      user_id: userId,
      title: prompt.slice(0, 60),
      prompt,
      generation_config: {
        chatSessionId: sessionId,
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
        // Check if existing record for this prompt/session exists
        const existing = await db`
          SELECT id FROM public.architecture_history
          WHERE user_id = ${userId}
            AND (generation_config->>'chatSessionId' = ${sessionId} OR prompt = ${prompt})
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
        } else {
          const inserted = await insertArchitectureHistory(recordData);
          return res.json({ success: true, id: inserted.id, count: cappedMessages.length });
        }
      } catch (err: any) {
        console.warn('[Chat API] Neon save error:', err.message);
      }
    }

    // 2. Supabase PostgreSQL
    if (isServerSupabaseConfigured && userId !== 'anonymous') {
      try {
        const { data: existing } = await supabaseServer
          .from('architecture_history')
          .select('id')
          .eq('user_id', userId)
          .eq('generation_config->>chatSessionId', sessionId)
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
        } else {
          const { data: inserted, error } = await supabaseServer
            .from('architecture_history')
            .insert(recordData)
            .select()
            .single();
          if (!error && inserted) {
            return res.json({ success: true, id: inserted.id, count: cappedMessages.length });
          }
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
    const userId = await getUserIdFromReq(req) || (req.query.userId as string) || 'anonymous';
    const sessionId = (req.query.sessionId as string) || '';

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

export default router;

