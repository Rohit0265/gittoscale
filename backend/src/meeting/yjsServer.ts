import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import * as Y from 'yjs';
import {
  getMeetingById,
  joinMeeting,
  getParticipants,
  setParticipantRole,
  removeParticipant,
  toggleMeetingLock,
  endMeeting,
  saveArchitectureState,
  saveMeetingMessage,
  getMeetingMessages,
  assignColor,
} from './meetingService.js';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import { MeetingRole, ParticipantPresence, MeetingChatMessage } from './types.js';

interface MeetingRoomSession {
  doc: Y.Doc;
  lastSaveTimer: NodeJS.Timeout | null;
}

interface SocketParticipantSession {
  meetingId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  role: MeetingRole;
  color: string;
}

interface SocketUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

const activeRooms = new Map<string, MeetingRoomSession>();
const clientSessions = new Map<string, SocketParticipantSession>();
const roomPresences = new Map<string, Map<string, ParticipantPresence>>();

let ioInstance: SocketIOServer | null = null;

export function getMeetingIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Resolves the authenticated user from the Socket.IO handshake token.
 * Enforces real verification in production; falls back to self-reported
 * payload identity only in non-production environments (local dev / tests).
 */
async function resolveSocketUser(socket: Socket): Promise<SocketUser | null> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return null;

  const allowMockAuth =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';

  if (token.startsWith('mock_jwt_')) {
    if (!allowMockAuth) return null;
    try {
      const payloadBase64 = token.replace('mock_jwt_', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      return {
        id: payload.id || 'usr_mock',
        fullName: payload.name || payload.email?.split('@')[0] || 'GitToScale User',
        avatarUrl: payload.avatar_url || payload.picture || payload.avatar || undefined,
      };
    } catch {
      return null;
    }
  }

  if (isServerSupabaseConfigured) {
    try {
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (error || !user) return null;
      const meta = user.user_metadata || {};
      return {
        id: user.id,
        fullName: meta.full_name || meta.name || user.email?.split('@')[0] || 'GitToScale User',
        avatarUrl: meta.avatar_url || meta.picture || meta.avatar || undefined,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Gets or initializes the Y.Doc for a meeting, hydrating it from the DB if needed.
 */
export async function getOrCreateMeetingDoc(meetingId: string): Promise<Y.Doc> {
  const existing = activeRooms.get(meetingId);
  if (existing) {
    return existing.doc;
  }

  const doc = new Y.Doc();
  const nodesMap = doc.getMap('nodes');
  const edgesMap = doc.getMap('edges');

  // Hydrate from DB
  const meeting = await getMeetingById(meetingId);
  if (meeting && meeting.architecture_state) {
    const { nodes, edges } = meeting.architecture_state;
    if (Array.isArray(nodes)) {
      doc.transact(() => {
        nodes.forEach((n: any) => {
          if (n && n.id) nodesMap.set(n.id, n);
        });
        if (Array.isArray(edges)) {
          edges.forEach((e: any) => {
            if (e && e.id) edgesMap.set(e.id, e);
          });
        }
      });
    }
  }

  // Setup debounced persistence to PostgreSQL whenever Y.Doc mutates
  doc.on('update', () => {
    scheduleSave(meetingId);
  });

  activeRooms.set(meetingId, {
    doc,
    lastSaveTimer: null,
  });

  return doc;
}

function scheduleSave(meetingId: string) {
  const room = activeRooms.get(meetingId);
  if (!room) return;

  if (room.lastSaveTimer) {
    clearTimeout(room.lastSaveTimer);
  }

  room.lastSaveTimer = setTimeout(async () => {
    try {
      const nodesMap = room.doc.getMap('nodes');
      const edgesMap = room.doc.getMap('edges');
      const nodes = Array.from(nodesMap.values());
      const edges = Array.from(edgesMap.values());
      await saveArchitectureState(meetingId, { nodes, edges });
    } catch (err: any) {
      console.warn('[YjsServer] Debounced save failed:', err?.message || err);
    }
  }, 1000);
}

function broadcastChat(
  io: SocketIOServer,
  roomKey: string,
  message: MeetingChatMessage
) {
  io.to(roomKey).emit('chat-message', message);
}

async function pushSystemMessage(
  io: SocketIOServer,
  roomKey: string,
  meetingId: string,
  text: string
) {
  try {
    const message = await saveMeetingMessage(
      meetingId,
      { id: 'system', fullName: 'System' },
      text,
      'system'
    );
    broadcastChat(io, roomKey, message);
  } catch (err: any) {
    console.warn('[YjsServer] System message failed:', err?.message || err);
  }
}

/**
 * Initializes the Yjs-enabled WebSocket server for Collaborative Meetings.
 */
export function initMeetingSocketServer(httpServer: HttpServer): SocketIOServer {
  if (ioInstance) return ioInstance;

  const allowedOrigins = [
    'https://gitoscale.com',
    'https://www.gitoscale.com',
    'https://gittoscale.tech',
    'https://www.gittoscale.tech',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          process.env.NODE_ENV !== 'production' ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(new Error('CORS origin blocked'));
      },
      credentials: true,
    },
    path: '/socket.io',
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  io.on('connection', (socket: Socket) => {
    // 1. Participant joins a collaborative meeting
    socket.on(
      'join-meeting',
      async (payload: {
        meetingId: string;
        user: { id: string; fullName: string; avatarUrl?: string };
      }) => {
        try {
          const { meetingId, user } = payload;
          if (!meetingId || !user?.id) {
            socket.emit('meeting-error', { message: 'Meeting ID and user profile are required.' });
            return;
          }

          const meeting = await getMeetingById(meetingId);
          if (!meeting) {
            socket.emit('meeting-error', { message: 'Meeting not found or has been ended.' });
            return;
          }

          if (meeting.status === 'ended') {
            socket.emit('meeting-ended', { message: 'This collaborative meeting has ended.' });
            return;
          }

          // Authenticate via handshake token when available; enforce in production
          const verified = await resolveSocketUser(socket);
          const isProduction = process.env.NODE_ENV === 'production';
          const identity: SocketUser = verified || {
            id: user.id,
            fullName: user.fullName || 'Anonymous',
            avatarUrl: user.avatarUrl,
          };
          if (isProduction && !verified) {
            socket.emit('permission-denied', {
              reason: 'Authentication required to join this meeting.',
            });
            return;
          }

          // Upsert the participant (restores persisted role across reconnects)
          const { meeting: currentMeeting, participants } = await joinMeeting(meetingId, identity);
          if (!currentMeeting || currentMeeting.status === 'ended') {
            socket.emit('meeting-ended', { message: 'This collaborative meeting has ended.' });
            return;
          }

          const doc = await getOrCreateMeetingDoc(meetingId);
          const roomKey = `meeting:${meetingId}`;
          socket.join(roomKey);

          const currentParticipant = participants.find((p) => p.user_id === identity.id);
          const role: MeetingRole =
            currentMeeting.host_id === identity.id
              ? 'host'
              : (currentParticipant?.role || 'editor');
          const color = currentParticipant?.color || assignColor(participants.length);

          const session: SocketParticipantSession = {
            meetingId,
            userId: identity.id,
            userName: identity.fullName || 'Anonymous',
            userAvatar: identity.avatarUrl,
            role,
            color,
          };
          clientSessions.set(socket.id, session);

          // Update awareness presence
          let presences = roomPresences.get(meetingId);
          if (!presences) {
            presences = new Map();
            roomPresences.set(meetingId, presences);
          }
          const wasPresent = presences.has(identity.id);
          presences.set(identity.id, {
            userId: identity.id,
            userName: session.userName,
            userAvatar: session.userAvatar,
            role,
            color,
            lastActive: Date.now(),
          });

          // Load persisted chat history
          const messages = await getMeetingMessages(meetingId);

          // Generate initial full state update from Y.Doc
          const initialUpdate = Y.encodeStateAsUpdate(doc);
          const base64Update = Buffer.from(initialUpdate).toString('base64');

          // Send initialization payload to connecting client
          socket.emit('init-meeting-state', {
            meeting: currentMeeting,
            role,
            color,
            isLocked: currentMeeting.is_locked,
            participants,
            presences: Array.from(presences.values()),
            messages,
            yjsUpdate: base64Update,
          });

          // Broadcast to other participants
          socket.to(roomKey).emit('participant-joined', {
            participant: {
              id: identity.id,
              meeting_id: meetingId,
              user_id: identity.id,
              user_name: identity.fullName,
              user_avatar: identity.avatarUrl || null,
              role,
              color,
              is_online: true,
            },
            participants,
            presences: Array.from(presences.values()),
          });

          if (!wasPresent) {
            void pushSystemMessage(io, roomKey, meetingId, `${identity.fullName} joined the meeting.`);
          }
        } catch (err: any) {
          console.error('[YjsServer] join-meeting error:', err);
          socket.emit('meeting-error', { message: err?.message || 'Failed to join meeting room.' });
        }
      }
    );

    // 2. Client sends a Yjs Document Update
    // IMPORTANT SECURITY ENFORCEMENT: Backend validates role and lock status before applying!
    socket.on('yjs-update', async (payload: { update: string | number[] | Uint8Array }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session) return;

        const meeting = await getMeetingById(session.meetingId);
        if (!meeting || meeting.status === 'ended') {
          socket.emit('permission-denied', { reason: 'The meeting has ended.' });
          return;
        }

        // Viewers are strictly prohibited from mutating document state
        if (session.role === 'viewer') {
          socket.emit('permission-denied', {
            reason: 'You are in Viewer mode and do not have permission to modify the architecture.',
          });
          return;
        }

        // If architecture is locked, only the host can apply updates
        if (meeting.is_locked && session.role !== 'host') {
          socket.emit('permission-denied', {
            reason: 'The architecture diagram is currently locked by the host.',
          });
          return;
        }

        const room = activeRooms.get(session.meetingId);
        if (!room) return;

        let binaryUpdate: Uint8Array;
        if (typeof payload.update === 'string') {
          binaryUpdate = new Uint8Array(Buffer.from(payload.update, 'base64'));
        } else if (Array.isArray(payload.update)) {
          binaryUpdate = new Uint8Array(payload.update);
        } else {
          binaryUpdate = payload.update;
        }

        // Apply to server Y.Doc
        Y.applyUpdate(room.doc, binaryUpdate, socket.id);

        // Broadcast the update to all peers in the room except sender
        socket.to(`meeting:${session.meetingId}`).emit('yjs-update', {
          update: Buffer.from(binaryUpdate).toString('base64'),
          senderId: session.userId,
        });
      } catch (err: any) {
        console.error('[YjsServer] yjs-update error:', err);
      }
    });

    // 3. Cursor movement
    socket.on('cursor-move', (payload: { x?: number; y?: number }) => {
      const session = clientSessions.get(socket.id);
      if (!session || session.role === 'viewer') return;

      const presences = roomPresences.get(session.meetingId);
      if (!presences) return;

      const existing = presences.get(session.userId);
      const presence: ParticipantPresence = {
        userId: session.userId,
        userName: session.userName,
        userAvatar: session.userAvatar,
        role: session.role,
        color: session.color,
        cursor: { x: payload.x || 0, y: payload.y || 0 },
        isEditing: existing?.isEditing,
        selectedNodeId: existing?.selectedNodeId,
        lastActive: Date.now(),
      };
      presences.set(session.userId, presence);
      socket.to(`meeting:${session.meetingId}`).emit('presence-updated', {
        presences: Array.from(presences.values()),
      });
    });

    // 4. Awareness updates (editing indicators, selection)
    socket.on(
      'awareness-update',
      (payload: { isEditing?: boolean; selectedNodeId?: string | null }) => {
        const session = clientSessions.get(socket.id);
        if (!session) return;

        const presences = roomPresences.get(session.meetingId);
        if (presences) {
          const existing = presences.get(session.userId);
          const presence: ParticipantPresence = {
            userId: session.userId,
            userName: session.userName,
            userAvatar: session.userAvatar,
            role: session.role,
            color: session.color,
            cursor: existing?.cursor || null,
            isEditing: Boolean(payload.isEditing),
            selectedNodeId: payload.selectedNodeId || null,
            lastActive: Date.now(),
          };
          presences.set(session.userId, presence);

          socket.to(`meeting:${session.meetingId}`).emit('presence-updated', {
            presences: Array.from(presences.values()),
          });
        }
      }
    );

    // 5. Meeting chat (persisted + broadcast)
    socket.on('chat-message', async (payload: { text?: string; type?: 'chat' | 'ai' }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session) return;

        const text = String(payload?.text || '').trim();
        if (!text) return;

        const message = await saveMeetingMessage(
          session.meetingId,
          {
            id: session.userId,
            fullName: session.userName,
            avatarUrl: session.userAvatar || undefined,
          },
          text,
          payload?.type === 'ai' ? 'ai' : 'chat'
        );

        // Broadcast to every participant including the sender
        broadcastChat(io, `meeting:${session.meetingId}`, message);
      } catch (err: any) {
        console.error('[YjsServer] chat-message error:', err);
      }
    });

    // 6. Host updates participant role (Host <-> Editor <-> Viewer)
    socket.on(
      'update-participant-role',
      async (payload: { targetUserId: string; role: MeetingRole }) => {
        try {
          const session = clientSessions.get(socket.id);
          if (!session || session.role !== 'host') {
            socket.emit('permission-denied', { reason: 'Only the host can modify participant roles.' });
            return;
          }

          const updated = await setParticipantRole(
            session.meetingId,
            session.userId,
            payload.targetUserId,
            payload.role
          );
          const participants = await getParticipants(session.meetingId);

          // Update target participant's active socket session(s)
          for (const [, sess] of clientSessions.entries()) {
            if (sess.meetingId === session.meetingId && sess.userId === payload.targetUserId) {
              sess.role = updated.role;
            }
          }

          // If role changed to viewer, clear cursor and editing state in presence
          const presences = roomPresences.get(session.meetingId);
          if (presences) {
            const p = presences.get(payload.targetUserId);
            if (p) {
              p.role = updated.role;
              if (updated.role === 'viewer') {
                p.cursor = null;
                p.isEditing = false;
                p.selectedNodeId = null;
              }
              io.to(`meeting:${session.meetingId}`).emit('presence-updated', {
                presences: Array.from(presences.values()),
              });
            }
          }

          io.to(`meeting:${session.meetingId}`).emit('role-updated', {
            userId: payload.targetUserId,
            role: updated.role,
            participants,
          });
        } catch (err: any) {
          console.error('[YjsServer] update-participant-role error:', err);
        }
      }
    );

    // 7. Host locks/unlocks architecture
    socket.on('toggle-lock', async (payload: { isLocked: boolean }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session || session.role !== 'host') {
          socket.emit('permission-denied', { reason: 'Only the host can lock or unlock the architecture.' });
          return;
        }

        const updated = await toggleMeetingLock(session.meetingId, session.userId, payload.isLocked);
        const roomKey = `meeting:${session.meetingId}`;
        io.to(roomKey).emit('lock-updated', {
          isLocked: updated.is_locked,
        });
        void pushSystemMessage(
          io,
          roomKey,
          session.meetingId,
          updated.is_locked ? 'The host locked the architecture canvas.' : 'The host unlocked the architecture canvas.'
        );
      } catch (err: any) {
        console.error('[YjsServer] toggle-lock error:', err);
      }
    });

    // 8. Host removes a participant
    socket.on('kick-participant', async (payload: { targetUserId: string }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session || session.role !== 'host') {
          socket.emit('permission-denied', { reason: 'Only the host can remove participants.' });
          return;
        }

        await removeParticipant(session.meetingId, session.userId, payload.targetUserId);
        const participants = await getParticipants(session.meetingId);
        const roomKey = `meeting:${session.meetingId}`;
        const presences = roomPresences.get(session.meetingId);

        // Notify room (keeps the kicked user in the list for last render, then removes)
        io.to(roomKey).emit('participant-left', {
          userId: payload.targetUserId,
          participants,
          presences: presences ? Array.from(presences.values()) : [],
        });

        // Remove from presence
        presences?.delete(payload.targetUserId);

        // Find and disconnect the target socket(s)
        for (const [sId, sess] of clientSessions.entries()) {
          if (sess.meetingId === session.meetingId && sess.userId === payload.targetUserId) {
            const targetSocket = io.sockets.sockets.get(sId);
            if (targetSocket) {
              targetSocket.emit('kicked', {
                reason: 'You were removed from this meeting by the host.',
              });
              targetSocket.leave(roomKey);
            }
            clientSessions.delete(sId);
          }
        }

        void pushSystemMessage(io, roomKey, session.meetingId, `${payload.targetUserId} was removed by the host.`);
      } catch (err: any) {
        console.error('[YjsServer] kick-participant error:', err);
      }
    });

    // 9. Host ends the meeting
    socket.on('end-meeting', async () => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session || session.role !== 'host') {
          socket.emit('permission-denied', { reason: 'Only the host can end the meeting.' });
          return;
        }

        // Final save
        const room = activeRooms.get(session.meetingId);
        if (room) {
          const nodes = Array.from(room.doc.getMap('nodes').values());
          const edges = Array.from(room.doc.getMap('edges').values());
          await saveArchitectureState(session.meetingId, { nodes, edges });
        }

        const ended = await endMeeting(session.meetingId, session.userId);
        const roomKey = `meeting:${session.meetingId}`;
        io.to(roomKey).emit('meeting-ended', {
          meeting: ended,
          endedBy: session.userName,
        });
      } catch (err: any) {
        console.error('[YjsServer] end-meeting error:', err);
      }
    });

    // 10. Disconnect
    socket.on('disconnect', () => {
      const session = clientSessions.get(socket.id);
      if (session) {
        clientSessions.delete(socket.id);
        const presences = roomPresences.get(session.meetingId);
        if (presences) {
          presences.delete(session.userId);
          socket.to(`meeting:${session.meetingId}`).emit('presence-updated', {
            presences: Array.from(presences.values()),
          });
        }
        socket.to(`meeting:${session.meetingId}`).emit('participant-left', {
          userId: session.userId,
          userName: session.userName,
        });
      }
    });
  });

  ioInstance = io;
  return io;
}

/**
 * TEST ONLY — resets the module singleton so integration tests can bind a
 * fresh Socket.IO server on their own ephemeral port.
 */
export function _resetMeetingSocketServerForTests() {
  ioInstance = null;
  activeRooms.clear();
  clientSessions.clear();
  roomPresences.clear();
}
