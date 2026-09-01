import axiosClient from '../axiosClient';

export const attendanceApi = {
  toggle: (payload) => axiosClient.post('/attendance/toggle', payload),
  status: () => axiosClient.get('/attendance/status'),
  monthlyReport: (params) => axiosClient.get('/attendance/report/monthly', { params }),
};
