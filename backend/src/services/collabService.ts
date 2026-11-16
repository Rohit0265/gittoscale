import crypto from 'node:crypto';
import { getSql, isNeonConfigured } from './neon.js';
import {
  CollabMeeting,
  CollabParticipant,
  CollabMessage,
  CollabPermissionMode,
  CollabArchitectureState,
} from '../collab/types.js';

// In-memory fallbacks when Postgres is offline or during testing
const inMemMeetings = new Map<string, CollabMeeting>();
const inMemParticipants = new Map<string, CollabParticipant[]>();
const inMemMessages = new Map<string, CollabMessage[]>();

const PARTICIPANT_PALETTE = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#2563EB', // Blue
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#EA580C', // Orange
];

let hasEnsuredCollabSchema = false;

export async function ensureCollabSchema(): Promise<void> {
  if (hasEnsuredCollabSchema || !isNeonConfigured()) return;
  try {
    const db = getSql();
    await db`
      CREATE TABLE IF NOT EXISTS public.collab_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host_user_id TEXT NOT NULL,
        host_user_name TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'System Architecture Design Session',
        join_code VARCHAR(12) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        permission_mode VARCHAR(20) NOT NULL DEFAULT 'collaborative',
        architecture_state JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        ended_at TIMESTAMPTZ
      );
    `;
    await db`
      CREATE TABLE IF NOT EXISTS public.collab_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES public.collab_meetings(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'participant',
        can_edit BOOLEAN NOT NULL DEFAULT true,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        UNIQUE(meeting_id, user_id)
      );
    `;
    await db`
      CREATE TABLE IF NOT EXISTS public.collab_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES public.collab_meetings(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_avatar TEXT,
        message TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'chat',
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_collab_meetings_join_code ON public.collab_meetings (join_code);`;
    await db`CREATE INDEX IF NOT EXISTS idx_collab_meetings_status ON public.collab_meetings (status);`;
    await db`CREATE INDEX IF NOT EXISTS idx_collab_participants_meeting ON public.collab_participants (meeting_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_collab_messages_meeting ON public.collab_messages (meeting_id, created_at ASC);`;
    hasEnsuredCollabSchema = true;
  } catch (err: any) {
    console.warn('[Collab Schema] Migration check warning:', err?.message || err);
  }
}

export function generateJoinCode(): string {
  // Generates e.g. "GTS-7X9" or 6-char clean alphanumeric
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export function assignParticipantColor(index: number): string {
  return PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];
}

/**
 * Creates a new collaborative meeting.
 */
export async function createMeeting(
  hostUser: { id: string; fullName: string; avatarUrl?: string },
  title?: string,
  initialArchitecture?: CollabArchitectureState
): Promise<CollabMeeting> {
  await ensureCollabSchema();
  const meetingId = crypto.randomUUID();
  const joinCode = generateJoinCode();
  const now = new Date().toISOString();
  const safeTitle = (title || 'System Architecture Design Session').trim().slice(0, 100);
  const safeArchitecture: CollabArchitectureState = {
    nodes: Array.isArray(initialArchitecture?.nodes) ? initialArchitecture.nodes : [],
    edges: Array.isArray(initialArchitecture?.edges) ? initialArchitecture.edges : [],
  };

  const meeting: CollabMeeting = {
    id: meetingId,
    host_user_id: hostUser.id,
    host_user_name: hostUser.fullName,
    title: safeTitle,
    join_code: joinCode,
    status: 'active',
    permission_mode: 'collaborative',
    architecture_state: safeArchitecture,
    created_at: now,
    updated_at: now,
    ended_at: null,
  };

  const hostParticipant: CollabParticipant = {
    id: crypto.randomUUID(),
    meeting_id: meetingId,
    user_id: hostUser.id,
    user_name: hostUser.fullName,
    user_avatar: hostUser.avatarUrl || null,
    role: 'host',
    can_edit: true,
    joined_at: now,
    last_seen_at: now,
    color: assignParticipantColor(0),
    is_online: true,
  };

  // Persist to Neon Postgres if configured
  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        INSERT INTO public.collab_meetings (
          id, host_user_id, host_user_name, title, join_code, status, permission_mode, architecture_state, created_at, updated_at
        ) VALUES (
          ${meeting.id}, ${meeting.host_user_id}, ${meeting.host_user_name}, ${meeting.title},
          ${meeting.join_code}, ${meeting.status}, ${meeting.permission_mode},
          ${JSON.stringify(meeting.architecture_state)}, ${meeting.created_at}, ${meeting.updated_at}
        );
      `;
      await db`
        INSERT INTO public.collab_participants (
          id, meeting_id, user_id, user_name, user_avatar, role, can_edit, joined_at, last_seen_at
        ) VALUES (
          ${hostParticipant.id}, ${hostParticipant.meeting_id}, ${hostParticipant.user_id},
          ${hostParticipant.user_name}, ${hostParticipant.user_avatar}, ${hostParticipant.role},
          ${hostParticipant.can_edit}, ${hostParticipant.joined_at}, ${hostParticipant.last_seen_at}
        );
      `;
    } catch (err: any) {
      console.error('[Collab] Failed to persist meeting to database, keeping in memory:', err?.message || err);
    }
  }

  // Always keep in-memory cache for ultra-fast socket lookup
  inMemMeetings.set(meetingId, meeting);
  inMemParticipants.set(meetingId, [hostParticipant]);
  inMemMessages.set(meetingId, [
    {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      sender_id: 'system',
      sender_name: 'GitToScale Collab',
      message: `Meeting started by ${hostUser.fullName}. Welcome to live collaborative system design!`,
      message_type: 'system',
      created_at: now,
    },
  ]);

  return meeting;
}

/**
 * Gets a meeting by ID.
 */
export async function getMeetingById(meetingId: string): Promise<CollabMeeting | null> {
  const cached = inMemMeetings.get(meetingId);
  if (cached) return cached;

  if (isNeonConfigured()) {
    try {
      await ensureCollabSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.collab_meetings WHERE id = ${meetingId} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        const meeting: CollabMeeting = {
          id: row.id,
          host_user_id: row.host_user_id,
          host_user_name: row.host_user_name,
          title: row.title,
          join_code: row.join_code,
          status: row.status,
          permission_mode: row.permission_mode,
          architecture_state: typeof row.architecture_state === 'string'
            ? JSON.parse(row.architecture_state)
            : (row.architecture_state || { nodes: [], edges: [] }),
          created_at: row.created_at,
          updated_at: row.updated_at,
          ended_at: row.ended_at,
        };
        inMemMeetings.set(meetingId, meeting);
        return meeting;
      }
    } catch (err: any) {
      console.warn('[Collab] Failed to get meeting from DB:', err?.message || err);
    }
  }

  return null;
}

/**
 * Gets a meeting by its Join Code (case-insensitive, ignores hyphens).
 */
export async function getMeetingByJoinCode(rawCode: string): Promise<CollabMeeting | null> {
  const cleanCode = rawCode.trim().toUpperCase().replace(/[\s-]/g, '');
  
  // Check in-memory first
  for (const meeting of inMemMeetings.values()) {
    if (meeting.join_code.replace(/-/g, '') === cleanCode) {
      return meeting;
    }
  }

  if (isNeonConfigured()) {
    try {
      await ensureCollabSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.collab_meetings 
        WHERE REPLACE(join_code, '-', '') = ${cleanCode} 
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        const meeting: CollabMeeting = {
          id: row.id,
          host_user_id: row.host_user_id,
          host_user_name: row.host_user_name,
          title: row.title,
          join_code: row.join_code,
          status: row.status,
          permission_mode: row.permission_mode,
          architecture_state: typeof row.architecture_state === 'string'
            ? JSON.parse(row.architecture_state)
            : (row.architecture_state || { nodes: [], edges: [] }),
          created_at: row.created_at,
          updated_at: row.updated_at,
          ended_at: row.ended_at,
        };
        inMemMeetings.set(meeting.id, meeting);
        return meeting;
      }
    } catch (err: any) {
      console.warn('[Collab] Failed to lookup meeting by join code from DB:', err?.message || err);
    }
  }

  return null;
}

/**
 * Adds or updates a participant in a meeting.
 */
export async function joinMeeting(
  meetingId: string,
  user: { id: string; fullName: string; avatarUrl?: string }
): Promise<{ meeting: CollabMeeting; participant: CollabParticipant; participants: CollabParticipant[] }> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found or has been removed.');
  }

  if (meeting.status === 'ended') {
    throw new Error('This collaborative session has already ended.');
  }

  const isHost = meeting.host_user_id === user.id;
  let canEdit = true;
  if (!isHost) {
    if (meeting.permission_mode === 'host_only') {
      canEdit = false;
    } else if (meeting.permission_mode === 'controlled') {
      canEdit = false; // Default until host explicitly grants permission
    }
  }

  const now = new Date().toISOString();
  let existingList = inMemParticipants.get(meetingId) || [];
  let participant = existingList.find((p) => p.user_id === user.id);

  if (participant) {
    // Reconnection / update
    participant.user_name = user.fullName;
    participant.user_avatar = user.avatarUrl || participant.user_avatar;
    participant.last_seen_at = now;
    participant.is_online = true;
    if (isHost) {
      participant.role = 'host';
      participant.can_edit = true;
    }
  } else {
    // New participant
    participant = {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      user_id: user.id,
      user_name: user.fullName,
      user_avatar: user.avatarUrl || null,
      role: isHost ? 'host' : 'participant',
      can_edit: isHost ? true : canEdit,
      joined_at: now,
      last_seen_at: now,
      color: assignParticipantColor(existingList.length),
      is_online: true,
    };
    existingList.push(participant);
    inMemParticipants.set(meetingId, existingList);

    // Add join message to chat
    await addMessage(meetingId, {
      id: 'system',
      fullName: 'GitToScale Collab',
    }, `${user.fullName} joined the session.`, 'system');
  }

  // Persist to Neon Postgres
  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        INSERT INTO public.collab_participants (
          id, meeting_id, user_id, user_name, user_avatar, role, can_edit, joined_at, last_seen_at
        ) VALUES (
          ${participant.id}, ${participant.meeting_id}, ${participant.user_id},
          ${participant.user_name}, ${participant.user_avatar}, ${participant.role},
          ${participant.can_edit}, ${participant.joined_at}, ${participant.last_seen_at}
        )
        ON CONFLICT (meeting_id, user_id) DO UPDATE SET
          user_name = EXCLUDED.user_name,
          user_avatar = EXCLUDED.user_avatar,
          last_seen_at = EXCLUDED.last_seen_at;
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to persist participant to DB:', err?.message || err);
    }
  }

  return {
    meeting,
    participant,
    participants: existingList,
  };
}

/**
 * Gets all participants of a meeting.
 */
export async function getParticipants(meetingId: string): Promise<CollabParticipant[]> {
  const cached = inMemParticipants.get(meetingId);
  if (cached && cached.length > 0) return cached;

  if (isNeonConfigured()) {
    try {
      await ensureCollabSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.collab_participants WHERE meeting_id = ${meetingId} ORDER BY joined_at ASC;
      `;
      const list: CollabParticipant[] = rows.map((r, i) => ({
        id: r.id,
        meeting_id: r.meeting_id,
        user_id: r.user_id,
        user_name: r.user_name,
        user_avatar: r.user_avatar,
        role: r.role,
        can_edit: r.can_edit,
        joined_at: r.joined_at,
        last_seen_at: r.last_seen_at,
        color: assignParticipantColor(i),
        is_online: true,
      }));
      inMemParticipants.set(meetingId, list);
      return list;
    } catch (err: any) {
      console.warn('[Collab] Failed to fetch participants from DB:', err?.message || err);
    }
  }

  return [];
}

/**
 * Updates meeting permission mode (Host Only).
 */
export async function updatePermissionMode(
  meetingId: string,
  hostUserId: string,
  newMode: CollabPermissionMode
): Promise<CollabMeeting> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_user_id !== hostUserId) {
    throw new Error('Only the meeting host can change permission settings.');
  }

  meeting.permission_mode = newMode;
  meeting.updated_at = new Date().toISOString();

  // Adjust non-host participants according to new mode
  const participants = inMemParticipants.get(meetingId) || [];
  for (const p of participants) {
    if (p.role !== 'host') {
      if (newMode === 'host_only') {
        p.can_edit = false;
      } else if (newMode === 'collaborative') {
        p.can_edit = true;
      }
      // If controlled, keep existing individual settings
    }
  }

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.collab_meetings 
        SET permission_mode = ${newMode}, updated_at = ${meeting.updated_at}
        WHERE id = ${meetingId};
      `;
      if (newMode === 'host_only') {
        await db`
          UPDATE public.collab_participants
          SET can_edit = false
          WHERE meeting_id = ${meetingId} AND role != 'host';
        `;
      } else if (newMode === 'collaborative') {
        await db`
          UPDATE public.collab_participants
          SET can_edit = true
          WHERE meeting_id = ${meetingId};
        `;
      }
    } catch (err: any) {
      console.warn('[Collab] Failed to update permission mode in DB:', err?.message || err);
    }
  }

  return meeting;
}

/**
 * Grants or revokes edit permissions for a specific participant (Host only).
 */
export async function setParticipantEditPermission(
  meetingId: string,
  hostUserId: string,
  targetUserId: string,
  canEdit: boolean
): Promise<CollabParticipant> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_user_id !== hostUserId) {
    throw new Error('Only the meeting host can grant or revoke editing permissions.');
  }

  const participants = inMemParticipants.get(meetingId) || [];
  const target = participants.find((p) => p.user_id === targetUserId);
  if (!target) throw new Error('Participant not found in this meeting');

  if (target.role === 'host') {
    target.can_edit = true; // Host cannot be stripped of editing
  } else {
    target.can_edit = canEdit;
  }

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.collab_participants
        SET can_edit = ${target.can_edit}
        WHERE meeting_id = ${meetingId} AND user_id = ${targetUserId};
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to update participant permission in DB:', err?.message || err);
    }
  }

  return target;
}

/**
 * Removes (kicks) a participant from the meeting (Host only).
 */
export async function removeParticipant(
  meetingId: string,
  hostUserId: string,
  targetUserId: string
): Promise<void> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_user_id !== hostUserId) {
    throw new Error('Only the meeting host can remove participants.');
  }
  if (targetUserId === hostUserId) {
    throw new Error('The host cannot be removed from their own meeting.');
  }

  let participants = inMemParticipants.get(meetingId) || [];
  inMemParticipants.set(
    meetingId,
    participants.filter((p) => p.user_id !== targetUserId)
  );

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        DELETE FROM public.collab_participants
        WHERE meeting_id = ${meetingId} AND user_id = ${targetUserId};
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to delete participant from DB:', err?.message || err);
    }
  }
}

/**
 * Saves the latest architecture state (nodes & edges) to the meeting.
 */
export async function saveArchitectureState(
  meetingId: string,
  userId: string,
  architectureState: CollabArchitectureState
): Promise<CollabMeeting> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  if (meeting.status === 'ended') {
    throw new Error('Cannot edit an ended meeting.');
  }

  // Permission check
  const participants = inMemParticipants.get(meetingId) || [];
  const sender = participants.find((p) => p.user_id === userId);
  const isHost = meeting.host_user_id === userId;

  if (!isHost && (!sender || !sender.can_edit)) {
    throw new Error('You do not have permission to edit the architecture.');
  }

  meeting.architecture_state = {
    nodes: Array.isArray(architectureState.nodes) ? architectureState.nodes : [],
    edges: Array.isArray(architectureState.edges) ? architectureState.edges : [],
  };
  meeting.updated_at = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.collab_meetings
        SET architecture_state = ${JSON.stringify(meeting.architecture_state)},
            updated_at = ${meeting.updated_at}
        WHERE id = ${meetingId};
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to update architecture in DB:', err?.message || err);
    }
  }

  return meeting;
}

/**
 * Adds a message to the meeting chat.
 */
export async function addMessage(
  meetingId: string,
  sender: { id: string; fullName: string; avatarUrl?: string },
  message: string,
  messageType: 'chat' | 'system' | 'ai' = 'chat'
): Promise<CollabMessage> {
  const msgObj: CollabMessage = {
    id: crypto.randomUUID(),
    meeting_id: meetingId,
    sender_id: sender.id,
    sender_name: sender.fullName,
    sender_avatar: sender.avatarUrl || null,
    message: message.trim(),
    message_type: messageType,
    created_at: new Date().toISOString(),
  };

  const current = inMemMessages.get(meetingId) || [];
  current.push(msgObj);
  inMemMessages.set(meetingId, current);

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        INSERT INTO public.collab_messages (
          id, meeting_id, sender_id, sender_name, sender_avatar, message, message_type, created_at
        ) VALUES (
          ${msgObj.id}, ${msgObj.meeting_id}, ${msgObj.sender_id},
          ${msgObj.sender_name}, ${msgObj.sender_avatar}, ${msgObj.message},
          ${msgObj.message_type}, ${msgObj.created_at}
        );
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to persist message to DB:', err?.message || err);
    }
  }

  return msgObj;
}

/**
 * Retrieves all chat messages for a meeting.
 */
export async function getMessages(meetingId: string): Promise<CollabMessage[]> {
  const cached = inMemMessages.get(meetingId);
  if (cached && cached.length > 0) return cached;

  if (isNeonConfigured()) {
    try {
      await ensureCollabSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.collab_messages 
        WHERE meeting_id = ${meetingId} 
        ORDER BY created_at ASC;
      `;
      const list: CollabMessage[] = rows.map((r) => ({
        id: r.id,
        meeting_id: r.meeting_id,
        sender_id: r.sender_id,
        sender_name: r.sender_name,
        sender_avatar: r.sender_avatar,
        message: r.message,
        message_type: r.message_type,
        created_at: r.created_at,
      }));
      inMemMessages.set(meetingId, list);
      return list;
    } catch (err: any) {
      console.warn('[Collab] Failed to fetch messages from DB:', err?.message || err);
    }
  }

  return [];
}

/**
 * Ends a meeting (Host only).
 */
export async function endMeeting(meetingId: string, hostUserId: string): Promise<CollabMeeting> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_user_id !== hostUserId) {
    throw new Error('Only the meeting host can end the meeting.');
  }

  const now = new Date().toISOString();
  meeting.status = 'ended';
  meeting.ended_at = now;
  meeting.updated_at = now;

  // Add system message
  await addMessage(
    meetingId,
    { id: 'system', fullName: 'GitToScale Collab' },
    'The meeting has been ended by the host.',
    'system'
  );

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.collab_meetings
        SET status = 'ended', ended_at = ${now}, updated_at = ${now}
        WHERE id = ${meetingId};
      `;
    } catch (err: any) {
      console.warn('[Collab] Failed to end meeting in DB:', err?.message || err);
    }
  }

  return meeting;
}
