const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  if (!req.user?.isVerified) {
    return next(new AppError('Please verify your email before continuing', 403));
  }
  next();
};
