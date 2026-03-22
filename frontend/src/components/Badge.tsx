import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING } from '../constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  small?: boolean;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, small, testID }) => {
  const { theme } = useTheme();
  const badgeColor = color || theme.gold;
  return (
    <View testID={testID} style={[styles.badge, { borderColor: badgeColor }, small && styles.small]}>
      <Text style={[styles.text, { color: badgeColor, fontFamily: FONTS.semiBold }, small && styles.smallText]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  small: { paddingHorizontal: 6, paddingVertical: 1 },
  text: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  smallText: { fontSize: 9 },
});
