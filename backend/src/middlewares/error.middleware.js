import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for field "${err.path}"`, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    error = ApiError.conflict(`Duplicate value for field(s): ${field}`, 'DUPLICATE_KEY');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
  }

  if (!(error instanceof ApiError)) {
    error = ApiError.internal(env.nodeEnv === 'production' ? 'Something went wrong' : err.message, 'INTERNAL_ERROR');
  }

  if (error.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    details: error.details && error.details.length ? error.details : undefined,
    ...(env.nodeEnv !== 'production' && error.statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
