import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { dismissToast } from '../features/ui/uiSlice';

// Bridges Redux's toast queue (dispatched from anywhere — thunks, components)
// into notistack's imperative snackbar API.
export function ToastHost() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    toasts.forEach((toast) => {
      enqueueSnackbar(toast.message, { variant: toast.severity });
      dispatch(dismissToast(toast.id));
    });
  }, [toasts, enqueueSnackbar, dispatch]);

  return null;
}
