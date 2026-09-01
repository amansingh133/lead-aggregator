import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { useAppDispatch } from '../../app/hooks';
import { bootstrapSuperAdmin } from '../../features/auth/authSlice';
import { authApi } from '../../api/endpoints/authApi';
import { LoadingState } from '../../components/LoadingState';

const GENDERS = ['Male', 'Female', 'Other'];

// Hidden, one-time route. Renders the form only while the deployment has no
// Super Admin; the moment one exists this redirects to /login and the
// backend endpoint 404s. There is no link to this page anywhere.
export default function SetupSuperAdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [available, setAvailable] = useState(null); // null = checking
  const [formError, setFormError] = useState(null);
  const { values, errors, handleChange, handleSubmit, submitting, setFieldErrors } = useForm({
    name: '',
    email: '',
    mobileNumber: '',
    gender: 'Male',
    address: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let alive = true;
    authApi
      .bootstrapStatus()
      .then((res) => alive && setAvailable(Boolean(res.data?.available)))
      .catch(() => alive && setAvailable(false));
    return () => {
      alive = false;
    };
  }, []);

  if (available === null) return <LoadingState minHeight="40vh" />;
  if (available === false) return <Navigate to="/login" replace />;

  const onSubmit = handleSubmit(async (vals) => {
    setFormError(null);
    if (vals.password !== vals.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    const result = await dispatch(bootstrapSuperAdmin(vals));
    if (bootstrapSuperAdmin.fulfilled.match(result)) {
      navigate('/', { replace: true });
    } else {
      setFormError(result.payload?.message || 'Setup failed');
      setFieldErrors(result.payload?.fieldErrors || {});
    }
  });

  return (
    <Stack component="form" spacing={2} onSubmit={onSubmit}>
      <Typography variant="h6" textAlign="center">
        Create the first Super Admin
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        This one-time setup is only available until the first account is created.
      </Typography>
      {formError && <Alert severity="error">{formError}</Alert>}
      <TextField label="Full name" value={values.name} onChange={handleChange('name')} required fullWidth />
      <TextField
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        error={Boolean(errors.email)}
        helperText={errors.email}
        required
        fullWidth
      />
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <TextField
            label="Mobile number"
            value={values.mobileNumber}
            onChange={handleChange('mobileNumber')}
            error={Boolean(errors.mobileNumber)}
            helperText={errors.mobileNumber}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={5}>
          <TextField select label="Gender" value={values.gender} onChange={handleChange('gender')} fullWidth>
            {GENDERS.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <TextField label="Address (optional)" value={values.address} onChange={handleChange('address')} fullWidth />
      <TextField
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        required
        fullWidth
      />
      <TextField
        label="Confirm password"
        type="password"
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword}
        required
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={submitting}>
        Create Super Admin
      </Button>
    </Stack>
  );
}
