import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../../app.js';
import {
  initMeetingSocketServer,
  _resetMeetingSocketServerForTests,
} from '../yjsServer.js';
import { createMeeting, getMeetingMessages } from '../meetingService.js';

const mockToken = (payload: any) =>
  'mock_jwt_' + Buffer.from(JSON.stringify(payload)).toString('base64');

function connectClient(url: string, token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioc(url, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });
}

function waitForEvent<T>(
  socket: ClientSocket,
  event: string,
  predicate?: (data: T) => boolean,
  timeoutMs = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for socket event "${event}"`));
    }, timeoutMs);
    const onEvent = (data: T) => {
      if (predicate && !predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(data);
    };
    socket.on(event, onEvent);
  });
}

describe('Yjs Meeting Socket Integration', () => {
  const hostUser = { id: 'it-host', fullName: 'Integration Host', avatarUrl: undefined };
  const peerUser = { id: 'it-peer', fullName: 'Integration Peer', avatarUrl: undefined };

  let server: HttpServer;
  let url = '';
  let meetingId = '';
  let hostSocket: ClientSocket;
  let peerSocket: ClientSocket;

  beforeAll(async () => {
    _resetMeetingSocketServerForTests();

    const meeting = await createMeeting(hostUser, null, 'Integration Meeting', {
      nodes: [],
      edges: [],
    });
    meetingId = meeting.id;

    const app = createApp();
    server = createServer(app);
    initMeetingSocketServer(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    url = `http://127.0.0.1:${port}`;

    hostSocket = await connectClient(url, mockToken({ id: hostUser.id, name: hostUser.fullName }));
    peerSocket = await connectClient(url, mockToken({ id: peerUser.id, name: peerUser.fullName }));
  });

  afterAll(async () => {
    hostSocket?.disconnect();
    peerSocket?.disconnect();
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    _resetMeetingSocketServerForTests();
  });

  it('initializes both participants with correct roles', async () => {
    const hostInitPromise = waitForEvent<any>(hostSocket, 'init-meeting-state');
    hostSocket.emit('join-meeting', { meetingId, user: hostUser });
    const hostInit = await hostInitPromise;
    expect(hostInit.meeting.id).toBe(meetingId);
    expect(hostInit.role).toBe('host');
    expect(hostInit.isLocked).toBe(false);
    expect(Array.isArray(hostInit.messages)).toBe(true);

    const peerInitPromise = waitForEvent<any>(peerSocket, 'init-meeting-state');
    peerSocket.emit('join-meeting', { meetingId, user: peerUser });
    const peerInit = await peerInitPromise;
    expect(peerInit.role).toBe('editor');
    expect(peerInit.participants.map((p: any) => p.user_id)).toContain(hostUser.id);
  });

  it('broadcasts and persists chat messages', async () => {
    const receivedPromise = waitForEvent<any>(
      hostSocket,
      'chat-message',
      (m) => m.message_type === 'chat' && m.content === 'hello from peer'
    );
    peerSocket.emit('chat-message', { text: 'hello from peer', type: 'chat' });
    const msg = await receivedPromise;
    expect(msg.content).toBe('hello from peer');
    expect(msg.user_id).toBe(peerUser.id);
    expect(msg.user_name).toBe(peerUser.fullName);

    const persisted = await getMeetingMessages(meetingId);
    expect(persisted.some((m) => m.content === 'hello from peer')).toBe(true);
  });

  it('host can demote an editor to viewer', async () => {
    const rolePromise = waitForEvent<any>(peerSocket, 'role-updated');
    hostSocket.emit('update-participant-role', { targetUserId: peerUser.id, role: 'viewer' });
    const payload = await rolePromise;
    expect(payload.userId).toBe(peerUser.id);
    expect(payload.role).toBe('viewer');
    expect(payload.participants.find((p: any) => p.user_id === peerUser.id).role).toBe('viewer');
  });

  it('host can lock the canvas and viewers are denied Yjs updates', async () => {
    const lockPromise = waitForEvent<any>(peerSocket, 'lock-updated');
    hostSocket.emit('toggle-lock', { isLocked: true });
    const lock = await lockPromise;
    expect(lock.isLocked).toBe(true);

    const deniedPromise = waitForEvent<any>(peerSocket, 'permission-denied');
    peerSocket.emit('yjs-update', { update: Buffer.from('garbage').toString('base64') });
    const denied = await deniedPromise;
    expect(denied.reason.toLowerCase()).toContain('viewer');
  });

  it('host can kick a participant', async () => {
    const kickedPromise = waitForEvent<any>(peerSocket, 'kicked');
    hostSocket.emit('kick-participant', { targetUserId: peerUser.id });
    const kicked = await kickedPromise;
    expect(kicked.reason).toContain('removed');
  });

  it('host can end the meeting', async () => {
    const endedPromise = waitForEvent<any>(hostSocket, 'meeting-ended');
    hostSocket.emit('end-meeting');
    const ended = await endedPromise;
    expect(ended.meeting.status).toBe('ended');
  });
});
