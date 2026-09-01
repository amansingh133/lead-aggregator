import axios from 'axios';
import { env } from '../config/env';
import { sessionExpired } from '../features/auth/authActions';

// Store is injected after creation (store.js imports this file, so this file
// cannot import store.js back without a circular import) — see attachStore below.
let storeRef = null;
export function attachStore(store) {
  storeRef = store;
}

const axiosClient = axios.create({
  baseURL: `${env.apiBaseUrl}${env.apiPrefix}`,
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = storeRef?.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // List pages keep every filter key in Redux state (e.g. isActive: '') so
  // controlled <TextField select> inputs always have a defined value. Some
  // backend list controllers (e.g. GET /projects) treat an explicitly
  // present but empty query param as a real filter value rather than
  // "unset" — so strip empty/null/undefined params here, once, instead of
  // requiring every endpoint call site to remember to.
  if (config.params) {
    config.params = Object.fromEntries(
      Object.entries(config.params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const isAuthEndpoint = error?.config?.url?.includes('/auth/login');
    if (error?.response?.status === 401 && !isAuthEndpoint && storeRef) {
      storeRef.dispatch(sessionExpired());
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
