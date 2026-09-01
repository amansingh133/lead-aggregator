import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../modules/real-estate/models/user.model.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing. Please login again.', 'TOKEN_MISSING');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please login again.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid authentication token.', 'TOKEN_INVALID');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User for this token no longer exists.', 'USER_NOT_FOUND');
  }
  if (!user.isVerified) {
    throw ApiError.forbidden('Account not verified. Please verify your email first.', 'ACCOUNT_NOT_VERIFIED');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your admin.', 'ACCOUNT_DEACTIVATED');
  }

  req.user = user;
  next();
});
