import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  toasts: [], // {id, message, severity}
  confirm: null, // {title, message, confirmLabel, severity, resolveId} | null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare(message, severity = 'info') {
        return { payload: { id: nanoid(), message, severity } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    askConfirm: {
      reducer(state, action) {
        state.confirm = action.payload;
      },
      prepare({ title, message, confirmLabel = 'Confirm', severity = 'warning' }) {
        return { payload: { id: nanoid(), title, message, confirmLabel, severity } };
      },
    },
    resolveConfirm(state) {
      state.confirm = null;
    },
  },
});

export const { showToast, dismissToast, askConfirm, resolveConfirm } = uiSlice.actions;
export default uiSlice.reducer;
