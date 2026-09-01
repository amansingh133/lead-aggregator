import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createListSlice } from '../../app/createListSlice';
import { leadApi } from '../../api/endpoints/leadApi';
import { followupApi } from '../../api/endpoints/followupApi';
import { parseApiError } from '../../utils/errorMessage';

const { slice, fetchItems: fetchLeads } = createListSlice({
  name: 'leads',
  fetchList: async (params) => {
    const res = await leadApi.list(params);
    return { items: res.data, meta: res.meta };
  },
  initialFilters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    project: '',
    type: '',
    assignedTo: '',
    origin: '',
    platform: '',
    campaignId: '',
    adsetId: '',
    adId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
});

export const createLead = createAsyncThunk('leads/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await leadApi.create(payload);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const updateLead = createAsyncThunk('leads/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await leadApi.update(id, payload);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const removeLead = createAsyncThunk('leads/remove', async (id, { rejectWithValue }) => {
  try {
    await leadApi.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchLeadDetail = createAsyncThunk('leads/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    const res = await leadApi.get(id);
    return res.data; // { lead, followUpHistory }
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const addFollowUp = createAsyncThunk('leads/addFollowUp', async ({ leadId, payload }, { rejectWithValue }) => {
  try {
    const res = await leadApi.addFollowUp(leadId, payload);
    return res.data; // { followUp, lead }
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const updateFollowUp = createAsyncThunk(
  'leads/updateFollowUp',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await followupApi.update(id, payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

export const removeFollowUp = createAsyncThunk('leads/removeFollowUp', async (id, { rejectWithValue }) => {
  try {
    await followupApi.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

const detailSlice = createSlice({
  name: 'leadDetail',
  initialState: { lead: null, followUpHistory: [], status: 'idle', error: null },
  reducers: {
    clearLeadDetail(state) {
      state.lead = null;
      state.followUpHistory = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadDetail.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLeadDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lead = action.payload.lead;
        state.followUpHistory = action.payload.followUpHistory;
      })
      .addCase(fetchLeadDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        if (state.lead && state.lead._id === action.payload._id) {
          state.lead = { ...state.lead, ...action.payload };
        }
      })
      .addCase(addFollowUp.fulfilled, (state, action) => {
        state.followUpHistory.unshift(action.payload.followUp);
        if (state.lead && state.lead._id === action.payload.lead._id) {
          state.lead = { ...state.lead, ...action.payload.lead };
        }
      })
      .addCase(updateFollowUp.fulfilled, (state, action) => {
        const idx = state.followUpHistory.findIndex((f) => f._id === action.payload._id);
        if (idx !== -1) state.followUpHistory[idx] = action.payload;
      })
      .addCase(removeFollowUp.fulfilled, (state, action) => {
        state.followUpHistory = state.followUpHistory.filter((f) => f._id !== action.payload);
      });
  },
});

export const { setFilters, resetFilters } = slice.actions;
export const { clearLeadDetail } = detailSlice.actions;
export { fetchLeads };
export const leadsReducer = slice.reducer;
export const leadDetailReducer = detailSlice.reducer;
