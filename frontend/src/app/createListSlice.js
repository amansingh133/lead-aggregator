import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { parseApiError } from '../utils/errorMessage';

// Every list-bearing feature (projects, leads, employees, posts, ad accounts, ...)
// needs the same {items, meta, filters, status, error} shape and fetch lifecycle.
// This factory removes that repetition; each slice still owns its own extra
// thunks/reducers (create/update/remove, detail state, etc.) alongside it.
export function createListSlice({ name, fetchList, initialFilters = {} }) {
  const fetchItems = createAsyncThunk(`${name}/fetchItems`, async (params, { rejectWithValue }) => {
    try {
      return await fetchList(params);
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  });

  const slice = createSlice({
    name,
    initialState: {
      items: [],
      meta: null,
      filters: initialFilters,
      status: 'idle',
      error: null,
    },
    reducers: {
      setFilters(state, action) {
        state.filters = { ...state.filters, ...action.payload };
      },
      resetFilters(state) {
        state.filters = initialFilters;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchItems.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchItems.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.items = action.payload.items;
          state.meta = action.payload.meta ?? null;
        })
        .addCase(fetchItems.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        });
    },
  });

  return { slice, fetchItems };
}
