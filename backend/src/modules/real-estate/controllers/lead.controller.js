import { Lead } from "../models/lead.model.js";
import { FollowUp } from "../models/followup.model.js";
import { Project } from "../models/project.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { sendSuccess } from "../../../utils/ApiResponse.js";
import { withTransaction } from "../../../utils/withTransaction.js";
import { User } from "../models/user.model.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  LEAD_STATUS,
  LEAD_ORIGIN,
  ROLE,
  PRIVILEGED_ROLES,
} from "../../../utils/constants.js";

// POST /leads
// Manual-entry leads only - social-origin leads (Facebook Lead Ads) are
// created by the social-media module (the `leadgen` webhook or a campaign
// reconciliation pull) directly via the Lead model, not through this endpoint.
export const createLead = asyncHandler(async (req, res) => {
  const {
    name,
    mobileNumber,
    alternateNumber,
    project,
    status,
    type,
    budget,
    source,
    location,
    remarks,
    nextFollowUpDate,
    assignedTo,
  } = req.body;

  const projectDoc = await Project.findOne({ _id: project });
  if (!projectDoc)
    throw ApiError.notFound(
      "Selected project does not exist.",
      "PROJECT_NOT_FOUND",
    );

  const duplicate = await Lead.findOne({ mobileNumber, project });
  if (duplicate) {
    throw ApiError.conflict(
      "A lead with this mobile number already exists for the selected project.",
      "DUPLICATE_LEAD",
    );
  }

  // Employees can only ever create leads assigned to themselves. Only an
  // Admin / Super Admin can assign a lead to a different employee.
  let finalAssignedTo = req.user._id;
  if (PRIVILEGED_ROLES.includes(req.user.role) && assignedTo) {
    const assignee = await User.findOne({ _id: assignedTo });
    if (!assignee)
      throw ApiError.notFound("assignedTo user not found.", "ASSIGNEE_NOT_FOUND");
    finalAssignedTo = assignee._id;
  }

  const lead = await Lead.create({
    origin: LEAD_ORIGIN.MANUAL,
    name,
    mobileNumber,
    alternateNumber,
    project,
    status: status || LEAD_STATUS.NEW,
    type,
    budget,
    source,
    location,
    remarks,
    // Per spec: added date is the 1st follow-up date by default.
    nextFollowUpDate: nextFollowUpDate || new Date(),
    assignedTo: finalAssignedTo,
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, "Lead created successfully.", lead);
});

// GET /leads
export const getLeads = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Number(req.query.limit) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const {
    search,
    status,
    project,
    type,
    assignedTo,
    origin,
    platform,
    campaignId,
    adsetId,
    adId,
    sortBy,
    sortOrder,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (project) filter.project = project;
  if (type) filter.type = type;
  // origin/platform let callers separate manually entered leads from
  // Facebook Lead Ads captures - both live in this one unified Lead
  // collection (the social-media module writes straight into it).
  if (origin) filter.origin = origin;
  if (platform) filter["social.platform"] = platform;
  // Facebook attribution: campaign -> ad set -> ad the lead originated from.
  if (campaignId) filter["social.campaignId"] = campaignId;
  if (adsetId) filter["social.adsetId"] = adsetId;
  if (adId) filter["social.adId"] = adId;

  // Employees only ever see their own leads. Admins may optionally filter
  // by a specific employee via ?assignedTo=, or omit it to see all.
  if (req.user.role === ROLE.EMPLOYEE) {
    filter.assignedTo = req.user._id;
  } else if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy || "createdAt"]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .populate("project", "name type")
      .populate("assignedTo", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, "Leads fetched successfully.", items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /leads/facebook-attribution?level=campaign|adset|ad&campaignId=&adsetId=
// The distinct Facebook campaigns / ad sets / ads that have actually
// produced a lead, for the cascading "Campaign -> Ad Set -> Ad" filter on
// the leads list. `level` picks which tier; the parent id (campaignId for
// adset, adsetId for ad) scopes it to the selected parent. Scoped the same
// way as the leads list (an Employee only sees their own leads' attribution).
const ATTRIBUTION_LEVELS = {
  campaign: { idField: "social.campaignId", nameField: "social.campaignName" },
  adset: { idField: "social.adsetId", nameField: "social.adsetName" },
  ad: { idField: "social.adId", nameField: "social.adName" },
};

export const getFacebookAttribution = asyncHandler(async (req, res) => {
  const level = ATTRIBUTION_LEVELS[req.query.level] ? req.query.level : "campaign";
  const { idField, nameField } = ATTRIBUTION_LEVELS[level];

  const match = {
    origin: LEAD_ORIGIN.SOCIAL,
    "social.platform": "facebook",
    [idField]: { $ne: null },
  };
  if (req.user.role === ROLE.EMPLOYEE) {
    match.assignedTo = req.user._id;
  }
  // Scope to the selected parent where relevant.
  if (level === "adset" && req.query.campaignId) {
    match["social.campaignId"] = req.query.campaignId;
  }
  if (level === "ad") {
    if (req.query.adsetId) match["social.adsetId"] = req.query.adsetId;
    else if (req.query.campaignId) match["social.campaignId"] = req.query.campaignId;
  }

  const rows = await Lead.aggregate([
    { $match: match },
    {
      $group: {
        _id: `$${idField}`,
        name: { $first: `$${nameField}` },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, name: 1 } },
  ]);

  const data = rows.map((r) => ({
    id: r._id,
    name: r.name || r._id,
    count: r.count,
  }));

  return sendSuccess(res, 200, "Facebook lead attribution fetched.", data);
});

// Employees may only access leads assigned to them; Admins may access any
// lead. Unassigned social-origin leads (assignedTo === null) are visible to
// Admins only, until claimed.
const assertLeadAccess = (lead, req) => {
  if (!lead) {
    throw ApiError.notFound("Lead not found.", "LEAD_NOT_FOUND");
  }
  if (req.user.role === ROLE.EMPLOYEE) {
    const assignedId = lead.assignedTo?._id
      ? lead.assignedTo._id.toString()
      : lead.assignedTo?.toString();
    if (assignedId !== req.user._id.toString()) {
      throw ApiError.forbidden(
        "You do not have access to this lead.",
        "LEAD_ACCESS_DENIED",
      );
    }
  }
};

// GET /leads/:id  (includes full follow-up history, per "expand lead" spec)
export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate("project", "name type")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  assertLeadAccess(lead, req);

  const followUps = await FollowUp.find({ lead: lead._id }).sort({
    createdAt: -1,
  });

  return sendSuccess(res, 200, "Lead fetched successfully.", {
    lead,
    followUpHistory: followUps,
  });
});

// PUT /leads/:id
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  assertLeadAccess(lead, req);

  // Name, mobile number and email are intentionally NOT in this list: they
  // stay read-only once a lead is created (schema-enforced via
  // `immutable: true` in lead.model.js too) to preserve the duplicate-check
  // guarantee for manual leads and the platform-identity guarantee for
  // social ones. Use a new lead if these must change.
  const allowedFields = [
    "alternateNumber",
    "project",
    "type",
    "budget",
    "source",
    "location",
    "remarks",
  ];
  // Only an Admin / Super Admin may reassign a lead to a different employee
  // (this is also how an unassigned social-origin lead gets claimed).
  if (PRIVILEGED_ROLES.includes(req.user.role)) allowedFields.push("assignedTo");

  if (req.body.project && req.body.project !== lead.project?.toString()) {
    const projectDoc = await Project.findOne({ _id: req.body.project });
    if (!projectDoc)
      throw ApiError.notFound(
        "Selected project does not exist.",
        "PROJECT_NOT_FOUND",
      );
  }

  if (req.body.assignedTo && PRIVILEGED_ROLES.includes(req.user.role)) {
    const assignee = await User.findOne({ _id: req.body.assignedTo });
    if (!assignee)
      throw ApiError.notFound("assignedTo user not found.", "ASSIGNEE_NOT_FOUND");
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) lead[field] = req.body[field];
  });

  // Social-origin leads: a contact field the Instant Form did not collect can
  // be filled in once by an Admin / Super Admin. It re-locks the moment it
  // holds a value; manual leads keep name/email/mobileNumber fully locked.
  if (
    lead.origin === LEAD_ORIGIN.SOCIAL &&
    PRIVILEGED_ROLES.includes(req.user.role)
  ) {
    ["name", "email", "mobileNumber"].forEach((field) => {
      const incoming = req.body[field];
      const current = lead[field];
      const isEmpty =
        current === undefined ||
        current === null ||
        String(current).trim() === "";
      if (typeof incoming === "string" && incoming.trim() !== "" && isEmpty) {
        lead[field] = incoming.trim();
      }
    });
  }

  await lead.save();
  return sendSuccess(res, 200, "Lead updated successfully.", lead);
});

// DELETE /leads/:id
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  assertLeadAccess(lead, req);

  // Two writes - do them atomically so a failure can't leave a lead with
  // its follow-ups deleted (or vice versa).
  await withTransaction(async (session) => {
    await FollowUp.deleteMany({ lead: lead._id }, { session });
    await lead.deleteOne({ session });
  });

  return sendSuccess(res, 200, "Lead deleted successfully.");
});
