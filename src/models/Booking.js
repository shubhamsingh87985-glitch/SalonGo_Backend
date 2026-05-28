const mongoose = require('mongoose');
const { BOOKING_STATUSES, PAYMENT_STATUSES } = require('../constants/statuses');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String,
    required: true
  },
  queuePosition: {
    type: Number,
    min: 1
  },
  estimatedWaitMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: BOOKING_STATUSES,
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'unpaid'
  },
  notes: String
}, {
  timestamps: true
});

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ salonId: 1, bookingDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
