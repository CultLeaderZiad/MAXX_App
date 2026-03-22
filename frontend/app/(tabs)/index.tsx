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

  const completedCount = useMemo(() => missions.filter((m) => m.completed).length, [missions]);
  const allDone = completedCount === 3;

  const toggleMission = useCallback((id: string) => {
    setMissions((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, completed: !m.completed } : m);
      const newComplete = updated.filter((m) => m.completed).length;
      const oldComplete = prev.filter((m) => m.completed).length;
      if (newComplete > oldComplete) {
        const task = updated.find((m) => m.id === id);
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
            <Text style={[styles.greeting, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>Day 7, Ziad</Text>
            <Text style={[styles.greetSub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Keep pushing.</Text>
          </View>
          <TouchableOpacity testID="home-bell-btn" style={styles.bellBtn}>
            <Feather name="bell" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Power Level Card */}
        <Card testID="power-level-card" style={styles.powerCard}>
          <View style={styles.powerHeader}>
            <Text style={[styles.powerLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>POWER LEVEL</Text>
            <View style={styles.powerScore}>
              <Feather name="zap" size={18} color={theme.gold} />
              <Text style={[styles.powerValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{MOCK_PROFILE.power_level}</Text>
            </View>
          </View>
          <ProgressBar progress={MOCK_PROFILE.power_level / 1000} testID="power-progress-bar" />
          <Text style={[styles.levelTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            {getLevelTitle(MOCK_PROFILE.power_level)}
          </Text>
        </Card>

        {/* Trial Banner */}
        {!trialDismissed && MOCK_SUBSCRIPTION.status === 'trialing' && (
          <TouchableOpacity activeOpacity={0.9} testID="trial-banner">
            <LinearGradient colors={['rgba(200,169,110,0.15)', 'rgba(200,169,110,0.05)']} style={[styles.trialBanner, { borderColor: theme.selectedBorder }]}>
              <View style={styles.trialContent}>
                <Feather name="clock" size={16} color={theme.gold} />
                <Text style={[styles.trialText, { color: theme.gold, fontFamily: FONTS.medium }]}>
                  {MOCK_SUBSCRIPTION.trial_days_remaining} days remaining in trial
                </Text>
                <Feather name="chevron-right" size={16} color={theme.gold} />
              </View>
              <TouchableOpacity onPress={() => setTrialDismissed(true)} style={styles.trialClose} testID="trial-dismiss-btn">
                <Feather name="x" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Daily Mission Card */}
        <Card testID="daily-mission-card">
          <View style={styles.missionHeader}>
            <Text style={[styles.missionTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>Daily Mission Card</Text>
            <Badge label={`${completedCount}/3`} />
          </View>
          {missions.map((m) => (
            <TouchableOpacity key={m.id} testID={`mission-${m.id}`} onPress={() => toggleMission(m.id)} style={styles.missionRow}>
              <View style={[styles.missionCheck, { borderColor: m.completed ? theme.gold : theme.border, backgroundColor: m.completed ? theme.gold : 'transparent' }]}>
                {m.completed && <Feather name="check" size={12} color="#0A0A0A" />}
              </View>
              <Text style={[styles.missionName, { color: m.completed ? theme.textMuted : theme.textPrimary, fontFamily: FONTS.regular, textDecorationLine: m.completed ? 'line-through' : 'none' }]}>
                {m.name}
              </Text>
              <Badge label={`+${m.xp} XP`} small color={m.completed ? theme.textMuted : theme.gold} />
            </TouchableOpacity>
          ))}
          {allDone && (
            <View style={[styles.bonusRow, { borderTopColor: theme.border }]}>
              <Feather name="award" size={16} color={theme.gold} />
              <Text style={[styles.bonusText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>+50 XP Bonus!</Text>
            </View>
          )}
          <View style={styles.streakRow}>
            <Text style={[styles.streakText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
              {MOCK_STREAKS.daily.current_streak} day streak
            </Text>
          </View>
        </Card>

        {/* Wisdom Card */}
        <Card testID="wisdom-card" style={{ marginTop: SPACING.md }}>
          <Text style={[styles.wisdomLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>WISDOM DROP</Text>
          <Text style={[styles.wisdomQuote, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            "{MOCK_WISDOM.quote}"
          </Text>
          <Text style={[styles.wisdomAuthor, { color: theme.textMuted, fontFamily: FONTS.regular }]}>— {MOCK_WISDOM.author}</Text>
          <View style={styles.wisdomActions}>
            <TouchableOpacity testID="wisdom-bookmark-btn" style={styles.wisdomBtn}>
              <Feather name="bookmark" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity testID="wisdom-share-btn" style={styles.wisdomBtn}>
              <Feather name="share" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Progress Mini Cards */}
        <Text style={[styles.progressTitle, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>PROGRESS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.progressScroll}>
          <View style={styles.progressRow}>
            {MOCK_PROGRESS_CARDS.map((card, i) => (
              <Card key={i} testID={`progress-card-${card.label.toLowerCase()}`} style={styles.progressCard}>
                <Feather name={card.icon} size={18} color={theme.gold} />
                <Text style={[styles.progressValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{card.value}</Text>
                <Text style={[styles.progressUnit, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{card.unit || card.label}</Text>
              </Card>
            ))}
          </View>
        </ScrollView>
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
  trialClose: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  missionTitle: { fontSize: 16 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 10 },
  missionCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  missionName: { fontSize: 14, flex: 1 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderTopWidth: 1, paddingTop: SPACING.md, marginTop: SPACING.sm },
  bonusText: { fontSize: 14 },
  streakRow: { alignItems: 'flex-end', marginTop: SPACING.sm },
  streakText: { fontSize: 12 },
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
});
