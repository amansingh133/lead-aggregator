import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from '../../hooks/useForm';
import { LEAD_STATUS, VISIT_STATUSES } from '../../constants/leadStatus';
import { FOLLOWUP_TYPE } from '../../constants/followupType';

const EMPTY = {
  nextFollowUpDate: '',
  numberOfClients: 1,
  type: 'Call',
  remarks: '',
  status: '',
  visitDate: '',
};

export function FollowUpForm({ onSubmit, submitting, currentStatus }) {
  const { values, handleChange, reset } = useForm(EMPTY);
  const needsVisitDate = VISIT_STATUSES.includes(values.status);

  const handleSave = async () => {
    const payload = {
      nextFollowUpDate: values.nextFollowUpDate,
      numberOfClients: Number(values.numberOfClients) || 1,
      type: values.type,
      remarks: values.remarks,
      ...(values.status ? { status: values.status } : {}),
      ...(needsVisitDate ? { visitDate: values.visitDate } : {}),
    };
    const ok = await onSubmit(payload);
    if (ok) reset(EMPTY);
  };

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Next follow-up date"
            type="datetime-local"
            value={values.nextFollowUpDate}
            onChange={handleChange('nextFollowUpDate')}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Contact type" value={values.type} onChange={handleChange('type')} fullWidth>
            {FOLLOWUP_TYPE.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Update status"
            value={values.status}
            onChange={handleChange('status')}
            fullWidth
            helperText={`Currently: ${currentStatus}`}
          >
            <MenuItem value="">Keep current status</MenuItem>
            {LEAD_STATUS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Number of clients"
            type="number"
            value={values.numberOfClients}
            onChange={handleChange('numberOfClients')}
            fullWidth
          />
        </Grid>
        {needsVisitDate && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Visit date"
              type="datetime-local"
              value={values.visitDate}
              onChange={handleChange('visitDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
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
      <Stack direction="row">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitting || !values.nextFollowUpDate || (needsVisitDate && !values.visitDate)}
        >
          Log follow-up
        </Button>
      </Stack>
    </Stack>
  );
}
