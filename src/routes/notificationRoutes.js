const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/', notificationController.listNotifications);
router.put('/:id/read', notificationController.markRead);

module.exports = router;
