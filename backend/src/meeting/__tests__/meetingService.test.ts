import { describe, it, expect } from 'vitest';
import {
  createMeeting,
  getMeetingById,
  joinMeeting,
  getParticipants,
  setParticipantRole,
  removeParticipant,
  toggleMeetingLock,
  endMeeting,
  saveMeetingMessage,
  getMeetingMessages,
} from '../meetingService.js';

describe('Meeting Service', () => {
  const hostUser = {
    id: 'user-host-123',
    fullName: 'Host User',
    avatarUrl: 'https://example.com/avatar1.png',
  };

  const participantUser = {
    id: 'user-peer-456',
    fullName: 'Peer Collaborator',
    avatarUrl: 'https://example.com/avatar2.png',
  };

  let meetingId: string;

  it('creates a new collaborative meeting with initial architecture', async () => {
    const initialArch = {
      nodes: [
        {
          id: 'node-1',
          name: 'API Gateway',
          type: 'gateway',
          position: { x: 100, y: 100 },
        },
      ],
      edges: [],
    };

    const meeting = await createMeeting(
      hostUser,
      'project-abc',
      'System Architecture Design Session',
      initialArch
    );

    expect(meeting).toBeDefined();
    expect(meeting.id).toBeDefined();
    expect(meeting.title).toBe('System Architecture Design Session');
    expect(meeting.status).toBe('active');
    expect(meeting.is_locked).toBe(false);
    expect(meeting.architecture_state.nodes).toHaveLength(1);

    meetingId = meeting.id;
  });

  it('retrieves an existing meeting by ID', async () => {
    const meeting = await getMeetingById(meetingId);
    expect(meeting).toBeDefined();
    expect(meeting?.id).toBe(meetingId);
    expect(meeting?.host_id).toBe(hostUser.id);
  });

  it('allows a participant to join and assigns editor role by default', async () => {
    const result = await joinMeeting(meetingId, participantUser);
    expect(result.meeting.id).toBe(meetingId);
    expect(result.participant.role).toBe('editor');

    const participants = await getParticipants(meetingId);
    expect(participants.length).toBeGreaterThanOrEqual(2);

    const peer = participants.find((p) => p.user_id === participantUser.id);
    expect(peer).toBeDefined();
    expect(peer?.role).toBe('editor');
  });

  it('allows the host to change participant role to viewer', async () => {
    await setParticipantRole(meetingId, hostUser.id, participantUser.id, 'viewer');
    const participants = await getParticipants(meetingId);
    const peer = participants.find((p) => p.user_id === participantUser.id);
    expect(peer?.role).toBe('viewer');
  });

  it('allows the host to promote another participant to host role', async () => {
    await setParticipantRole(meetingId, hostUser.id, participantUser.id, 'host');
    const participants = await getParticipants(meetingId);
    const peer = participants.find((p) => p.user_id === participantUser.id);
    expect(peer?.role).toBe('host');

    // Promoted host can now also perform host actions (e.g., demoting back to editor)
    await setParticipantRole(meetingId, participantUser.id, participantUser.id, 'editor');
    const updatedParticipants = await getParticipants(meetingId);
    const updatedPeer = updatedParticipants.find((p) => p.user_id === participantUser.id);
    expect(updatedPeer?.role).toBe('editor');
  });

  it('rejects non-host from changing participant roles', async () => {
    await expect(
      setParticipantRole(meetingId, 'fake-intruder-id', participantUser.id, 'editor')
    ).rejects.toThrow('Only the meeting host can change participant roles.');
  });

  it('allows the host to lock and unlock the architecture canvas', async () => {
    await toggleMeetingLock(meetingId, hostUser.id, true);
    let meeting = await getMeetingById(meetingId);
    expect(meeting?.is_locked).toBe(true);

    await toggleMeetingLock(meetingId, hostUser.id, false);
    meeting = await getMeetingById(meetingId);
    expect(meeting?.is_locked).toBe(false);
  });

  it('rejects non-host from locking the canvas', async () => {
    await expect(
      toggleMeetingLock(meetingId, participantUser.id, true)
    ).rejects.toThrow('Only the meeting host can lock or unlock the architecture.');
  });

  it('allows the host to remove a participant', async () => {
    await removeParticipant(meetingId, hostUser.id, participantUser.id);
    const participants = await getParticipants(meetingId);
    const peer = participants.find((p) => p.user_id === participantUser.id);
    expect(peer).toBeUndefined();
  });

  it('allows the host to end the meeting', async () => {
    await endMeeting(meetingId, hostUser.id);
    const meeting = await getMeetingById(meetingId);
    expect(meeting?.status).toBe('ended');
    expect(meeting?.ended_at).toBeDefined();
  });

  it('rejects non-host from ending the meeting', async () => {
    await expect(
      endMeeting(meetingId, 'random-person')
    ).rejects.toThrow('Only the meeting host can end the meeting.');
  });

  it('persists meeting chat messages and returns them in order', async () => {
    const m1 = await saveMeetingMessage(
      meetingId,
      hostUser,
      'Hello team',
      'chat'
    );
    const m2 = await saveMeetingMessage(
      meetingId,
      participantUser,
      'Architecture looks good',
      'chat'
    );
    const sys = await saveMeetingMessage(
      meetingId,
      { id: 'system', fullName: 'System' },
      'Host joined',
      'system'
    );

    expect(m1.id).toBeDefined();
    expect(m1.content).toBe('Hello team');
    expect(m1.message_type).toBe('chat');
    expect(m2.user_name).toBe(participantUser.fullName);
    expect(sys.message_type).toBe('system');

    const messages = await getMeetingMessages(meetingId);
    expect(messages.length).toBeGreaterThanOrEqual(3);
    expect(messages[0].content).toBe('Hello team');
    expect(messages[1].content).toBe('Architecture looks good');
    expect(messages[2].content).toBe('Host joined');
  });

  it('caps message retrieval to the requested limit', async () => {
    for (let i = 0; i < 5; i++) {
      await saveMeetingMessage(meetingId, hostUser, `msg ${i}`, 'chat');
    }
    const limited = await getMeetingMessages(meetingId, 2);
    expect(limited.length).toBe(2);
    expect(limited[0].content).toBe('msg 3');
    expect(limited[1].content).toBe('msg 4');
  });
});
