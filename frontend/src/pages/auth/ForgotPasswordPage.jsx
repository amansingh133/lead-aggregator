import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { useAppDispatch } from '../../app/hooks';
import { forgotPassword } from '../../features/auth/authSlice';

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const { values, handleChange, handleSubmit, submitting } = useForm({ email: '' });

  const onSubmit = handleSubmit(async (vals) => {
    setFormError(null);
    const result = await dispatch(forgotPassword(vals));
    if (forgotPassword.fulfilled.match(result)) {
      navigate('/verify-otp', { state: { email: vals.email } });
    } else {
      setFormError(result.payload?.message || 'Request failed');
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
      <Typography variant="h6" textAlign="center">
        Forgot password
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        We&apos;ll email you an OTP to reset your password.
      </Typography>
      {formError && <Alert severity="error">{formError}</Alert>}
      <TextField
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        autoFocus
        required
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={submitting}>
        Send OTP
      </Button>
    </Stack>
  );
}
