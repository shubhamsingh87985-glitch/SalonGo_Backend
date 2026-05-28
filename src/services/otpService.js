const OTP = require('../models/OTP');
const { generateOtp } = require('../utils/tokens');
const { otpEmail } = require('../templates/emailTemplates');
const { sendEmail } = require('./emailService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

async function issueOtp({ identifier, purpose, name, throwOnEmailFailure = true }) {
  const otp = generateOtp();
  await OTP.createOtp(identifier, purpose, otp);
  const template = otpEmail({ name, otp, purpose });

  try {
    await sendEmail({ to: identifier, ...template });
    return { sent: true };
  } catch (error) {
    logger.error(`OTP email failed for ${identifier}: ${error.message}`);
    if (throwOnEmailFailure) {
      throw new AppError('OTP email could not be sent. Please check email configuration and try again.', 502);
    }
    return {
      sent: false,
      message: 'Account created, but OTP email could not be sent. Please use resend OTP after email is configured.'
    };
  }
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
