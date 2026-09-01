import { body, param } from "express-validator";
import {
  FOLLOWUP_TYPE_VALUES,
  LEAD_STATUS,
  LEAD_STATUS_VALUES,
} from "../../../utils/constants.js";

const STATUSES_REQUIRING_VISIT_DATE = [
  LEAD_STATUS.VISIT_PLANNED,
  LEAD_STATUS.VISIT_DONE,
  LEAD_STATUS.REVISIT,
];

export const createFollowUpValidator = [
  param("leadId").isMongoId().withMessage("Invalid lead id"),
  body("nextFollowUpDate")
    .isISO8601()
    .withMessage("nextFollowUpDate must be a valid ISO 8601 date"),
  body("numberOfClients")
    .optional()
    .isInt({ min: 1 })
    .withMessage("numberOfClients must be a positive integer"),
  body("type")
    .isIn(FOLLOWUP_TYPE_VALUES)
    .withMessage(`Type must be one of: ${FOLLOWUP_TYPE_VALUES.join(", ")}`),
  body("remarks").optional().trim(),
  // Adding a follow-up can also move the lead's status — no separate API needed.
  body("status")
    .optional()
    .isIn(LEAD_STATUS_VALUES)
    .withMessage(`Status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`),
  body("visitDate")
    .optional()
    .isISO8601()
    .withMessage("visitDate must be a valid ISO 8601 date"),
  body("visitDate").custom((value, { req }) => {
    if (STATUSES_REQUIRING_VISIT_DATE.includes(req.body.status) && !value) {
      throw new Error(
        `visitDate is required when status is one of: ${STATUSES_REQUIRING_VISIT_DATE.join(", ")}`,
      );
    }
    return true;
  }),
];

export const updateFollowUpValidator = [
  param("id").isMongoId().withMessage("Invalid follow-up id"),
  body("nextFollowUpDate")
    .optional()
    .isISO8601()
    .withMessage("nextFollowUpDate must be a valid ISO 8601 date"),
  body("numberOfClients")
    .optional()
    .isInt({ min: 1 })
    .withMessage("numberOfClients must be a positive integer"),
  body("type")
    .optional()
    .isIn(FOLLOWUP_TYPE_VALUES)
    .withMessage(`Type must be one of: ${FOLLOWUP_TYPE_VALUES.join(", ")}`),
  body("remarks").optional().trim(),
  body("visitDate")
    .optional()
    .isISO8601()
    .withMessage("visitDate must be a valid ISO 8601 date"),
];

export const leadIdParamValidator = [
  param("leadId").isMongoId().withMessage("Invalid lead id"),
];
export const followUpIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid follow-up id"),
];
