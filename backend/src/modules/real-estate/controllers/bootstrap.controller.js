import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import { issueAccessToken } from '../services/token.service.js';
import { withTransaction } from '../../../utils/withTransaction.js';
import { ROLE } from '../../../utils/constants.js';

/**
 * One-time provisioning of the very first (primary) Super Admin, used once
 * per fresh deployment. Self-disabling: the moment ANY Super Admin exists,
 * POST /auth/bootstrap-super-admin responds with the exact same 404 body
 * the app's notFoundHandler produces, so it is indistinguishable from a
 * route that was never there. There is no UI entry point; the operator
 * simply has to know the URL.
 *
 * After setup these files/routes can be deleted entirely as a hardening
 * step (see the plan's Migration notes) - but the DB check + the partial
 * unique index on User.isPrimary keep them inert even if left in place.
 */

const superAdminExists = () => User.exists({ role: ROLE.SUPER_ADMIN });

// GET /auth/bootstrap-status  (public) - lets the setup page decide whether to render.
export const bootstrapStatus = asyncHandler(async (req, res) => {
  const exists = await superAdminExists();
  return sendSuccess(res, 200, 'Bootstrap status.', { available: !exists });
});

// POST /auth/bootstrap-super-admin  (public, self-disabling)
export const bootstrapSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, gender, address, password } = req.body;

  const user = await withTransaction(async (session) => {
    if (await superAdminExists()) {
      // Match notFoundHandler byte-for-byte.
      throw ApiError.notFound(
        `Route not found: ${req.method} ${req.originalUrl}`,
        'ROUTE_NOT_FOUND',
      );
    }

    const existingEmail = await User.findOne({ email }).session(session);
    if (existingEmail) {
      throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await User.create(
      [
        {
          name,
          email,
          username: email,
          mobileNumber,
          gender,
          address,
          passwordHash,
          role: ROLE.SUPER_ADMIN,
          isPrimary: true,
          isVerified: true,
          isActive: true,
        },
      ],
      { session },
    );
    return created;
  });

  const token = issueAccessToken(user);
  return sendSuccess(res, 201, 'Primary Super Admin created.', {
    token,
    user: user.toSafeObject(),
  });
});
