import { useEffect } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { ROLE, ROLE_LABEL, manageableRoles } from '../../constants/roles';

const GENDERS = ['Male', 'Female', 'Other'];
const EMPTY = { name: '', email: '', mobileNumber: '', gender: 'Male', address: '', role: ROLE.EMPLOYEE };

export function EmployeeFormDialog({ open, onClose, onSubmit, submitting }) {
  const auth = useAuth();
  const roleOptions = manageableRoles(auth);
  const { values, handleChange, setValues, reset } = useForm(EMPTY);
  const isPrivilegedRole = values.role === ROLE.ADMIN || values.role === ROLE.SUPER_ADMIN;

  useEffect(() => {
    if (open) setValues(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    const ok = await onSubmit(values);
    if (ok) {
      reset(EMPTY);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New team member</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={7}>
            <TextField label="Full name" value={values.name} onChange={handleChange('name')} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField select label="Gender" value={values.gender} onChange={handleChange('gender')} fullWidth>
              {GENDERS.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mobile number"
              value={values.mobileNumber}
              onChange={handleChange('mobileNumber')}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address (optional)" value={values.address} onChange={handleChange('address')} fullWidth />
          </Grid>
          {roleOptions.length > 1 && (
            <Grid item xs={12}>
              <TextField select label="Role" value={values.role} onChange={handleChange('role')} fullWidth>
                {roleOptions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          {isPrivilegedRole && (
            <Grid item xs={12}>
              <Alert severity="warning">
                {ROLE_LABEL[values.role]}s have org-wide access to every project, lead and the Facebook Lead Ads
                integration
                {values.role === ROLE.SUPER_ADMIN ? ', and can manage Admins.' : '.'}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color={isPrivilegedRole ? 'warning' : 'primary'}
          onClick={handleSave}
          disabled={submitting || !values.name || !values.email || !values.mobileNumber}
        >
          {isPrivilegedRole ? `Create ${ROLE_LABEL[values.role]}` : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
