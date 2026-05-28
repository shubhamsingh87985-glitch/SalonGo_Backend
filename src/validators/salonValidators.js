const { body } = require('express-validator');

exports.registerSalon = [
  body('ownerName').isString().trim().isLength({ min: 2, max: 100 }),
  body('salonName').isString().trim().isLength({ min: 2, max: 140 }),
  body('businessEmail').isEmail().normalizeEmail(),
  body('businessPhone').isString().isLength({ min: 7, max: 20 }),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }),
  body('totalSeats').optional().isInt({ min: 1 }),
  body('yearsInBusiness').optional().isInt({ min: 0 })
];

exports.updateSalon = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 140 }),
  body('totalSeats').optional().isInt({ min: 1 }),
  body('services').optional().isArray()
];
