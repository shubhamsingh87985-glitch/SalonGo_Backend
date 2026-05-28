const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true
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

passwordResetTokenSchema.statics.createResetToken = async function createResetToken(identifier, role, tokenHash, expiresAt) {
  await this.deleteMany({ identifier: identifier.toLowerCase(), role });
  return this.create({
    identifier: identifier.toLowerCase(),
    role,
    tokenHash,
    expiresAt
  });
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
