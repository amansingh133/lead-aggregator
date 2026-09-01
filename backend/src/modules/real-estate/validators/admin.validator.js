import { body, param } from "express-validator";
import { GENDER_VALUES, ROLE_VALUES } from "../../../utils/constants.js";

export const createEmployeeValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail({ gmail_remove_dots: false }),
  body("mobileNumber")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("gender")
    .isIn(GENDER_VALUES)
    .withMessage(`Gender must be one of: ${GENDER_VALUES.join(", ")}`),
  body("address").optional().trim(),
  // Defaults to Employee in the controller when omitted. Constrained to the
  // real role enum here; the controller then enforces that the caller may
  // actually create that role (manageableRoles) - an Admin can only create
  // Employees, a Super Admin can also create Admins, etc.
  body("role")
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage(`Role must be one of: ${ROLE_VALUES.join(", ")}`),
];

export const updateEmployeeValidator = [
  param("id").isMongoId().withMessage("Invalid employee id"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("mobileNumber")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("gender")
    .optional()
    .isIn(GENDER_VALUES)
    .withMessage(`Gender must be one of: ${GENDER_VALUES.join(", ")}`),
  body("address").optional().trim(),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

export const employeeIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid employee id"),
];
