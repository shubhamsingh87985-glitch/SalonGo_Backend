const { body } = require('express-validator');
const { ROLES } = require('../constants/roles');

exports.register = [
  body('fullName').isString().trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().isString().isLength({ min: 7, max: 20 }),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
];

exports.login = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('role').optional().isIn(Object.values(ROLES))
];

exports.otp = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isString().matches(/^[0-9]{6}$/),
  body('role').optional().isIn(Object.values(ROLES))
];

exports.email = [
  body('email').isEmail().normalizeEmail(),
  body('purpose').optional().isIn(['email_verification', 'forgot_password']),
  body('role').optional().isIn(Object.values(ROLES))
];

exports.resetPassword = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isString().matches(/^[0-9]{6}$/),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }),
  body('role').optional().isIn(Object.values(ROLES))
];
