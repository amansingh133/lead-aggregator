import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useAppDispatch } from '../../app/hooks';
import { resetPassword } from '../../features/auth/authSlice';
import { PasswordFields } from '../../components/PasswordFields';

// Final step of the public password-reset chain. email + otp arrive from
// the verify step's router state; only the new password is entered here.
export default function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};
  const [pw, setPw] = useState({ value: '', valid: false });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!email || !otp) return <Navigate to="/forgot-password" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = await dispatch(resetPassword({ email, otp, newPassword: pw.value }));
    setSubmitting(false);
    if (resetPassword.fulfilled.match(result)) {
      navigate('/login', { replace: true });
    } else {
      setFormError(result.payload?.message || 'Reset failed');
    }
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
      <Typography variant="h6" textAlign="center">
        Set a new password
      </Typography>
      {formError && <Alert severity="error">{formError}</Alert>}
      <PasswordFields onChange={setPw} />
      <Button type="submit" variant="contained" size="large" disabled={submitting || !pw.valid}>
        Reset password
      </Button>
    </Stack>
  );
}
