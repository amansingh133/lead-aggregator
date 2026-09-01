import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { useAppDispatch } from '../../app/hooks';
import { login } from '../../features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const { values, handleChange, handleSubmit, submitting } = useForm({ username: '', password: '' });

  const onSubmit = handleSubmit(async (vals) => {
    setFormError(null);
    const result = await dispatch(login(vals));
    if (login.fulfilled.match(result)) {
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } else {
      setFormError(result.payload?.message || 'Login failed');
    }
  });

  return (
    <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
      <Typography variant="h6" textAlign="center">
        Sign in
      </Typography>
      {formError && <Alert severity="error">{formError}</Alert>}
      <TextField
        label="Email or username"
        value={values.username}
        onChange={handleChange('username')}
        autoFocus
        fullWidth
        required
      />
      <TextField
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        fullWidth
        required
      />
      <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ alignSelf: 'flex-end' }}>
        Forgot password?
      </Link>
      <Button type="submit" variant="contained" size="large" disabled={submitting}>
        Sign in
      </Button>
    </Stack>
  );
}
