const OTP = require('../models/OTP');
const { generateOtp } = require('../utils/tokens');
const { otpEmail } = require('../templates/emailTemplates');
const { sendEmail } = require('./emailService');
const AppError = require('../utils/AppError');

async function issueOtp({ identifier, purpose, name }) {
  const otp = generateOtp();
  await OTP.createOtp(identifier, purpose, otp);
  const template = otpEmail({ name, otp, purpose });
  await sendEmail({ to: identifier, ...template });
}

async function verifyOtp({ identifier, purpose, otp }) {
  const record = await OTP.findOne({
    identifier: identifier.toLowerCase(),
    purpose,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) throw new AppError('OTP is invalid or expired', 400);

  if (record.attempts >= 5) {
    throw new AppError('Too many OTP attempts. Please request a new OTP.', 400);
  }

  const isValid = await record.verify(otp);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    throw new AppError('OTP is invalid or expired', 400);
  }

  record.consumedAt = new Date();
  await record.save();
  return true;
}

module.exports = {
  issueOtp,
  verifyOtp
};
