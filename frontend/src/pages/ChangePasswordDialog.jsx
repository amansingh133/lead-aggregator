import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useAppDispatch } from '../app/hooks';
import {
  changePasswordRequest,
  changePasswordResend,
  changePasswordConfirm,
  logout,
} from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';
import { PasswordFields } from '../components/PasswordFields';
import { ResendOtpButton } from '../components/ResendOtpButton';

// Two-step, authenticated password change (never touches the public reset
// routes): current password + new password -> OTP -> confirm -> forced re-login.
export function ChangePasswordDialog({ open, onClose }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState('');
  const [pw, setPw] = useState({ value: '', valid: false });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setOldPassword('');
      setPw({ value: '', valid: false });
      setOtp('');
      setError(null);
    }
  }, [open]);

  const submitRequest = async () => {
    setError(null);
    setBusy(true);
    const result = await dispatch(
      changePasswordRequest({ oldPassword, newPassword: pw.value }),
    );
    setBusy(false);
    if (changePasswordRequest.fulfilled.match(result)) {
      dispatch(showToast(result.payload?.message || 'Verification code sent', 'success'));
      setStep(2);
    } else {
      setError(result.payload?.message || 'Could not start password change');
    }
  };

  const submitConfirm = async () => {
    setError(null);
    setBusy(true);
    const result = await dispatch(changePasswordConfirm({ otp, newPassword: pw.value }));
    setBusy(false);
    if (changePasswordConfirm.fulfilled.match(result)) {
      dispatch(showToast('Password changed. Please sign in again.', 'success'));
      await dispatch(logout());
      navigate('/login', { replace: true });
    } else {
      setError(result.payload?.message || 'Could not change password');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {step === 1 ? (
            <>
              <TextField
                label="Current password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                fullWidth
                required
              />
              <PasswordFields onChange={setPw} />
            </>
          ) : (
            <>
              <Alert severity="info">Enter the verification code sent to your email.</Alert>
              <TextField
                label="Verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                fullWidth
                required
                autoFocus
              />
              <ResendOtpButton onResend={() => dispatch(changePasswordResend())} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        {step === 1 ? (
          <Button
            variant="contained"
            onClick={submitRequest}
            disabled={busy || !oldPassword || !pw.valid}
          >
            Send code
          </Button>
        ) : (
          <Button variant="contained" onClick={submitConfirm} disabled={busy || !otp}>
            Change password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
