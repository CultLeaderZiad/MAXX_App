import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { JAW_EXERCISES, BODY_PROGRAMS, HEALTH_MODULES, NOFAP_MILESTONES, MOCK_STREAKS } from '../../src/constants/mockData';

const SUB_TABS = ['Jaw & Face', 'Body', 'Health', 'NoFap'] as const;
type SubTab = typeof SUB_TABS[number];

export default function TrainScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<SubTab>('Jaw & Face');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="train-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Train</Text>
      {/* Sub-tab pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {SUB_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              testID={`train-tab-${tab.toLowerCase().replace(/\s|&/g, '')}`}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabPill, { backgroundColor: activeTab === tab ? theme.bgElevated : theme.bgSurface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Jaw & Face' && <JawFaceTab theme={theme} />}
        {activeTab === 'Body' && <BodyTab theme={theme} />}
        {activeTab === 'Health' && <HealthTab theme={theme} />}
        {activeTab === 'NoFap' && <NoFapTab theme={theme} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function JawFaceTab({ theme }: { theme: any }) {
  const router = useRouter();
  const levels = useMemo(() => [JAW_EXERCISES.level1, JAW_EXERCISES.level2, JAW_EXERCISES.level3], []);

  return (
    <View style={{ gap: SPACING.md }}>
      {levels.map((level, idx) => {
        const isLocked = level.status === 'locked';
        return (
          <Card key={idx} testID={`jaw-level-${idx + 1}`} style={[isLocked && idx === 2 && { opacity: 0.4 }]}>
            {!isLocked && <View style={[styles.levelAccent, { backgroundColor: theme.gold }]} />}
            <View style={styles.levelHeader}>
              <Text style={[styles.levelTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{level.title}</Text>
              {isLocked ? (
                <View style={styles.lockRow}>
                  <Feather name="lock" size={14} color={theme.textMuted} />
                  <Text style={[styles.lockText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                    {(level as any).daysToUnlock} days to unlock
                  </Text>
                </View>
              ) : (
                <Badge label="Unlocked" color={theme.green} />
              )}
            </View>
            {isLocked && (level as any).progress !== undefined && (
              <View style={{ marginTop: SPACING.sm }}>
                <ProgressBar progress={(level as any).progress / (level as any).daysToUnlock} animated={false} />
                <Text style={[styles.progressLabel, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                  {(level as any).progress} of {(level as any).daysToUnlock} days
                </Text>
              </View>
            )}
            {!isLocked && level.exercises.map((ex: any) => (
              <TouchableOpacity
                key={ex.id}
                testID={`exercise-${ex.id}`}
                style={styles.exerciseRow}
                onPress={() => router.push({ pathname: '/exercise', params: { name: ex.name, sets: ex.sets, hold: ex.hold, rest: ex.rest, xp: ex.xp } })}
              >
                <View style={[styles.exCheck, { borderColor: ex.completed ? theme.gold : theme.border, backgroundColor: ex.completed ? theme.gold : 'transparent' }]}>
                  {ex.completed && <Feather name="check" size={10} color="#0A0A0A" />}
                </View>
                <Text style={[styles.exName, { color: ex.completed ? theme.textMuted : theme.textPrimary, fontFamily: FONTS.regular }]}>{ex.name}</Text>
                <Badge label={`+${ex.xp} XP`} small />
              </TouchableOpacity>
            ))}
            {!isLocked && (
              <TouchableOpacity
                testID={`start-level-${idx + 1}`}
                style={[styles.startBtn, { borderColor: theme.selectedBorder }]}
                onPress={() => {
                  const firstIncomplete = level.exercises.find((e: any) => !e.completed);
                  if (firstIncomplete) {
                    router.push({ pathname: '/exercise', params: { name: firstIncomplete.name, sets: firstIncomplete.sets, hold: firstIncomplete.hold, rest: firstIncomplete.rest, xp: firstIncomplete.xp } });
                  }
                }}
              >
                <Text style={[styles.startBtnText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>Start</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function BodyTab({ theme }: { theme: any }) {
  return (
    <View style={{ gap: SPACING.md }}>
      <Text style={[styles.sectionSub, { color: theme.textMuted, fontFamily: FONTS.medium }]}>NATURAL PROGRAMS — NO TRT / PEDS</Text>
      {BODY_PROGRAMS.map((prog) => (
        <Card key={prog.key} testID={`body-${prog.key}`}>
          <View style={styles.bodyHeader}>
            <Text style={[styles.bodyTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{prog.title}</Text>
            <Badge label={prog.badge} />
          </View>
          <View style={styles.bodyStats}>
            <Text style={[styles.bodyStat, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{prog.duration}</Text>
            <Text style={[styles.bodyStat, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{prog.frequency}</Text>
            <Text style={[styles.bodyStat, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{prog.exercises} exercises</Text>
          </View>
          <View style={styles.sampleRow}>
            {prog.sample.map((s, i) => (
              <Text key={i} style={[styles.sampleText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>• {s}</Text>
            ))}
          </View>
          <Button title="Start Program" variant="secondary" onPress={() => {}} testID={`start-body-${prog.key}`} style={{ marginTop: SPACING.md }} />
        </Card>
      ))}
    </View>
  );
}

function HealthTab({ theme }: { theme: any }) {
  return (
    <View style={{ gap: SPACING.sm }}>
      {HEALTH_MODULES.map((mod, i) => (
        <TouchableOpacity key={mod.id} testID={`health-${mod.id}`} activeOpacity={0.7}
          style={[styles.modRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, opacity: mod.locked ? 0.5 : 1 }]}>
          <View style={[styles.modNum, { backgroundColor: theme.bgElevated }]}>
            <Text style={[styles.modNumText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{i + 1}</Text>
          </View>
          <View style={styles.modInfo}>
            <Text style={[styles.modTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{mod.title}</Text>
            <Text style={[styles.modDur, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{mod.duration} · +{mod.xp} XP</Text>
          </View>
          {mod.locked ? <Feather name="lock" size={16} color={theme.textMuted} /> : <Feather name="chevron-right" size={16} color={theme.textSecondary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function NoFapTab({ theme }: { theme: any }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const startDate = useMemo(() => new Date(MOCK_STREAKS.nofap.start_date), []);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startDate.getTime()) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const days = Math.floor(elapsed / 86400);
  const hours = Math.floor((elapsed % 86400) / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleRelapse = useCallback(() => {
    Alert.alert(
      'Confirm Relapse',
      'Are you sure? This will reset your counter. No judgment — just get back up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Reset',
          style: 'destructive',
          onPress: () => Alert.alert('Stay Strong', 'Counter reset. Every king falls — what matters is you rise again.'),
        },
      ]
    );
  }, []);

  return (
    <View style={{ gap: SPACING.md }}>
      <Card testID="nofap-counter-card" style={styles.nofapCard}>
        <Text style={[styles.nofapLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>NOFAP TRACKER</Text>
        <Text style={[styles.nofapTimer, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
          {days}d {pad(hours)}h
        </Text>
        <Text style={[styles.nofapSubTimer, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          {pad(mins)}:{pad(secs)}
        </Text>
        <Text style={[styles.nofapDay, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          Day {days} of 30
        </Text>
        <ProgressBar progress={Math.min(days / 30, 1)} testID="nofap-progress" />
      </Card>

      {/* Milestones */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.milestoneRow}>
          {NOFAP_MILESTONES.map((ms) => {
            const reached = days >= ms.day;
            return (
              <View key={ms.day} testID={`milestone-${ms.day}`}
                style={[styles.milestone, { backgroundColor: reached ? 'rgba(200,169,110,0.1)' : theme.bgSurface, borderColor: reached ? theme.borderActive : theme.border }]}>
                <Text style={[styles.msLabel, { color: reached ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold }]}>{ms.label}</Text>
                <Text style={[styles.msStatus, { color: reached ? theme.green : theme.textMuted, fontFamily: FONTS.regular }]}>
                  {reached ? 'Done' : `${ms.day - days} left`}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Power boost */}
      <Card testID="nofap-boost-card">
        <View style={styles.boostRow}>
          <Feather name="zap" size={18} color={theme.gold} />
          <Text style={[styles.boostText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>NoFap Power Boost +{days * 3} pts</Text>
        </View>
      </Card>

      {/* Action buttons */}
      <Button title="RELAPSE — 2-step confirm" variant="danger" onPress={handleRelapse} testID="nofap-relapse-btn" />
      <Button title="Emergency Mode" onPress={() => router.push('/emergency')} testID="nofap-emergency-btn" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabScroll: { marginTop: SPACING.md, maxHeight: 48 },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  tabPill: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.sm },
  tabText: { fontSize: 13 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  levelAccent: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 1.5 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  levelTitle: { fontSize: 16 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockText: { fontSize: 12 },
  progressLabel: { fontSize: 11, marginTop: 4 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 8 },
  exCheck: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  exName: { fontSize: 14, flex: 1 },
  startBtn: { borderWidth: 1, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center', marginTop: SPACING.md },
  startBtnText: { fontSize: 14 },
  sectionSub: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  bodyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bodyTitle: { fontSize: 18 },
  bodyStats: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  bodyStat: { fontSize: 12 },
  sampleRow: { marginTop: SPACING.sm, gap: 2 },
  sampleText: { fontSize: 12 },
  modRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, gap: SPACING.md },
  modNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modNumText: { fontSize: 16 },
  modInfo: { flex: 1 },
  modTitle: { fontSize: 15 },
  modDur: { fontSize: 12, marginTop: 2 },
  nofapCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  nofapLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACING.md },
  nofapTimer: { fontSize: 48 },
  nofapSubTimer: { fontSize: 18, marginTop: 2 },
  nofapDay: { fontSize: 14, marginTop: SPACING.md, marginBottom: SPACING.md },
  milestoneRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  milestone: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, alignItems: 'center', minWidth: 80 },
  msLabel: { fontSize: 13 },
  msStatus: { fontSize: 11, marginTop: 2 },
  boostRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  boostText: { fontSize: 14 },
});
