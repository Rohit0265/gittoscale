import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { checkAndIncrementMeetingUsage } from '../services/subscriptionService.js';
import {
  createMeeting,
  getMeetingById,
  joinMeeting,
  getParticipants,
  setParticipantRole,
  removeParticipant,
  toggleMeetingLock,
  endMeeting,
  getMeetingMessages,
  getUserMeetings,
  deleteMeetingForUser,
} from './meetingService.js';

const router = Router();

const CreateMeetingSchema = z.object({
  projectId: z.string().optional().nullable(),
  title: z.string().max(100).optional(),
  initialArchitecture: z
    .object({
      nodes: z.array(z.any()).default([]),
      edges: z.array(z.any()).default([]),
    })
    .optional(),
});

const UpdateRoleSchema = z.object({
  role: z.enum(['host', 'editor', 'viewer']),
});

const ToggleLockSchema = z.object({
  isLocked: z.boolean(),
});

/**
 * POST /api/meetings
 * Host creates a new collaborative meeting.
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const parsed = CreateMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.format() });
      return;
    }

    const check = await checkAndIncrementMeetingUsage(user.id);
    if (!check.allowed) {
      res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_REACHED',
        message: 'You have reached your free plan limit of 3 meetings. Upgrade your plan to continue hosting live collaborative meetings.',
        upgradeUrl: '/payment',
        plan: check.plan,
        used: check.used,
        limit: check.limit,
      });
      return;
    }

    const meeting = await createMeeting(
      {
        id: user.id,
        fullName: user.fullName || user.email?.split('@')[0] || 'Host',
        avatarUrl: user.avatarUrl,
      },
      parsed.data.projectId,
      parsed.data.title,
      parsed.data.initialArchitecture
    );

    res.status(201).json({
      success: true,
      meeting,
    });
  } catch (err: any) {
    console.error('[Meeting Route] Create error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to create meeting' });
  }
});

/**
 * GET /api/meetings/user/history
 * Retrieves collaborative meetings for the authenticated user.
 */
router.get('/user/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const meetings = await getUserMeetings(user.id);
    res.json({
      success: true,
      meetings,
    });
  } catch (err: any) {
    console.error('[Meeting Route] User history error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch user meetings' });
  }
});

/**
 * GET /api/meetings/:id
 * Retrieves meeting details.
 */
router.get('/:id', async (req, res: Response) => {
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
    res.status(500).json({ success: false, error: 'Failed to retrieve meeting' });
  }
});

/**
 * POST /api/meetings/:id/join
 * Joins a meeting.
 */
router.post('/:id/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
      role: result.participant.role,
      participants: result.participants,
    });
  } catch (err: any) {
    console.error('[Meeting Route] Join error:', err);
    const statusCode = err?.message?.includes('ended') ? 410 : err?.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: err?.message || 'Failed to join meeting' });
  }
});

/**
 * GET /api/meetings/:id/participants
 * Retrieves all participants for a meeting.
 */
router.get('/:id/participants', async (req, res: Response) => {
  try {
    const participants = await getParticipants(req.params.id);
    res.json({ success: true, participants });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

/**
 * PUT /api/meetings/:id/participants/:userId/role
 * Host assigns Editor or Viewer role to a participant.
 */
router.put(
  '/:id/participants/:userId/role',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const hostUser = req.user!;
      const parsed = UpdateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid role' });
        return;
      }

      const updated = await setParticipantRole(
        req.params.id,
        hostUser.id,
        req.params.userId,
        parsed.data.role
      );

      res.json({ success: true, participant: updated });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err?.message || 'Failed to update participant role' });
    }
  }
);

/**
 * DELETE /api/meetings/:id/participants/:userId
 * Host removes a participant from the meeting.
 */
router.delete(
  '/:id/participants/:userId',
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
 * PUT/POST /api/meetings/:id/lock
 * Host locks or unlocks the architecture canvas.
 */
const handleToggleLock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostUser = req.user!;
    const parsed = ToggleLockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid lock parameter' });
      return;
    }

    const meeting = await toggleMeetingLock(req.params.id, hostUser.id, parsed.data.isLocked);
    res.json({ success: true, meeting });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err?.message || 'Failed to update lock' });
  }
};

router.put('/:id/lock', requireAuth, handleToggleLock);
router.post('/:id/lock', requireAuth, handleToggleLock);

/**
 * POST /api/meetings/:id/end
 * Host ends the meeting.
 */
router.post('/:id/end', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostUser = req.user!;
    const meeting = await endMeeting(req.params.id, hostUser.id);
    res.json({ success: true, meeting });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err?.message || 'Failed to end meeting' });
  }
});

/**
 * GET /api/meetings/:id/messages
 * Retrieves persistent meeting chat history (authenticated meeting participants).
 */
router.get('/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messages = await getMeetingMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch meeting messages' });
  }
});

/**
 * GET /api/meetings/:id/snapshot
 * Retrieves the latest architecture snapshot.
 */
router.get('/:id/snapshot', async (req, res: Response) => {
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

/**
 * DELETE /api/meetings/:id
 * Deletes a meeting from the user's history (host only or participant leave).
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    await deleteMeetingForUser(req.params.id, user.id);
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete meeting' });
  }
});

export default router;
