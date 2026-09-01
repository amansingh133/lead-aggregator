import mongoose from "mongoose";
import {
  LEAD_STATUS,
  LEAD_STATUS_VALUES,
  LEAD_TYPE_VALUES,
  LEAD_ORIGIN,
  LEAD_ORIGIN_VALUES,
  SOCIAL_LEAD_CHANNEL_VALUES,
  PLATFORM_LIST,
} from "../../../utils/constants.js";

const { Schema } = mongoose;

const isManual = function isManual() {
  return this.origin === LEAD_ORIGIN.MANUAL;
};

// Present only when origin === 'social'. Structured Facebook Lead Ads
// attribution captured by the social-media module (the `leadgen` webhook or
// a campaign reconciliation pull) - kept for dedup (see the partial unique
// index below) and reporting. Manual leads never populate this; their
// "who/how brought this lead in" note stays in the plain `source` text
// field above, unchanged.
const socialMetaSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORM_LIST, required: true },
    channel: { type: String, enum: SOCIAL_LEAD_CHANNEL_VALUES, required: true },
    // Meta's leadgen id for this Instant Form submission. Combined with
    // platform+channel it uniquely identifies the capture, so a repeated
    // webhook delivery or reconciliation pull is a no-op, not a duplicate.
    externalId: { type: String, required: true },
    // Instant Form answers, in the form's own order. `name` is Meta's field
    // key; `label` is the advertiser's question text (from the cached form
    // definition) or a humanised fallback - see MetaLeadIngestService.
    fieldData: {
      type: [{ name: String, label: String, values: [String] }],
      default: [],
    },
    formId: { type: String, default: null },
    campaignId: { type: String, default: null },
    campaignName: { type: String, default: null },
    adsetId: { type: String, default: null },
    adsetName: { type: String, default: null },
    adId: { type: String, default: null },
    adName: { type: String, default: null },
    // Raw Meta lead payload, kept for debugging/audit - excluded by default
    raw: { type: Schema.Types.Mixed, select: false },
  },
  { _id: false },
);

const leadSchema = new Schema(
  {
    // ---- Identity ----
    // Manual leads: locked after creation (updateLead never lists these), so
    // a correction requires a new lead - preserving the duplicate-check
    // guarantee. Social leads: a field the Instant Form didn't collect can be
    // filled in ONCE by an Admin/Super Admin (re-locks once set) - enforced
    // in lead.controller.js's updateLead, not here.
    name: { type: String, required: true, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: null },
    mobileNumber: {
      type: String,
      trim: true,
      // Only manual leads are guaranteed a mobile number at capture time - a
      // Meta Lead Ad's Instant Form may collect just name + email.
      required: isManual,
    },
    alternateNumber: { type: String, trim: true, default: "" },

    // ---- How this lead entered the system ----
    origin: { type: String, enum: LEAD_ORIGIN_VALUES, required: true, default: LEAD_ORIGIN.MANUAL },
    // Free text "who/how brought this lead in" - unchanged from the
    // original manual-only model, always editable. For origin === 'social'
    // this is auto-filled with "Facebook Lead Ad" so any UI showing a
    // single "Source" column keeps working without branching on origin.
    // Structured attribution for social leads lives in `social` below.
    source: { type: String, trim: true, default: "" },
    social: { type: socialMetaSchema, default: null },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      // Social-origin leads start without a project - whoever they're
      // assigned to fills this in (see lead.controller.js's updateLead).
      // Progressing the lead past LEAD_STATUS.NEW (via a follow-up) is
      // blocked until this is set - see followup.controller.js.
      required: isManual,
    },
    status: {
      type: String,
      enum: LEAD_STATUS_VALUES,
      default: LEAD_STATUS.NEW,
    },
    type: {
      type: String,
      enum: LEAD_TYPE_VALUES,
      default: null,
      required: isManual,
    },
    budget: { type: Number, min: 0, default: null },
    location: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },

    // Set once on creation, never changed afterwards.
    addedDate: { type: Date, default: Date.now, immutable: true },

    // Drives dashboard "today/tomorrow/pending follow-ups" and reminders.
    // Defaults to addedDate/capture time, then updated every time a new
    // follow-up is logged.
    nextFollowUpDate: { type: Date, required: true, default: Date.now },

    // Set (and overwritten) only when a follow-up is logged with status
    // Visit Planned / Visit Done / Revisit — the date the visit/revisit is
    // scheduled for, or the date it happened. Drives the dashboard's
    // "today's/tomorrow's visits" buckets and visit reminders.
    visitDate: { type: Date, default: null },

    // Used by the reminder cron job to avoid re-notifying too frequently.
    lastReminderSentAt: { type: Date, default: null },

    // Unassigned until an Admin claims/assigns a social-origin lead;
    // required (and defaulted to the creator) for manual leads - see
    // lead.controller.js's createLead.
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: isManual,
    },
    // For Facebook Lead Ads leads this is set to the user who owns the Meta
    // connection the lead came through (server-determined, never from the
    // client); `assignedTo` stays null until an Admin assigns it.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// Manual leads: the same mobile number can't be added twice for the same
// project (unchanged behavior from before the merge).
leadSchema.index(
  { mobileNumber: 1, project: 1 },
  { unique: true, partialFilterExpression: { origin: LEAD_ORIGIN.MANUAL } },
);
// Social leads: the same platform+channel+externalId can't be captured
// twice - this is what makes retried `leadgen` webhook deliveries and
// repeated campaign reconciliation pulls a no-op instead of a duplicate
// lead (mobileNumber may be null or shared across social leads still
// awaiting enrichment, so it can't be the dedup key for this origin).
leadSchema.index(
  { "social.platform": 1, "social.channel": 1, "social.externalId": 1 },
  { unique: true, partialFilterExpression: { origin: LEAD_ORIGIN.SOCIAL } },
);
leadSchema.index({ status: 1 });
leadSchema.index({ nextFollowUpDate: 1 });
leadSchema.index({ visitDate: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ origin: 1 });
// Filtering the leads list by the originating Facebook campaign / ad set / ad.
leadSchema.index({ "social.campaignId": 1 });
leadSchema.index({ "social.adsetId": 1 });
leadSchema.index({ "social.adId": 1 });

export const Lead = mongoose.model("Lead", leadSchema);
