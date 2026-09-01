import axiosClient from '../axiosClient';

export const dashboardApi = {
  summary: (params) => axiosClient.get('/dashboard/summary', { params }),
  followUps: (params) => axiosClient.get('/dashboard/followups', { params }),
  visits: (params) => axiosClient.get('/dashboard/visits', { params }),
};
