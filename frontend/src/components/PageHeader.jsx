import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function PageHeader({ title, breadcrumbs, actions }) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 0.5 }} fontSize="small">
          {breadcrumbs.map((crumb, i) =>
            crumb.to && i !== breadcrumbs.length - 1 ? (
              <MuiLink key={crumb.label} component={RouterLink} to={crumb.to} underline="hover" color="inherit">
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={crumb.label} color="text.primary" variant="body2">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Typography variant="h4">{title}</Typography>
        {actions && (
          <Stack direction="row" spacing={1}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
