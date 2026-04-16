import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

interface CaptainCardProps {
  title?: string;
  message?: string;
}

// Placeholder captain/coach card component
export function CaptainCard({ title = 'Coach', message }: CaptainCardProps) {
  const { theme } = useTheme();
  if (!message) return null;
  return (
    <View style={[styles.card, { backgroundColor: theme.bgElevated, borderColor: theme.gold + '40' }]}>
      <Feather name="message-circle" size={16} color={theme.gold} />
      <Text style={[styles.text, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 20 },
});
