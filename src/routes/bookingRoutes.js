const express = require('express');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const verifiedMiddleware = require('../middlewares/verifiedMiddleware');
const validate = require('../middlewares/validateMiddleware');
const validators = require('../validators/bookingValidators');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware, roleMiddleware(ROLES.CUSTOMER), verifiedMiddleware);

router.post('/create', validators.createBooking, validate, bookingController.createBooking);
router.get('/history', bookingController.history);

module.exports = router;
