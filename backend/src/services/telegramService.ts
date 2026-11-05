/**
 * Telegram notification service for administrative alerts (new user signups, critical events).
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
 * Sends a Telegram notification when a new user registers on GitToScale.
 */
export async function sendSignupTelegramNotification(payload: SignupNotificationPayload): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    console.log('[Telegram Signup Alert] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
    return false;
  }

  const timestamp = new Date(payload.createdAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const displayName = payload.name?.trim() || payload.email.split('@')[0];
  const providerLabel = payload.provider ? ` (${payload.provider.toUpperCase()})` : '';

  const message = [
    `🚀 <b>New GitToScale User Registration!</b>`,
    ``,
    `👤 <b>Name:</b> ${escapeTelegramHtml(displayName)}`,
    `📧 <b>Email:</b> ${escapeTelegramHtml(payload.email)}`,
    `🔑 <b>Auth Method:</b> ${escapeTelegramHtml(payload.provider || 'Email / Password')}${providerLabel}`,
    payload.userId ? `🆔 <b>User ID:</b> <code>${escapeTelegramHtml(payload.userId)}</code>` : '',
    ``,
    `🕒 <i>${timestamp} UTC</i>`,
  ].filter(Boolean).join('\n');

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data: any = await res.json();
    if (!res.ok || !data.ok) {
      console.error('[Telegram Signup Alert] Error from Telegram API:', data);
      return false;
    }

    console.log('[Telegram Signup Alert] Alert successfully sent for:', payload.email);
    return true;
  } catch (err) {
    console.error('[Telegram Signup Alert] Request error:', err);
    return false;
  }
}

