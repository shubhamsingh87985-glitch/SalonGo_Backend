const express = require('express');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const verifiedMiddleware = require('../middlewares/verifiedMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authMiddleware, roleMiddleware(ROLES.CUSTOMER));

router.get('/profile', customerController.getProfile);
router.put('/update', verifiedMiddleware, upload.single('profileImage'), customerController.updateProfile);
router.post('/favorites/:salonId', verifiedMiddleware, customerController.addFavoriteSalon);
router.delete('/favorites/:salonId', verifiedMiddleware, customerController.removeFavoriteSalon);

module.exports = router;
