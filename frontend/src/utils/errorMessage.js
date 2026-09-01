// Normalizes the backend's error envelope ({success:false, message, errorCode, details?})
// into a shape components/slices can use uniformly, regardless of which layer threw
// (axios network error vs. ApiError vs. express-validator/Joi `details`).
export function parseApiError(error) {
  const response = error?.response?.data;
  const message = response?.message || error?.message || 'Something went wrong. Please try again.';
  const errorCode = response?.errorCode || null;
  const details = Array.isArray(response?.details) ? response.details : [];

  const fieldErrors = {};
  for (const detail of details) {
    if (detail && typeof detail === 'object' && detail.field) {
      fieldErrors[detail.field] = detail.message;
    }
  }

  return { message, errorCode, details, fieldErrors };
}
