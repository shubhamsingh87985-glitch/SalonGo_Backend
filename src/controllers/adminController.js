const slugify = require('slugify');
const User = require('../models/User');
const SalonOwner = require('../models/SalonOwner');
const Salon = require('../models/Salon');
const Booking = require('../models/Booking');
const Queue = require('../models/Queue');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { simpleEmail } = require('../templates/emailTemplates');
const { sendEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');
const { env } = require('../config/env');

exports.bootstrapAdmin = asyncHandler(async (req, res) => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new AppError('Admin bootstrap env vars are missing', 400);
  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (existing) return sendSuccess(res, 200, 'Admin already exists');

  const admin = await Admin.create({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    permissions: ['*']
  });
  sendSuccess(res, 201, 'Admin created successfully', { admin });
});

exports.pendingSalons = asyncHandler(async (req, res) => {
  const owners = await SalonOwner.find({ verificationStatus: { $in: ['pending', 'under_review'] }, isDeleted: false })
    .sort({ createdAt: 1 });
  sendSuccess(res, 200, 'Pending salon requests fetched successfully', { owners });
});

exports.approveSalon = asyncHandler(async (req, res) => {
  const owner = await SalonOwner.findById(req.params.id);
  if (!owner) throw new AppError('Salon owner not found', 404);

  owner.verificationStatus = 'approved';
  owner.isApproved = true;
  owner.reviewedBy = req.user._id;
  owner.reviewedAt = new Date();
  owner.reviewNote = req.body.note || 'Approved by ASRVTech admin';
  await owner.save();

  const salon = await Salon.findOneAndUpdate(
    { ownerId: owner._id },
    {
      ownerId: owner._id,
      name: owner.salonName,
      slug: `${slugify(owner.salonName, { lower: true, strict: true })}-${owner._id.toString().slice(-6)}`,
      description: owner.salonDescription,
      address: owner.salonAddress,
      phone: owner.businessPhone,
      email: owner.businessEmail,
      totalSeats: owner.totalSeats,
      images: owner.salonImages,
      isActive: true,
      isSuspended: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Queue.findOneAndUpdate(
    { salonId: salon._id },
    { salonId: salon._id, totalSeats: salon.totalSeats },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await createNotification({
    recipientModel: 'SalonOwner',
    recipientId: owner._id,
    title: 'Salon approved',
    message: 'Your SalonGo salon account has been approved.',
    type: 'approval'
  });
  await sendEmail({
    to: owner.businessEmail,
    ...simpleEmail({
      subject: 'Your SalonGo salon has been approved',
      heading: 'Welcome to SalonGo',
      message: 'Your salon verification has been approved by ASRVTech. You can now manage bookings and live queues.'
    })
  });
  await audit(req, 'admin.salon.approved', { model: 'SalonOwner', id: owner._id });

  sendSuccess(res, 200, 'Salon approved successfully', { owner, salon });
});

exports.rejectSalon = asyncHandler(async (req, res) => {
  const owner = await SalonOwner.findById(req.params.id);
  if (!owner) throw new AppError('Salon owner not found', 404);

  owner.verificationStatus = 'rejected';
  owner.isApproved = false;
  owner.reviewedBy = req.user._id;
  owner.reviewedAt = new Date();
  owner.reviewNote = req.body.reason || 'Rejected by ASRVTech admin';
  await owner.save();

  await createNotification({
    recipientModel: 'SalonOwner',
    recipientId: owner._id,
    title: 'Salon rejected',
    message: owner.reviewNote,
    type: 'rejection'
  });
  await sendEmail({
    to: owner.businessEmail,
    ...simpleEmail({
      subject: 'SalonGo salon verification update',
      heading: 'Verification not approved',
      message: owner.reviewNote
    })
  });
  await audit(req, 'admin.salon.rejected', { model: 'SalonOwner', id: owner._id });

  sendSuccess(res, 200, 'Salon rejected successfully', { owner });
});

exports.suspendSalon = asyncHandler(async (req, res) => {
  const owner = await SalonOwner.findById(req.params.id);
  if (!owner) throw new AppError('Salon owner not found', 404);
  owner.isSuspended = true;
  await owner.save();
  await Salon.findOneAndUpdate({ ownerId: owner._id }, { isSuspended: true, isActive: false });
  await audit(req, 'admin.salon.suspended', { model: 'SalonOwner', id: owner._id });
  sendSuccess(res, 200, 'Salon suspended successfully', { owner });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const customers = await User.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(100);
  const salonOwners = await SalonOwner.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(100);
  sendSuccess(res, 200, 'Users fetched successfully', { customers, salonOwners });
});

exports.listBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('customerId', 'fullName email phone')
    .populate('salonId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(200);
  sendSuccess(res, 200, 'Bookings fetched successfully', { bookings });
});

exports.reports = asyncHandler(async (req, res) => {
  const [customers, salonOwners, bookings, activeSalons] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    SalonOwner.countDocuments({ isDeleted: false }),
    Booking.countDocuments(),
    Salon.countDocuments({ isActive: true })
  ]);

  sendSuccess(res, 200, 'Reports fetched successfully', {
    customers,
    salonOwners,
    bookings,
    activeSalons
  });
});
