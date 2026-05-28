const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  checkedInAt: Date,
  servedAt: Date,
  completedAt: Date
}, { _id: false });

const queueSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    unique: true
  },
  totalSeats: {
    type: Number,
    min: 1,
    default: 1
  },
  occupiedSeats: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedWaitPerCustomerMinutes: {
    type: Number,
    default: 20
  },
  activeCustomersCount: {
    type: Number,
    default: 0
  },
  entries: [queueEntrySchema],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalonOwner'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Queue', queueSchema);
