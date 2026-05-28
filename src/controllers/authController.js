const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SalonOwner = require('../models/SalonOwner');
const Admin = require('../models/Admin');
const { ROLES } = require('../constants/roles');
const { env } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { signAccessToken, signRefreshToken, hashToken } = require('../utils/tokens');
const { normalizeRole } = require('../utils/normalizeRole');
const { issueOtp, verifyOtp } = require('../services/otpService');
const { issuePasswordResetLink, verifyPasswordResetToken } = require('../services/passwordResetService');
const { audit } = require('../services/auditService');

const modelByRole = {
  [ROLES.CUSTOMER]: User,
  [ROLES.SALON_OWNER]: SalonOwner,
  [ROLES.ADMIN]: Admin
};

function authPayload(account) {
  return {
    user: account,
    accessToken: signAccessToken(account),
    refreshToken: signRefreshToken(account)
  };
}

async function persistRefreshToken(account, refreshToken) {
  account.refreshTokenHash = hashToken(refreshToken);
  account.lastLoginAt = new Date();
  await account.save();
}

exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const user = await User.create({ fullName, email, phone, password, role: ROLES.CUSTOMER });
  const otpResult = await issueOtp({
    identifier: email,
    purpose: 'email_verification',
    name: fullName,
    throwOnEmailFailure: false
  });

  await audit(req, 'customer.registered', { model: 'User', id: user._id });
  sendSuccess(
    res,
    201,
    'Registration successful. Please verify your email OTP.',
    { user, otpEmailSent: otpResult.sent }
  );
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const role = normalizeRole(req.body.role);
  const Model = modelByRole[role];
  if (!Model) throw new AppError('Invalid role', 400);

  const emailField = role === ROLES.SALON_OWNER ? 'businessEmail' : 'email';
  const account = await Model.findOne({ [emailField]: email.toLowerCase(), isDeleted: false }).select('+password +refreshTokenHash');
  if (!account || !(await account.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (account.isSuspended) throw new AppError('Account is suspended', 403);
  if (role === ROLES.SALON_OWNER && !account.isApproved) {
    throw new AppError('Salon owner account is pending admin approval', 403);
  }

  const payload = authPayload(account);
  await persistRefreshToken(account, payload.refreshToken);
  await audit(req, 'auth.login', { model: Model.modelName, id: account._id });

  sendSuccess(res, 200, 'Login successful', payload);
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token is required', 400);

  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  const Model = modelByRole[decoded.role];
  if (!Model) throw new AppError('Invalid refresh token', 401);

  const account = await Model.findById(decoded.id).select('+refreshTokenHash');
  if (!account || account.isDeleted || account.isSuspended) throw new AppError('Invalid refresh token', 401);
  if (account.refreshTokenHash !== hashToken(refreshToken)) throw new AppError('Invalid refresh token', 401);
  if ((account.tokenVersion || 0) !== decoded.tokenVersion) throw new AppError('Invalid refresh token', 401);

  const payload = authPayload(account);
  await persistRefreshToken(account, payload.refreshToken);
  sendSuccess(res, 200, 'Token refreshed', payload);
});

exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshTokenHash = undefined;
  req.user.tokenVersion += 1;
  await req.user.save();
  await audit(req, 'auth.logout', { model: req.userModel, id: req.user._id });
  sendSuccess(res, 200, 'Logout successful');
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const role = normalizeRole(req.body.role);
  await verifyOtp({ identifier: email, purpose: 'email_verification', otp });

  const Model = modelByRole[role];
  const emailField = role === ROLES.SALON_OWNER ? 'businessEmail' : 'email';
  const account = await Model.findOneAndUpdate(
    { [emailField]: email.toLowerCase() },
    { isVerified: true },
    { new: true }
  );
  if (!account) throw new AppError('Account not found', 404);

  sendSuccess(res, 200, 'Email verified successfully', { user: account });
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = 'email_verification' } = req.body;
  const role = normalizeRole(req.body.role);
  const Model = modelByRole[role];
  const emailField = role === ROLES.SALON_OWNER ? 'businessEmail' : 'email';
  const nameField = role === ROLES.SALON_OWNER ? 'ownerName' : 'fullName';
  const account = await Model.findOne({ [emailField]: email.toLowerCase() });
  if (!account) throw new AppError('Account not found', 404);

  if (purpose === 'forgot_password') {
    await issuePasswordResetLink({ identifier: email, role, name: account[nameField] });
    return sendSuccess(res, 200, 'Password reset link sent successfully');
  }

  await issueOtp({ identifier: email, purpose, name: account[nameField] });
  sendSuccess(res, 200, 'OTP sent successfully');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const role = normalizeRole(req.body.role);
  const Model = modelByRole[role];
  const emailField = role === ROLES.SALON_OWNER ? 'businessEmail' : 'email';
  const nameField = role === ROLES.SALON_OWNER ? 'ownerName' : 'fullName';
  const account = await Model.findOne({ [emailField]: email.toLowerCase(), isDeleted: false });
  if (!account) throw new AppError('Account not found', 404);

  await issuePasswordResetLink({ identifier: email, role, name: account[nameField] });
  sendSuccess(res, 200, 'Password reset link sent successfully');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;
  const role = normalizeRole(req.body.role);
  await verifyPasswordResetToken({ identifier: email, role, token });

  const Model = modelByRole[role];
  const emailField = role === ROLES.SALON_OWNER ? 'businessEmail' : 'email';
  const account = await Model.findOne({ [emailField]: email.toLowerCase(), isDeleted: false });
  if (!account) throw new AppError('Account not found', 404);

  account.password = password;
  account.refreshTokenHash = undefined;
  account.tokenVersion += 1;
  await account.save();

  sendSuccess(res, 200, 'Password reset successful');
});
