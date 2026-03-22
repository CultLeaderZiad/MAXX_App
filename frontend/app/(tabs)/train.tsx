import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
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
      <View style={styles.contentWrap}>
        {activeTab === 'Jaw & Face' && <JawFaceTab theme={theme} />}
        {activeTab === 'Body' && <BodyTab theme={theme} />}
        {activeTab === 'Health' && <HealthTab theme={theme} />}
        {activeTab === 'NoFap' && <NoFapTab theme={theme} />}
      </View>
    </SafeAreaView>
  );
}

function JawFaceTab({ theme }: { theme: any }) {
  const router = useRouter();
  
  const levels = [
    {
      id: 1,
      title: 'Level 1',
      status: 'unlocked',
      tasks: [
        { name: 'Mewing Fundamentals', completed: true },
        { name: 'Jaw Chew Basics', completed: true },
        { name: 'Posture Check', completed: true },
        { name: '20 Push-ups', completed: true },
      ]
    },
    {
      id: 2,
      title: 'Level 2',
      status: 'locked',
      progress: 3,
      total: 7,
      daysLeft: 4,
    },
    {
      id: 3,
      title: 'Level 3',
      status: 'locked',
    }
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionSub, { color: theme.textMuted, fontFamily: FONTS.medium, marginBottom: SPACING.md }]}>JAW & FACE — LEVEL LOCK</Text>
      
      {levels.map((level, idx) => {
        const isLocked = level.status === 'locked';
        return (
          <View key={level.id} style={[styles.levelCard, { backgroundColor: theme.bgSurface, borderColor: isLocked ? theme.border : theme.gold, borderWidth: 1, borderRadius: 16, padding: SPACING.lg, marginBottom: SPACING.md, opacity: idx === 2 ? 0.4 : 1 }]}>
            <View style={styles.levelHeader}>
              <Text style={[styles.levelTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{level.title}</Text>
              {level.status === 'unlocked' ? (
                <View style={[styles.unlockedBadge, { backgroundColor: 'rgba(46, 204, 113, 0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }]}>
                  <Text style={{ color: '#2ecc71', fontSize: 11, fontFamily: FONTS.medium }}>Unlocked</Text>
                </View>
              ) : (
                 <Feather name="lock" size={16} color={theme.textMuted} />
              )}
            </View>

            {level.status === 'unlocked' && level.tasks?.map((t, i) => (
              <View key={i} style={styles.taskRow}>
                <View style={[styles.checkCircle, { backgroundColor: theme.gold }]}>
                  <Feather name="check" size={10} color="#000" />
                </View>
                <Text style={[styles.taskName, { color: theme.textSecondary, fontFamily: FONTS.medium, marginLeft: 10 }]}>{t.name}</Text>
              </View>
            ))}

            {level.id === 2 && (
              <View style={{ marginTop: SPACING.md }}>
                <View style={[styles.progressBarBg, { backgroundColor: theme.bgElevated, height: 4, borderRadius: 2 }]}>
                   <View style={[styles.progressBarFill, { backgroundColor: theme.gold, width: '43%', height: 4, borderRadius: 2 }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                   <Text style={{ color: theme.textMuted, fontSize: 11 }}>3 of 7 days complete</Text>
                   <Text style={{ color: theme.gold, fontSize: 11 }}>4 days to unlock</Text>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function BodyTab({ theme }: { theme: any }) {
  return (
    <FlatList
      data={BODY_PROGRAMS}
      keyExtractor={(item: any) => item.key}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<Text style={[styles.sectionSub, { color: theme.textMuted, fontFamily: FONTS.medium, marginBottom: SPACING.md }]}>NATURAL PROGRAMS — NO TRT / PEDS</Text>}
      renderItem={({ item: prog }: { item: any }) => (
        <Card testID={`body-${prog.key}`} style={styles.tabCard}>
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
            {prog.sample.map((s: string, i: number) => (
              <Text key={i} style={[styles.sampleText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>• {s}</Text>
            ))}
          </View>
          <Button title="Start Program" variant="secondary" onPress={() => {}} testID={`start-body-${prog.key}`} style={{ marginTop: SPACING.md }} />
        </Card>
      )}
    />
  );
}

function HealthTab({ theme }: { theme: any }) {
  return (
    <FlatList
      data={HEALTH_MODULES}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={styles.content}
      renderItem={({ item: mod, index: i }: { item: any; index: number }) => (
        <TouchableOpacity testID={`health-${mod.id}`} activeOpacity={0.7}
          style={[styles.modRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, opacity: mod.locked ? 0.5 : 1, marginBottom: SPACING.sm }]}>
          <View style={[styles.modNum, { backgroundColor: theme.bgElevated }]}>
            <Text style={[styles.modNumText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{i + 1}</Text>
          </View>
          <View style={styles.modInfo}>
            <Text style={[styles.modTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{mod.title}</Text>
            <Text style={[styles.modDur, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{mod.duration} · +{mod.xp} XP</Text>
          </View>
          {mod.locked ? <Feather name="lock" size={16} color={theme.textMuted} /> : <Feather name="chevron-right" size={16} color={theme.textSecondary} />}
        </TouchableOpacity>
      )}
    />
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

  const sections = [
    { type: 'counter' },
    { type: 'milestones' },
    { type: 'boost' },
    { type: 'actions' },
  ];

  return (
    <FlatList
      data={sections}
      keyExtractor={(_: any, i: number) => i.toString()}
      contentContainerStyle={styles.content}
      renderItem={({ item }: { item: any }) => {
        if (item.type === 'counter') return (
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
        );
        if (item.type === 'milestones') return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: SPACING.md }}>
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
        );
        if (item.type === 'boost') return (
          <Card testID="nofap-boost-card" style={{ marginBottom: SPACING.md }}>
            <View style={styles.boostRow}>
              <Feather name="zap" size={18} color={theme.gold} />
              <Text style={[styles.boostText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>NoFap Power Boost +{days * 3} pts</Text>
            </View>
          </Card>
        );
        if (item.type === 'actions') return (
          <View style={{ gap: SPACING.sm }}>
            <Button title="RELAPSE — 2-step confirm" variant="danger" onPress={handleRelapse} testID="nofap-relapse-btn" />
            <Button title="Emergency Mode" onPress={() => router.push('/emergency')} testID="nofap-emergency-btn" />
          </View>
        );
        return null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabScroll: { marginTop: SPACING.md, maxHeight: 48 },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  tabPill: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.sm },
  tabText: { fontSize: 13 },
  contentWrap: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  tabCard: { marginBottom: SPACING.md },
  levelCard: { marginBottom: SPACING.md },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  unlockedBadge: { },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  taskName: { fontSize: 14 },
  progressBarBg: { height: 4, width: '100%'},
  progressBarFill: { },
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
