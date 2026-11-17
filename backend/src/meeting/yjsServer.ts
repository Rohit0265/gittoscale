import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import * as Y from 'yjs';
import {
  getMeetingById,
  getParticipants,
  setParticipantRole,
  removeParticipant,
  toggleMeetingLock,
  endMeeting,
  saveArchitectureState,
  assignColor,
} from './meetingService.js';
import { MeetingRole, ParticipantPresence } from './types.js';

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

const activeRooms = new Map<string, MeetingRoomSession>();
const clientSessions = new Map<string, SocketParticipantSession>();
const roomPresences = new Map<string, Map<string, ParticipantPresence>>();

let ioInstance: SocketIOServer | null = null;

export function getMeetingIO(): SocketIOServer | null {
  return ioInstance;
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

          const doc = await getOrCreateMeetingDoc(meetingId);
          const roomKey = `meeting:${meetingId}`;
          socket.join(roomKey);

          const participants = await getParticipants(meetingId);
          const currentParticipant = participants.find((p) => p.user_id === user.id);
          const role: MeetingRole =
            meeting.host_id === user.id
              ? 'host'
              : (currentParticipant?.role || 'editor');
          const color = currentParticipant?.color || assignColor(participants.length);

          const session: SocketParticipantSession = {
            meetingId,
            userId: user.id,
            userName: user.fullName || 'Anonymous',
            userAvatar: user.avatarUrl,
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
          presences.set(user.id, {
            userId: user.id,
            userName: session.userName,
            userAvatar: session.userAvatar,
            role,
            color,
            lastActive: Date.now(),
          });

          // Generate initial full state update from Y.Doc
          const initialUpdate = Y.encodeStateAsUpdate(doc);
          const base64Update = Buffer.from(initialUpdate).toString('base64');

          // Send initialization payload to connecting client
          socket.emit('init-meeting-state', {
            meeting,
            role,
            color,
            isLocked: meeting.is_locked,
            participants,
            presences: Array.from(presences.values()),
            yjsUpdate: base64Update,
          });

          // Broadcast to other participants
          socket.to(roomKey).emit('participant-joined', {
            participant: currentParticipant || {
              id: user.id,
              meeting_id: meetingId,
              user_id: user.id,
              user_name: user.fullName,
              user_avatar: user.avatarUrl || null,
              role,
              color,
              is_online: true,
            },
            participants,
            presences: Array.from(presences.values()),
          });
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
        socket.to(`meeting:${session.meetingId}`).emit('yjs-update-applied', {
          update: Buffer.from(binaryUpdate).toString('base64'),
          senderId: session.userId,
        });
      } catch (err: any) {
        console.error('[YjsServer] yjs-update error:', err);
      }
    });

    // 3. Awareness updates (cursor coordinates, editing indicators)
    socket.on(
      'awareness-update',
      (payload: {
        cursor?: { x: number; y: number } | null;
        isEditing?: boolean;
        selectedNodeId?: string | null;
      }) => {
        const session = clientSessions.get(socket.id);
        if (!session) return;

        const presences = roomPresences.get(session.meetingId);
        if (presences) {
          const presence: ParticipantPresence = {
            userId: session.userId,
            userName: session.userName,
            userAvatar: session.userAvatar,
            role: session.role,
            color: session.color,
            cursor: payload.cursor,
            isEditing: payload.isEditing,
            selectedNodeId: payload.selectedNodeId,
            lastActive: Date.now(),
          };
          presences.set(session.userId, presence);

          socket.to(`meeting:${session.meetingId}`).emit('awareness-changed', {
            presences: Array.from(presences.values()),
          });
        }
      }
    );

    // 4. Host updates participant role (Host <-> Editor <-> Viewer)
    socket.on(
      'update-role',
      async (payload: { targetUserId: string; newRole: MeetingRole }) => {
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
            payload.newRole
          );
          const participants = await getParticipants(session.meetingId);

          // Update target participant's active socket session
          for (const [sId, sess] of clientSessions.entries()) {
            if (sess.meetingId === session.meetingId && sess.userId === payload.targetUserId) {
              sess.role = updated.role;
              const targetSocket = io.sockets.sockets.get(sId);
              if (targetSocket) {
                targetSocket.emit('role-changed', { role: updated.role });
              }
            }
          }

          io.to(`meeting:${session.meetingId}`).emit('participant-role-updated', {
            targetUserId: payload.targetUserId,
            newRole: updated.role,
            participants,
          });
        } catch (err: any) {
          console.error('[YjsServer] update-role error:', err);
        }
      }
    );

    // 5. Host locks/unlocks architecture
    socket.on('toggle-lock', async (payload: { isLocked: boolean }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session || session.role !== 'host') {
          socket.emit('permission-denied', { reason: 'Only the host can lock or unlock the architecture.' });
          return;
        }

        const updated = await toggleMeetingLock(session.meetingId, session.userId, payload.isLocked);
        io.to(`meeting:${session.meetingId}`).emit('lock-updated', {
          isLocked: updated.is_locked,
        });
      } catch (err: any) {
        console.error('[YjsServer] toggle-lock error:', err);
      }
    });

    // 6. Host removes a participant
    socket.on('remove-participant', async (payload: { targetUserId: string }) => {
      try {
        const session = clientSessions.get(socket.id);
        if (!session || session.role !== 'host') {
          socket.emit('permission-denied', { reason: 'Only the host can remove participants.' });
          return;
        }

        await removeParticipant(session.meetingId, session.userId, payload.targetUserId);
        const participants = await getParticipants(session.meetingId);

        // Notify room
        io.to(`meeting:${session.meetingId}`).emit('participant-removed', {
          targetUserId: payload.targetUserId,
          participants,
        });

        // Find and disconnect the target socket
        for (const [sId, sess] of clientSessions.entries()) {
          if (sess.meetingId === session.meetingId && sess.userId === payload.targetUserId) {
            const targetSocket = io.sockets.sockets.get(sId);
            if (targetSocket) {
              targetSocket.emit('kicked-from-meeting', {
                reason: 'You were removed from this meeting by the host.',
              });
              targetSocket.leave(`meeting:${session.meetingId}`);
            }
          }
        }
      } catch (err: any) {
        console.error('[YjsServer] remove-participant error:', err);
      }
    });

    // 7. Host ends the meeting
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
        io.to(`meeting:${session.meetingId}`).emit('meeting-ended', {
          meeting: ended,
          endedBy: session.userName,
        });
      } catch (err: any) {
        console.error('[YjsServer] end-meeting error:', err);
      }
    });

    // 8. Disconnect
    socket.on('disconnect', () => {
      const session = clientSessions.get(socket.id);
      if (session) {
        clientSessions.delete(socket.id);
        const presences = roomPresences.get(session.meetingId);
        if (presences) {
          presences.delete(session.userId);
          socket.to(`meeting:${session.meetingId}`).emit('awareness-changed', {
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
