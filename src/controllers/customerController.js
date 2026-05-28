const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { parseCloudinaryFile, deleteCloudinaryAsset } = require('../services/uploadService');
const { audit } = require('../services/auditService');

exports.getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched successfully', { user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'phone'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  if (req.file) {
    if (req.user.profileImage?.publicId) {
      await deleteCloudinaryAsset(req.user.profileImage.publicId);
    }
    req.user.profileImage = parseCloudinaryFile(req.file);
  }

  await req.user.save();
  await audit(req, 'customer.profile.updated', { model: 'User', id: req.user._id });
  sendSuccess(res, 200, 'Profile updated successfully', { user: req.user });
});

exports.addFavoriteSalon = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { favoriteSalons: req.params.salonId } });
  sendSuccess(res, 200, 'Salon added to favorites');
});

exports.removeFavoriteSalon = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { favoriteSalons: req.params.salonId } });
  sendSuccess(res, 200, 'Salon removed from favorites');
});
