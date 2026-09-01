/**
 * Standard application error. Throw this from anywhere (controllers,
 * services, validators) and the central errorHandler will format the
 * HTTP response consistently.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human readable message
   * @param {string} errorCode - Machine readable code, e.g. "LEAD_NOT_FOUND"
   * @param {Array} details - Optional array of field-level validation errors
   */
  constructor(statusCode, message, errorCode = 'ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', details = []) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message = 'Conflict', errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}
