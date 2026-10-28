import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import {
  isNeonConfigured,
  insertArchitectureHistory,
  queryArchitectureHistory,
  getArchitectureById as getArchByIdNeon,
  deleteArchitectureById as deleteArchByIdNeon,
  insertRepositoryHistory,
  queryRepositoryHistory,
  getRepositoryById as getRepoByIdNeon,
  deleteRepositoryById as deleteRepoByIdNeon,
} from '../services/neon.js';

const router = Router();

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
  if (isNeonConfigured()) {
    try {
      const { rows, total } = await queryArchitectureHistory(userId, {
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
      console.error('[History API] Neon fetch error:', err);
      // Fall through to other stores if Neon query fails
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured) {
    try {
      let sbQuery = supabaseServer
        .from('architecture_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        sbQuery = sbQuery.eq('status', status);
      }
      if (query) {
        sbQuery = sbQuery.or(`title.ilike.%${query}%,prompt.ilike.%${query}%`);
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
      console.error('[History API] Supabase fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch architecture history', message: err.message });
      return;
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

  const recordTitle = (title && typeof title === 'string' && title.trim()) || prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '');

  const newRecord = {
    user_id: userId,
    title: recordTitle,
    prompt: prompt.trim(),
    generation_config: generationConfig || {},
    architecture_data: architectureData || {},
    status: ['pending', 'processing', 'completed', 'failed'].includes(status) ? status : 'completed',
    error_message: errorMessage || null,
  };

  // 1. Neon PostgreSQL
  if (isNeonConfigured()) {
    try {
      const data = await insertArchitectureHistory(newRecord);
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.error('[History API] Failed to insert into Neon:', err);
      // Fall through to other stores if Neon insert fails
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured) {
    try {
      const { data, error } = await supabaseServer
        .from('architecture_history')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.error('[History API] Failed to insert architecture history:', err);
      res.status(500).json({ error: 'Failed to persist architecture history', message: err.message });
      return;
    }
  }

  // 3. Fallback in-memory
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

  if (isNeonConfigured) {
    try {
      const data = await getArchByIdNeon(id, userId!);
      if (data) {
        res.json({ success: true, data });
        return;
      }
    } catch (err: any) {
      console.error('[History API] Neon fetch single error:', err);
    }
  }

  if (isServerSupabaseConfigured) {
    try {
      const { data, error } = await supabaseServer
        .from('architecture_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        res.status(404).json({ error: 'Architecture history record not found' });
        return;
      }
      res.json({ success: true, data });
      return;
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', message: err.message });
      return;
    }
  }

  const record = inMemoryArchHistory.find((item) => item.id === id && item.user_id === userId);
  if (!record) {
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

  if (isNeonConfigured) {
    try {
      await deleteArchByIdNeon(id, userId!);
      res.json({ success: true, message: 'Architecture history entry removed' });
      return;
    } catch (err: any) {
      console.error('[History API] Neon delete error:', err);
    }
  }

  if (isServerSupabaseConfigured) {
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
  if (isNeonConfigured()) {
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
  if (isServerSupabaseConfigured) {
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
  if (isNeonConfigured()) {
    try {
      const data = await insertRepositoryHistory(newRecord);
      res.status(201).json({ success: true, data });
      return;
    } catch (err: any) {
      console.error('[History API] Failed to insert repo history into Neon:', err);
    }
  }

  // 2. Supabase PostgreSQL
  if (isServerSupabaseConfigured) {
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
      console.error('[History API] Failed to insert repo history:', err);
      res.status(500).json({ error: 'Failed to persist repository history', message: err.message });
      return;
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

  if (isNeonConfigured) {
    try {
      await deleteRepoByIdNeon(id, userId!);
      res.json({ success: true, message: 'Repository history entry removed' });
      return;
    } catch (err: any) {
      console.error('[History API] Neon delete repo error:', err);
    }
  }

  if (isServerSupabaseConfigured) {
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
