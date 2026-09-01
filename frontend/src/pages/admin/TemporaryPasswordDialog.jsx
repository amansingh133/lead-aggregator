import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';

export function TemporaryPasswordDialog({ open, onClose, employee, temporaryPassword }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Employee created</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning">
            This password is shown once. Share it securely with {employee?.name} — it cannot be retrieved again.
          </Alert>
          <TextField
            label="Temporary password"
            value={temporaryPassword || ''}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
