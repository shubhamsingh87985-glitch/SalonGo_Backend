function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetPasswordPage({ email = '', token = '', role = 'CUSTOMER' }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset SalonGo Password</title>
  </head>
  <body style="margin:0;min-height:100vh;background:#f4f0ea;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px 14px;box-sizing:border-box;">
      <section style="width:100%;max-width:460px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(17,24,39,0.16);">
        <div style="padding:28px;background:linear-gradient(135deg,#111827 0%,#312e81 55%,#b45309 100%);color:#ffffff;">
          <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#fde68a;font-weight:700;">SalonGo Secure</div>
          <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.2;">Create a new password</h1>
          <p style="margin:0;line-height:1.6;color:#e5e7eb;">Use a strong password to keep your bookings and salon account protected.</p>
        </div>
        <form method="post" action="/api/v1/auth/reset-password" style="padding:28px;">
          <input type="hidden" name="email" value="${escapeHtml(email)}">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <input type="hidden" name="role" value="${escapeHtml(role)}">
          <label style="display:block;margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;" for="password">New password</label>
          <input id="password" name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters" style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:10px;padding:13px 14px;font-size:15px;color:#111827;outline:none;">
          <p style="margin:10px 0 22px;color:#6b7280;font-size:13px;line-height:1.5;">Include uppercase, lowercase, and a number.</p>
          <button type="submit" style="width:100%;border:0;border-radius:10px;background:#111827;color:#ffffff;padding:14px 18px;font-size:15px;font-weight:700;cursor:pointer;">Reset password</button>
          <p style="margin:18px 0 0;color:#6b7280;font-size:12px;line-height:1.5;text-align:center;">This one-time link expires soon. If it has expired, request a fresh reset email.</p>
        </form>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = { resetPasswordPage };
