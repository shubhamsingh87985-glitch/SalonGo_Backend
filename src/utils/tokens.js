const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  generateOtp
};
