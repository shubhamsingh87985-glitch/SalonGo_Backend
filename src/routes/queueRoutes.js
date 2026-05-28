const express = require('express');
const queueController = require('../controllers/queueController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:salonId', authMiddleware, queueController.getQueue);

module.exports = router;
