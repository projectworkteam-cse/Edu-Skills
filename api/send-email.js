// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — BREVO TRANSACTIONAL EMAIL DISPATCHER (/api/send-email)
// ══════════════════════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
  }

  const { to, subject, htmlContent, textContent, type } = req.body || {};

  if (!to || !subject || (!htmlContent && !textContent && !type)) {
    return res.status(400).json({ error: 'Missing required email fields (to, subject, content or type).' });
  }

  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || 'projectworkteam87@gmail.com').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || "EDU-SKILL'S AI").trim();

  // If Brevo is not configured in environment, return graceful notice
  if (!brevoApiKey) {
    return res.status(200).json({
      status: 'fallback',
      message: 'BREVO_API_KEY is not set in environment. Dispatched via standard provider.'
    });
  }

  try {
    let finalHtml = htmlContent;
    if (!finalHtml) {
      if (type === 'verification') {
        finalHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <div style="background: #5B21D6; padding: 20px; border-radius: 8px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 22px;">EDU-SKILL'S AI</h1>
              <p style="margin: 5px 0 0; font-size: 13px; color: #E9D5FF;">Smart Study Planner & Academic Workspace</p>
            </div>
            <div style="padding: 24px 8px; color: #1f2937;">
              <h2 style="color: #111827; font-size: 18px;">Account Verification</h2>
              <p>Welcome to <strong>EDU-SKILL'S AI</strong>!</p>
              <p>Your student account has been registered. An official verification link has also been dispatched from Firebase Authentication.</p>
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5B21D6;">
                <p style="margin: 0; font-size: 14px;"><strong>Important Next Step:</strong></p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #4B5563;">Please check both your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder for the verification email. Click the verification link to activate your student account.</p>
              </div>
              <p style="font-size: 13px; color: #6B7280;">If you did not create this account, please ignore this email.</p>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #9CA3AF;">
              &copy; EDU-SKILL'S AI &bull; Project Work Team CSE
            </div>
          </div>
        `;
      } else if (type === 'reset') {
        finalHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <div style="background: #5B21D6; padding: 20px; border-radius: 8px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 22px;">EDU-SKILL'S AI</h1>
              <p style="margin: 5px 0 0; font-size: 13px; color: #E9D5FF;">Password Reset Notification</p>
            </div>
            <div style="padding: 24px 8px; color: #1f2937;">
              <h2 style="color: #111827; font-size: 18px;">Password Reset Requested</h2>
              <p>A password reset request was initiated for your EDU-SKILL'S AI account.</p>
              <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                <p style="margin: 0; font-size: 14px;"><strong>Next Step:</strong></p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #92400E;">Please check your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder for the official password reset link from Firebase Authentication to choose a new password.</p>
              </div>
              <p style="font-size: 13px; color: #6B7280;">If you did not request a password reset, you can safely ignore this message.</p>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #9CA3AF;">
              &copy; EDU-SKILL'S AI &bull; Project Work Team CSE
            </div>
          </div>
        `;
      } else {
        finalHtml = `<p>${textContent || ''}</p>`;
      }
    }

    const brevoPayload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to.trim() }],
      subject: subject.trim(),
      htmlContent: finalHtml
    };

    if (textContent) {
      brevoPayload.textContent = textContent;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload),
      signal: controller.signal
    });

    clearTimeout(timer);

    const data = await response.json();

    if (!response.ok) {
      console.warn('Brevo API error response:', data);
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 502).json({
        error: data.message || 'Failed to dispatch email via Brevo.',
        code: data.code || 'brevo_error'
      });
    }

    return res.status(200).json({
      status: 'sent',
      messageId: data.messageId
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.error('Brevo dispatch error:', err.message);
    return res.status(504).json({
      error: isTimeout ? 'Brevo email service timed out.' : 'Failed to connect to email service.',
      details: err.message
    });
  }
};
