import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, selected, style, testID }) => {
  const { theme } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: theme.bgSurface, borderColor: selected ? theme.borderActive : theme.border },
        selected && { borderColor: theme.borderActive },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
});
