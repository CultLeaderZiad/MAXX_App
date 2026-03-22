import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { XPToast } from '../../src/components/XPToast';
import { FONTS, SPACING, RADIUS, getLevelTitle } from '../../src/constants/theme';
import { MOCK_PROFILE, MOCK_DAILY_MISSIONS, MOCK_WISDOM, MOCK_PROGRESS_CARDS, MOCK_SUBSCRIPTION, MOCK_STREAKS } from '../../src/constants/mockData';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [missions, setMissions] = useState(MOCK_DAILY_MISSIONS);
  const [trialDismissed, setTrialDismissed] = useState(false);
  const [xpToast, setXpToast] = useState({ visible: false, amount: 0 });

  const completedCount = useMemo(() => missions.filter((m: any) => m.completed).length, [missions]);
  const allDone = completedCount === 3;

  const toggleMission = useCallback((id: string) => {
    setMissions((prev: any[]) => {
      const updated = prev.map((m: any) => m.id === id ? { ...m, completed: !m.completed } : m);
      const newComplete = updated.filter((m: any) => m.completed).length;
      const oldComplete = prev.filter((m: any) => m.completed).length;
      if (newComplete > oldComplete) {
        const task = updated.find((m: any) => m.id === id);
        setXpToast({ visible: true, amount: task?.xp || 40 });
      }
      return updated;
    });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="home-screen">
      <XPToast amount={xpToast.amount} visible={xpToast.visible} onDone={() => setXpToast({ visible: false, amount: 0 })} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>Day 12, Ziad</Text>
          </View>
          <TouchableOpacity testID="home-bell-btn" style={[styles.bellBtn, { backgroundColor: theme.bgElevated, borderRadius: 22 }]}>
            <Feather name="bell" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Power Level Card */}
        <View style={[styles.powerCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: SPACING.lg }]}>
          <View style={styles.powerHeader}>
            <Text style={[styles.powerLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>POWER LEVEL</Text>
            <View style={styles.powerScore}>
              <Feather name="zap" size={18} color={theme.gold} />
              <Text style={[styles.powerValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>750</Text>
            </View>
          </View>
          <ProgressBar progress={0.75} />
          <Text style={[styles.levelTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold, marginTop: SPACING.md }]}>
            ALPHA RISING
          </Text>
        </View>

        {/* Trial Banner */}
        {!trialDismissed && (
          <TouchableOpacity activeOpacity={0.9} style={[styles.trialBanner, { borderColor: theme.gold, borderWidth: 0.5, backgroundColor: 'rgba(200,169,110,0.05)', borderRadius: 12, padding: 12, marginTop: SPACING.md }]}>
            <View style={styles.trialContent}>
              <Text style={[styles.trialText, { color: theme.gold, fontFamily: FONTS.medium }]}>Free Trial Active</Text>
              <Text style={[styles.trialDays, { color: theme.gold, fontFamily: FONTS.regular, opacity: 0.8 }]}>5 days remaining →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Mission */}
        <View style={[styles.missionCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md }]}>
          <View style={styles.missionHeader}>
            <Text style={[styles.missionTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>Today's Mission</Text>
            <View style={styles.streakBadge}>
               <Text style={[styles.streakTextBold, { color: theme.gold, fontFamily: FONTS.semiBold }]}>7 day streak 🔥</Text>
            </View>
          </View>
          
          {missions.map((m: any) => (
            <TouchableOpacity key={m.id} onPress={() => toggleMission(m.id)} style={styles.missionRow}>
              <View style={[styles.missionCheck, { borderColor: m.completed ? theme.gold : theme.border, backgroundColor: m.completed ? theme.gold : 'transparent' }]}>
                {m.completed && <Feather name="check" size={12} color="#0A0A0A" /> || <Feather name="square" size={12} color="transparent" />}
              </View>
              <Text style={[styles.missionName, { color: m.completed ? theme.textMuted : theme.textPrimary, fontFamily: FONTS.medium, textDecorationLine: m.completed ? 'line-through' : 'none', flex: 1, marginLeft: 12 }]}>
                {m.name}
              </Text>
              <View style={[styles.xpPill, { backgroundColor: theme.bgElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{m.xp} XP</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wisdom Drop */}
        <View style={[styles.wisdomCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md }]}>
          <Text style={[styles.wisdomLabel, { color: theme.textMuted, fontFamily: FONTS.medium, fontSize: 10, letterSpacing: 1 }]}>WISDOM DROP</Text>
          <Text style={[styles.wisdomQuote, { color: theme.gold, fontFamily: FONTS.regular, fontStyle: 'italic', fontSize: 16, marginTop: 8, lineHeight: 24 }]}>
            "Discipline is not punishment. It is the price of becoming."
          </Text>
          <Text style={[styles.wisdomAuthor, { color: theme.textMuted, fontFamily: FONTS.regular, marginTop: 8 }]}>— MAXX Doctrine</Text>
          <View style={styles.wisdomActions}>
            <TouchableOpacity style={[styles.wisdomBtn, { backgroundColor: theme.bgElevated, borderRadius: 10 }]}>
              <Feather name="bookmark" size={16} color={theme.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.wisdomBtn, { backgroundColor: theme.bgElevated, borderRadius: 10 }]}>
              <Feather name="share-2" size={16} color={theme.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Progress Row */}
        <View style={styles.bottomStatsRow}>
          {[
            { label: 'JAW', val: '5', unit: 'days', icon: 'activity' },
            { label: 'NOFAP', val: '12d 4h', unit: 'live', icon: 'zap' },
            { label: 'BODY', val: '3', unit: 'workouts', icon: 'target' },
            { label: 'XP', val: '480', unit: 'to next', icon: 'award' },
          ].map((s, i) => (
            <View key={i} style={[styles.statBox, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 10, flex: 1, gap: 4 }]}>
              <Text style={[styles.statLabelMini, { color: theme.textMuted, fontSize: 9, fontFamily: FONTS.medium }]}>{s.label}</Text>
              <Text style={[styles.statValLarge, { color: theme.gold, fontSize: 16, fontFamily: FONTS.cinzelBold }]}>{s.val}</Text>
              <Text style={[styles.statUnitMini, { color: theme.textMuted, fontSize: 9 }]}>{s.unit}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  greeting: { fontSize: 24 },
  greetSub: { fontSize: 14, marginTop: 2 },
  bellBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  powerCard: { marginBottom: SPACING.md },
  powerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  powerLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  powerScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  powerValue: { fontSize: 28 },
  levelTitle: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center', marginTop: SPACING.sm },
  trialBanner: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.md, position: 'relative' },
  trialContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  trialText: { fontSize: 13, flex: 1 },
  trialDays: { },
  trialClose: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  missionTitle: { fontSize: 16 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 10 },
  missionCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  missionName: { fontSize: 14, flex: 1 },
  missionCard: { },
  streakBadge: { },
  streakTextBold: { },
  xpPill: { },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderTopWidth: 1, paddingTop: SPACING.md, marginTop: SPACING.sm },
  bonusText: { fontSize: 14 },
  streakRow: { alignItems: 'flex-end', marginTop: SPACING.sm },
  streakText: { fontSize: 12 },
  wisdomCard: { },
  wisdomLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: SPACING.sm },
  wisdomQuote: { fontSize: 18, fontStyle: 'italic', lineHeight: 26 },
  wisdomAuthor: { fontSize: 13, marginTop: SPACING.sm },
  wisdomActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
  wisdomBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  progressTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  progressScroll: { marginHorizontal: -SPACING.lg },
  progressRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  progressCard: { width: 100, alignItems: 'center', gap: 6, paddingVertical: SPACING.md },
  progressValue: { fontSize: 20 },
  progressUnit: { fontSize: 11 },
  bottomStatsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  statBox: { alignItems: 'center', justifyContent: 'center' },
  statLabelMini: { letterSpacing: 1 },
  statValLarge: { },
  statUnitMini: { },
});
