import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { useAppDispatch } from '../../app/hooks';
import { verifyOtp, resendOtp } from '../../features/auth/authSlice';
import { ResendOtpButton } from '../../components/ResendOtpButton';

// Middle step of the public password-reset chain: confirm the emailed code
// (without consuming it), then move on to set a new password.
export default function VerifyOtpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [formError, setFormError] = useState(null);
  const { values, handleChange, handleSubmit, submitting } = useForm({ otp: '' });

  // Reached without going through "forgot password" first.
  if (!email) return <Navigate to="/forgot-password" replace />;

  const onSubmit = handleSubmit(async (vals) => {
    setFormError(null);
    const result = await dispatch(verifyOtp({ email, otp: vals.otp }));
    if (verifyOtp.fulfilled.match(result)) {
      navigate('/reset-password', { state: { email, otp: vals.otp } });
    } else {
      setFormError(result.payload?.message || 'Verification failed');
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
      <Typography variant="h6" textAlign="center">
        Enter the code
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        We sent a one-time code to {email}.
      </Typography>
      {formError && <Alert severity="error">{formError}</Alert>}
      <TextField label="OTP" value={values.otp} onChange={handleChange('otp')} required fullWidth autoFocus />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <ResendOtpButton onResend={() => dispatch(resendOtp({ email }))} />
        <Link component={RouterLink} to="/login" variant="body2">
          Back to sign in
        </Link>
      </Stack>
      <Button type="submit" variant="contained" size="large" disabled={submitting || !values.otp}>
        Continue
      </Button>
    </Stack>
  );
}
