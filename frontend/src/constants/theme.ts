// ── Design Tokens ─────────────────────────────────────────────────────────────

export const GOLD = '#C8A96E';
export const GOLD_LIGHT = '#D4B87A';
export const GOLD_DARK = '#A07840';

export const FONTS = {
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  cinzel: 'Cinzel_400Regular',
  cinzelBold: 'Cinzel_700Bold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Dark theme (default)
export const DARK_THEME = {
  bg: '#0A0A0A',
  bgSurface: '#111111',
  bgElevated: '#1C1C1C',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#606060',
  gold: GOLD,
  border: '#2A2A2A',
  success: '#2ECC71',
  danger: '#E74C3C',
  info: '#3498DB',
};

// Light theme
export const LIGHT_THEME = {
  bg: '#F4F4F0',
  bgSurface: '#FFFFFF',
  bgElevated: '#EAEAE5',
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#9A9A9A',
  gold: GOLD_DARK,
  border: '#DDDDD8',
  success: '#27AE60',
  danger: '#E74C3C',
  info: '#2980B9',
};

export type AppTheme = typeof DARK_THEME;
