const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SalonOwner = require('../models/SalonOwner');
const Admin = require('../models/Admin');
const { env } = require('../config/env');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const modelByRole = {
  [ROLES.CUSTOMER]: User,
  [ROLES.SALON_OWNER]: SalonOwner,
  [ROLES.ADMIN]: Admin
};

function extractToken(req) {
  const authHeader = req.headers.authorization;
  const headerToken = req.headers['x-access-token'] || req.headers['x-auth-token'];

  if (authHeader) {
    const [scheme, value] = authHeader.split(' ');
    if (/^bearer$/i.test(scheme) && value) return value;
    return authHeader;
  }

  return headerToken || req.cookies?.accessToken;
}

module.exports = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) throw new AppError('Authentication required', 401);

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const Model = modelByRole[decoded.role];
  if (!Model) throw new AppError('Invalid token role', 401);

  const user = await Model.findById(decoded.id);
  if (!user || user.isDeleted) throw new AppError('Account not found', 401);
  if (user.isSuspended) throw new AppError('Account is suspended', 403);
  if ((user.tokenVersion || 0) !== decoded.tokenVersion) throw new AppError('Token is no longer valid', 401);

  req.user = user;
  req.userModel = Model.modelName;
  next();
});
