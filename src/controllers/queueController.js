const Salon = require('../models/Salon');
const Queue = require('../models/Queue');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { audit } = require('../services/auditService');

function recalculateQueue(queue) {
  let position = 1;
  queue.entries
    .filter((entry) => ['waiting', 'serving'].includes(entry.status))
    .sort((a, b) => a.position - b.position)
    .forEach((entry) => {
      entry.position = position;
      position += 1;
    });

  queue.activeCustomersCount = queue.entries.filter((entry) => ['waiting', 'serving'].includes(entry.status)).length;
}

exports.getQueue = asyncHandler(async (req, res) => {
  const queue = await Queue.findOne({ salonId: req.params.salonId })
    .populate('entries.customerId', 'fullName phone')
    .populate('entries.bookingId', 'serviceName bookingTime status');
  if (!queue) throw new AppError('Queue not found', 404);

  const estimatedWaitingTime = Math.max(0, queue.activeCustomersCount - queue.totalSeats) * queue.estimatedWaitPerCustomerMinutes;
  sendSuccess(res, 200, 'Queue fetched successfully', { queue, estimatedWaitingTime });
});

exports.myQueue = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon not found', 404);
  const queue = await Queue.findOne({ salonId: salon._id });
  sendSuccess(res, 200, 'Queue fetched successfully', { queue });
});

exports.updateSeats = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon not found', 404);
  const { occupiedSeats, estimatedWaitPerCustomerMinutes } = req.body;

  const queue = await Queue.findOneAndUpdate(
    { salonId: salon._id },
    {
      occupiedSeats,
      estimatedWaitPerCustomerMinutes,
      lastUpdatedBy: req.user._id
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await audit(req, 'queue.seats.updated', { model: 'Queue', id: queue._id });
  sendSuccess(res, 200, 'Queue seats updated successfully', { queue });
});

exports.updateEntryStatus = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ ownerId: req.user._id });
  if (!salon) throw new AppError('Salon not found', 404);
  const queue = await Queue.findOne({ salonId: salon._id });
  if (!queue) throw new AppError('Queue not found', 404);

  const entry = queue.entries.find((item) => item.bookingId.toString() === req.params.bookingId);
  if (!entry) throw new AppError('Queue entry not found', 404);

  entry.status = req.body.status;
  if (req.body.status === 'serving') entry.servedAt = new Date();
  if (req.body.status === 'completed') entry.completedAt = new Date();
  recalculateQueue(queue);
  await queue.save();

  await Booking.findByIdAndUpdate(req.params.bookingId, {
    status: req.body.status === 'completed' ? 'completed' : 'confirmed',
    queuePosition: entry.position
  });

  await audit(req, 'queue.entry.updated', { model: 'Queue', id: queue._id }, { bookingId: req.params.bookingId });
  sendSuccess(res, 200, 'Queue entry updated successfully', { queue });
});
