const AppError = require('../utils/AppError');

module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource', 403));
  }
  next();
};
