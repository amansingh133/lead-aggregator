import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { store } from './app/store';
import { router } from './routes/router';
import { ThemeModeProvider } from './theme/ThemeModeProvider';
import { ConfirmDialogHost } from './components/ConfirmDialogHost';
import { ToastHost } from './components/ToastHost';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeModeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ToastHost />
            <ConfirmDialogHost />
            <RouterProvider router={router} />
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeModeProvider>
    </Provider>
  );
}
