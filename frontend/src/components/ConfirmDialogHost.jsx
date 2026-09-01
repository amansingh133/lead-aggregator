import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { resolveConfirm } from '../features/ui/uiSlice';
import { resolveConfirmPromise } from '../hooks/useConfirm';

export function ConfirmDialogHost() {
  const dispatch = useAppDispatch();
  const confirm = useAppSelector((state) => state.ui.confirm);

  const handleClose = (confirmed) => {
    if (confirm) resolveConfirmPromise(confirm.id, confirmed);
    dispatch(resolveConfirm());
  };

  return (
    <Dialog open={Boolean(confirm)} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{confirm?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{confirm?.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>Cancel</Button>
        <Button
          onClick={() => handleClose(true)}
          color={confirm?.severity === 'error' ? 'error' : 'primary'}
          variant="contained"
          autoFocus
        >
          {confirm?.confirmLabel || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
