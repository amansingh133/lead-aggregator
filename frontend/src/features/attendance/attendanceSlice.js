import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/endpoints/attendanceApi';
import { parseApiError } from '../../utils/errorMessage';

export const fetchStatus = createAsyncThunk('attendance/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    const res = await attendanceApi.status();
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const toggleAttendance = createAsyncThunk('attendance/toggle', async (payload, { rejectWithValue }) => {
  try {
    const res = await attendanceApi.toggle(payload);
    return res.data; // { action, attendance }
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchMonthlyReport = createAsyncThunk(
  'attendance/fetchMonthlyReport',
  async (params, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.monthlyReport(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayStatus: null,
    monthlyReport: null,
    status: 'idle',
    toggleStatus: 'idle',
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.todayStatus = action.payload;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(toggleAttendance.pending, (state) => {
        state.toggleStatus = 'loading';
      })
      .addCase(toggleAttendance.fulfilled, (state) => {
        state.toggleStatus = 'succeeded';
      })
      .addCase(toggleAttendance.rejected, (state, action) => {
        state.toggleStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.monthlyReport = action.payload;
      });
  },
});

export default attendanceSlice.reducer;
