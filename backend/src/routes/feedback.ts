import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

/**
 * Validation schema for user-submitted feedback.
 */
const feedbackSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Valid email is required'),
  type: z.enum(['recommendation', 'bug']),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

/**
 * Representation of a stored user feedback entry.
 */
export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  type: 'recommendation' | 'bug';
  message: string;
  createdAt: string;
}

/**
 * In-memory storage for feedback submissions.
 */
export const feedbackStore: FeedbackItem[] = [];

/**
 * Escapes characters that have special meaning in HTML mode for Telegram Bot API.
 */
function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Dispatches a formatted notification to Telegram using the Telegram Bot API.
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from environment variables.
 */
export async function sendTelegramNotification(feedback: FeedbackItem): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    console.log('[Telegram Notification] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
    return false;
  }

  const categoryEmoji = feedback.type === 'bug' ? '🐛 Bug Report' : '💡 Recommendation / Idea';
  const timestamp = new Date(feedback.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedMessage = [
    `<b>🔔 New GitToScale Message Received!</b>`,
    ``,
    `<b>👤 Name:</b> ${escapeTelegramHtml(feedback.name)}`,
    `<b>📧 Email:</b> ${escapeTelegramHtml(feedback.email)}`,
    `<b>🏷️ Type:</b> ${categoryEmoji}`,
    ``,
    `<b>💬 Message:</b>`,
    `<blockquote>${escapeTelegramHtml(feedback.message)}</blockquote>`,
    ``,
    `<i>🕒 ${timestamp}</i>`,
  ].join('\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data: any = await res.json();
    if (!res.ok || !data.ok) {
      console.error('[Telegram Notification] Error from Telegram API:', data);
      return false;
    }

    console.log('[Telegram Notification] Successfully delivered to Telegram chat:', chatId);
    return true;
  } catch (error) {
    console.error('[Telegram Notification] Request error:', error);
    return false;
  }
}

/**
 * POST /api/feedback
 *
 * Receives and validates user recommendations and bug reports.
 * Forwards the message to Telegram when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
 * Returns HTTP 201 Created on success, or HTTP 400 Bad Request on validation errors.
 */
router.post('/', async (req: Request, res: Response) => {
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

  // Forward to Telegram
  const telegramDelivered = await sendTelegramNotification(feedback);

  return res.status(201).json({
    success: true,
    message: 'Thank you! Your feedback has been received.',
    id: feedback.id,
    telegramDelivered,
  });
});

export default router;
