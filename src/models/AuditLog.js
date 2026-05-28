const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorModel: {
    type: String,
    enum: ['User', 'SalonOwner', 'Admin', 'System'],
    default: 'System'
  },
  actorId: mongoose.Schema.Types.ObjectId,
  action: {
    type: String,
    required: true,
    index: true
  },
  targetModel: String,
  targetId: mongoose.Schema.Types.ObjectId,
  ip: String,
  userAgent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
