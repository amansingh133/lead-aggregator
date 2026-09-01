import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { metaConnectionApi } from '../../api/endpoints/metaConnectionApi';
import { parseApiError } from '../../utils/errorMessage';

// Holds the NON-secret list of connected Facebook Pages. Access tokens are
// never sent here by the backend and never stored in Redux.
export const fetchMetaConnections = createAsyncThunk(
  'metaConnection/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await metaConnectionApi.list();
      return res.data; // [{ id, pageId, pageName, adAccounts, webhookSubscribed, ... }]
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

// Step 1: get the Facebook login URL (the component then redirects the browser).
export const startMetaOAuth = createAsyncThunk(
  'metaConnection/oauthStart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await metaConnectionApi.oauthStart();
      return res.data; // { authUrl }
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

// Step 2: exchange the returned code -> { sessionId, pages, adAccounts }.
export const exchangeMetaOAuth = createAsyncThunk(
  'metaConnection/oauthExchange',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await metaConnectionApi.oauthExchange(payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

// Step 3: connect the Pages the user picked.
export const finalizeMetaConnections = createAsyncThunk(
  'metaConnection/finalize',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await metaConnectionApi.finalize(payload);
      return res.data; // { connected: [...] }
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const disconnectMeta = createAsyncThunk(
  'metaConnection/disconnect',
  async (id, { rejectWithValue }) => {
    try {
      await metaConnectionApi.disconnect(id);
      return id;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

const metaConnectionSlice = createSlice({
  name: 'metaConnection',
  initialState: { connections: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetaConnections.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMetaConnections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.connections = action.payload;
      })
      .addCase(fetchMetaConnections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(disconnectMeta.fulfilled, (state, action) => {
        state.connections = state.connections.filter((c) => c.id !== action.payload);
      });
  },
});

export default metaConnectionSlice.reducer;
