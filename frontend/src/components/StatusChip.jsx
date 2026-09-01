import { Chip } from '@mui/material';
import { LEAD_STATUS_COLOR } from '../constants/leadStatus';

export function StatusChip({ status }) {
  return <Chip label={status} color={LEAD_STATUS_COLOR[status] || 'default'} size="small" variant="outlined" />;
}
