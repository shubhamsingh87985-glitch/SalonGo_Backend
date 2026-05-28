const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { ROLES } = require('../constants/roles');

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    default: 'ASRVTech Admin',
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: [ROLES.ADMIN],
    default: ROLES.ADMIN
  },
  permissions: [{
    type: String,
    trim: true
  }],
  refreshTokenHash: {
    type: String,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastLoginAt: Date
}, {
  timestamps: true
});

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.toJSON = function toJSON() {
  const admin = this.toObject();
  delete admin.password;
  delete admin.refreshTokenHash;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);
