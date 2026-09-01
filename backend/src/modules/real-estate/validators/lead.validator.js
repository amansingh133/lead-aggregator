import { body, param } from "express-validator";
import { LEAD_STATUS_VALUES, LEAD_TYPE_VALUES } from "../../../utils/constants.js";

export const createLeadValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("mobileNumber")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("alternateNumber")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage("Alternate number must be a valid 10-digit number"),
  body("project").isMongoId().withMessage("A valid project id is required"),
  body("status")
    .optional()
    .isIn(LEAD_STATUS_VALUES)
    .withMessage(`Status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`),
  body("type")
    .isIn(LEAD_TYPE_VALUES)
    .withMessage(`Type must be one of: ${LEAD_TYPE_VALUES.join(", ")}`),
  body("budget")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("source").optional().trim(),
  body("location").optional().trim(),
  body("remarks").optional().trim(),
  body("nextFollowUpDate")
    .optional()
    .isISO8601()
    .withMessage("nextFollowUpDate must be a valid ISO 8601 date"),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Invalid assignedTo user id"),
];

export const updateLeadValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
  // Only honoured for social-origin leads whose value is still empty (see
  // updateLead) - accepted here so the request passes validation.
  body("name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1 })
    .withMessage("Name cannot be empty"),
  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("A valid email is required"),
  body("mobileNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("alternateNumber")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage("Alternate number must be a valid 10-digit number"),
  body("project").optional().isMongoId().withMessage("Invalid project id"),
  body("status")
    .optional()
    .isIn(LEAD_STATUS_VALUES)
    .withMessage(`Status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`),
  body("type")
    .optional()
    .isIn(LEAD_TYPE_VALUES)
    .withMessage(`Type must be one of: ${LEAD_TYPE_VALUES.join(", ")}`),
  body("budget")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("source").optional().trim(),
  body("location").optional().trim(),
  body("remarks").optional().trim(),
  body("nextFollowUpDate")
    .optional()
    .isISO8601()
    .withMessage("nextFollowUpDate must be a valid ISO 8601 date"),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Invalid assignedTo user id"),
];

export const leadIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid lead id"),
];
