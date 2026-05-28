const Notification = require('../models/Notification');

function createNotification(payload) {
  return Notification.create(payload);
}

module.exports = {
  createNotification
};
