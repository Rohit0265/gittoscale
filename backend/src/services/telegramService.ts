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
    const options: https.RequestOptions = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
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
 * Seamlessly attempts TELEGRAM_BOT_TOKEN1/CHAT_ID1 first, and automatically
 * fails over to TELEGRAM_BOT_TOKEN/CHAT_ID if the primary bot encounters any error.
 */
export async function sendSignupTelegramNotification(payload: SignupNotificationPayload): Promise<boolean> {
  const candidates: Array<{ name: string; botToken: string; chatId: string }> = [];

  const token1 = process.env.TELEGRAM_BOT_TOKEN1?.trim();
  const chat1 = process.env.TELEGRAM_CHAT_ID1?.trim();
  if (token1 && chat1) {
    candidates.push({ name: 'Bot 1 (TELEGRAM_BOT_TOKEN1)', botToken: token1, chatId: chat1 });
  }

  const token0 = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chat0 = process.env.TELEGRAM_CHAT_ID?.trim();
  if (token0 && chat0 && token0 !== token1) {
    candidates.push({ name: 'Primary Bot (TELEGRAM_BOT_TOKEN)', botToken: token0, chatId: chat0 });
  }

  if (candidates.length === 0) {
    console.log('[Telegram Signup Alert] Skipped: No Telegram bot credentials configured.');
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

  let lastError: any = null;

  for (const candidate of candidates) {
    try {
      await postTelegramMessage(candidate.botToken, {
        chat_id: candidate.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      console.log(`[Telegram Signup Alert] Alert successfully delivered via ${candidate.name} for: ${payload.email}`);
      return true;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Telegram Signup Alert] Delivery failed using ${candidate.name}: ${err?.message || err}. Attempting next bot if available...`);
    }
  }

  console.error('[Telegram Signup Alert] All Telegram bot candidates failed to deliver alert:', lastError?.message || lastError);
  return false;
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
