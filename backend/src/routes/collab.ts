import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import {
  createMeeting,
  getMeetingById,
  getMeetingByJoinCode,
  joinMeeting,
  getParticipants,
  getMessages,
  updatePermissionMode,
  setParticipantEditPermission,
  removeParticipant,
  endMeeting,
} from '../services/collabService.js';

const router = Router();

const CreateMeetingSchema = z.object({
  title: z.string().max(100).optional(),
  initialArchitecture: z
    .object({
      nodes: z.array(z.any()).default([]),
      edges: z.array(z.any()).default([]),
    })
    .optional(),
});

const ValidateCodeSchema = z.object({
  joinCode: z.string().min(3).max(20),
});

const UpdatePermissionModeSchema = z.object({
  permissionMode: z.enum(['host_only', 'collaborative', 'controlled']),
});

const SetParticipantPermissionSchema = z.object({
  canEdit: z.boolean(),
});

/**
 * POST /api/collab/meetings
 * Creates a new collaborative meeting.
 */
router.post('/meetings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = CreateMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const meeting = await createMeeting(
      {
        id: user.id,
        fullName: user.fullName || 'Host',
        avatarUrl: user.avatarUrl,
      },
      parsed.data.title,
      parsed.data.initialArchitecture
    );

    res.status(201).json({
      success: true,
      meeting,
    });
  } catch (err: any) {
    console.error('[Collab Route] Create meeting error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to create meeting' });
  }
});

/**
 * POST /api/collab/meetings/validate
 * Validates a join code and returns the target meeting info.
 */
router.post('/meetings/validate', async (req, res: Response) => {
  try {
    const parsed = ValidateCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Please provide a valid meeting code.' });
      return;
    }

    const meeting = await getMeetingByJoinCode(parsed.data.joinCode);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found. Please check the code and try again.' });
      return;
    }

    if (meeting.status === 'ended') {
      res.status(410).json({ success: false, error: 'This meeting has already ended.' });
      return;
    }

    res.json({
      success: true,
      meetingId: meeting.id,
      title: meeting.title,
      hostName: meeting.host_user_name,
      status: meeting.status,
    });
  } catch (err: any) {
    console.error('[Collab Route] Validate code error:', err);
    res.status(500).json({ success: false, error: 'Failed to validate meeting code' });
  }
});

/**
 * GET /api/collab/meetings/:id
 * Retrieves meeting details.
 */
router.get('/meetings/:id', async (req, res: Response) => {
  try {
    const meeting = await getMeetingById(req.params.id);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }
    const participants = await getParticipants(meeting.id);

    res.json({
      success: true,
      meeting,
      participantCount: participants.length,
    });
  } catch (err: any) {
    console.error('[Collab Route] Get meeting error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve meeting' });
  }
});

/**
 * POST /api/collab/meetings/:id/join
 * Joins a meeting.
 */
router.post('/meetings/:id/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const meetingId = req.params.id;

    const result = await joinMeeting(meetingId, {
      id: user.id,
      fullName: user.fullName || user.email?.split('@')[0] || 'Participant',
      avatarUrl: user.avatarUrl,
    });

    res.json({
      success: true,
      meeting: result.meeting,
      participant: result.participant,
      participants: result.participants,
    });
  } catch (err: any) {
    console.error('[Collab Route] Join meeting error:', err);
    const statusCode = err?.message?.includes('ended') ? 410 : err?.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: err?.message || 'Failed to join meeting' });
  }
});

/**
 * GET /api/collab/meetings/:id/participants
 * Retrieves all participants in the meeting.
 */
router.get('/meetings/:id/participants', async (req, res: Response) => {
  try {
    const participants = await getParticipants(req.params.id);
    res.json({ success: true, participants });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

/**
 * GET /api/collab/meetings/:id/messages
 * Retrieves chat history.
 */
router.get('/meetings/:id/messages', async (req, res: Response) => {
  try {
    const messages = await getMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

/**
 * PUT /api/collab/meetings/:id/permissions
 * Host changes meeting permission mode.
 */
router.put('/meetings/:id/permissions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = UpdatePermissionModeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid permission mode' });
      return;
    }

    const updated = await updatePermissionMode(req.params.id, user.id, parsed.data.permissionMode);
    res.json({ success: true, meeting: updated });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err?.message || 'Failed to update permissions' });
  }
});

/**
 * PUT /api/collab/meetings/:id/participants/:userId/permission
 * Host grants or revokes edit permissions for a participant.
 */
router.put(
  '/meetings/:id/participants/:userId/permission',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const hostUser = req.user!;
      const parsed = SetParticipantPermissionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid permission payload' });
        return;
      }

      const updated = await setParticipantEditPermission(
        req.params.id,
        hostUser.id,
        req.params.userId,
        parsed.data.canEdit
      );

      res.json({ success: true, participant: updated });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err?.message || 'Failed to update participant permission' });
    }
  }
);

/**
 * DELETE /api/collab/meetings/:id/participants/:userId
 * Host removes a participant from the meeting.
 */
router.delete(
  '/meetings/:id/participants/:userId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const hostUser = req.user!;
      await removeParticipant(req.params.id, hostUser.id, req.params.userId);
      res.json({ success: true, message: 'Participant removed' });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err?.message || 'Failed to remove participant' });
    }
  }
);

/**
 * POST /api/collab/meetings/:id/end
 * Host ends the meeting.
 */
router.post('/meetings/:id/end', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostUser = req.user!;
    const meeting = await endMeeting(req.params.id, hostUser.id);
    res.json({ success: true, meeting });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err?.message || 'Failed to end meeting' });
  }
});

/**
 * GET /api/collab/meetings/:id/snapshot
 * Retrieves the architecture snapshot to export to normal playground.
 */
router.get('/meetings/:id/snapshot', async (req, res: Response) => {
  try {
    const meeting = await getMeetingById(req.params.id);
    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }
    res.json({
      success: true,
      title: meeting.title,
      architecture: meeting.architecture_state,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve snapshot' });
  }
});

export default router;
