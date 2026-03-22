import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

export function CaptainCard({ children, title = "Your gym bro says:" }: { children: React.ReactNode; title?: string }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(200,169,110,0.1)', borderColor: theme.gold }]}>
      <Text style={[styles.header, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
        🎯 {title}
      </Text>
      <Text style={[styles.text, { color: theme.textPrimary, fontFamily: FONTS.medium }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
