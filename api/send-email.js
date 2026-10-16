// api/send-email.js - authenticated transactional mailer (Brevo).
// ponytail: auth verified; recipient is strictly user.email from token; fixed templates only.
const { verifyFirebaseUser } = require('../lib/auth');
const { rateLimit } = require('../lib/rate-limit');

const err = (res, status, code, message) => res.status(status).json({ error: { code, message } });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TEMPLATES = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <div style="background: #5B21D6; padding: 20px; border-radius: 8px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">EDU-SKILL'S AI</h1>
        <p style="margin: 5px 0 0; font-size: 13px; color: #E9D5FF;">Smart Study Planner & Academic Workspace</p>
      </div>
      <div style="padding: 24px 8px; color: #1f2937;">
        <h2 style="color: #111827; font-size: 18px;">Welcome, ${esc(name || 'Student')}!</h2>
        <p>Your EDU-SKILL'S AI account is ready to use.</p>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #9CA3AF;">
        &copy; EDU-SKILL'S AI &bull; Project Work Team CSE
      </div>
    </div>`,
  reminder: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <div style="background: #5B21D6; padding: 20px; border-radius: 8px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">EDU-SKILL'S AI</h1>
        <p style="margin: 5px 0 0; font-size: 13px; color: #E9D5FF;">Study Reminder</p>
      </div>
      <div style="padding: 24px 8px; color: #1f2937;">
        <h2 style="color: #111827; font-size: 18px;">Time to Study, ${esc(name || 'Student')}!</h2>
        <p>You have pending study sessions scheduled for today in your Edu-Skills timetable.</p>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #9CA3AF;">
        &copy; EDU-SKILL'S AI &bull; Project Work Team CSE
      </div>
    </div>`
};

const SUBJECTS = {
  welcome: "Welcome to EDU-SKILL'S AI",
  reminder: "Edu-Skills Study Reminder"
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return err(res, 405, 'method_not_allowed', 'Only POST is supported.');
  }

  let user;
  try { user = await verifyFirebaseUser(req); }
  catch (e) { return err(res, 503, 'auth_unavailable', 'Sign-in check unavailable.'); }

  if (!user) return err(res, 401, 'unauthorized', 'Please sign in again.');
  if (!user.emailVerified) return err(res, 403, 'email_unverified', 'Please verify your email address.');

  if (!rateLimit(`mail:${user.uid}`, 5, 3600000)) {
    res.setHeader('Retry-After', '3600');
    return err(res, 429, 'rate_limited', 'Email limit reached (5/hour). Please wait.');
  }

  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const mailFrom = (process.env.MAIL_FROM || process.env.BREVO_SENDER_EMAIL || '').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "EDU-SKILL'S AI").trim();

  if (!brevoApiKey || !mailFrom) {
    return err(res, 503, 'not_configured', 'Email service is not configured.');
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { body = null; }
  if (!body || typeof body !== 'object') return err(res, 400, 'bad_json', 'Request body must be JSON.');

  const type = String(body.type || '').trim();
  const tpl = TEMPLATES[type];
  if (!tpl) return err(res, 400, 'bad_type', 'Invalid email template type. Must be "welcome" or "reminder".');

  const subject = SUBJECTS[type];
  const name = typeof body.name === 'string' ? body.name.slice(0, 100) : '';
  const htmlContent = tpl(name);

  // Recipient is strictly user.email from the verified token - NEVER client-supplied
  const brevoPayload = {
    sender: { name: senderName, email: mailFrom },
    to: [{ email: user.email }],
    subject,
    htmlContent
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn('[send-email] Brevo API HTTP', response.status);
      return err(res, response.status >= 400 && response.status < 600 ? response.status : 502, 'provider_error', 'Email delivery failed.');
    }

    const data = await response.json().catch(() => ({}));
    return res.status(200).json({ status: 'sent', messageId: data.messageId || 'ok' });
  } catch (e) {
    const isTimeout = e.name === 'TimeoutError' || e.name === 'AbortError';
    return err(res, isTimeout ? 504 : 502, isTimeout ? 'timeout' : 'network_error', isTimeout ? 'Email request timed out.' : 'Email service unreachable.');
  }
};
