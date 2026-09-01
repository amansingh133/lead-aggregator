import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { PROJECT_TYPE } from '../../constants/projectType';

const EMPTY = { name: '', type: 'Flats', location: '', description: '' };

export function ProjectFormDialog({ open, onClose, onSubmit, initialValues, submitting }) {
  const { values, handleChange, setValues, reset } = useForm(initialValues || EMPTY);

  useEffect(() => {
    if (open) setValues(initialValues || EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  const handleSave = async () => {
    const ok = await onSubmit(values);
    if (ok) {
      reset(EMPTY);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues ? 'Edit project' : 'New project'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={7}>
            <TextField label="Name" value={values.name} onChange={handleChange('name')} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField select label="Type" value={values.type} onChange={handleChange('type')} fullWidth>
              {PROJECT_TYPE.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Location" value={values.location} onChange={handleChange('location')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={values.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={submitting || !values.name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
