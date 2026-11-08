import https from 'https';

/**
 * GitToScale Email Service
 * Handles custom transactional email dispatch for new user signups,
 * invitations, and system notifications.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface WelcomeEmailPayload {
  name?: string;
  email: string;
  userId?: string;
  provider?: string;
  appUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  provider: 'resend' | 'sendgrid' | 'simulated';
  error?: string;
}

function getFromAddress(override?: string): string {
  if (override) return override;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  // If custom domain is not yet verified on Resend, onboarding@resend.dev is the official default
  return 'GitToScale <onboarding@resend.dev>';
}

const APP_URL = process.env.APP_URL || 'https://gittoscale.tech';

/**
 * Strips HTML tags to generate a clean plain-text fallback.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Generates an impeccably designed, responsive, dark/light email template for new GitToScale signups.
 */
export function generateWelcomeEmailTemplate(payload: WelcomeEmailPayload): { subject: string; html: string; text: string } {
  const recipientName = (payload.name && payload.name.trim()) || payload.email.split('@')[0] || 'Architect';
  const studioUrl = `${payload.appUrl || APP_URL}/app`;
  const feedUrl = `${payload.appUrl || APP_URL}/feed`;

  const subject = `Welcome to GitToScale, ${recipientName} — Design & Simulate Without Limits`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #060709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ededed; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060709; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0d0f12; border: 1px solid #1f242d; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background-color: #10b981; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding: 32px 36px 20px; text-align: left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background-color: #10b981; text-align: center; line-height: 32px; color: #000000; font-weight: 900; font-size: 16px; font-family: monospace;">G</div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">GitToScale</span>
                    <span style="display: block; font-size: 11px; font-family: monospace; color: #8892b0; text-transform: uppercase; letter-spacing: 1px;">Systems Architecture Studio</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Headline -->
          <tr>
            <td style="padding: 0 36px 16px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; line-height: 1.25; color: #ffffff; letter-spacing: -0.6px;">
                Welcome aboard, ${recipientName}.
              </h1>
              <p style="margin: 12px 0 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                Your account is ready. You now have full access to GitToScale’s real-time analytical queue simulator, automated repository discovery, and distributed systems community feed.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 8px 36px 28px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius: 10px; background-color: #10b981;">
                    <a href="${studioUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #052e16; text-decoration: none; border-radius: 10px; letter-spacing: -0.2px;">
                      Launch Architecture Studio &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Feature Cards Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="border-top: 1px solid #1e293b; height: 1px; line-height: 1px;">&nbsp;</div>
            </td>
          </tr>

          <!-- 3-Step Quick Start Roadmap -->
          <tr>
            <td style="padding: 24px 36px 16px;">
              <p style="margin: 0 0 16px; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #10b981; font-weight: 700;">
                Get Started in 3 Minutes
              </p>

              <!-- Step 1 -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px; background-color: #13171f; border: 1px solid #202735; border-radius: 10px; padding: 12px 14px;">
                <tr>
                  <td width="28" style="vertical-align: top; font-family: monospace; font-size: 12px; font-weight: 800; color: #10b981;">01</td>
                  <td style="vertical-align: top;">
                    <strong style="color: #f1f5f9; font-size: 13px;">Design or Ingest a Codebase</strong>
                    <p style="margin: 3px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.45;">
                      Describe your platform in plain text, import a GitHub repo, or start from a clean canvas.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px; background-color: #13171f; border: 1px solid #202735; border-radius: 10px; padding: 12px 14px;">
                <tr>
                  <td width="28" style="vertical-align: top; font-family: monospace; font-size: 12px; font-weight: 800; color: #10b981;">02</td>
                  <td style="vertical-align: top;">
                    <strong style="color: #f1f5f9; font-size: 13px;">Simulate Burst Traffic &amp; Failures</strong>
                    <p style="margin: 3px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.45;">
                      Test peak burst loads (up to 100k+ req/s) with instant mathematical queueing models. Zero cloud cost.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px; background-color: #13171f; border: 1px solid #202735; border-radius: 10px; padding: 12px 14px;">
                <tr>
                  <td width="28" style="vertical-align: top; font-family: monospace; font-size: 12px; font-weight: 800; color: #10b981;">03</td>
                  <td style="vertical-align: top;">
                    <strong style="color: #f1f5f9; font-size: 13px;">Publish to Community Feed</strong>
                    <p style="margin: 3px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.45;">
                      1-click publish your topology and simulation run to <a href="${feedUrl}" style="color: #10b981; text-decoration: none;">/feed</a> for senior architect peer reviews.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px; background-color: #090a0d; border-top: 1px solid #1a1e26; text-align: left;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                You are receiving this welcome email because an account was registered with <strong>${payload.email}</strong> on <a href="${APP_URL}" style="color: #8892b0; text-decoration: none;">GitToScale</a>.
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #475569; font-family: monospace;">
                &copy; ${new Date().getFullYear()} GitToScale · System Design Playground &amp; Capacity Planner
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = htmlToPlainText(html);

  return { subject, html, text };
}

/**
 * Dispatches an email through Resend API (HTTPS).
 */
async function sendViaResend(apiKey: string, options: SendEmailOptions): Promise<SendEmailResult> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      from: getFromAddress(options.from),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || htmlToPlainText(options.html),
      reply_to: options.replyTo,
    });

    const req = https.request(
      {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && data.id) {
              resolve({
                success: true,
                messageId: data.id,
                provider: 'resend',
              });
            } else {
              console.warn('[EmailService] Resend API error response:', res.statusCode, body);
              resolve({
                success: false,
                provider: 'resend',
                error: data.message || `Resend error ${res.statusCode}`,
              });
            }
          } catch (e: any) {
            resolve({
              success: false,
              provider: 'resend',
              error: e.message || 'Failed to parse Resend response',
            });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        provider: 'resend',
        error: 'Resend HTTP request timed out after 10000ms',
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        provider: 'resend',
        error: err.message,
      });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Dispatches an email through SendGrid API (HTTPS).
 */
async function sendViaSendGrid(apiKey: string, options: SendEmailOptions): Promise<SendEmailResult> {
  return new Promise((resolve) => {
    const recipients = Array.isArray(options.to)
      ? options.to.map((email) => ({ email }))
      : [{ email: options.to }];

    const payload = JSON.stringify({
      personalizations: [{ to: recipients }],
      from: { email: getFromAddress(options.from).replace(/.*<([^>]+)>.*/, '$1') },
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text || htmlToPlainText(options.html) },
        { type: 'text/html', value: options.html },
      ],
    });

    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              messageId: (res.headers['x-message-id'] as string) || `sg_${Date.now()}`,
              provider: 'sendgrid',
            });
          } else {
            console.warn('[EmailService] SendGrid API error response:', res.statusCode, body);
            resolve({
              success: false,
              provider: 'sendgrid',
              error: `SendGrid error ${res.statusCode}: ${body}`,
            });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        provider: 'sendgrid',
        error: 'SendGrid HTTP request timed out after 10000ms',
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        provider: 'sendgrid',
        error: err.message,
      });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Universal email dispatcher:
 * Automatically uses RESEND_API_KEY, SENDGRID_API_KEY, or development simulation mode.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const isTest = process.env.NODE_ENV === 'test' && !process.env.TEST_LIVE_EMAIL;
  const resendKey = !isTest ? process.env.RESEND_API_KEY : undefined;
  const sendgridKey = !isTest ? process.env.SENDGRID_API_KEY : undefined;

  if (resendKey) {
    return sendViaResend(resendKey, options);
  }

  if (sendgridKey) {
    return sendViaSendGrid(sendgridKey, options);
  }

  // Development / Simulation Fallback
  // Formats and logs the email cleanly so registration never blocks in local/staging environments.
  const recipient = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  console.log(`[EmailService] 📧 Simulated email dispatched to: ${recipient} | Subject: "${options.subject}"`);

  return {
    success: true,
    simulated: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    provider: 'simulated',
  };
}

/**
 * Public helper to send the custom GitToScale welcome email to new users.
 */
export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<SendEmailResult> {
  if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@')) {
    return {
      success: false,
      error: 'Invalid recipient email address provided.',
      provider: 'simulated',
    };
  }

  const { subject, html, text } = generateWelcomeEmailTemplate(payload);

  return sendEmail({
    to: payload.email.trim().toLowerCase(),
    subject,
    html,
    text,
  });
}

/**
 * Returns whether a live email provider API key is configured.
 */
export function isEmailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}

export default {
  sendEmail,
  sendWelcomeEmail,
  generateWelcomeEmailTemplate,
  isEmailServiceConfigured,
};
