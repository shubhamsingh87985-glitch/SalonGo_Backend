const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    required: [true, 'Full name is required'],
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  profileImage: {
    url: String,
    publicId: String
  },
  favoriteSalons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  }],
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.CUSTOMER
  },
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
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  lastLoginAt: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokenHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);
