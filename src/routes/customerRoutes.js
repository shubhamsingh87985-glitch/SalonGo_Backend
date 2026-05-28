const express = require('express');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const verifiedMiddleware = require('../middlewares/verifiedMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();
const profileImageFields = [
  { name: 'profileImage', maxCount: 1 },
  { name: 'profilePic', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
];

router.use(authMiddleware, roleMiddleware(ROLES.CUSTOMER));

router.get('/profile', customerController.getProfile);
router.put('/update', verifiedMiddleware, upload.fields(profileImageFields), customerController.updateProfile);
router.post('/favorites/:salonId', verifiedMiddleware, customerController.addFavoriteSalon);
router.delete('/favorites/:salonId', verifiedMiddleware, customerController.removeFavoriteSalon);

module.exports = router;
