import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import {
  isNeonConfigured,
  getSql,
  insertArchitectureHistory,
  queryArchitectureHistory,
  getArchitectureById as getArchByIdNeon,
  deleteArchitectureById as deleteArchByIdNeon,
  insertRepositoryHistory,
  queryRepositoryHistory,
  deleteRepositoryById as deleteRepoByIdNeon,
} from '../services/neon.js';

const router = Router();
const useRemoteDb = () => process.env.NODE_ENV !== 'test';

// In-memory fallback stores when neither Neon nor Supabase is configured (e.g. testing)
interface InMemArch {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  generation_config: any;
  architecture_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

interface InMemRepo {
  id: string;
  user_id: string;
  repository_url: string;
  repository_owner?: string | null;
  repository_name?: string | null;
  repository_metadata: any;
  scan_result: any;
  architecture_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

const inMemoryArchHistory: InMemArch[] = [];
const inMemoryRepoHistory: InMemRepo[] = [];

function deduplicateArchitectureRecords(items: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const item of items) {
    const projId = item.generation_config?.projectId;
    const normPrompt = (item.prompt || '').trim().toLowerCase();
    const key = projId ? `proj_${projId}` : `prompt_${normPrompt}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// =============================================================================
// ARCHITECTURE HISTORY ENDPOINTS
// =============================================================================

/**
 * GET /api/history/architectures
 * Fetch list of prompt-generated architectures for the authenticated user
 */
router.get('/architectures', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User context not found' });
    return;
  }

  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  // 1. Neon PostgreSQL
  if (isNeonConfigured() && useRemoteDb()) {
    try {
      const { rows, total } = await queryArchitectureHistory(userId, {
        query,
        status,
        limit: Math.max(limit * 2, 50),
        offset,
      });
      const deduped = deduplicateArchitectureRecords(rows || []);
      res.json({
        success: true,
        data: deduped.slice(0, limit),
        total: deduped.length < (rows || []).length ? deduped.length : total,
        limit,
        offset,
      });
      return;
    } catch (err: any) {
      console.error('[History API] Neon fetch error:', err);
      // Fall through to other stores if Neon query fails
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      let sbQuery = supabaseServer
        .from('architecture_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Math.max(limit * 2, 50) - 1);

      if (status && status !== 'all') {
        sbQuery = sbQuery.eq('status', status);
      }
      if (query) {
        sbQuery = sbQuery.or(`title.ilike.%${query}%,prompt.ilike.%${query}%`);
      }

      const { data, count, error } = await sbQuery;
      if (error) throw error;

      const deduped = deduplicateArchitectureRecords(data || []);

      res.json({
        success: true,
        data: deduped.slice(0, limit),
        total: deduped.length < (data?.length || 0) ? deduped.length : (count || 0),
        limit,
        offset,
      });
      return;
    } catch (err: any) {
      console.warn('[History API] Supabase fetch failed, falling through to in-memory store:', err?.message || err);
      // Fall through to in-memory store
    }
  }

  // 3. Fallback in-memory
  let items = inMemoryArchHistory.filter((item) => item.user_id === userId);
  if (status && status !== 'all') {
    items = items.filter((item) => item.status === status);
  }
  if (query) {
    const qLower = query.toLowerCase();
    items = items.filter(
      (item) => item.title.toLowerCase().includes(qLower) || item.prompt.toLowerCase().includes(qLower)
    );
  }
  const deduped = deduplicateArchitectureRecords(items);
  const total = deduped.length;
  const paginated = deduped.slice(offset, offset + limit);

  res.json({
    success: true,
    data: paginated,
    total,
    limit,
    offset,
  });
});

/**
 * POST /api/history/architectures
 * Save a new prompt-generated architecture
 */
router.post('/architectures', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User context not found' });
    return;
  }

  const { title, prompt, generationConfig, architectureData, status = 'completed', errorMessage } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const promptTrimmed = prompt.trim();
  const projectId = generationConfig?.projectId;
  const recordTitle = (title && typeof title === 'string' && title.trim()) || promptTrimmed.slice(0, 60) + (promptTrimmed.length > 60 ? '...' : '');

  const newRecord = {
    user_id: userId,
    title: recordTitle,
    prompt: promptTrimmed,
    generation_config: generationConfig || {},
    architecture_data: architectureData || {},
    status: ['pending', 'processing', 'completed', 'failed'].includes(status) ? status : 'completed',
    error_message: errorMessage || null,
  };

  // 1. Neon PostgreSQL
  if (isNeonConfigured() && useRemoteDb()) {
    try {
      const db = getSql();
      // Check if existing record exists for this user and project/prompt to prevent duplicates
      const existing = await db`
        SELECT id FROM public.architecture_history
        WHERE user_id = ${userId}
          AND (
            (${projectId || null}::text IS NOT NULL AND generation_config->>'projectId' = ${projectId})
            OR prompt = ${promptTrimmed}
          )
        ORDER BY updated_at DESC
        LIMIT 1;
      `;

      if (existing.length > 0) {
        const updated = await db`
          UPDATE public.architecture_history
          SET
            title = ${recordTitle},
            generation_config = ${JSON.stringify(newRecord.generation_config)}::jsonb,
            architecture_data = ${JSON.stringify(newRecord.architecture_data)}::jsonb,
            status = ${newRecord.status},
            updated_at = timezone('utc'::text, now())
          WHERE id = ${existing[0].id}
          RETURNING *;
        `;
        res.status(200).json({ success: true, data: updated[0] });
        return;
      }

      const data = await insertArchitectureHistory(newRecord);
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.error('[History API] Failed to insert into Neon:', err);
      // Fall through to other stores if Neon insert fails
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      // Check if existing record exists for this user and project/prompt to prevent duplicates
      let existingQuery = supabaseServer
        .from('architecture_history')
        .select('id')
        .eq('user_id', userId);

      if (projectId) {
        existingQuery = existingQuery.or(
          `generation_config->>projectId.eq.${projectId},prompt.eq.${promptTrimmed}`
        );
      } else {
        existingQuery = existingQuery.eq('prompt', promptTrimmed);
      }

      const { data: existing } = await existingQuery
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { data: updated, error: updateErr } = await supabaseServer
          .from('architecture_history')
          .update({
            title: recordTitle,
            generation_config: newRecord.generation_config,
            architecture_data: newRecord.architecture_data,
            status: newRecord.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!updateErr && updated) {
          res.status(200).json({ success: true, data: updated });
          return;
        }
      }

      const { data, error } = await supabaseServer
        .from('architecture_history')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.warn('[History API] Supabase insert failed, falling through to in-memory store:', err?.message || err);
      // Fall through to in-memory store
    }
  }

  // 3. Fallback in-memory
  const existingIdx = inMemoryArchHistory.findIndex(
    (item) =>
      item.user_id === userId &&
      ((projectId && item.generation_config?.projectId === projectId) ||
        item.prompt.trim().toLowerCase() === promptTrimmed.toLowerCase())
  );

  if (existingIdx !== -1) {
    inMemoryArchHistory[existingIdx] = {
      ...inMemoryArchHistory[existingIdx],
      ...newRecord,
      updated_at: new Date().toISOString(),
    };
    res.status(200).json({ success: true, data: inMemoryArchHistory[existingIdx] });
    return;
  }
  const created: InMemArch = {
    id: `arch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...newRecord,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  inMemoryArchHistory.unshift(created);

  res.status(201).json({ success: true, data: created });
});

/**
 * GET /api/history/architectures/:id
 */
router.get('/architectures/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (isNeonConfigured() && useRemoteDb()) {
    try {
      const data = await getArchByIdNeon(id, userId!);
      if (data) {
        res.json({ success: true, data });
        return;
      }
      // Also check by generation_config->>projectId
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.architecture_history
        WHERE user_id = ${userId}
          AND generation_config->>'projectId' = ${id}
        ORDER BY updated_at DESC
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        res.json({ success: true, data: rows[0] });
        return;
      }

      // Check if project exists but belongs to a different user (unverified / unauthorized access)
      const otherUserRows = await db`
        SELECT user_id FROM public.architecture_history
        WHERE (id = ${id} OR generation_config->>'projectId' = ${id})
          AND user_id != ${userId}
        LIMIT 1;
      `;
      if (otherUserRows && otherUserRows.length > 0) {
        res.status(403).json({
          error: 'Forbidden: Project ownership unverified. You do not have permission to access this project.',
          code: 'PROJECT_UNVERIFIED'
        });
        return;
      }
    } catch (err: any) {
      console.error('[History API] Neon fetch single error:', err);
    }
  }

  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      // Check primary key id or projectId in generation_config
      const { data } = await supabaseServer
        .from('architecture_history')
        .select('*')
        .eq('user_id', userId)
        .or(`id.eq.${id},generation_config->>projectId.eq.${id}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        res.json({ success: true, data });
        return;
      }

      // Check if project exists but belongs to a different user under Supabase
      const { data: otherUserData } = await supabaseServer
        .from('architecture_history')
        .select('user_id')
        .or(`id.eq.${id},generation_config->>projectId.eq.${id}`)
        .neq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (otherUserData) {
        res.status(403).json({
          error: 'Forbidden: Project ownership unverified. You do not have permission to access this project.',
          code: 'PROJECT_UNVERIFIED'
        });
        return;
      }

      res.status(404).json({ error: 'Architecture history record not found' });
      return;
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', message: err.message });
      return;
    }
  }

  const record = inMemoryArchHistory.find(
    (item) => item.user_id === userId && (item.id === id || item.generation_config?.projectId === id)
  );
  if (!record) {
    const otherUserRecord = inMemoryArchHistory.find(
      (item) => item.user_id !== userId && (item.id === id || item.generation_config?.projectId === id)
    );
    if (otherUserRecord) {
      res.status(403).json({
        error: 'Forbidden: Project ownership unverified. You do not have permission to access this project.',
        code: 'PROJECT_UNVERIFIED'
      });
      return;
    }

    res.status(404).json({ error: 'Architecture record not found' });
    return;
  }
  res.json({ success: true, data: record });
});

/**
 * DELETE /api/history/architectures/:id
 */
router.delete('/architectures/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (isNeonConfigured() && useRemoteDb()) {
    try {
      await deleteArchByIdNeon(id, userId!);
      res.json({ success: true, message: 'Architecture history entry removed' });
      return;
    } catch (err: any) {
      console.error('[History API] Neon delete error:', err);
    }
  }

  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      const { error } = await supabaseServer
        .from('architecture_history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      res.json({ success: true, message: 'Architecture history entry removed' });
      return;
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete record', message: err.message });
      return;
    }
  }

  const index = inMemoryArchHistory.findIndex((item) => item.id === id && item.user_id === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  inMemoryArchHistory.splice(index, 1);
  res.json({ success: true, message: 'Architecture history entry removed' });
});

// =============================================================================
// REPOSITORY HISTORY ENDPOINTS
// =============================================================================

/**
 * GET /api/history/repositories
 * Fetch list of scanned repository imports for the authenticated user
 */
router.get('/repositories', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User context not found' });
    return;
  }

  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  // 1. Neon PostgreSQL
  if (isNeonConfigured() && useRemoteDb()) {
    try {
      const { rows, total } = await queryRepositoryHistory(userId, {
        query,
        status,
        limit,
        offset,
      });
      res.json({
        success: true,
        data: rows,
        total,
        limit,
        offset,
      });
      return;
    } catch (err: any) {
      console.error('[History API] Neon repo fetch error:', err);
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      let sbQuery = supabaseServer
        .from('repository_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        sbQuery = sbQuery.eq('status', status);
      }
      if (query) {
        sbQuery = sbQuery.or(
          `repository_url.ilike.%${query}%,repository_name.ilike.%${query}%,repository_owner.ilike.%${query}%`
        );
      }

      const { data, count, error } = await sbQuery;
      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        total: count || 0,
        limit,
        offset,
      });
      return;
    } catch (err: any) {
      console.error('[History API] Supabase repo fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch repository history', message: err.message });
      return;
    }
  }

  // 3. Fallback in-memory
  let items = inMemoryRepoHistory.filter((item) => item.user_id === userId);
  if (status && status !== 'all') {
    items = items.filter((item) => item.status === status);
  }
  if (query) {
    const qLower = query.toLowerCase();
    items = items.filter(
      (item) =>
        item.repository_url.toLowerCase().includes(qLower) ||
        (item.repository_name && item.repository_name.toLowerCase().includes(qLower)) ||
        (item.repository_owner && item.repository_owner.toLowerCase().includes(qLower))
    );
  }
  const total = items.length;
  const paginated = items.slice(offset, offset + limit);

  res.json({
    success: true,
    data: paginated,
    total,
    limit,
    offset,
  });
});

/**
 * POST /api/history/repositories
 * Save a new scanned repository import
 */
router.post('/repositories', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User context not found' });
    return;
  }

  const {
    repositoryUrl,
    repositoryOwner,
    repositoryName,
    repositoryMetadata,
    scanResult,
    architectureData,
    status = 'completed',
    errorMessage,
  } = req.body || {};

  if (!repositoryUrl || typeof repositoryUrl !== 'string') {
    res.status(400).json({ error: 'repositoryUrl is required' });
    return;
  }

  // Derive repo owner and name if not provided
  let owner = repositoryOwner;
  let name = repositoryName;
  if (!name || !owner) {
    try {
      const cleanUrl = repositoryUrl.replace(/\.git$/, '');
      const parts = cleanUrl.split('/');
      if (parts.length >= 2) {
        name = name || parts[parts.length - 1];
        owner = owner || parts[parts.length - 2];
      }
    } catch {}
  }

  const newRecord = {
    user_id: userId,
    repository_url: repositoryUrl.trim(),
    repository_owner: owner || null,
    repository_name: name || null,
    repository_metadata: repositoryMetadata || {},
    scan_result: scanResult || {},
    architecture_data: architectureData || {},
    status: ['pending', 'processing', 'completed', 'failed'].includes(status) ? status : 'completed',
    error_message: errorMessage || null,
  };

  // 1. Neon PostgreSQL
  if (isNeonConfigured() && useRemoteDb()) {
    try {
      const data = await insertRepositoryHistory(newRecord);
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.error('[History API] Failed to insert repo history into Neon:', err);
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      const { data, error } = await supabaseServer
        .from('repository_history')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.warn('[History API] Supabase repo insert failed, falling through to in-memory store:', err?.message || err);
      // Fall through to in-memory store
    }
  }

  // 3. Fallback in-memory
  const created: InMemRepo = {
    id: `repo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...newRecord,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  inMemoryRepoHistory.unshift(created);

  res.status(201).json({ success: true, data: created });
});

/**
 * DELETE /api/history/repositories/:id
 */
router.delete('/repositories/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (isNeonConfigured() && useRemoteDb()) {
    try {
      await deleteRepoByIdNeon(id, userId!);
      res.json({ success: true, message: 'Repository history entry removed' });
      return;
    } catch (err: any) {
      console.error('[History API] Neon delete repo error:', err);
    }
  }

  if (isServerSupabaseConfigured && useRemoteDb()) {
    try {
      const { error } = await supabaseServer
        .from('repository_history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      res.json({ success: true, message: 'Repository history entry removed' });
      return;
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete repository entry', message: err.message });
      return;
    }
  }

  const index = inMemoryRepoHistory.findIndex((item) => item.id === id && item.user_id === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Repository entry not found' });
    return;
  }
  inMemoryRepoHistory.splice(index, 1);
  res.json({ success: true, message: 'Repository history entry removed' });
});

export default router;
