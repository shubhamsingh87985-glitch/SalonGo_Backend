const Booking = require('../models/Booking');
const Salon = require('../models/Salon');
const Queue = require('../models/Queue');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { createNotification } = require('../services/notificationService');
const { audit } = require('../services/auditService');

exports.createBooking = asyncHandler(async (req, res) => {
  const { salonId, serviceName, bookingDate, bookingTime, paymentStatus = 'unpaid', notes } = req.body;
  const salon = await Salon.findOne({ _id: salonId, isActive: true, isSuspended: false });
  if (!salon) throw new AppError('Salon not available for booking', 404);

  const queue = await Queue.findOneAndUpdate(
    { salonId },
    { $setOnInsert: { salonId, totalSeats: salon.totalSeats } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const activeEntries = queue.entries.filter((entry) => ['waiting', 'serving'].includes(entry.status));
  const queuePosition = activeEntries.length + 1;
  const estimatedWaitMinutes = Math.max(0, queuePosition - queue.totalSeats) * queue.estimatedWaitPerCustomerMinutes;

  const booking = await Booking.create({
    customerId: req.user._id,
    salonId,
    serviceName,
    bookingDate,
    bookingTime,
    queuePosition,
    estimatedWaitMinutes,
    paymentStatus,
    notes,
    status: 'confirmed'
  });

  queue.entries.push({
    bookingId: booking._id,
    customerId: req.user._id,
    position: queuePosition,
    status: 'waiting',
    checkedInAt: new Date()
  });
  queue.activeCustomersCount = queue.entries.filter((entry) => ['waiting', 'serving'].includes(entry.status)).length;
  await queue.save();

  await createNotification({
    recipientModel: 'User',
    recipientId: req.user._id,
    title: 'Booking confirmed',
    message: `Your ${serviceName} booking is confirmed. Queue position: ${queuePosition}.`,
    type: 'booking',
    data: { bookingId: booking._id, salonId }
  });
  await audit(req, 'booking.created', { model: 'Booking', id: booking._id });

  sendSuccess(res, 201, 'Booking created successfully', { booking, queue });
});

exports.history = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user._id })
    .populate('salonId', 'name phone address')
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Booking history fetched successfully', { bookings });
});

exports.ownerBookings = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon not found', 404);
  const bookings = await Booking.find({ salonId: salon._id })
    .populate('customerId', 'fullName phone email')
    .sort({ bookingDate: -1, bookingTime: -1 });
  sendSuccess(res, 200, 'Salon bookings fetched successfully', { bookings });
});

exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon not found', 404);
  const booking = await Booking.findOne({ _id: req.params.id, salonId: salon._id });
  if (!booking) throw new AppError('Booking not found', 404);

  booking.status = req.body.status;
  await booking.save();
  await audit(req, 'booking.status.updated', { model: 'Booking', id: booking._id }, { status: booking.status });
  sendSuccess(res, 200, 'Booking status updated successfully', { booking });
});
