import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS, SPACING } from '../src/constants/theme';
import { Button } from '../src/components/Button';

const STACK = [
  { name: 'Zinc', dosage: '30–45mg per day', benefit: 'Testosterone', benefitCol: '#C8A96E', notes: 'Supports testosterone production and immune function', timing: 'Take with dinner' },
  { name: 'Ashwagandha', dosage: '300–600mg per day', benefit: 'Testosterone', benefitCol: '#C8A96E', notes: 'Reduces cortisol, supports testosterone and stress response', timing: 'Take before bed' },
  { name: 'Creatine Monohydrate', dosage: '5g per day', benefit: 'Energy', benefitCol: '#3498DB', notes: 'Strength, energy, cognitive performance', timing: 'Post-workout or morning' },
  { name: 'Collagen Peptides', dosage: '10–20g per day', benefit: 'Jaw & Bone', benefitCol: '#2ECC71', notes: 'Supports jaw structure, skin, and joint health', timing: 'Post-workout or morning' },
];

export default function SupplementStackScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="supplements-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="supplements-back-btn">
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Supplement Stack</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>My Stack</Text>
          <Text style={[styles.introSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Based on your goals: Jaw · Sexual Health · Energy</Text>
        </View>

        <Button title="Generate My Stack" onPress={() => {}} testID="generate-stack-btn" style={{ marginBottom: SPACING.xl }} />

        {STACK.map((item, i) => (
          <View key={i} style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.name, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{item.name}</Text>
              <View style={[styles.tag, { backgroundColor: item.benefitCol + '22' }]}>
                <Text style={[styles.tagText, { color: item.benefitCol, fontFamily: FONTS.semiBold }]}>{item.benefit}</Text>
              </View>
            </View>
            <Text style={[styles.dosage, { color: theme.gold, fontFamily: FONTS.medium }]}>{item.dosage}</Text>
            <Text style={[styles.notes, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{item.notes}</Text>
            <View style={styles.timingRow}>
              <Feather name="clock" size={14} color="#E74C3C" />
              <Text style={[styles.timing, { color: theme.textMuted, fontFamily: FONTS.medium }]}>{item.timing}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 24, marginLeft: SPACING.xs },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  intro: { marginBottom: SPACING.lg },
  introTitle: { fontSize: 20 },
  introSub: { fontSize: 12, marginTop: 4 },
  card: { padding: SPACING.lg, borderRadius: 16, borderWidth: 1, marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16 },
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  tagText: { fontSize: 10 },
  dosage: { fontSize: 14, marginVertical: 6 },
  notes: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timing: { fontSize: 11 },
});
