import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after an array of express-validator chains. Collects all failures
 * into a single, consistent ApiError shape instead of express-validator's
 * default format.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
};
