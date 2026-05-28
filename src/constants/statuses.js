const VERIFICATION_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];
const NOTIFICATION_TYPES = ['system', 'booking', 'queue', 'approval', 'rejection'];

module.exports = {
  VERIFICATION_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  NOTIFICATION_TYPES
};
