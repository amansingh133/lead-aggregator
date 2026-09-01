export const LEAD_STATUS = Object.freeze({
  NEW: "New",
  ASSIGNED: "Assigned",
  IN_PROCESS: "In Process",
  CONTACTED: "Contacted",
  VISIT_PLANNED: "Visit Planned",
  VISIT_DONE: "Visit Done",
  REVISIT: "Revisit",
  NEGOTIATION: "Negotiation",
  BROKER: "Broker",
  CONVERTED: "Converted",
  DROPPED: "Dropped",
});

export const LEAD_STATUS_VALUES = Object.values(LEAD_STATUS);

export const LEAD_TYPE = Object.freeze({
  BROKER: "Broker",
  CLIENT: "Client",
});
export const LEAD_TYPE_VALUES = Object.values(LEAD_TYPE);

export const PROJECT_TYPE = Object.freeze({
  FLATS: "Flats",
  VILLAS: "Villas",
  PLOTS: "Plots",
  COMMERCIAL: "Commercial",
});
export const PROJECT_TYPE_VALUES = Object.values(PROJECT_TYPE);

export const FOLLOWUP_TYPE = Object.freeze({
  WHATSAPP: "WhatsApp",
  CALL: "Call",
  PHYSICAL: "Physical Interaction",
});
export const FOLLOWUP_TYPE_VALUES = Object.values(FOLLOWUP_TYPE);

export const OTP_PURPOSE = Object.freeze({
  // Public "forgot my password" reset flow (email + OTP, no session).
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  // Authenticated "change my password" flow from the profile page. Kept
  // distinct so a reset OTP can't satisfy a change confirmation or vice versa.
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
});

// Minimum seconds between successive OTP (re)sends for one account, enforced
// server-side on both the public resend and the authed change-password resend.
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export const GENDER_VALUES = ["Male", "Female", "Other"];

export const ROLE = Object.freeze({
  // Full access, incl. managing Admins. The first one (isPrimary) also
  // manages other Super Admins and can never be deactivated/deleted.
  SUPER_ADMIN: "SuperAdmin",
  // Org-wide access (projects, all leads, dashboards, social); manages
  // Employees only.
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
});
export const ROLE_VALUES = Object.values(ROLE);

// Roles with org-wide ("admin-level") access - used wherever a controller
// previously checked `role === ROLE.ADMIN`.
export const PRIVILEGED_ROLES = Object.freeze([ROLE.ADMIN, ROLE.SUPER_ADMIN]);

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// The only social platform the app integrates with is Facebook (Lead Ads).
// Shared by the Lead model's `social.platform` field and the social-media module.
export const PLATFORMS = Object.freeze({
  FACEBOOK: "facebook",
});
export const PLATFORM_LIST = Object.values(PLATFORMS);

// How a Lead entered the system. Manual leads are typed in by staff and use
// the fields above (project/type/budget/...) same as always. Social leads
// are captured automatically from the social-media module (Facebook Lead
// Ads Instant Form submissions) and start with only name/email/phone - see
// models/lead.model.js for which fields are conditionally required.
export const LEAD_ORIGIN = Object.freeze({
  MANUAL: "manual",
  SOCIAL: "social",
});
export const LEAD_ORIGIN_VALUES = Object.values(LEAD_ORIGIN);

// Which social capture mechanism produced a `social`-origin lead. Kept
// alongside LEAD_ORIGIN so the social-media module and the Lead model share
// one vocabulary instead of each defining their own. Facebook Lead Ads is
// the only integrated channel.
export const SOCIAL_LEAD_CHANNEL = Object.freeze({
  LEAD_AD: "lead_ad", // Meta Lead Ads Instant Form submission (webhook or reconciliation pull)
});
export const SOCIAL_LEAD_CHANNEL_VALUES = Object.values(SOCIAL_LEAD_CHANNEL);
