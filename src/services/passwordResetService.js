const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');
const { env } = require('../config/env');
const { hashToken } = require('../utils/tokens');
const { passwordResetEmail } = require('../templates/emailTemplates');
const { sendEmail } = require('./emailService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function resetExpiryMs() {
  const value = String(env.JWT_RESET_EXPIRES_IN || '10m').trim();
  const match = value.match(/^(\d+)\s*([smhd])?$/i);
  if (!match) return 10 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

function buildResetLink({ identifier, role, token }) {
  const resetPath = '/reset-password';
  const baseUrl = env.PASSWORD_RESET_URL || env.CLIENT_URL || 'https://salongo-backend.onrender.com';
  const resetUrl = new URL(baseUrl === '*' ? `https://salongo-backend.onrender.com${resetPath}` : baseUrl);

  if (!env.PASSWORD_RESET_URL && resetUrl.pathname === '/') {
    resetUrl.pathname = resetPath;
  }

  resetUrl.searchParams.set('token', token);
  resetUrl.searchParams.set('email', identifier);
  resetUrl.searchParams.set('role', role);

  return resetUrl.toString();
}

async function issuePasswordResetLink({ identifier, role, name }) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + resetExpiryMs());

  await PasswordResetToken.createResetToken(identifier, role, hashToken(token), expiresAt);
  const resetLink = buildResetLink({ identifier, role, token });
  const template = passwordResetEmail({ name, resetLink, expiresAt });

  try {
    await sendEmail({ to: identifier, ...template });
    return { sent: true };
  } catch (error) {
    logger.error(`Password reset email failed for ${identifier}: ${error.message}`);
    throw new AppError('Password reset email could not be sent. Please check email configuration and try again.', 502);
  }
}

async function verifyPasswordResetToken({ identifier, role, token }) {
  const record = await PasswordResetToken.findOne({
    identifier: identifier.toLowerCase(),
    role,
    tokenHash: hashToken(token),
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) throw new AppError('Password reset link is invalid or expired', 400);

  record.consumedAt = new Date();
  await record.save();
  return true;
}

module.exports = {
  issuePasswordResetLink,
  verifyPasswordResetToken
};
