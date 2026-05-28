const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  if (!req.user?.isApproved) {
    return next(new AppError('Salon owner account is pending admin approval', 403));
  }
  next();
};
