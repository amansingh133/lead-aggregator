import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createListSlice } from '../../app/createListSlice';
import { adminApi } from '../../api/endpoints/adminApi';
import { parseApiError } from '../../utils/errorMessage';

const { slice, fetchItems: fetchEmployees } = createListSlice({
  name: 'employees',
  fetchList: async (params) => {
    const res = await adminApi.listEmployees(params);
    return { items: res.data, meta: res.meta };
  },
  initialFilters: { page: 1, limit: 10, search: '', isActive: '', role: '' },
});

export const createEmployee = createAsyncThunk('employees/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await adminApi.createEmployee(payload);
    return res.data; // { employee, temporaryPassword }
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const updateEmployee = createAsyncThunk('employees/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const res = await adminApi.updateEmployee(id, payload);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const removeEmployee = createAsyncThunk('employees/remove', async (id, { rejectWithValue }) => {
  try {
    await adminApi.removeEmployee(id);
    return id;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchEmployeeDetail = createAsyncThunk('employees/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    const res = await adminApi.getEmployee(id);
    return res.data;
  } catch (error) {
    return rejectWithValue(parseApiError(error));
  }
});

export const fetchEmployeeMonthlyAttendance = createAsyncThunk(
  'employees/fetchMonthlyAttendance',
  async ({ employeeId, params }, { rejectWithValue }) => {
    try {
      const res = await adminApi.employeeMonthlyAttendance(employeeId, params);
      return res.data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  }
);

const detailSlice = createSlice({
  name: 'employeeDetail',
  initialState: { current: null, monthlyAttendance: null, status: 'idle', error: null },
  reducers: {
    clearEmployeeDetail(state) {
      state.current = null;
      state.monthlyAttendance = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeDetail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmployeeDetail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchEmployeeDetail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        if (state.current && state.current._id === action.payload._id) {
          state.current = action.payload;
        }
      })
      .addCase(fetchEmployeeMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyAttendance = action.payload;
      });
  },
});

export const { setFilters, resetFilters } = slice.actions;
export const { clearEmployeeDetail } = detailSlice.actions;
export { fetchEmployees };
export const employeesReducer = slice.reducer;
export const employeeDetailReducer = detailSlice.reducer;
