const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalonOwner',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
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
  phone: String,
  email: String,
  totalSeats: {
    type: Number,
    min: 1,
    default: 1
  },
  services: [{
    name: String,
    durationMinutes: Number,
    price: Number
  }],
  images: [{
    url: String,
    publicId: String
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  ratingAverage: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

salonSchema.index({ 'address.location': '2dsphere' });
salonSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });

module.exports = mongoose.model('Salon', salonSchema);
