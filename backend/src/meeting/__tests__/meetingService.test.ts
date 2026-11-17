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
});
