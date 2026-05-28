const brand = {
  appName: 'SalonGo',
  company: 'ASRVTech',
  logoText: 'SalonGo'
};

function layout({ title, preview, body }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">${preview}</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f6f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px;background:#111827;color:#ffffff;">
                <div style="font-size:24px;font-weight:700;">${brand.logoText}</div>
                <div style="font-size:13px;color:#d1d5db;margin-top:4px;">by ${brand.company}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px;">
                This message was sent by ${brand.company} for ${brand.appName}. If you did not request this, you can ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function otpEmail({ name = 'there', otp, purpose }) {
  const title = purpose === 'forgot_password' ? 'Reset your SalonGo password' : 'Verify your SalonGo email';
  return {
    subject: title,
    html: layout({
      title,
      preview: `Your SalonGo OTP is ${otp}`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;">Hi ${name},</h1>
        <p style="margin:0 0 18px;line-height:1.6;">Use this one-time password to ${purpose === 'forgot_password' ? 'reset your password' : 'verify your email'}.</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700;background:#f3f4f6;border-radius:8px;padding:18px;text-align:center;color:#111827;">${otp}</div>
        <p style="margin:18px 0 0;line-height:1.6;color:#4b5563;">This OTP expires in 5 minutes.</p>
      `
    })
  };
}

function simpleEmail({ subject, heading, message }) {
  return {
    subject,
    html: layout({
      title: subject,
      preview: message,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;">${heading}</h1>
        <p style="margin:0;line-height:1.6;">${message}</p>
      `
    })
  };
}

module.exports = {
  otpEmail,
  simpleEmail
};
