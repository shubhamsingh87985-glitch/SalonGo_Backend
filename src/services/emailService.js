const axios = require('axios');
const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const logger = require('../utils/logger');

async function sendWithBrevo({ to, subject, html }) {
  if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured');

  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: {
      name: env.BREVO_SENDER_NAME,
      email: env.BREVO_SENDER_EMAIL
    },
    to: [{ email: to }],
    subject,
    htmlContent: html
  }, {
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    timeout: 10000
  });
}

async function sendWithSmtp({ to, subject, html }) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP fallback is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html
  });
}

async function sendEmail(payload) {
  try {
    await sendWithBrevo(payload);
  } catch (brevoError) {
    const brevoDetails = brevoError.response?.data ? JSON.stringify(brevoError.response.data) : brevoError.message;
    logger.warn(`Brevo email failed: ${brevoDetails}`);
    await sendWithSmtp(payload);
  }
}

module.exports = { sendEmail };
