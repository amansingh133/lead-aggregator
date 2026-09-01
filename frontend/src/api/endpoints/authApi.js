import axiosClient from '../axiosClient';

export const authApi = {
  login: (payload) => axiosClient.post('/auth/login', payload),

  // One-time primary Super Admin provisioning (hidden /setup-super-admin route).
  bootstrapStatus: () => axiosClient.get('/auth/bootstrap-status'),
  bootstrapSuperAdmin: (payload) => axiosClient.post('/auth/bootstrap-super-admin', payload),

  // Public password reset flow.
  forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
  verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
  resendOtp: (payload) => axiosClient.post('/auth/resend-otp', payload),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),

  // Authenticated change-password flow (profile page) - protected endpoints.
  changePasswordRequest: (payload) => axiosClient.post('/auth/change-password/request', payload),
  changePasswordResend: () => axiosClient.post('/auth/change-password/resend'),
  changePasswordConfirm: (payload) => axiosClient.post('/auth/change-password/confirm', payload),

  getProfile: () => axiosClient.get('/auth/profile'),
  updateProfile: (payload) => axiosClient.put('/auth/profile', payload),
  registerFcmToken: (fcmToken) => axiosClient.post('/auth/fcm-token', { fcmToken }),
  logout: (fcmToken) => axiosClient.post('/auth/logout', fcmToken ? { fcmToken } : {}),
};
