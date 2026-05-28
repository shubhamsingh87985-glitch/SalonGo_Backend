const express = require('express');
const salonController = require('../controllers/salonController');
const bookingController = require('../controllers/bookingController');
const queueController = require('../controllers/queueController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const verifiedMiddleware = require('../middlewares/verifiedMiddleware');
const salonApprovedMiddleware = require('../middlewares/salonApprovedMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const validate = require('../middlewares/validateMiddleware');
const validators = require('../validators/salonValidators');
const bookingValidators = require('../validators/bookingValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/public', salonController.listPublicSalons);
router.get('/public/:slug', salonController.getPublicSalon);
router.post('/register', validators.registerSalon, validate, salonController.registerSalonOwner);

router.use(authMiddleware, roleMiddleware(ROLES.SALON_OWNER));

router.post(
  '/upload-documents',
  verifiedMiddleware,
  upload.fields([
    { name: 'salonImages', maxCount: 8 },
    { name: 'businessLicense', maxCount: 1 },
    { name: 'ownerIdProof', maxCount: 1 }
  ]),
  salonController.uploadDocuments
);
router.get('/status', salonController.getStatus);
router.get('/me', verifiedMiddleware, salonApprovedMiddleware, salonController.getMySalon);
router.put('/me', verifiedMiddleware, salonApprovedMiddleware, validators.updateSalon, validate, salonController.updateMySalon);
router.get('/bookings', verifiedMiddleware, salonApprovedMiddleware, bookingController.ownerBookings);
router.put('/bookings/:id/status', verifiedMiddleware, salonApprovedMiddleware, bookingValidators.updateStatus, validate, bookingController.updateBookingStatus);
router.get('/queue', verifiedMiddleware, salonApprovedMiddleware, queueController.myQueue);
router.put('/queue/seats', verifiedMiddleware, salonApprovedMiddleware, queueController.updateSeats);
router.put('/queue/entries/:bookingId', verifiedMiddleware, salonApprovedMiddleware, queueController.updateEntryStatus);

module.exports = router;
