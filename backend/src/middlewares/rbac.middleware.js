import { ApiError } from '../utils/ApiError.js';

/**
 * Usage: router.post('/', protect, authorize('Admin'), handler)
 * Must run after `protect` so req.user is populated.
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden(
      `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      'ROLE_NOT_ALLOWED'
    );
  }
  next();
};
