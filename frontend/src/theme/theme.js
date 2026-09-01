import { createTheme } from '@mui/material/styles';

// Design tokens shared by light/dark palettes — keeps the two modes visually
// consistent (same hue relationships) instead of maintaining two unrelated palettes.
const brand = {
  primary: '#3454D1',
  primaryDark: '#25397A',
  secondary: '#0EA5A5',
  success: '#22A06B',
  warning: '#D97706',
  error: '#DC3545',
  info: '#2E86DE',
};

const shape = { borderRadius: 10 };

const typography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: { fontWeight: 700, fontSize: '2rem' },
  h2: { fontWeight: 700, fontSize: '1.6rem' },
  h3: { fontWeight: 600, fontSize: '1.3rem' },
  h4: { fontWeight: 600, fontSize: '1.15rem' },
  h5: { fontWeight: 600, fontSize: '1rem' },
  h6: { fontWeight: 600, fontSize: '0.95rem' },
  button: { textTransform: 'none', fontWeight: 600 },
};

function buildPalette(mode) {
  const isLight = mode === 'light';
  return {
    mode,
    primary: { main: brand.primary, dark: brand.primaryDark, contrastText: '#fff' },
    secondary: { main: brand.secondary, contrastText: '#fff' },
    success: { main: brand.success },
    warning: { main: brand.warning },
    error: { main: brand.error },
    info: { main: brand.info },
    background: {
      default: isLight ? '#F4F6FB' : '#0F1420',
      paper: isLight ? '#FFFFFF' : '#171D2B',
    },
    text: {
      primary: isLight ? '#1A2033' : '#E7EAF3',
      secondary: isLight ? '#5B6478' : '#A0A8BD',
    },
    divider: isLight ? 'rgba(26,32,51,0.08)' : 'rgba(231,234,243,0.08)',
  };
}

export function buildTheme(mode) {
  return createTheme({
    palette: buildPalette(mode),
    shape,
    typography,
    shadows: createTheme().shadows.map((shadow, i) =>
      i === 0 ? 'none' : shadow.replace(/rgba\(0,0,0,0\.2\)/g, 'rgba(26,32,51,0.08)')
    ),
    components: {
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiTableCell: {
        styleOverrides: { head: { fontWeight: 700 } },
      },
    },
  });
}
