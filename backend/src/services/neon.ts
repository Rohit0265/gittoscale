import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { loadEnvFiles } from '../utils/env.js';

// Ensure environment files (.env) are loaded
loadEnvFiles();

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || '';
}

export function isNeonConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(
    url &&
    (url.includes('neon.tech') || url.includes('postgres://') || url.includes('postgresql://'))
  );
}

let _sqlInstance: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sqlInstance) {
    const url = getDatabaseUrl();
    if (!url) {
      throw new Error('DATABASE_URL is not set for Neon');
    }
    _sqlInstance = neon(url);
  }
  return _sqlInstance;
}

// Proxy export for tagged template syntax: sql`...`
export const sql: NeonQueryFunction<false, false> = ((...args: any[]) => {
  return (getSql() as any)(...args);
}) as unknown as NeonQueryFunction<false, false>;

export interface ArchitectureRecord {
  id?: string;
  user_id: string;
  title: string;
  prompt: string;
  generation_config?: any;
  architecture_data?: any;
  status?: string;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RepositoryRecord {
  id?: string;
  user_id: string;
  repository_url: string;
  repository_owner?: string | null;
  repository_name?: string | null;
  repository_metadata?: any;
  scan_result?: any;
  architecture_data?: any;
  status?: string;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function insertArchitectureHistory(record: ArchitectureRecord) {
  const db = getSql();
  const rows = await db`
    INSERT INTO public.architecture_history (
      user_id, title, prompt, generation_config, architecture_data, status, error_message
    ) VALUES (
      ${record.user_id},
      ${record.title},
      ${record.prompt},
      ${JSON.stringify(record.generation_config || {})}::jsonb,
      ${JSON.stringify(record.architecture_data || {})}::jsonb,
      ${record.status || 'completed'},
      ${record.error_message || null}
    )
    RETURNING *;
  `;
  return rows[0];
}

export async function queryArchitectureHistory(
  userId: string,
  options: { query?: string; status?: string; limit?: number; offset?: number } = {}
) {
  const db = getSql();
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const query = options.query?.trim() ? `%${options.query.trim().toLowerCase()}%` : null;
  const status = options.status && options.status !== 'all' ? options.status : null;

  let rows: any[];
  let countResult: any[];

  if (query && status) {
    rows = await db`
      SELECT * FROM public.architecture_history
      WHERE user_id = ${userId}
        AND status = ${status}
        AND (LOWER(title) LIKE ${query} OR LOWER(prompt) LIKE ${query})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.architecture_history
      WHERE user_id = ${userId}
        AND status = ${status}
        AND (LOWER(title) LIKE ${query} OR LOWER(prompt) LIKE ${query});
    `;
  } else if (query) {
    rows = await db`
      SELECT * FROM public.architecture_history
      WHERE user_id = ${userId}
        AND (LOWER(title) LIKE ${query} OR LOWER(prompt) LIKE ${query})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.architecture_history
      WHERE user_id = ${userId}
        AND (LOWER(title) LIKE ${query} OR LOWER(prompt) LIKE ${query});
    `;
  } else if (status) {
    rows = await db`
      SELECT * FROM public.architecture_history
      WHERE user_id = ${userId} AND status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.architecture_history
      WHERE user_id = ${userId} AND status = ${status};
    `;
  } else {
    rows = await db`
      SELECT * FROM public.architecture_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.architecture_history
      WHERE user_id = ${userId};
    `;
  }

  return {
    rows,
    total: countResult[0]?.count || 0,
  };
}

export async function getArchitectureById(id: string, userId: string) {
  const db = getSql();
  const rows = await db`
    SELECT * FROM public.architecture_history
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1;
  `;
  return rows[0] || null;
}

export async function deleteArchitectureById(id: string, userId: string) {
  const db = getSql();
  await db`
    DELETE FROM public.architecture_history
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return true;
}

export async function insertRepositoryHistory(record: RepositoryRecord) {
  const db = getSql();
  const rows = await db`
    INSERT INTO public.repository_history (
      user_id, repository_url, repository_owner, repository_name,
      repository_metadata, scan_result, architecture_data, status, error_message
    ) VALUES (
      ${record.user_id},
      ${record.repository_url},
      ${record.repository_owner || null},
      ${record.repository_name || null},
      ${JSON.stringify(record.repository_metadata || {})}::jsonb,
      ${JSON.stringify(record.scan_result || {})}::jsonb,
      ${JSON.stringify(record.architecture_data || {})}::jsonb,
      ${record.status || 'completed'},
      ${record.error_message || null}
    )
    RETURNING *;
  `;
  return rows[0];
}

export async function queryRepositoryHistory(
  userId: string,
  options: { query?: string; status?: string; limit?: number; offset?: number } = {}
) {
  const db = getSql();
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const query = options.query?.trim() ? `%${options.query.trim().toLowerCase()}%` : null;
  const status = options.status && options.status !== 'all' ? options.status : null;

  let rows: any[];
  let countResult: any[];

  if (query && status) {
    rows = await db`
      SELECT * FROM public.repository_history
      WHERE user_id = ${userId}
        AND status = ${status}
        AND (LOWER(repository_url) LIKE ${query} OR LOWER(COALESCE(repository_name, '')) LIKE ${query} OR LOWER(COALESCE(repository_owner, '')) LIKE ${query})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.repository_history
      WHERE user_id = ${userId}
        AND status = ${status}
        AND (LOWER(repository_url) LIKE ${query} OR LOWER(COALESCE(repository_name, '')) LIKE ${query} OR LOWER(COALESCE(repository_owner, '')) LIKE ${query});
    `;
  } else if (query) {
    rows = await db`
      SELECT * FROM public.repository_history
      WHERE user_id = ${userId}
        AND (LOWER(repository_url) LIKE ${query} OR LOWER(COALESCE(repository_name, '')) LIKE ${query} OR LOWER(COALESCE(repository_owner, '')) LIKE ${query})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.repository_history
      WHERE user_id = ${userId}
        AND (LOWER(repository_url) LIKE ${query} OR LOWER(COALESCE(repository_name, '')) LIKE ${query} OR LOWER(COALESCE(repository_owner, '')) LIKE ${query});
    `;
  } else if (status) {
    rows = await db`
      SELECT * FROM public.repository_history
      WHERE user_id = ${userId} AND status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.repository_history
      WHERE user_id = ${userId} AND status = ${status};
    `;
  } else {
    rows = await db`
      SELECT * FROM public.repository_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    countResult = await db`
      SELECT count(*)::int as count FROM public.repository_history
      WHERE user_id = ${userId};
    `;
  }

  return {
    rows,
    total: countResult[0]?.count || 0,
  };
}

export async function getRepositoryById(id: string, userId: string) {
  const db = getSql();
  const rows = await db`
    SELECT * FROM public.repository_history
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1;
  `;
  return rows[0] || null;
}

export async function deleteRepositoryById(id: string, userId: string) {
  const db = getSql();
  await db`
    DELETE FROM public.repository_history
    WHERE id = ${id} AND user_id = ${userId};
  `;
  return true;
}
