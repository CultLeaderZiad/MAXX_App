import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, SPACING } from '../../src/constants/theme';

export default function FocusScreen() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="focus-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Focus</Text>
      <View style={styles.placeholder}>
        <Feather name="eye" size={48} color={theme.textMuted} />
        <Text style={[styles.phText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>Daily Wisdom, Confidence & Convo Lab</Text>
        <Text style={[styles.phSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Coming in Phase 5</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  phText: { fontSize: 16, textAlign: 'center' },
  phSub: { fontSize: 13 },
});
