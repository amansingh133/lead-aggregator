import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import { OTP_RESEND_COOLDOWN_SECONDS } from '../../../utils/constants.js';

export const generateOtp = () => {
  const min = 10 ** (env.otp.length - 1);
  const max = 10 ** env.otp.length - 1;
  return crypto.randomInt(min, max).toString();
};

export const buildOtpPayload = (purpose) => ({
  code: generateOtp(),
  purpose,
  expiresAt: new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000),
});

/**
 * Verifies a submitted OTP against the one stored on the user document.
 * Throws an ApiError with a specific errorCode on any mismatch so the
 * client can distinguish "wrong code" from "expired" from "no code sent".
 */
export const verifyOtp = (user, submittedOtp, expectedPurpose) => {
  if (!user.otp || !user.otp.code) {
    throw ApiError.badRequest('No OTP was requested for this account.', 'OTP_NOT_REQUESTED');
  }
  if (user.otp.purpose !== expectedPurpose) {
    throw ApiError.badRequest('OTP purpose mismatch.', 'OTP_PURPOSE_MISMATCH');
  }
  if (new Date() > new Date(user.otp.expiresAt)) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.', 'OTP_EXPIRED');
  }
  if (user.otp.code !== submittedOtp) {
    throw ApiError.badRequest('Incorrect OTP.', 'OTP_INVALID');
  }
};

export const clearOtp = (user) => {
  user.otp = { code: null, purpose: null, expiresAt: null };
};

/**
 * Throttles OTP (re)sends without needing an extra "issuedAt" field: the
 * issue time is derived from expiresAt minus the configured lifetime.
 * Throws 429 if the current OTP was issued less than
 * OTP_RESEND_COOLDOWN_SECONDS ago.
 */
export const assertResendAllowed = (user) => {
  if (!user.otp || !user.otp.expiresAt) return;
  const issuedAt =
    new Date(user.otp.expiresAt).getTime() -
    env.otp.expiryMinutes * 60 * 1000;
  const elapsedSeconds = (Date.now() - issuedAt) / 1000;
  if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
    const retryAfter = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
    throw new ApiError(
      429,
      `Please wait ${retryAfter}s before requesting another code.`,
      'OTP_RESEND_TOO_SOON',
    );
  }
};
