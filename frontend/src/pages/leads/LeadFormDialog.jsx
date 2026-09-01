import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { LEAD_TYPE } from '../../constants/leadStatus';
import { useAuth } from '../../hooks/useAuth';

const EMPTY = {
  name: '',
  mobileNumber: '',
  alternateNumber: '',
  project: '',
  type: 'Client',
  budget: '',
  source: '',
  location: '',
  remarks: '',
  assignedTo: '',
};

export function LeadFormDialog({ open, onClose, onSubmit, projects, employees, submitting }) {
  const { isAdmin } = useAuth();
  const { values, handleChange, setValues, reset } = useForm(EMPTY);

  useEffect(() => {
    if (open) setValues(EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    const payload = { ...values, budget: values.budget === '' ? undefined : Number(values.budget) };
    const ok = await onSubmit(payload);
    if (ok) {
      reset(EMPTY);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New lead</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={7}>
            <TextField label="Name" value={values.name} onChange={handleChange('name')} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Mobile number"
              value={values.mobileNumber}
              onChange={handleChange('mobileNumber')}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Project"
              value={values.project}
              onChange={handleChange('project')}
              fullWidth
              required
            >
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Type" value={values.type} onChange={handleChange('type')} fullWidth>
              {LEAD_TYPE.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Budget" type="number" value={values.budget} onChange={handleChange('budget')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Source" value={values.source} onChange={handleChange('source')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Location" value={values.location} onChange={handleChange('location')} fullWidth />
          </Grid>
          {isAdmin && (
            <Grid item xs={12}>
              <TextField
                select
                label="Assign to"
                value={values.assignedTo}
                onChange={handleChange('assignedTo')}
                fullWidth
              >
                <MenuItem value="">Myself</MenuItem>
                {employees.map((e) => (
                  <MenuItem key={e._id} value={e._id}>
                    {e.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              label="Remarks"
              value={values.remarks}
              onChange={handleChange('remarks')}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitting || !values.name || !values.mobileNumber || !values.project}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
