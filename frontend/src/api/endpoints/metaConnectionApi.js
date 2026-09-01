import axiosClient from '../axiosClient';

export const metaConnectionApi = {
  list: () => axiosClient.get('/social/meta-connection'),
  // Facebook Login (OAuth) flow.
  oauthStart: () => axiosClient.get('/social/meta-connection/oauth/start'),
  oauthExchange: (payload) => axiosClient.post('/social/meta-connection/oauth/exchange', payload),
  finalize: (payload) => axiosClient.post('/social/meta-connection', payload),
  disconnect: (id) => axiosClient.delete(`/social/meta-connection/${id}`),
};
