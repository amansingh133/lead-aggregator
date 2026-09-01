import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: '60vh', textAlign: 'center' }}>
      <Typography variant="h2">404</Typography>
      <Typography variant="body1" color="text.secondary">
        This page doesn&apos;t exist.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to dashboard
      </Button>
    </Stack>
  );
}
