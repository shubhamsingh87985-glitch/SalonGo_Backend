const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/statuses');

const notificationSchema = new mongoose.Schema({
  recipientModel: {
    type: String,
    enum: ['User', 'SalonOwner', 'Admin'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    default: 'system'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readAt: Date
}, {
  timestamps: true
});

notificationSchema.index({ recipientModel: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
