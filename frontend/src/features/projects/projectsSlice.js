import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createListSlice } from '../../app/createListSlice';
import { projectApi } from '../../api/endpoints/projectApi';
import { parseApiError } from '../../utils/errorMessage';

const { slice, fetchItems: fetchProjects } = createListSlice({
  name: 'projects',
  fetchList: async (params) => {
    const res = await projectApi.list(params);
    return { items: res.data, meta: res.meta };
  },
  initialFilters: { page: 1, limit: 10, search: '', type: '', isActive: '' },
});

export const createProject = createAsyncThunk('projects/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await projectApi.create(payload);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await projectApi.update(id, payload);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const removeProject = createAsyncThunk('projects/remove', async (id, { rejectWithValue }) => {
  try {
    await projectApi.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchProjectDetail = createAsyncThunk('projects/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    const res = await projectApi.get(id);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

const detailSlice = createSlice({
  name: 'projectDetail',
  initialState: { current: null, status: 'idle', error: null },
  reducers: {
    clearProjectDetail(state) {
      state.current = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectDetail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjectDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchProjectDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setFilters, resetFilters } = slice.actions;
export const { clearProjectDetail } = detailSlice.actions;
export { fetchProjects };
export const projectsReducer = slice.reducer;
export const projectDetailReducer = detailSlice.reducer;
