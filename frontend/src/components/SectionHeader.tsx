import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING } from '../constants/theme';

interface SectionHeaderProps {
  label: string;
  testID?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, testID }) => {
  const { theme } = useTheme();
  return (
    <View testID={testID} style={[styles.container, { borderBottomColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, paddingBottom: SPACING.sm, marginBottom: SPACING.md },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
});
