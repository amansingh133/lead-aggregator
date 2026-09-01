import { body, query, param } from 'express-validator';

export const attendanceToggleValidator = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be a valid number between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be a valid number between -180 and 180'),
  body('address').optional().trim(),
];

export const monthlyReportQueryValidator = [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month must be between 1 and 12'),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year must be a valid 4-digit year'),
];

export const employeeIdParamValidator = [param('employeeId').isMongoId().withMessage('Invalid employee id')];
