import { Lead } from "../models/lead.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/ApiResponse.js";
import { LEAD_STATUS, LEAD_STATUS_VALUES, ROLE } from "../../../utils/constants.js";

// Employees only ever see their own leads; Admins see everything (or one
// employee's leads if they pass ?employeeId=).
const scopeFilter = (req) => {
  const filter = {};
  if (req.user.role === ROLE.EMPLOYEE) {
    filter.assignedTo = req.user._id;
  } else if (req.query.employeeId) {
    filter.assignedTo = req.query.employeeId;
  }
  return filter;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// GET /dashboard/summary
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const filter = scopeFilter(req);
  const totalLeads = await Lead.countDocuments(filter);

  const statusCounts = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countsByStatus = Object.fromEntries(
    LEAD_STATUS_VALUES.map((s) => [s, 0]),
  );
  statusCounts.forEach((s) => {
    countsByStatus[s._id] = s.count;
  });

  const converted = countsByStatus[LEAD_STATUS.CONVERTED] || 0;
  const conversionRate =
    totalLeads > 0 ? Number(((converted / totalLeads) * 100).toFixed(2)) : 0;

  return sendSuccess(res, 200, "Dashboard summary fetched successfully.", {
    totalLeads,
    conversionRate,
    statusCounts: countsByStatus,
  });
});

// GET /dashboard/followups?type=today|tomorrow|pending
export const getFollowUpsBucket = asyncHandler(async (req, res) => {
  const { type = "pending" } = req.query;
  const now = new Date();

  const filter = scopeFilter(req);
  if (type === "today") {
    filter.nextFollowUpDate = { $gte: startOfDay(now), $lte: endOfDay(now) };
  } else if (type === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    filter.nextFollowUpDate = {
      $gte: startOfDay(tomorrow),
      $lte: endOfDay(tomorrow),
    };
  } else {
    // pending = overdue, not yet actioned
    filter.nextFollowUpDate = { $lt: startOfDay(now) };
  }

  const leads = await Lead.find(filter)
    .populate("project", "name")
    .populate("assignedTo", "name")
    .sort({ nextFollowUpDate: 1 });

  return sendSuccess(
    res,
    200,
    `${type} follow-ups fetched successfully.`,
    leads,
  );
});

// GET /dashboard/visits?type=today|tomorrow
export const getVisitsBucket = asyncHandler(async (req, res) => {
  const { type = "today" } = req.query;
  const now = new Date();

  let targetDate = now;
  if (type === "tomorrow") {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const leads = await Lead.find({
    ...scopeFilter(req),
    status: LEAD_STATUS.VISIT_PLANNED,
    visitDate: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
  })
    .populate("project", "name")
    .populate("assignedTo", "name")
    .sort({ visitDate: 1 });

  return sendSuccess(res, 200, `${type} visits fetched successfully.`, leads);
});
