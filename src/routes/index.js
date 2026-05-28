const express = require('express');
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const salonRoutes = require('./salonRoutes');
const adminRoutes = require('./adminRoutes');
const bookingRoutes = require('./bookingRoutes');
const queueRoutes = require('./queueRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/salon', salonRoutes);
router.use('/admin', adminRoutes);
router.use('/booking', bookingRoutes);
router.use('/queue', queueRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
