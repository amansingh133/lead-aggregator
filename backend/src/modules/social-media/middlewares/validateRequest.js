import { ApiError } from '../../../utils/ApiError.js';

/**
 * Generic Joi-schema validation middleware for this module (the real-estate
 * module uses express-validator instead - see middlewares/validate.middleware.js
 * at the app root - the two aren't meant to be unified, they validate
 * different request shapes with different libraries).
 * Usage: router.post('/', validateRequest(schema), controller)
 */
const validateRequest = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property], { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
  }
  return next();
};

export default validateRequest;
