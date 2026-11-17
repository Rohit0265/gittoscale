import crypto from 'node:crypto';
import { getSql, isNeonConfigured } from '../services/neon.js';
import {
  Meeting,
  MeetingParticipant,
  MeetingRole,
  ArchitectureState,
} from './types.js';

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

export const inMemMeetings = new Map<string, Meeting>();
export const inMemMeetingParticipants = new Map<string, MeetingParticipant[]>();

let hasEnsuredMeetingSchema = false;

export async function ensureMeetingSchema(): Promise<void> {
  if (hasEnsuredMeetingSchema || !isNeonConfigured()) return;
  try {
    const db = getSql();
    await db`
      CREATE TABLE IF NOT EXISTS public.meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id TEXT,
        host_id TEXT NOT NULL,
        host_name TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'System Architecture Design Session',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_locked BOOLEAN NOT NULL DEFAULT false,
        architecture_state JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        ended_at TIMESTAMPTZ
      );
    `;
    await db`
      CREATE TABLE IF NOT EXISTS public.meeting_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'editor',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        UNIQUE(meeting_id, user_id)
      );
    `;
    await db`CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings (status);`;
    await db`CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants (meeting_id);`;
    hasEnsuredMeetingSchema = true;
  } catch (err: any) {
    console.warn('[Meeting Schema] Auto-migration check warning:', err?.message || err);
  }
}

export function assignColor(index: number): string {
  return PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];
}

/**
 * Creates a collaborative meeting initialized with an architecture.
 */
export async function createMeeting(
  hostUser: { id: string; fullName: string; avatarUrl?: string },
  projectId?: string | null,
  title?: string,
  initialArchitecture?: ArchitectureState
): Promise<Meeting> {
  await ensureMeetingSchema();
  const meetingId = crypto.randomUUID();
  const now = new Date().toISOString();
  const safeTitle = (title || 'System Architecture Design Session').trim().slice(0, 100);
  const safeArchitecture: ArchitectureState = {
    nodes: Array.isArray(initialArchitecture?.nodes) ? initialArchitecture.nodes : [],
    edges: Array.isArray(initialArchitecture?.edges) ? initialArchitecture.edges : [],
  };

  const meeting: Meeting = {
    id: meetingId,
    project_id: projectId || null,
    host_id: hostUser.id,
    host_name: hostUser.fullName,
    title: safeTitle,
    status: 'active',
    is_locked: false,
    architecture_state: safeArchitecture,
    created_at: now,
    updated_at: now,
    ended_at: null,
  };

  const hostParticipant: MeetingParticipant = {
    id: crypto.randomUUID(),
    meeting_id: meetingId,
    user_id: hostUser.id,
    user_name: hostUser.fullName,
    user_avatar: hostUser.avatarUrl || null,
    role: 'host',
    joined_at: now,
    last_seen_at: now,
    color: assignColor(0),
    is_online: true,
  };

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        INSERT INTO public.meetings (
          id, project_id, host_id, host_name, title, status, is_locked, architecture_state, created_at, updated_at
        ) VALUES (
          ${meeting.id}, ${meeting.project_id}, ${meeting.host_id}, ${meeting.host_name},
          ${meeting.title}, ${meeting.status}, ${meeting.is_locked},
          ${JSON.stringify(meeting.architecture_state)}, ${meeting.created_at}, ${meeting.updated_at}
        );
      `;
      await db`
        INSERT INTO public.meeting_participants (
          id, meeting_id, user_id, user_name, user_avatar, role, joined_at, last_seen_at
        ) VALUES (
          ${hostParticipant.id}, ${hostParticipant.meeting_id}, ${hostParticipant.user_id},
          ${hostParticipant.user_name}, ${hostParticipant.user_avatar}, ${hostParticipant.role},
          ${hostParticipant.joined_at}, ${hostParticipant.last_seen_at}
        );
      `;
    } catch (err: any) {
      console.error('[Meeting] DB persist warning, keeping in memory:', err?.message || err);
    }
  }

  inMemMeetings.set(meetingId, meeting);
  inMemMeetingParticipants.set(meetingId, [hostParticipant]);

  return meeting;
}

/**
 * Gets a meeting by ID.
 */
export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const cached = inMemMeetings.get(meetingId);
  if (cached) return cached;

  if (isNeonConfigured()) {
    try {
      await ensureMeetingSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.meetings WHERE id = ${meetingId} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        const meeting: Meeting = {
          id: row.id,
          project_id: row.project_id,
          host_id: row.host_id,
          host_name: row.host_name,
          title: row.title,
          status: row.status,
          is_locked: Boolean(row.is_locked),
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
      console.warn('[Meeting] DB fetch warning:', err?.message || err);
    }
  }

  return null;
}

/**
 * Adds or reconnects a participant in a meeting.
 */
export async function joinMeeting(
  meetingId: string,
  user: { id: string; fullName: string; avatarUrl?: string }
): Promise<{ meeting: Meeting; participant: MeetingParticipant; participants: MeetingParticipant[] }> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found.');
  }

  if (meeting.status === 'ended') {
    throw new Error('This meeting has already ended.');
  }

  const isHost = meeting.host_id === user.id;
  const now = new Date().toISOString();
  let list = inMemMeetingParticipants.get(meetingId) || [];
  let participant = list.find((p) => p.user_id === user.id);

  if (participant) {
    participant.user_name = user.fullName;
    participant.user_avatar = user.avatarUrl || participant.user_avatar;
    participant.last_seen_at = now;
    participant.is_online = true;
    if (isHost) participant.role = 'host';
  } else {
    participant = {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      user_id: user.id,
      user_name: user.fullName,
      user_avatar: user.avatarUrl || null,
      role: isHost ? 'host' : 'editor', // Default non-host to editor
      joined_at: now,
      last_seen_at: now,
      color: assignColor(list.length),
      is_online: true,
    };
    list.push(participant);
    inMemMeetingParticipants.set(meetingId, list);
  }

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        INSERT INTO public.meeting_participants (
          id, meeting_id, user_id, user_name, user_avatar, role, joined_at, last_seen_at
        ) VALUES (
          ${participant.id}, ${participant.meeting_id}, ${participant.user_id},
          ${participant.user_name}, ${participant.user_avatar}, ${participant.role},
          ${participant.joined_at}, ${participant.last_seen_at}
        )
        ON CONFLICT (meeting_id, user_id) DO UPDATE SET
          user_name = EXCLUDED.user_name,
          user_avatar = EXCLUDED.user_avatar,
          last_seen_at = EXCLUDED.last_seen_at;
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB participant persist warning:', err?.message || err);
    }
  }

  return { meeting, participant, participants: list };
}

/**
 * Gets all participants for a meeting.
 */
export async function getParticipants(meetingId: string): Promise<MeetingParticipant[]> {
  const cached = inMemMeetingParticipants.get(meetingId);
  if (cached && cached.length > 0) return cached;

  if (isNeonConfigured()) {
    try {
      await ensureMeetingSchema();
      const db = getSql();
      const rows = await db`
        SELECT * FROM public.meeting_participants WHERE meeting_id = ${meetingId} ORDER BY joined_at ASC;
      `;
      const list: MeetingParticipant[] = rows.map((r, i) => ({
        id: r.id,
        meeting_id: r.meeting_id,
        user_id: r.user_id,
        user_name: r.user_name,
        user_avatar: r.user_avatar,
        role: r.role as MeetingRole,
        joined_at: r.joined_at,
        last_seen_at: r.last_seen_at,
        color: assignColor(i),
        is_online: true,
      }));
      inMemMeetingParticipants.set(meetingId, list);
      return list;
    } catch (err: any) {
      console.warn('[Meeting] DB participants fetch warning:', err?.message || err);
    }
  }

  return [];
}

/**
 * Host changes a participant's role (Editor <-> Viewer).
 */
export async function setParticipantRole(
  meetingId: string,
  hostUserId: string,
  targetUserId: string,
  newRole: MeetingRole
): Promise<MeetingParticipant> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_id !== hostUserId) {
    throw new Error('Only the meeting host can change participant roles.');
  }

  const list = inMemMeetingParticipants.get(meetingId) || [];
  const target = list.find((p) => p.user_id === targetUserId);
  if (!target) throw new Error('Participant not found');

  if (target.user_id === meeting.host_id) {
    target.role = 'host';
  } else {
    target.role = newRole === 'host' ? 'editor' : newRole;
  }

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.meeting_participants
        SET role = ${target.role}
        WHERE meeting_id = ${meetingId} AND user_id = ${targetUserId};
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB role update warning:', err?.message || err);
    }
  }

  return target;
}

/**
 * Host removes a participant.
 */
export async function removeParticipant(
  meetingId: string,
  hostUserId: string,
  targetUserId: string
): Promise<void> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_id !== hostUserId) {
    throw new Error('Only the meeting host can remove participants.');
  }
  if (targetUserId === hostUserId) {
    throw new Error('The host cannot be removed from their own meeting.');
  }

  const list = inMemMeetingParticipants.get(meetingId) || [];
  inMemMeetingParticipants.set(
    meetingId,
    list.filter((p) => p.user_id !== targetUserId)
  );

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        DELETE FROM public.meeting_participants
        WHERE meeting_id = ${meetingId} AND user_id = ${targetUserId};
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB delete participant warning:', err?.message || err);
    }
  }
}

/**
 * Host locks or unlocks the architecture.
 */
export async function toggleMeetingLock(
  meetingId: string,
  hostUserId: string,
  isLocked: boolean
): Promise<Meeting> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_id !== hostUserId) {
    throw new Error('Only the meeting host can lock or unlock the architecture.');
  }

  meeting.is_locked = isLocked;
  meeting.updated_at = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.meetings
        SET is_locked = ${isLocked}, updated_at = ${meeting.updated_at}
        WHERE id = ${meetingId};
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB toggle lock warning:', err?.message || err);
    }
  }

  return meeting;
}

/**
 * Saves current architecture state to database.
 */
export async function saveArchitectureState(
  meetingId: string,
  architectureState: ArchitectureState
): Promise<void> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) return;

  meeting.architecture_state = {
    nodes: Array.isArray(architectureState.nodes) ? architectureState.nodes : [],
    edges: Array.isArray(architectureState.edges) ? architectureState.edges : [],
  };
  meeting.updated_at = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.meetings
        SET architecture_state = ${JSON.stringify(meeting.architecture_state)},
            updated_at = ${meeting.updated_at}
        WHERE id = ${meetingId};
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB save architecture warning:', err?.message || err);
    }
  }
}

/**
 * Ends a meeting (Host only).
 */
export async function endMeeting(meetingId: string, hostUserId: string): Promise<Meeting> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.host_id !== hostUserId) {
    throw new Error('Only the meeting host can end the meeting.');
  }

  const now = new Date().toISOString();
  meeting.status = 'ended';
  meeting.ended_at = now;
  meeting.updated_at = now;

  if (isNeonConfigured()) {
    try {
      const db = getSql();
      await db`
        UPDATE public.meetings
        SET status = 'ended', ended_at = ${now}, updated_at = ${now}
        WHERE id = ${meetingId};
      `;
    } catch (err: any) {
      console.warn('[Meeting] DB end meeting warning:', err?.message || err);
    }
  }

  return meeting;
}
