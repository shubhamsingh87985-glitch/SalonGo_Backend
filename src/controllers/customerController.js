const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { parseCloudinaryFile, deleteCloudinaryAsset } = require('../services/uploadService');
const { audit } = require('../services/auditService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const profileImageFieldOrder = ['profileImage', 'profilePic', 'avatar'];

function getUploadedProfileImage(req) {
  if (req.file) return req.file;

  for (const field of profileImageFieldOrder) {
    if (req.files?.[field]?.[0]) return req.files[field][0];
  }

  return undefined;
}

async function deleteUploadedImage(file) {
  if (!file?.filename) return;
  await deleteCloudinaryAsset(file.filename, file.resource_type || file.resourceType || 'image');
}

async function deletePreviousProfileImage(profileImage) {
  if (!profileImage?.publicId) return;
  await deleteCloudinaryAsset(profileImage.publicId, profileImage.resourceType || 'image');
}

exports.getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched successfully', { user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  if (req.body.phoneNumber !== undefined && req.body.phone === undefined) {
    req.body.phone = req.body.phoneNumber;
  }

  if (req.body.phone !== undefined) {
    const phone = String(req.body.phone).trim();
    if (phone && (phone.length < 7 || phone.length > 20)) {
      throw new AppError('Phone number must be between 7 and 20 characters', 400);
    }
    req.body.phone = phone || undefined;
  }

  const uploadedProfileImage = getUploadedProfileImage(req);
  const previousProfileImage = req.user.profileImage?.publicId
    ? req.user.profileImage.toObject?.() || req.user.profileImage
    : null;

  const allowed = ['fullName', 'phone'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  if (uploadedProfileImage) {
    req.user.profileImage = parseCloudinaryFile(uploadedProfileImage);
  }

  try {
    await req.user.save();
  } catch (error) {
    if (uploadedProfileImage) {
      try {
        await deleteUploadedImage(uploadedProfileImage);
      } catch (cleanupError) {
        logger.warn(`Profile image cleanup failed after profile save error: ${cleanupError.message}`);
      }
    }
    throw error;
  }

  if (uploadedProfileImage && previousProfileImage) {
    try {
      await deletePreviousProfileImage(previousProfileImage);
    } catch (cleanupError) {
      logger.warn(`Previous profile image cleanup failed for user ${req.user._id}: ${cleanupError.message}`);
    }
  }

  try {
    await audit(req, 'customer.profile.updated', { model: 'User', id: req.user._id });
  } catch (auditError) {
    logger.warn(`Profile update audit failed for user ${req.user._id}: ${auditError.message}`);
  }

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
