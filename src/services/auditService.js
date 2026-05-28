const AuditLog = require('../models/AuditLog');

async function audit(req, action, target = {}, metadata = {}) {
  await AuditLog.create({
    actorModel: req.userModel || 'System',
    actorId: req.user?._id,
    action,
    targetModel: target.model,
    targetId: target.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata
  });
}

module.exports = { audit };
