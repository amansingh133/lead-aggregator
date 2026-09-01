import { Stack } from '@mui/material';

export function FilterBar({ children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      {children}
    </Stack>
  );
}
