import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING } from '../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, size = 'md' }: ButtonProps) {
  const { theme } = useTheme();

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 12, md: 13, lg: 15 };

  const bgMap: Record<string, string> = {
    primary: theme.gold,
    secondary: theme.bgElevated,
    outline: 'transparent',
    ghost: 'transparent',
  };

  const textColorMap: Record<string, string> = {
    primary: '#000000',
    secondary: theme.textPrimary,
    outline: theme.gold,
    ghost: theme.textSecondary,
  };

  const borderColorMap: Record<string, string> = {
    primary: theme.gold,
    secondary: theme.border,
    outline: theme.gold,
    ghost: 'transparent',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          height: heights[size],
          backgroundColor: bgMap[variant],
          borderColor: borderColorMap[variant],
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColorMap[variant], fontSize: fontSizes[size], fontFamily: FONTS.bold }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  label: { letterSpacing: 1.2 },
});
