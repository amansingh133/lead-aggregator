import { Outlet } from 'react-router-dom';
import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 } }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            <ApartmentOutlinedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700}>
            RealEstate CRM
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Leads, projects &amp; social media, in one place.
          </Typography>
        </Stack>
        <Outlet />
      </Paper>
    </Box>
  );
}
