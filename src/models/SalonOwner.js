const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { ROLES } = require('../constants/roles');
const { VERIFICATION_STATUSES } = require('../constants/statuses');

const fileSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  resourceType: {
    type: String,
    default: 'image'
  }
}, { _id: false });

const salonOwnerSchema = new mongoose.Schema({
  ownerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  salonName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 140
  },
  businessEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid business email']
  },
  businessPhone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  salonAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'India'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  salonDescription: {
    type: String,
    maxlength: 1000
  },
  totalSeats: {
    type: Number,
    min: 1,
    default: 1
  },
  yearsInBusiness: {
    type: Number,
    min: 0,
    default: 0
  },
  salonImages: [fileSchema],
  businessLicense: fileSchema,
  ownerIdProof: fileSchema,
  verificationStatus: {
    type: String,
    enum: VERIFICATION_STATUSES,
    default: 'pending'
  },
  reviewNote: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: Date,
  isApproved: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: [ROLES.SALON_OWNER],
    default: ROLES.SALON_OWNER
  },
  refreshTokenHash: {
    type: String,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
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

salonOwnerSchema.index({ 'salonAddress.location': '2dsphere' });

salonOwnerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

salonOwnerSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

salonOwnerSchema.methods.toJSON = function toJSON() {
  const owner = this.toObject();
  delete owner.password;
  delete owner.refreshTokenHash;
  return owner;
};

module.exports = mongoose.model('SalonOwner', salonOwnerSchema);
