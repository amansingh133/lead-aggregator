import { Attendance } from '../models/attendance.model.js';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Builds a monthly attendance report for one user.
 * Returns the raw day-by-day records plus a small summary block
 * (present days count + total hours worked) that's cheap to compute
 * once here rather than repeatedly on the client.
 */
export const getMonthlyAttendance = async ({ userId, month, year }) => {
  const now = new Date();
  const targetMonth = Number(month) || now.getMonth() + 1; // 1-12
  const targetYear = Number(year) || now.getFullYear();

  const prefix = `${targetYear}-${pad(targetMonth)}`; // e.g. "2026-08"

  const records = await Attendance.find({
    user: userId,
    date: { $regex: `^${prefix}` },
  }).sort({ date: 1 });

  let totalHours = 0;
  const days = records.map((r) => {
    let hoursWorked = null;
    if (r.checkOut?.time) {
      hoursWorked = Number(((new Date(r.checkOut.time) - new Date(r.checkIn.time)) / (1000 * 60 * 60)).toFixed(2));
      totalHours += hoursWorked;
    }
    return {
      date: r.date,
      checkIn: r.checkIn?.time ?? null,
      checkOut: r.checkOut?.time ?? null,
      hoursWorked,
    };
  });

  return {
    month: targetMonth,
    year: targetYear,
    presentDays: records.length,
    totalHours: Number(totalHours.toFixed(2)),
    days,
  };
};
