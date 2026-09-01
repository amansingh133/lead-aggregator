import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { PageHeader } from '../components/PageHeader';
import { useForm } from '../hooks/useForm';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProfile, updateProfile } from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';
import { ChangePasswordDialog } from './ChangePasswordDialog';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const { values, handleChange, handleSubmit, submitting, setValues } = useForm({
    name: user?.name || '',
    mobileNumber: user?.mobileNumber || '',
    address: user?.address || '',
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setValues({ name: user.name || '', mobileNumber: user.mobileNumber || '', address: user.address || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const onSubmit = handleSubmit(async (vals) => {
    const result = await dispatch(updateProfile(vals));
    if (updateProfile.fulfilled.match(result)) {
      dispatch(showToast('Profile updated', 'success'));
    } else {
      dispatch(showToast(result.payload?.message || 'Update failed', 'error'));
    }
  });

  return (
    <>
      <PageHeader title="My Profile" />
      <Card variant="outlined" sx={{ maxWidth: 560 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Chip label={user?.role} color="primary" size="small" />
            <Chip label={user?.email} variant="outlined" size="small" />
          </Stack>
          <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Full name" value={values.name} onChange={handleChange('name')} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mobile number"
                  value={values.mobileNumber}
                  onChange={handleChange('mobileNumber')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" value={values.address} onChange={handleChange('address')} fullWidth />
              </Grid>
            </Grid>
            <Stack direction="row">
              <Button type="submit" variant="contained" disabled={submitting}>
                Save changes
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack>
              <Typography variant="subtitle2">Password</Typography>
              <Typography variant="body2" color="text.secondary">
                You&apos;ll verify a one-time code sent to your email.
              </Typography>
            </Stack>
            <Button startIcon={<LockResetIcon />} onClick={() => setPwDialogOpen(true)}>
              Change password
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} />
    </>
  );
}
