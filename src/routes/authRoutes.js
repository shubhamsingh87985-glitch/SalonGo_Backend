const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const validators = require('../validators/authValidators');

const router = express.Router();

router.post('/register', validators.register, validate, authController.register);
router.post('/login', validators.login, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.post('/verify-otp', validators.otp, validate, authController.verifyOtp);
router.post('/resend-otp', validators.email, validate, authController.resendOtp);
router.post('/forgot-password', validators.email, validate, authController.forgotPassword);
router.post('/reset-password', validators.resetPassword, validate, authController.resetPassword);

module.exports = router;
