import { createAction } from '@reduxjs/toolkit';

// Split out from authSlice.js so axiosClient's 401 interceptor can dispatch
// it without statically importing the whole slice (which imports authApi,
// which imports axiosClient itself — a circular import).
export const sessionExpired = createAction('auth/sessionExpired');
