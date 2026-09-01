import { Router } from 'express';
import {
  login,
  forgotPassword,
  verifyResetOtp,
  resendOtp,
  resetPassword,
  changePasswordRequest,
  changePasswordResend,
  changePasswordConfirm,
  getProfile,
  updateProfile,
  registerFcmToken,
  logout,
} from '../controllers/auth.controller.js';
import { bootstrapStatus, bootstrapSuperAdmin } from '../controllers/bootstrap.controller.js';
import {
  bootstrapValidator,
  verifyOtpValidator,
  resendOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordRequestValidator,
  changePasswordConfirmValidator,
  registerFcmTokenValidator,
} from '../validators/auth.validator.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { authLimiter } from '../../../middlewares/rateLimiter.middleware.js';

const router = Router();

// One-time primary Super Admin provisioning. Self-disables once any Super
// Admin exists (see controllers/bootstrap.controller.js).
router.get('/bootstrap-status', authLimiter, bootstrapStatus);
router.post('/bootstrap-super-admin', authLimiter, bootstrapValidator, validate, bootstrapSuperAdmin);

router.post('/login', authLimiter, loginValidator, validate, login);

// Public "forgot my password" reset flow.
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, verifyResetOtp);
router.post('/resend-otp', authLimiter, resendOtpValidator, validate, resendOtp);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Authenticated change-password flow (profile page). Separate protected
// endpoints - never the public reset routes above.
router.post('/change-password/request', protect, authLimiter, changePasswordRequestValidator, validate, changePasswordRequest);
router.post('/change-password/resend', protect, authLimiter, changePasswordResend);
router.post('/change-password/confirm', protect, authLimiter, changePasswordConfirmValidator, validate, changePasswordConfirm);

router.post('/fcm-token', protect, registerFcmTokenValidator, validate, registerFcmToken);
router.post('/logout', protect, logout);

export default router;
