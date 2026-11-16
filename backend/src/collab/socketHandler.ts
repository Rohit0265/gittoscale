import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  getMeetingById,
  saveArchitectureState,
  addMessage,
  getParticipants,
  setParticipantEditPermission,
  removeParticipant,
  endMeeting,
  updatePermissionMode,
  assignParticipantColor,
} from '../services/collabService.js';
import { CollabArchitectureState, CollabPermissionMode } from './types.js';

let ioInstance: SocketIOServer | null = null;

interface SocketUserSession {
  meetingId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  color: string;
}

const socketSessions = new Map<string, SocketUserSession>();

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function initCollabSocketServer(httpServer: HttpServer): SocketIOServer {
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
    // 1. Participant joins a collaborative meeting room
    socket.on(
      'join-meeting',
      async (payload: {
        meetingId: string;
        user: { id: string; fullName: string; avatarUrl?: string };
      }) => {
        try {
          const { meetingId, user } = payload;
          if (!meetingId || !user?.id) {
            socket.emit('error', { message: 'Meeting ID and user profile are required.' });
            return;
          }

          const meeting = await getMeetingById(meetingId);
          if (!meeting) {
            socket.emit('meeting-error', { message: 'Meeting not found or has been removed.' });
            return;
          }

          if (meeting.status === 'ended') {
            socket.emit('meeting-ended', { message: 'This collaborative meeting has ended.' });
            return;
          }

          const roomKey = `meeting:${meetingId}`;
          socket.join(roomKey);

          const participants = await getParticipants(meetingId);
          const existingParticipant = participants.find((p) => p.user_id === user.id);
          const color = existingParticipant?.color || assignParticipantColor(participants.length);

          const session: SocketUserSession = {
            meetingId,
            userId: user.id,
            userName: user.fullName || 'Anonymous',
            userAvatar: user.avatarUrl,
            color,
          };
          socketSessions.set(socket.id, session);

          // Notify existing room participants
          socket.to(roomKey).emit('participant-joined', {
            participant: existingParticipant || {
              id: user.id,
              meeting_id: meetingId,
              user_id: user.id,
              user_name: user.fullName,
              user_avatar: user.avatarUrl || null,
              role: meeting.host_user_id === user.id ? 'host' : 'participant',
              can_edit: meeting.permission_mode === 'host_only' ? meeting.host_user_id === user.id : true,
              color,
              is_online: true,
            },
            participants,
          });

          // Send current state to newly joined socket
          socket.emit('init-meeting-state', {
            meeting,
            participants,
            architecture: meeting.architecture_state,
            userColor: color,
          });
        } catch (err: any) {
          console.error('[Socket] join-meeting error:', err);
          socket.emit('meeting-error', { message: err?.message || 'Failed to join meeting room.' });
        }
      }
    );

    // 2. Real-time cursor motion
    socket.on('cursor-move', (coords: { x: number; y: number }) => {
      const session = socketSessions.get(socket.id);
      if (!session) return;
      socket.to(`meeting:${session.meetingId}`).emit('cursor-moved', {
        userId: session.userId,
        userName: session.userName,
        color: session.color,
        x: coords.x,
        y: coords.y,
      });
    });

    // 3. Real-time canvas operations (node move, add, delete, edge connect, inspect edit)
    socket.on(
      'canvas-operation',
      async (payload: {
        type: 'node-change' | 'edge-change' | 'add-node' | 'delete-node' | 'add-edge' | 'delete-edge' | 'update-node' | 'update-edge' | 'batch-sync';
        architecture: CollabArchitectureState;
        meta?: any;
      }) => {
        try {
          const session = socketSessions.get(socket.id);
          if (!session) return;

          const meeting = await getMeetingById(session.meetingId);
          if (!meeting || meeting.status === 'ended') {
            socket.emit('operation-rejected', { reason: 'Meeting is inactive or ended.' });
            return;
          }

          // Permission enforcement
          const isHost = meeting.host_user_id === session.userId;
          if (!isHost) {
            const participants = await getParticipants(session.meetingId);
            const participant = participants.find((p) => p.user_id === session.userId);
            if (!participant || !participant.can_edit || meeting.permission_mode === 'host_only') {
              socket.emit('operation-rejected', {
                reason: 'You do not have editing permissions. The meeting is in View-Only mode.',
              });
              return;
            }
          }

          // Persist architecture update to service / DB
          if (payload.architecture) {
            await saveArchitectureState(session.meetingId, session.userId, payload.architecture);
          }

          // Broadcast to other participants in the meeting room
          socket.to(`meeting:${session.meetingId}`).emit('canvas-operation-applied', {
            type: payload.type,
            architecture: payload.architecture,
            meta: payload.meta,
            senderId: session.userId,
            senderName: session.userName,
          });
        } catch (err: any) {
          console.error('[Socket] canvas-operation error:', err);
          socket.emit('operation-rejected', { reason: err?.message || 'Failed to sync canvas change.' });
        }
      }
    );

    // 4. Real-time chat messages
    socket.on(
      'send-message',
      async (payload: { message: string; messageType?: 'chat' | 'system' | 'ai' }) => {
        try {
          const session = socketSessions.get(socket.id);
          if (!session) return;

          const text = (payload.message || '').trim();
          if (!text) return;

          const saved = await addMessage(
            session.meetingId,
            {
              id: session.userId,
              fullName: session.userName,
              avatarUrl: session.userAvatar || undefined,
            },
            text,
            payload.messageType || 'chat'
          );

          // Broadcast to all participants in room including sender
          io.to(`meeting:${session.meetingId}`).emit('new-message', saved);
        } catch (err: any) {
          console.error('[Socket] send-message error:', err);
        }
      }
    );

    // 5. Host updates meeting permission mode
    socket.on(
      'update-permission-mode',
      async (payload: { permissionMode: CollabPermissionMode }) => {
        try {
          const session = socketSessions.get(socket.id);
          if (!session) return;

          const meeting = await getMeetingById(session.meetingId);
          if (!meeting || meeting.host_user_id !== session.userId) {
            socket.emit('operation-rejected', { reason: 'Only the host can modify permission modes.' });
            return;
          }

          const updated = await updatePermissionMode(session.meetingId, session.userId, payload.permissionMode);
          const updatedParticipants = await getParticipants(session.meetingId);

          io.to(`meeting:${session.meetingId}`).emit('permission-mode-changed', {
            permissionMode: updated.permission_mode,
            participants: updatedParticipants,
          });

          // Add system message
          const modeLabel =
            payload.permissionMode === 'host_only'
              ? 'Host Only Editing'
              : payload.permissionMode === 'controlled'
              ? 'Controlled Editing'
              : 'Collaborative Editing';
          const sysMsg = await addMessage(
            session.meetingId,
            { id: 'system', fullName: 'GitToScale Collab' },
            `Host changed collaboration mode to: ${modeLabel}`,
            'system'
          );
          io.to(`meeting:${session.meetingId}`).emit('new-message', sysMsg);
        } catch (err: any) {
          console.error('[Socket] update-permission-mode error:', err);
        }
      }
    );

    // 6. Host grants or revokes edit access for a specific participant
    socket.on(
      'set-participant-permission',
      async (payload: { targetUserId: string; canEdit: boolean }) => {
        try {
          const session = socketSessions.get(socket.id);
          if (!session) return;

          const meeting = await getMeetingById(session.meetingId);
          if (!meeting || meeting.host_user_id !== session.userId) {
            socket.emit('operation-rejected', { reason: 'Only the host can grant or revoke permissions.' });
            return;
          }

          const updatedTarget = await setParticipantEditPermission(
            session.meetingId,
            session.userId,
            payload.targetUserId,
            payload.canEdit
          );
          const updatedParticipants = await getParticipants(session.meetingId);

          io.to(`meeting:${session.meetingId}`).emit('participant-permission-updated', {
            targetUserId: payload.targetUserId,
            canEdit: updatedTarget.can_edit,
            participants: updatedParticipants,
          });

          const sysMsg = await addMessage(
            session.meetingId,
            { id: 'system', fullName: 'GitToScale Collab' },
            `Host ${payload.canEdit ? 'granted editing access to' : 'set to view-only for'} ${updatedTarget.user_name}`,
            'system'
          );
          io.to(`meeting:${session.meetingId}`).emit('new-message', sysMsg);
        } catch (err: any) {
          console.error('[Socket] set-participant-permission error:', err);
        }
      }
    );

    // 7. Host removes (kicks) a participant
    socket.on('remove-participant', async (payload: { targetUserId: string }) => {
      try {
        const session = socketSessions.get(socket.id);
        if (!session) return;

        const meeting = await getMeetingById(session.meetingId);
        if (!meeting || meeting.host_user_id !== session.userId) {
          socket.emit('operation-rejected', { reason: 'Only the host can remove participants.' });
          return;
        }

        await removeParticipant(session.meetingId, session.userId, payload.targetUserId);
        const updatedParticipants = await getParticipants(session.meetingId);

        // Notify room
        io.to(`meeting:${session.meetingId}`).emit('participant-removed', {
          targetUserId: payload.targetUserId,
          participants: updatedParticipants,
        });

        // Find the target socket and notify them directly
        for (const [sId, sess] of socketSessions.entries()) {
          if (sess.meetingId === session.meetingId && sess.userId === payload.targetUserId) {
            const targetSocket = io.sockets.sockets.get(sId);
            if (targetSocket) {
              targetSocket.emit('kicked-from-meeting', {
                reason: 'You were removed from this collaborative meeting by the host.',
              });
              targetSocket.leave(`meeting:${session.meetingId}`);
            }
          }
        }
      } catch (err: any) {
        console.error('[Socket] remove-participant error:', err);
      }
    });

    // 8. Host ends the meeting
    socket.on('end-meeting', async () => {
      try {
        const session = socketSessions.get(socket.id);
        if (!session) return;

        const meeting = await getMeetingById(session.meetingId);
        if (!meeting || meeting.host_user_id !== session.userId) {
          socket.emit('operation-rejected', { reason: 'Only the host can end the meeting.' });
          return;
        }

        const ended = await endMeeting(session.meetingId, session.userId);
        io.to(`meeting:${session.meetingId}`).emit('meeting-ended', {
          meeting: ended,
          endedBy: session.userName,
        });
      } catch (err: any) {
        console.error('[Socket] end-meeting error:', err);
      }
    });

    // 9. Disconnect cleanup
    socket.on('disconnect', () => {
      const session = socketSessions.get(socket.id);
      if (session) {
        socketSessions.delete(socket.id);
        const roomKey = `meeting:${session.meetingId}`;
        socket.to(roomKey).emit('cursor-removed', { userId: session.userId });
        socket.to(roomKey).emit('participant-left', {
          userId: session.userId,
          userName: session.userName,
        });
      }
    });
  });

  ioInstance = io;
  return io;
}
