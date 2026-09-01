import { Attendance } from '../models/attendance.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import { reverseGeocode } from '../services/geocode.service.js';
import { getClientIp } from '../../../utils/getClientIp.js';
import { getMonthlyAttendance } from '../services/attendance.service.js';

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildPunch = async ({ req, latitude, longitude, address }) => ({
  time: new Date(),
  latitude,
  longitude,
  // Prefer the address the Android app resolved on-device; only fall back
  // to a best-effort server-side reverse geocode if none was sent.
  address: address || (await reverseGeocode(latitude, longitude)),
  ipAddress: getClientIp(req),
});

// POST /attendance/toggle
// Single dynamic endpoint driving the Login/Logout button: figures out
// whether this is today's check-in or check-out based on existing state.
export const toggleAttendance = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;
  const date = todayKey();
  const punch = await buildPunch({ req, latitude, longitude, address });

  // Try the check-in first, relying on the {user, date} unique index to
  // reject a second check-in for today outright - this is what actually
  // makes the operation race-safe, unlike the old findOne-then-create.
  try {
    const record = await Attendance.create({ user: req.user._id, date, checkIn: punch });
    return sendSuccess(res, 201, 'Checked in successfully.', { action: 'CHECK_IN', attendance: record });
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Already checked in today - this is a check-out (or a losing racer of
    // a duplicate check-in click); fall through.
  }

  // Atomic: only succeeds if today's record still has no check-out, so a
  // concurrent double check-out click can't both "win".
  const record = await Attendance.findOneAndUpdate(
    { user: req.user._id, date, checkOut: null },
    { $set: { checkOut: punch } },
    { new: true },
  );

  if (!record) {
    throw ApiError.conflict('You have already checked out for today.', 'ALREADY_CHECKED_OUT_TODAY');
  }

  return sendSuccess(res, 200, 'Checked out successfully.', { action: 'CHECK_OUT', attendance: record });
});

// GET /attendance/status
// Tells the Android app whether to render the button as "Login" or "Logout".
export const getTodayStatus = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: todayKey() });

  return sendSuccess(res, 200, "Today's attendance status fetched successfully.", {
    checkedIn: Boolean(record),
    checkedOut: Boolean(record?.checkOut),
    nextAction: !record ? 'CHECK_IN' : !record.checkOut ? 'CHECK_OUT' : 'DONE_FOR_TODAY',
    attendance: record || null,
  });
});

// GET /attendance/report/monthly?month=&year=
export const getMyMonthlyAttendance = asyncHandler(async (req, res) => {
  const report = await getMonthlyAttendance({
    userId: req.user._id,
    month: req.query.month,
    year: req.query.year,
  });
  return sendSuccess(res, 200, 'Monthly attendance report fetched successfully.', report);
});
