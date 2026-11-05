import https from 'https';

/**
 * Telegram notification service for administrative alerts (new user signups, feedback).
 */

function escapeTelegramHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface SignupNotificationPayload {
  name?: string;
  email: string;
  userId?: string;
  provider?: string;
  createdAt?: string;
}

/**
 * Dispatches an HTTPS POST request forcing IPv4 to prevent Node.js dual-stack IPv6 ETIMEDOUT issues.
 */
function postTelegramMessage(botToken: string, payload: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      family: 4, // Force IPv4
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed);
          } else {
            reject(new Error(`Telegram API responded with status ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Telegram API response: ${body}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram request timed out after 10000ms'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Sends a Telegram notification when a new user registers on GitToScale.
 * Uses TELEGRAM_BOT_TOKEN1 / TELEGRAM_CHAT_ID1 with fallback to TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.
 */
export async function sendSignupTelegramNotification(payload: SignupNotificationPayload): Promise<boolean> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN1 || process.env.TELEGRAM_BOT_TOKEN)?.trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID1 || process.env.TELEGRAM_CHAT_ID)?.trim();

  if (!botToken || !chatId) {
    console.log('[Telegram Signup Alert] Skipped: TELEGRAM_BOT_TOKEN1 or TELEGRAM_CHAT_ID1 not configured.');
    return false;
  }

  const timestamp = new Date(payload.createdAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const displayName = payload.name?.trim() || payload.email.split('@')[0];

  const message = [
    `✅ <b>User Signed Up!</b>`,
    ``,
    `👤 <b>Name:</b> ${escapeTelegramHtml(displayName)}`,
    `📧 <b>Email:</b> ${escapeTelegramHtml(payload.email)}`,
    `🔑 <b>Via:</b> ${escapeTelegramHtml(payload.provider || 'Email / Password')}`,
    ``,
    `🕒 <i>${timestamp} UTC</i>`,
  ].filter(Boolean).join('\n');

  try {
    await postTelegramMessage(botToken, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    console.log('[Telegram Signup Alert] Alert successfully sent for:', payload.email);
    return true;
  } catch (err) {
    console.error('[Telegram Signup Alert] Request error:', err);
    return false;
  }
}

/**
 * Sends feedback notifications to Telegram using IPv4-safe dispatch.
 */
export async function sendFeedbackTelegramMessage(feedback: {
  name: string;
  email: string;
  type: 'recommendation' | 'bug';
  message: string;
  createdAt: string;
}): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    console.log('[Telegram Feedback Alert] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
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
    `<pre>${escapeTelegramHtml(feedback.message)}</pre>`,
    ``,
    `<i>🕒 ${timestamp}</i>`,
  ].join('\n');

  try {
    await postTelegramMessage(botToken, {
      chat_id: chatId,
      text: formattedMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    console.log('[Telegram Notification] Successfully delivered to Telegram chat:', chatId);
    return true;
  } catch (err) {
    console.error('[Telegram Notification] Request error:', err);
    return false;
  }
}
