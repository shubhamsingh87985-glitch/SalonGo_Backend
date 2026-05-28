const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.post('/bootstrap', adminController.bootstrapAdmin);

router.use(authMiddleware, adminMiddleware);

router.get('/pending-salons', adminController.pendingSalons);
router.put('/approve/:id', adminController.approveSalon);
router.put('/reject/:id', adminController.rejectSalon);
router.put('/suspend/:id', adminController.suspendSalon);
router.get('/users', adminController.listUsers);
router.get('/bookings', adminController.listBookings);
router.get('/reports', adminController.reports);

module.exports = router;
