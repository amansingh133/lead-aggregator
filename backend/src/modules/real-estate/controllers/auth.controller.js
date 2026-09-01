import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import {
  buildOtpPayload,
  verifyOtp,
  clearOtp,
  assertResendAllowed,
} from '../services/otp.service.js';
import { sendOtpEmail } from '../services/email.service.js';
import { issueAccessToken } from '../services/token.service.js';
import { OTP_PURPOSE } from '../../../utils/constants.js';

// Public self-registration has been removed. New privileged users are
// created by an Admin / Super Admin via /admin/employees; the very first
// (primary) Super Admin is created once via the self-disabling bootstrap
// route (see controllers/bootstrap.controller.js).

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
  }).select('+passwordHash');

  if (!user) throw ApiError.unauthorized('Invalid username or password.', 'INVALID_CREDENTIALS');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid username or password.', 'INVALID_CREDENTIALS');

  if (!user.isVerified) {
    throw ApiError.forbidden('Account not verified. Contact your administrator.', 'ACCOUNT_NOT_VERIFIED');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your admin.', 'ACCOUNT_DEACTIVATED');
  }

  const token = issueAccessToken(user);

  return sendSuccess(res, 200, 'Login successful.', {
    token,
    user: user.toSafeObject(),
  });
});

// ─────────────────────────────────────────────────────────────
// Public "forgot my password" reset flow (email + OTP, no session)
// ─────────────────────────────────────────────────────────────

// POST /auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email.', 'USER_NOT_FOUND');

  user.otp = buildOtpPayload(OTP_PURPOSE.FORGOT_PASSWORD);
  await user.save();

  await sendOtpEmail({ to: user.email, name: user.name, otp: user.otp.code, purpose: OTP_PURPOSE.FORGOT_PASSWORD });

  return sendSuccess(res, 200, 'An OTP to reset your password has been sent to your email.');
});

// POST /auth/verify-otp
// Checks a reset OTP is valid WITHOUT consuming it, so the UI can gate the
// "enter new password" step. No token is issued here.
export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email.', 'USER_NOT_FOUND');

  verifyOtp(user, otp, OTP_PURPOSE.FORGOT_PASSWORD);

  return sendSuccess(res, 200, 'OTP verified.', { ok: true });
});

// POST /auth/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email.', 'USER_NOT_FOUND');

  assertResendAllowed(user);

  user.otp = buildOtpPayload(OTP_PURPOSE.FORGOT_PASSWORD);
  await user.save();

  await sendOtpEmail({ to: user.email, name: user.name, otp: user.otp.code, purpose: OTP_PURPOSE.FORGOT_PASSWORD });

  return sendSuccess(res, 200, 'A new OTP has been sent to your email.');
});

// POST /auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email.', 'USER_NOT_FOUND');

  verifyOtp(user, otp, OTP_PURPOSE.FORGOT_PASSWORD);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  clearOtp(user);
  await user.save();

  return sendSuccess(res, 200, 'Password reset successfully. Please login with your new password.');
});

// ─────────────────────────────────────────────────────────────
// Authenticated "change my password" flow (from the profile page).
// Distinct protected endpoints - never the public reset routes - and it
// additionally requires the current password before an OTP is sent.
// ─────────────────────────────────────────────────────────────

// POST /auth/change-password/request  { oldPassword, newPassword }
export const changePasswordRequest = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw ApiError.unauthorized('Current password is incorrect.', 'INVALID_CREDENTIALS');
  }
  if (await user.comparePassword(newPassword)) {
    throw ApiError.badRequest('New password must be different from the current password.', 'PASSWORD_UNCHANGED');
  }

  user.otp = buildOtpPayload(OTP_PURPOSE.CHANGE_PASSWORD);
  await user.save();

  await sendOtpEmail({ to: user.email, name: user.name, otp: user.otp.code, purpose: OTP_PURPOSE.CHANGE_PASSWORD });

  return sendSuccess(res, 200, `A verification code has been sent to ${user.email}.`);
});

// POST /auth/change-password/resend   (no body)
export const changePasswordResend = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.otp?.purpose !== OTP_PURPOSE.CHANGE_PASSWORD) {
    throw ApiError.badRequest('Start a password change first.', 'NO_PENDING_CHANGE');
  }

  assertResendAllowed(user);

  user.otp = buildOtpPayload(OTP_PURPOSE.CHANGE_PASSWORD);
  await user.save();

  await sendOtpEmail({ to: user.email, name: user.name, otp: user.otp.code, purpose: OTP_PURPOSE.CHANGE_PASSWORD });

  return sendSuccess(res, 200, 'A new verification code has been sent to your email.');
});

// POST /auth/change-password/confirm  { otp, newPassword }
export const changePasswordConfirm = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');
  verifyOtp(user, otp, OTP_PURPOSE.CHANGE_PASSWORD);

  if (await user.comparePassword(newPassword)) {
    throw ApiError.badRequest('New password must be different from the current password.', 'PASSWORD_UNCHANGED');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  clearOtp(user);
  await user.save();

  return sendSuccess(res, 200, 'Password changed successfully. Please sign in again.');
});

// GET /auth/profile
export const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched successfully.', req.user.toSafeObject());
});

// PUT /auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, address, mobileNumber } = req.body;

  if (name !== undefined) req.user.name = name;
  if (address !== undefined) req.user.address = address;
  if (mobileNumber !== undefined) req.user.mobileNumber = mobileNumber;

  await req.user.save();

  return sendSuccess(res, 200, 'Profile updated successfully.', req.user.toSafeObject());
});

// POST /auth/fcm-token
export const registerFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;

  if (!req.user.fcmTokens.includes(fcmToken)) {
    req.user.fcmTokens.push(fcmToken);
    await req.user.save();
  }

  return sendSuccess(res, 200, 'Device registered for notifications.');
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: logout is handled client-side by discarding the token.
  // If a specific device token was supplied, stop sending it push notifications.
  const { fcmToken } = req.body;
  if (fcmToken) {
    req.user.fcmTokens = req.user.fcmTokens.filter((t) => t !== fcmToken);
    await req.user.save();
  }
  return sendSuccess(res, 200, 'Logged out successfully.');
});
