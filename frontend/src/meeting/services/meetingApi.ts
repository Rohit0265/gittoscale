import axios from 'axios';
import { Meeting, MeetingParticipant, MeetingRole } from '../types';

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const CLEAN_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL
  ? (CLEAN_URL.endsWith('/api') ? CLEAN_URL : `${CLEAN_URL}/api`)
  : '/api';

export const meetingApi = {
  async createMeeting(
    params: {
      title?: string;
      projectId?: string | null;
      initialArchitecture?: { nodes: any[]; edges: any[] };
    },
    token?: string | null
  ): Promise<Meeting> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(
      `${API_BASE}/meetings`,
      {
        title: params.title || 'Collaborative Architecture Meeting',
        projectId: params.projectId || null,
        initialArchitecture: params.initialArchitecture || { nodes: [], edges: [] },
      },
      { headers }
    );
    return res.data.meeting;
  },

  async getMeeting(meetingId: string): Promise<{ meeting: Meeting; participantCount: number }> {
    const res = await axios.get(`${API_BASE}/meetings/${meetingId}`);
    return res.data;
  },

  async joinMeeting(meetingId: string, token: string): Promise<{ meeting: Meeting; role: MeetingRole }> {
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.post(`${API_BASE}/meetings/${meetingId}/join`, {}, { headers });
    return res.data;
  },

  async getParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    const res = await axios.get(`${API_BASE}/meetings/${meetingId}/participants`);
    return res.data.participants;
  },

  async updateParticipantRole(
    meetingId: string,
    targetUserId: string,
    role: MeetingRole,
    token: string
  ): Promise<void> {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.put(
      `${API_BASE}/meetings/${meetingId}/participants/${targetUserId}/role`,
      { role },
      { headers }
    );
  },

  async removeParticipant(meetingId: string, targetUserId: string, token: string): Promise<void> {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.delete(`${API_BASE}/meetings/${meetingId}/participants/${targetUserId}`, { headers });
  },

  async toggleMeetingLock(meetingId: string, isLocked: boolean, token: string): Promise<void> {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.put(`${API_BASE}/meetings/${meetingId}/lock`, { isLocked }, { headers });
  },

  async endMeeting(meetingId: string, token: string): Promise<void> {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.post(`${API_BASE}/meetings/${meetingId}/end`, {}, { headers });
  },

  async getSnapshot(meetingId: string): Promise<{ nodes: any[]; edges: any[] }> {
    const res = await axios.get(`${API_BASE}/meetings/${meetingId}/snapshot`);
    return res.data.architecture;
  },
};
