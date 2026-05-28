const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

exports.listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipientModel: req.userModel,
    recipientId: req.user._id
  }).sort({ createdAt: -1 }).limit(100);
  sendSuccess(res, 200, 'Notifications fetched successfully', { notifications });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientModel: req.userModel, recipientId: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  sendSuccess(res, 200, 'Notification marked as read', { notification });
});
