import { useEffect, useRef, useState, useCallback } from 'react';
import { ArchitectureNode, ArchitectureEdge } from '../types';
import { api } from './api';

export interface PlaygroundPersistenceState {
  projectId?: string;
  prompt: string;
  title?: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  incomingTrafficRate: number;
  durationSeconds?: number;
  viewMode?: 'basic' | 'detailed';
  selectedAnswers?: Record<string, string>;
  basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
  detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
  timestamp: number;
  lastSavedIso: string;
}

export type AutoSaveStatus = 'saved' | 'saving' | 'local_only' | 'error';

const ACTIVE_PLAYGROUND_KEY = 'gitoscale_playground_active_state';
const LAST_SYNCED_HASH_KEY = 'gitoscale_playground_last_synced_hash';

/**
 * Computes a fast lightweight fingerprint of the playground topology & parameters
 * to avoid duplicate API calls if nothing changed.
 */
export function computePlaygroundHash(state: Partial<PlaygroundPersistenceState>): string {
  const nodeSummary = (state.nodes || [])
    .map(
      (n) =>
        `${n.id}:${n.name}:${n.type}:${n.enabled ? 1 : 0}:${n.workerCount}:${n.capacityPerSecond}:${Math.round(n.position?.x || 0)},${Math.round(n.position?.y || 0)}`
    )
    .sort()
    .join('|');

  const edgeSummary = (state.edges || [])
    .map((e) => `${e.source}->${e.target}:${e.enabled ? 1 : 0}:${e.requestsPerInput || 1}`)
    .sort()
    .join('|');

  return `${state.projectId || ''}#${state.prompt || ''}#${state.incomingTrafficRate || 1000}#${state.viewMode || 'basic'}#${nodeSummary}#${edgeSummary}`;
}

/**
 * Saves playground state immediately to browser storage (localStorage).
 * Executes synchronously with zero latency to guarantee recovery even upon sudden shutdown.
 */
export function savePlaygroundToBrowserStorage(state: PlaygroundPersistenceState, userId?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(ACTIVE_PLAYGROUND_KEY, raw);

    if (state.projectId) {
      localStorage.setItem(`gitoscale_project_state_${state.projectId}`, raw);
      localStorage.setItem(`gitoscale_project_${state.projectId}`, state.prompt);
      if (userId) {
        localStorage.setItem(`gitoscale_project_owner_${state.projectId}`, userId);
      }
      localStorage.setItem(
        `gitoscale_arch_${state.projectId}`,
        JSON.stringify({ nodes: state.nodes, edges: state.edges })
      );
    }

    window.dispatchEvent(
      new CustomEvent('gitoscale:playground_saved', {
        detail: { target: 'browser', timestamp: state.timestamp, projectId: state.projectId },
      })
    );
    return true;
  } catch (err) {
    console.warn('[PlaygroundPersistence] Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Loads playground state from browser storage.
 * Prioritizes project-specific state, falling back to active state.
 * If currentUserId is passed, verifies that local project ownership matches.
 */
export function loadPlaygroundFromBrowserStorage(
  projectId?: string | null,
  currentUserId?: string | null
): PlaygroundPersistenceState | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try project-specific key
    if (projectId) {
      if (currentUserId) {
        const storedOwner = localStorage.getItem(`gitoscale_project_owner_${projectId}`);
        if (storedOwner && storedOwner !== currentUserId) {
          // Belongs to a different account in local storage
          return null;
        }
      }

      const projRaw = localStorage.getItem(`gitoscale_project_state_${projectId}`);
      if (projRaw) {
        const parsed = JSON.parse(projRaw);
        if (parsed && Array.isArray(parsed.nodes)) {
          return parsed;
        }
      }

      // Legacy fallback for gitoscale_arch_
      const archRaw = localStorage.getItem(`gitoscale_arch_${projectId}`);
      const promptCached = localStorage.getItem(`gitoscale_project_${projectId}`) || '';
      if (archRaw) {
        const parsedArch = JSON.parse(archRaw);
        const nodes = parsedArch.nodes || (Array.isArray(parsedArch) ? parsedArch : []);
        if (nodes.length > 0) {
          return {
            projectId,
            prompt: promptCached,
            nodes,
            edges: parsedArch.edges || [],
            incomingTrafficRate: 1000,
            viewMode: 'basic',
            timestamp: Date.now(),
            lastSavedIso: new Date().toISOString(),
          };
        }
      }
    }

    // 2. Try global active state
    const globalRaw = localStorage.getItem(ACTIVE_PLAYGROUND_KEY);
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PlaygroundPersistence] Failed to load from localStorage:', err);
  }

  return null;
}

/**
 * Saves playground state to the backend database (PostgreSQL via Neon / Supabase).
 */
export async function syncPlaygroundToDatabase(
  token: string | null,
  state: PlaygroundPersistenceState
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!token) {
    return { success: false, error: 'User unauthenticated' };
  }

  const hash = computePlaygroundHash(state);
  const lastSyncedHash =
    typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNCED_HASH_KEY) : null;

  // Don't issue redundant network request if already synced
  if (lastSyncedHash === hash) {
    return { success: true };
  }

  try {
    const payload = {
      title: state.title || state.prompt?.slice(0, 60) || 'Playground Architecture',
      prompt: state.prompt || 'Custom Scalable Architecture',
      generationConfig: {
        projectId: state.projectId,
        viewMode: state.viewMode || 'basic',
        incomingTrafficRate: state.incomingTrafficRate || 1000,
        selectedAnswers: state.selectedAnswers || {},
        timestamp: state.timestamp,
      },
      architectureData: {
        nodes: state.nodes,
        edges: state.edges,
        basicGraph: state.basicGraph,
        detailedGraph: state.detailedGraph,
        incomingTrafficRate: state.incomingTrafficRate,
        durationSeconds: state.durationSeconds,
      },
      status: 'completed',
    };

    const res = await api.saveArchitectureHistory(token, payload);
    if (res?.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNCED_HASH_KEY, hash);
      }
      window.dispatchEvent(
        new CustomEvent('gitoscale:playground_saved', {
          detail: { target: 'database', timestamp: Date.now(), projectId: state.projectId },
        })
      );
      return { success: true, data: res.data };
    }
    return { success: false, error: 'Database save did not return success' };
  } catch (err: any) {
    console.warn('[PlaygroundPersistence] Failed to sync to database:', err?.message || err);
    return { success: false, error: err?.message || 'Database sync error' };
  }
}

export interface UsePlaygroundPersistenceOptions {
  projectId?: string;
  prompt: string;
  title?: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  incomingTrafficRate: number;
  durationSeconds?: number;
  viewMode?: 'basic' | 'detailed';
  selectedAnswers?: Record<string, string>;
  basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
  detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
  user?: any;
  getAuthToken?: () => string | null;
  enabled?: boolean;
}

/**
 * Universal Auto-Save Hook for the Playground.
 * Automatically saves all canvas edits to browser storage immediately,
 * and debounces database persistence to protect against sudden PC shutdowns.
 */
export function usePlaygroundPersistence(options: UsePlaygroundPersistenceOptions) {
  const {
    projectId,
    prompt,
    title,
    nodes,
    edges,
    incomingTrafficRate,
    durationSeconds,
    viewMode = 'basic',
    selectedAnswers,
    basicGraph,
    detailedGraph,
    user,
    getAuthToken,
    enabled = true,
  } = options;

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(() => new Date());

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<PlaygroundPersistenceState | null>(null);

  // Keep state ref fresh for beforeunload flushes
  const currentState: PlaygroundPersistenceState = {
    projectId,
    prompt: prompt || 'Custom Scalable Architecture',
    title,
    nodes,
    edges,
    incomingTrafficRate,
    durationSeconds,
    viewMode,
    selectedAnswers,
    basicGraph,
    detailedGraph,
    timestamp: Date.now(),
    lastSavedIso: new Date().toISOString(),
  };
  latestStateRef.current = currentState;

  // 1. Immediate browser storage save + debounced DB sync on ANY change
  useEffect(() => {
    if (!enabled || (nodes.length === 0 && !prompt)) return;

    // A. Immediate Local Storage Save (instant recovery on sudden shutdown)
    savePlaygroundToBrowserStorage(currentState, user?.id);

    const token = getAuthToken ? getAuthToken() : null;
    const isAuthenticated = Boolean(user && token);

    if (!isAuthenticated) {
      setSaveStatus('local_only');
      setLastSaved(new Date());
      return;
    }

    setSaveStatus('saving');

    // B. Debounced Cloud Database Sync (1,200ms after user pauses editing)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!latestStateRef.current) return;
      const res = await syncPlaygroundToDatabase(token, latestStateRef.current);
      if (res.success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
      } else {
        setSaveStatus('local_only');
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    nodes,
    edges,
    incomingTrafficRate,
    durationSeconds,
    viewMode,
    prompt,
    title,
    projectId,
    selectedAnswers,
    basicGraph,
    detailedGraph,
    enabled,
    user,
    getAuthToken,
  ]);

  // 2. Immediate flush on tab close / reload / visibility change
  useEffect(() => {
    const handleFlush = () => {
      if (latestStateRef.current && (latestStateRef.current.nodes.length > 0 || latestStateRef.current.prompt)) {
        savePlaygroundToBrowserStorage(latestStateRef.current, user?.id);

        const token = getAuthToken ? getAuthToken() : null;
        if (token) {
          syncPlaygroundToDatabase(token, latestStateRef.current).catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };

    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getAuthToken]);

  const forceSyncNow = useCallback(async () => {
    if (!latestStateRef.current) return false;
    savePlaygroundToBrowserStorage(latestStateRef.current, user?.id);
    const token = getAuthToken ? getAuthToken() : null;
    if (token) {
      setSaveStatus('saving');
      const res = await syncPlaygroundToDatabase(token, latestStateRef.current);
      if (res.success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        return true;
      }
    }
    setSaveStatus('local_only');
    return false;
  }, [getAuthToken]);

  return {
    saveStatus,
    lastSaved,
    forceSyncNow,
  };
}

