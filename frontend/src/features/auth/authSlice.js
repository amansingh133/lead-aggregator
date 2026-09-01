import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/endpoints/authApi';
import { parseApiError } from '../../utils/errorMessage';
import { sessionExpired } from './authActions';

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

function readStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    return { token: token || null, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return { token: null, user: null };
  }
}

function persistAuth(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // ignore storage failures
  }
}

const thunk = (name, fn) =>
  createAsyncThunk(name, async (payload, { rejectWithValue }) => {
    try {
      return await fn(payload);
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  });

export const login = thunk('auth/login', async (payload) => (await authApi.login(payload)).data);

// One-time primary Super Admin creation - signs the operator straight in.
export const bootstrapSuperAdmin = thunk(
  'auth/bootstrapSuperAdmin',
  async (payload) => (await authApi.bootstrapSuperAdmin(payload)).data,
);

// Public reset flow
export const forgotPassword = thunk('auth/forgotPassword', async (payload) => {
  await authApi.forgotPassword(payload);
  return true;
});
export const verifyOtp = thunk('auth/verifyOtp', async (payload) => {
  await authApi.verifyOtp(payload); // { ok: true } - no token, does not consume the OTP
  return true;
});
export const resendOtp = thunk('auth/resendOtp', async (payload) => {
  await authApi.resendOtp(payload);
  return true;
});
export const resetPassword = thunk('auth/resetPassword', async (payload) => {
  await authApi.resetPassword(payload);
  return true;
});

// Authenticated change-password flow (profile page)
export const changePasswordRequest = thunk(
  'auth/changePasswordRequest',
  async (payload) => (await authApi.changePasswordRequest(payload)).data,
);
export const changePasswordResend = thunk('auth/changePasswordResend', async () => {
  await authApi.changePasswordResend();
  return true;
});
export const changePasswordConfirm = thunk(
  'auth/changePasswordConfirm',
  async (payload) => (await authApi.changePasswordConfirm(payload)).data,
);

export const fetchProfile = thunk('auth/fetchProfile', async () => (await authApi.getProfile()).data);
export const updateProfile = thunk('auth/updateProfile', async (payload) => (await authApi.updateProfile(payload)).data);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // logout locally regardless of whether the server call succeeded
  }
  return true;
});

const stored = readStoredAuth();

function applyAuth(state, { token, user }) {
  state.status = 'succeeded';
  state.token = token;
  state.user = user;
  persistAuth(token, user);
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: stored.token,
    user: stored.user,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sessionExpired, (state) => {
        state.token = null;
        state.user = null;
        persistAuth(null, null);
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => applyAuth(state, action.payload))
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(bootstrapSuperAdmin.fulfilled, (state, action) => applyAuth(state, action.payload))
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        persistAuth(state.token, action.payload);
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        persistAuth(state.token, action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = 'idle';
        persistAuth(null, null);
      });
  },
});

export { sessionExpired };
export default authSlice.reducer;
