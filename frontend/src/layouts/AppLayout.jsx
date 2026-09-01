import { useState } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { NAV_SECTIONS } from './navConfig';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { useThemeMode } from '../theme/ThemeModeProvider';

const DRAWER_WIDTH = 256;

function SidebarContent({ role, onNavigate }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>RE</Avatar>
        <Typography variant="h6" noWrap>
          RealEstate CRM
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflowY: 'auto', flex: 1, py: 1 }}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => !item.roles || item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <Box key={section.title || 'main'} sx={{ mb: 1 }}>
              {section.title && (
                <Typography
                  variant="caption"
                  sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 700 }}
                >
                  {section.title.toUpperCase()}
                </Typography>
              )}
              <List dense disablePadding>
                {visibleItems.map((item) => (
                  <ListItemButton
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    sx={{
                      mx: 1,
                      borderRadius: 1.5,
                      '&.active': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }}>{item.label}</ListItemText>
                  </ListItemButton>
                ))}
              </List>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const { user } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNavItem = NAV_SECTIONS.flatMap((s) => s.items).find(
    (item) => item.to === location.pathname || (item.to !== '/' && location.pathname.startsWith(item.to))
  );

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider' },
        }}
      >
        <SidebarContent role={user?.role} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
              {currentNavItem?.label || 'RealEstate CRM'}
            </Typography>
            <IconButton onClick={toggleMode} aria-label="Toggle color mode">
              {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                {user?.name?.[0]?.toUpperCase() || <PersonOutlineIcon fontSize="small" />}
              </Avatar>
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email} · {user?.role}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  navigate('/profile');
                }}
              >
                <ListItemIcon>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
