import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { ProgressBar } from '../src/components/ProgressBar';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { GOAL_OPTIONS } from '../src/constants/mockData';

export default function GoalsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="goals-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="goals-back-btn" style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === 0 ? theme.gold : theme.border }]} />
          ))}
        </View>
      </View>
      <FlatList
        data={GOAL_OPTIONS}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Prime targets?</Text>
            <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Select what you want to improve</Text>
          </>
        }
        renderItem={({ item: goal }) => {
          const isSel = selected.includes(goal.key);
          return (
            <TouchableOpacity
              testID={`goal-${goal.key}`}
              onPress={() => toggle(goal.key)}
              activeOpacity={0.7}
              style={[
                styles.goalCard,
                {
                  backgroundColor: isSel ? 'rgba(200,169,110,0.08)' : theme.bgSurface,
                  borderColor: isSel ? theme.borderActive : theme.border,
                },
              ]}
            >
              {isSel && (
                <View style={[styles.checkBadge, { backgroundColor: theme.gold }]}>
                  <Feather name="check" size={10} color="#0A0A0A" />
                </View>
              )}
              <Feather name={goal.icon as any} size={28} color={isSel ? theme.gold : theme.textMuted} />
              <Text style={[styles.goalLabel, { color: isSel ? theme.textPrimary : theme.textSecondary, fontFamily: FONTS.medium }]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.agreeRow} testID="goals-agree-btn">
            <View style={[styles.checkbox, { borderColor: agreed ? theme.gold : theme.border, backgroundColor: agreed ? theme.gold : 'transparent' }]}>
              {agreed && <Feather name="check" size={12} color="#0A0A0A" />}
            </View>
            <Text style={[styles.agreeText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
              I agree to Terms and Privacy Policy
            </Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.bottom}>
        <Button
          title="CONTINUE"
          onPress={() => router.push('/weakspots')}
          disabled={selected.length === 0 || !agreed}
          testID="goals-continue-btn"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginLeft: 'auto', marginRight: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: SPACING.lg },
  row: { justifyContent: 'space-between', marginBottom: SPACING.md },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  goalCard: {
    width: '47%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 13, textAlign: 'center' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xl },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  agreeText: { fontSize: 13, flex: 1 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
