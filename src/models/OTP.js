const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  purpose: {
    type: String,
    enum: ['email_verification', 'forgot_password'],
    required: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  consumedAt: Date
}, {
  timestamps: true
});

otpSchema.statics.createOtp = async function createOtp(identifier, purpose, otp) {
  await this.deleteMany({ identifier: identifier.toLowerCase(), purpose });
  return this.create({
    identifier: identifier.toLowerCase(),
    purpose,
    otpHash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });
};

otpSchema.methods.verify = function verify(otp) {
  return bcrypt.compare(otp, this.otpHash);
};

module.exports = mongoose.model('OTP', otpSchema);
