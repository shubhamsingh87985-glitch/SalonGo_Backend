const { body } = require('express-validator');

exports.createBooking = [
  body('salonId').isMongoId(),
  body('serviceName').isString().trim().isLength({ min: 2, max: 100 }),
  body('bookingDate').isISO8601().toDate(),
  body('bookingTime').isString().trim().isLength({ min: 3, max: 20 }),
  body('paymentStatus').optional().isIn(['unpaid', 'pending', 'paid', 'failed', 'refunded'])
];

exports.updateStatus = [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled'])
];
