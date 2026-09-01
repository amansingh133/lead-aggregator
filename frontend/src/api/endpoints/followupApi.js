import axiosClient from '../axiosClient';

export const followupApi = {
  update: (id, payload) => axiosClient.put(`/followups/${id}`, payload),
  remove: (id) => axiosClient.delete(`/followups/${id}`),
};
