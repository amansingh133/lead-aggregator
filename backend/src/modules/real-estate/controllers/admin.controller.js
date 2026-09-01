import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Lead } from '../models/lead.model.js';
import { Attendance } from '../models/attendance.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import { generateTempPassword } from '../services/token.service.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ROLE,
  PRIVILEGED_ROLES,
} from '../../../utils/constants.js';
import { getMonthlyAttendance } from '../services/attendance.service.js';

/**
 * Which roles a given actor is allowed to see / create / manage from the
 * Team panel. This is the single source of truth for the whole controller:
 *   - Admin          → Employees only
 *   - Super Admin     → Employees + Admins
 *   - primary Super Admin → Employees + Admins + Super Admins
 */
const manageableRoles = (actor) => {
  if (actor.role === ROLE.SUPER_ADMIN) {
    return actor.isPrimary
      ? [ROLE.EMPLOYEE, ROLE.ADMIN, ROLE.SUPER_ADMIN]
      : [ROLE.EMPLOYEE, ROLE.ADMIN];
  }
  return [ROLE.EMPLOYEE]; // ROLE.ADMIN (Employees can't reach this router)
};

// Refuses an action that would leave the org with no active privileged
// (Admin or Super Admin) account able to run the panel.
const assertNotLastActivePrivileged = async (excludingUserId) => {
  const remaining = await User.countDocuments({
    role: { $in: PRIVILEGED_ROLES },
    isActive: true,
    _id: { $ne: excludingUserId },
  });
  if (remaining === 0) {
    throw ApiError.conflict(
      'This is the last active Admin/Super Admin account. Add or activate another before deactivating or deleting this one.',
      'LAST_ADMIN',
    );
  }
};

// POST /admin/employees
// Creates a team member. `targetRole` must be within the caller's
// manageableRoles, so an Admin can only create Employees, a Super Admin can
// also create Admins, and only the primary Super Admin can create Super
// Admins. `isPrimary` is never settable here.
export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, gender, address, role } = req.body;
  const targetRole = role || ROLE.EMPLOYEE;

  if (!manageableRoles(req.user).includes(targetRole)) {
    throw ApiError.forbidden(
      `You are not allowed to create a ${targetRole} account.`,
      'ROLE_NOT_ALLOWED',
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const employee = await User.create({
    name,
    email,
    username: email,
    mobileNumber,
    gender,
    address,
    passwordHash,
    role: targetRole,
    isVerified: true,
  });

  return sendSuccess(
    res,
    201,
    `${targetRole} created successfully. Share the temporary password securely — it will not be shown again.`,
    {
      employee: employee.toSafeObject(),
      temporaryPassword: tempPassword,
    },
  );
});

// GET /admin/employees
export const getEmployees = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { search, isActive, role } = req.query;

  const allowedRoles = manageableRoles(req.user);
  // Force the result set to the caller's manageable roles; if an explicit
  // ?role= is passed, intersect (an out-of-scope role yields nothing).
  const roleFilter = role
    ? allowedRoles.filter((r) => r === role)
    : allowedRoles;

  const filter = { role: { $in: roleFilter } };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -otp -fcmTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Team members fetched successfully.', items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Loads a target user and 404s (not 403 - don't reveal existence) if the
// caller isn't allowed to manage that role.
const loadManageableTarget = async (req) => {
  const target = await User.findById(req.params.id);
  if (!target || !manageableRoles(req.user).includes(target.role)) {
    throw ApiError.notFound('Team member not found.', 'EMPLOYEE_NOT_FOUND');
  }
  return target;
};

// GET /admin/employees/:id
export const getEmployeeById = asyncHandler(async (req, res) => {
  const target = await loadManageableTarget(req);
  return sendSuccess(res, 200, 'Team member fetched successfully.', target.toSafeObject());
});

// PUT /admin/employees/:id
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await loadManageableTarget(req);

  const isSelf = employee._id.equals(req.user._id);
  if (isSelf && req.body.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account.', 'CANNOT_MODIFY_SELF');
  }
  if (employee.isPrimary && req.body.isActive === false) {
    throw ApiError.forbidden('The primary Super Admin cannot be deactivated.', 'CANNOT_MODIFY_PRIMARY');
  }
  if (
    req.body.isActive === false &&
    PRIVILEGED_ROLES.includes(employee.role)
  ) {
    await assertNotLastActivePrivileged(employee._id);
  }

  // Role and isPrimary are intentionally NOT editable here.
  const allowedFields = ['name', 'mobileNumber', 'gender', 'address', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) employee[field] = req.body[field];
  });

  await employee.save();
  return sendSuccess(res, 200, 'Team member updated successfully.', employee.toSafeObject());
});

// DELETE /admin/employees/:id
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await loadManageableTarget(req);

  if (employee._id.equals(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account.', 'CANNOT_MODIFY_SELF');
  }
  if (employee.isPrimary) {
    throw ApiError.forbidden('The primary Super Admin cannot be deleted.', 'CANNOT_MODIFY_PRIMARY');
  }
  if (PRIVILEGED_ROLES.includes(employee.role)) {
    await assertNotLastActivePrivileged(employee._id);
  }

  const [leadCount, attendanceCount] = await Promise.all([
    Lead.countDocuments({ assignedTo: employee._id }),
    Attendance.countDocuments({ user: employee._id }),
  ]);

  if (leadCount > 0 || attendanceCount > 0) {
    throw ApiError.conflict(
      'This team member has linked leads or attendance history and cannot be permanently deleted. Deactivate the account instead (PUT with isActive: false).',
      'EMPLOYEE_HAS_HISTORY',
    );
  }

  await employee.deleteOne();
  return sendSuccess(res, 200, 'Team member deleted successfully.');
});

// GET /admin/employees/:employeeId/attendance/monthly?month=&year=
export const getEmployeeMonthlyAttendance = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.employeeId).select(
    '-passwordHash -otp -fcmTokens',
  );
  if (!employee || !manageableRoles(req.user).includes(employee.role)) {
    throw ApiError.notFound('Employee not found.', 'EMPLOYEE_NOT_FOUND');
  }

  const report = await getMonthlyAttendance({
    userId: employee._id,
    month: req.query.month,
    year: req.query.year,
  });

  return sendSuccess(res, 200, 'Monthly attendance fetched successfully.', {
    employee: { _id: employee._id, name: employee.name, email: employee.email },
    ...report,
  });
});
