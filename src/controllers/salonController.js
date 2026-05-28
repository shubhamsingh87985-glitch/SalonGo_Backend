const slugify = require('slugify');
const SalonOwner = require('../models/SalonOwner');
const Salon = require('../models/Salon');
const Queue = require('../models/Queue');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { issueOtp } = require('../services/otpService');
const { parseCloudinaryFile } = require('../services/uploadService');
const { audit } = require('../services/auditService');

function applyUploadedDocuments(owner, files = {}) {
  let hasDocuments = false;

  if (files.salonImages) {
    owner.salonImages = files.salonImages.map(parseCloudinaryFile);
    hasDocuments = true;
  }
  if (files.businessLicense?.[0]) {
    owner.businessLicense = parseCloudinaryFile(files.businessLicense[0]);
    hasDocuments = true;
  }
  if (files.ownerIdProof?.[0]) {
    owner.ownerIdProof = parseCloudinaryFile(files.ownerIdProof[0]);
    hasDocuments = true;
  }

  return hasDocuments;
}

exports.registerSalonOwner = asyncHandler(async (req, res) => {
  const {
    ownerName,
    salonName,
    businessEmail,
    businessPhone,
    password,
    salonAddress,
    salonDescription,
    totalSeats,
    yearsInBusiness
  } = req.body;

  const owner = new SalonOwner({
    ownerName,
    salonName,
    businessEmail,
    businessPhone,
    password,
    salonAddress,
    salonDescription,
    totalSeats,
    yearsInBusiness,
    verificationStatus: 'pending'
  });

  if (applyUploadedDocuments(owner, req.files)) {
    owner.verificationStatus = 'under_review';
  }

  await owner.save();

  const otpResult = await issueOtp({
    identifier: businessEmail,
    purpose: 'email_verification',
    name: ownerName,
    throwOnEmailFailure: false
  });
  await audit(req, 'salon_owner.registered', { model: 'SalonOwner', id: owner._id });

  sendSuccess(
    res,
    201,
    'Salon owner registration submitted. Verify email and wait for admin approval.',
    { owner, otpEmailSent: otpResult.sent }
  );
});

exports.uploadDocuments = asyncHandler(async (req, res) => {
  const owner = req.user;
  applyUploadedDocuments(owner, req.files);

  owner.verificationStatus = 'under_review';
  await owner.save();
  await audit(req, 'salon.documents.uploaded', { model: 'SalonOwner', id: owner._id });

  sendSuccess(res, 200, 'Documents uploaded successfully', { owner });
});

exports.getStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Salon verification status fetched successfully', {
    verificationStatus: req.user.verificationStatus,
    isApproved: req.user.isApproved,
    isVerified: req.user.isVerified,
    reviewNote: req.user.reviewNote
  });
});

exports.getMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon profile not found', 404);
  sendSuccess(res, 200, 'Salon fetched successfully', { salon });
});

exports.updateMySalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon profile not found', 404);

  ['name', 'description', 'phone', 'email', 'address', 'totalSeats', 'services'].forEach((field) => {
    if (req.body[field] !== undefined) salon[field] = req.body[field];
  });

  if (req.body.name) {
    salon.slug = `${slugify(req.body.name, { lower: true, strict: true })}-${salon._id.toString().slice(-6)}`;
  }

  await salon.save();
  await Queue.findOneAndUpdate({ salonId: salon._id }, { totalSeats: salon.totalSeats }, { new: true });
  await audit(req, 'salon.profile.updated', { model: 'Salon', id: salon._id });
  sendSuccess(res, 200, 'Salon updated successfully', { salon });
});

exports.listPublicSalons = asyncHandler(async (req, res) => {
  const { q, city } = req.query;
  const filter = { isActive: true, isSuspended: false };
  if (q) filter.$text = { $search: q };
  if (city) filter['address.city'] = new RegExp(`^${city}$`, 'i');

  const salons = await Salon.find(filter).sort({ ratingAverage: -1, createdAt: -1 }).limit(50);
  sendSuccess(res, 200, 'Salons fetched successfully', { salons });
});

exports.getPublicSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ slug: req.params.slug, isActive: true, isSuspended: false });
  if (!salon) throw new AppError('Salon not found', 404);
  const queue = await Queue.findOne({ salonId: salon._id });
  sendSuccess(res, 200, 'Salon fetched successfully', { salon, queue });
});
