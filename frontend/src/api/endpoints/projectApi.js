import axiosClient from '../axiosClient';

export const projectApi = {
  list: (params) => axiosClient.get('/projects', { params }),
  get: (id) => axiosClient.get(`/projects/${id}`),
  create: (payload) => axiosClient.post('/projects', payload),
  update: (id, payload) => axiosClient.put(`/projects/${id}`, payload),
  remove: (id) => axiosClient.delete(`/projects/${id}`),
};
