import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Valid email is required'),
  type: z.enum(['recommendation', 'bug']),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  type: 'recommendation' | 'bug';
  message: string;
  createdAt: string;
}

export const feedbackStore: FeedbackItem[] = [];

router.post('/', (req: Request, res: Response) => {
  const result = feedbackSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid feedback submission',
      details: result.error.errors,
    });
  }

  const feedback: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...result.data,
    createdAt: new Date().toISOString(),
  };

  feedbackStore.push(feedback);
  console.log(`[Feedback] Received ${feedback.type} from ${feedback.name} <${feedback.email}>: "${feedback.message}"`);

  return res.status(201).json({
    success: true,
    message: 'Thank you! Your feedback has been received.',
    id: feedback.id,
  });
});

export default router;

