import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/endpoints/dashboardApi';
import { parseApiError } from '../../utils/errorMessage';

export const fetchSummary = createAsyncThunk('dashboard/fetchSummary', async (params, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.summary(params);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchFollowUps = createAsyncThunk('dashboard/fetchFollowUps', async (params, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.followUps(params);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchVisits = createAsyncThunk('dashboard/fetchVisits', async (params, { rejectWithValue }) => {
  try {
    const res = await dashboardApi.visits(params);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    summary: null,
    followUps: [],
    visits: [],
    status: 'idle',
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFollowUps.fulfilled, (state, action) => {
        state.followUps = action.payload;
      })
      .addCase(fetchVisits.fulfilled, (state, action) => {
        state.visits = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
