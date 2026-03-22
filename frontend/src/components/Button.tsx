import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', disabled, loading, style, testID }) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} testID={testID} style={style}>
        <LinearGradient
          colors={isDisabled ? ['#555', '#666', '#555'] : [...theme.goldGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, isDisabled && styles.disabled]}
        >
          {loading ? <ActivityIndicator color="#0A0A0A" /> : <Text style={[styles.primaryText, { fontFamily: FONTS.semiBold }]}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, any> = {
    secondary: { borderColor: theme.selectedBorder, borderWidth: 1 },
    danger: { borderColor: 'rgba(231,76,60,0.25)', borderWidth: 1 },
    ghost: {},
  };
  const textColors: Record<string, string> = {
    secondary: theme.gold,
    danger: theme.red,
    ghost: theme.textSecondary,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, { backgroundColor: 'transparent' }, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, { color: textColors[variant], fontFamily: FONTS.semiBold }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: { height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryText: { color: '#0A0A0A', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  text: { fontSize: 16, letterSpacing: 0.5 },
  disabled: { opacity: 0.5 },
});
