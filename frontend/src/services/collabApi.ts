import axios from 'axios';

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const CLEAN_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL
  ? (CLEAN_URL.endsWith('/api') ? CLEAN_URL : `${CLEAN_URL}/api`)
  : '/api';

export interface CollabMeeting {
  id: string;
  host_user_id: string;
  host_user_name: string;
  title: string;
  join_code: string;
  status: 'active' | 'ended' | 'expired';
  permission_mode: 'host_only' | 'collaborative' | 'controlled';
  architecture_state: {
    nodes: any[];
    edges: any[];
  };
  created_at: string;
  updated_at: string;
  ended_at?: string | null;
}

export interface CollabParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  role: 'host' | 'participant';
  can_edit: boolean;
  joined_at: string;
  last_seen_at: string;
  color?: string;
  is_online?: boolean;
}

export interface CollabMessage {
  id: string;
  meeting_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  message: string;
  message_type: 'chat' | 'system' | 'ai';
  created_at: string;
}

export const collabApi = {
  async createMeeting(
    title?: string,
    initialArchitecture?: { nodes: any[]; edges: any[] },
    token?: string | null
  ): Promise<CollabMeeting> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(
      `${API_BASE}/collab/meetings`,
      { title, initialArchitecture },
      { headers }
    );
    return res.data.meeting;
  },

  async validateMeetingCode(
    joinCode: string
  ): Promise<{ meetingId: string; title: string; hostName: string; status: string }> {
    const res = await axios.post(`${API_BASE}/collab/meetings/validate`, { joinCode });
    return res.data;
  },

  async getMeeting(meetingId: string): Promise<{ meeting: CollabMeeting; participantCount: number }> {
    const res = await axios.get(`${API_BASE}/collab/meetings/${meetingId}`);
    return res.data;
  },

  async joinMeeting(
    meetingId: string,
    token?: string | null
  ): Promise<{ meeting: CollabMeeting; participant: CollabParticipant; participants: CollabParticipant[] }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/collab/meetings/${meetingId}/join`, {}, { headers });
    return res.data;
  },

  async getParticipants(meetingId: string): Promise<CollabParticipant[]> {
    const res = await axios.get(`${API_BASE}/collab/meetings/${meetingId}/participants`);
    return res.data.participants || [];
  },

  async getMessages(meetingId: string): Promise<CollabMessage[]> {
    const res = await axios.get(`${API_BASE}/collab/meetings/${meetingId}/messages`);
    return res.data.messages || [];
  },

  async updatePermissionMode(
    meetingId: string,
    permissionMode: 'host_only' | 'collaborative' | 'controlled',
    token?: string | null
  ): Promise<CollabMeeting> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.put(
      `${API_BASE}/collab/meetings/${meetingId}/permissions`,
      { permissionMode },
      { headers }
    );
    return res.data.meeting;
  },

  async setParticipantPermission(
    meetingId: string,
    targetUserId: string,
    canEdit: boolean,
    token?: string | null
  ): Promise<CollabParticipant> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.put(
      `${API_BASE}/collab/meetings/${meetingId}/participants/${targetUserId}/permission`,
      { canEdit },
      { headers }
    );
    return res.data.participant;
  },

  async removeParticipant(
    meetingId: string,
    targetUserId: string,
    token?: string | null
  ): Promise<void> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.delete(`${API_BASE}/collab/meetings/${meetingId}/participants/${targetUserId}`, {
      headers,
    });
  },

  async endMeeting(meetingId: string, token?: string | null): Promise<CollabMeeting> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/collab/meetings/${meetingId}/end`, {}, { headers });
    return res.data.meeting;
  },

  async getSnapshot(meetingId: string): Promise<{ title: string; architecture: { nodes: any[]; edges: any[] } }> {
    const res = await axios.get(`${API_BASE}/collab/meetings/${meetingId}/snapshot`);
    return res.data;
  },
};
