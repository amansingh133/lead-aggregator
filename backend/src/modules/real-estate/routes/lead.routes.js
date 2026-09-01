import { Router } from "express";
import {
  createLead,
  getLeads,
  getFacebookAttribution,
  getLeadById,
  updateLead,
  deleteLead,
} from "../controllers/lead.controller.js";
import {
  addFollowUp,
  getFollowUpsForLead,
} from "../controllers/followup.controller.js";
import {
  createLeadValidator,
  updateLeadValidator,
  leadIdParamValidator,
} from "../validators/lead.validator.js";
import {
  createFollowUpValidator,
  leadIdParamValidator as followUpLeadIdValidator,
} from "../validators/followup.validator.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import { protect } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", createLeadValidator, validate, createLead);
router.get("/", getLeads);
// Static path - must be registered before "/:id".
router.get("/facebook-attribution", getFacebookAttribution);
router.get("/:id", leadIdParamValidator, validate, getLeadById);
router.put("/:id", updateLeadValidator, validate, updateLead);
router.delete("/:id", leadIdParamValidator, validate, deleteLead);

// Single entry point for advancing a lead: logs a follow-up AND can update
// status/visitDate in the same call (see followup.controller.js).
router.post(
  "/:leadId/followups",
  createFollowUpValidator,
  validate,
  addFollowUp,
);
router.get(
  "/:leadId/followups",
  followUpLeadIdValidator,
  validate,
  getFollowUpsForLead,
);

export default router;
