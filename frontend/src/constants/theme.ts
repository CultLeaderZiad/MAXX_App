export const DARK_THEME = {
  bgPrimary: '#0A0A0A',
  bgSurface: '#111111',
  bgElevated: '#1A1A1A',
  bgInput: '#161616',
  gold: '#C8A96E',
  goldDim: '#8A7240',
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9A9A',
  textMuted: '#444444',
  border: '#2A2A2A',
  borderActive: '#C8A96E',
  green: '#2ECC71',
  red: '#E74C3C',
  orange: '#E67E22',
  blue: '#4A90D9',
  selectedBorder: 'rgba(200, 169, 110, 0.27)',
  goldGradient: ['#8A6420', '#C8A96E', '#F0D090'] as const,
};

export const LIGHT_THEME = {
  bgPrimary: '#F5F5F5',
  bgSurface: '#FFFFFF',
  bgElevated: '#F0F0F0',
  bgInput: '#EBEBEB',
  gold: '#B8860B',
  goldDim: '#8A7240',
  textPrimary: '#0A0A0A',
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#DDDDDD',
  borderActive: '#B8860B',
  green: '#2ECC71',
  red: '#E74C3C',
  orange: '#E67E22',
  blue: '#4A90D9',
  selectedBorder: 'rgba(184, 134, 11, 0.27)',
  goldGradient: ['#8A6420', '#B8860B', '#D4A843'] as const,
};

export type ThemeColors = typeof DARK_THEME;

export const FONTS = {
  cinzelBold: 'Cinzel_700Bold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
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
  sm: 8,
  md: 12,
  lg: 14,
  xl: 24,
  pill: 9999,
};

export const POWER_LEVEL_TITLES: Record<string, string> = {
  '0': 'Beginner',
  '200': 'Rising Alpha',
  '400': 'Iron Will',
  '600': 'Alpha Rising',
  '800': 'Sigma in Progress',
  '1000': 'Sigma',
};

export const getLevelTitle = (power: number): string => {
  if (power >= 1000) return 'Sigma';
  if (power >= 800) return 'Sigma in Progress';
  if (power >= 600) return 'Alpha Rising';
  if (power >= 400) return 'Iron Will';
  if (power >= 200) return 'Rising Alpha';
  return 'Beginner';
};
