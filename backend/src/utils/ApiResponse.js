/**
 * Standard success response envelope so every endpoint returns the same shape:
 * { success, message, data, meta }
 */
export class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  send(res, statusCode) {
    return res.status(statusCode || 200).json(this);
  }
}

export const sendSuccess = (res, statusCode, message, data = null, meta = null) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
