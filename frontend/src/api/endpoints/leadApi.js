import axiosClient from '../axiosClient';

export const leadApi = {
  list: (params) => axiosClient.get('/leads', { params }),
  // level: 'campaign' | 'adset' | 'ad' (+ optional campaignId / adsetId to scope)
  facebookAttribution: (params) => axiosClient.get('/leads/facebook-attribution', { params }),
  get: (id) => axiosClient.get(`/leads/${id}`),
  create: (payload) => axiosClient.post('/leads', payload),
  update: (id, payload) => axiosClient.put(`/leads/${id}`, payload),
  remove: (id) => axiosClient.delete(`/leads/${id}`),
  listFollowUps: (leadId) => axiosClient.get(`/leads/${leadId}/followups`),
  addFollowUp: (leadId, payload) => axiosClient.post(`/leads/${leadId}/followups`, payload),
};
