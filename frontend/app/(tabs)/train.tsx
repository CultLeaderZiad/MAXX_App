import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';
import { PressableScale } from '../../src/components/PressableScale';

const TABS = ['Body', 'Face', 'Mind'];

const EXERCISES: Record<string, any[]> = {
  Body: [
    { id: 'ohp', key: 'ohp', title: 'Overhead Press', sets: '4 sets × 6-8 reps', muscle: 'Shoulders', videoId: '2yjwXTZQDDI', level: 'Intermediate', bro: 'Shoulder width is 70% of how powerful you look.' },
    { id: 'bench', key: 'bench', title: 'Barbell Bench Press', sets: '4 sets × 6 reps', muscle: 'Chest, Triceps', videoId: 'rT7DgCr-3pg', level: 'Intermediate', bro: 'A strong chest commands respect. No shortcuts.' },
    { id: 'squat', key: 'squat', title: 'Back Squat', sets: '4 sets × 8 reps', muscle: 'Quads, Glutes', videoId: 'bEv6CCg2BC8', level: 'Intermediate', bro: 'Never skip legs. The whole body follows.' },
    { id: 'deadlift', key: 'deadlift', title: 'Deadlift', sets: '3 sets × 5 reps', muscle: 'Full Posterior', videoId: 'op9kVnSso6Q', level: 'Advanced', bro: 'This one move builds your entire back, your entire life.' },
    { id: 'pullup', key: 'pullup', title: 'Pull-Up', sets: '4 sets × max', muscle: 'Back, Biceps', videoId: 'eGo4IYlbE5g', level: 'Beginner', bro: 'If you can\'t do 10 pull-ups, you have a job to do.' },
    { id: 'face_pulls', key: 'face_pulls', title: 'Face Pulls', sets: '4 sets × 15-20 reps', muscle: 'Rear Delts, Posture', videoId: 'HSoHeSjovGc', level: 'Beginner', bro: 'If you only do one exercise, it is this one.' },
  ],
  Face: [
    { id: 'mewing', key: 'mewing', title: 'Mewing Protocol', sets: 'All day', muscle: 'Tongue, Jaw', videoId: 'HSoHeSjovGc', level: 'Beginner', bro: 'The jaw you want is built in silence, 24/7.' },
    { id: 'neck_extension', key: 'neck_extension', title: 'Neck Extension', sets: '3 sets × 20 reps', muscle: 'Neck Extensors', videoId: 'wQylqaCl8Zo', level: 'Beginner', bro: 'A strong neck is the mark of a dominant man.' },
    { id: 'chin_tuck', key: 'chin_tuck', title: 'Chin Tuck', sets: '3 sets × 15 reps', muscle: 'Neck, Posture', videoId: 'wQylqaCl8Zo', level: 'Beginner', bro: 'Posture is your silent status signal.' },
    { id: 'masseter', key: 'masseter', title: 'Masseter Workout', sets: 'Chew protocol', muscle: 'Jawline', videoId: 'HSoHeSjovGc', level: 'Beginner', bro: 'Jawlines don\'t grow in gyms. They grow in discipline.' },
    { id: 'eye_training', key: 'eye_training', title: 'Eye Dominance Training', sets: '10 min daily', muscle: 'Eye contact, Focus', videoId: '2yjwXTZQDDI', level: 'Beginner', bro: 'Hold eye contact. It\'s the oldest status signal.' },
  ],
  Mind: [
    { id: 'cold_shower', key: 'cold_shower', title: 'Cold Shower Protocol', sets: '3 min daily', muscle: 'Dopamine, Resilience', videoId: '2yjwXTZQDDI', level: 'Beginner', bro: 'The man who can be uncomfortable on purpose controls everything.' },
    { id: 'deep_work', key: 'deep_work', title: 'Deep Work Block', sets: '90 min focus', muscle: 'Prefrontal Cortex', videoId: '2yjwXTZQDDI', level: 'Intermediate', bro: 'One undistracted hour beats eight hours of noise.' },
    { id: 'box_breathing', key: 'box_breathing', title: 'Box Breathing', sets: '5 min', muscle: 'ANS Regulation', videoId: 'tybOi4hjZFQ', level: 'Beginner', bro: 'Breathe. Then think. Then act. Never reverse.' },
    { id: 'visualization', key: 'visualization', title: 'Mental Rehearsal', sets: '10 min', muscle: 'Motor Cortex', videoId: '2yjwXTZQDDI', level: 'Beginner', bro: 'Champions train twice: with the body and with the mind.' },
  ],
};

const CALCULATOR_CARDS = [
  { type: 'calorie', name: 'Calorie Calculator', desc: 'Daily calories for your goal', color: GOLD, icon: 'zap' },
  { type: 'hydration', name: 'Hydration Calculator', desc: 'Daily water intake target', color: '#4A90D9', icon: 'droplet' },
  { type: 'sleep', name: 'Sleep Calculator', desc: 'Optimal sleep cycles', color: '#9B59B6', icon: 'moon' },
  { type: 'ffmi', name: 'Fat-Free Mass Index', desc: 'Lean body mass score', color: '#2ECC71', icon: 'trending-up' },
  { type: 'bmi', name: 'BMI + Body Fat', desc: 'Full body composition', color: '#E67E22', icon: 'user' },
  { type: 'macros', name: 'Macro Nutrients', desc: 'Protein / carb / fat split', color: '#E74C3C', icon: 'pie-chart' },
];

const LEVEL_COLOR: Record<string, string> = {
  Beginner: '#2ECC71', Intermediate: '#F39C12', Advanced: '#E74C3C',
};

// ── Body Tab Stats Section ─────────────────────────────────────────────────────
function BodyStatsSection({ profile, onReset }: { profile: any; onReset: () => void }) {
  const w = profile?.weight_kg;
  const h = profile?.height_cm;
  const bmi = w && h ? (w / ((h / 100) * (h / 100))).toFixed(1) : null;

  const stats = [
    { label: 'WEIGHT', value: w ? `${w}KG` : '—', sub: w ? '' : 'Not set' },
    { label: 'HEIGHT', value: h ? `${h}CM` : '—', sub: h ? '' : 'Not set' },
    { label: 'BMI', value: bmi || '—', sub: bmi ? (parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : 'High') : 'No data' },
    { label: 'BODY FAT', value: '—', sub: 'Use calculator' },
  ];

  return (
    <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
        <Text style={[bodyStyles.sectionTitle, { fontFamily: FONTS.cinzelBold, color: '#FFFFFF' }]}>YOUR STATS</Text>
        <TouchableOpacity
          onPress={onReset}
          style={[bodyStyles.resetBtn, { backgroundColor: '#1A1A1A', borderColor: GOLD + '33' }]}
        >
          <Text style={[{ color: GOLD, fontSize: 8, fontFamily: FONTS.bold, letterSpacing: 1 }]}>RESET STATS</Text>
        </TouchableOpacity>
      </View>
      <View style={[bodyStyles.statsRow, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={bodyStyles.statDivider} />}
            <View style={bodyStyles.statCell}>
              <Text style={[bodyStyles.statVal, { color: GOLD, fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
              <Text style={[bodyStyles.statLabel, { color: '#9A9A9A', fontFamily: FONTS.bold }]}>{s.label}</Text>
              {s.sub ? <Text style={[{ fontSize: 8, color: '#606060', fontFamily: FONTS.regular }]}>{s.sub}</Text> : null}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Calculator Grid ────────────────────────────────────────────────────────────
function CalculatorGrid({ router }: { router: any }) {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
      <Text style={[bodyStyles.sectionTitle, { fontFamily: FONTS.bold, color: '#9A9A9A', marginBottom: SPACING.sm }]}>BODY CALCULATORS</Text>
      <View style={bodyStyles.calcGrid}>
        {CALCULATOR_CARDS.map(c => (
          <TouchableOpacity
            key={c.type}
            onPress={() => router.push({ pathname: '/calculator', params: { type: c.type } } as any)}
            style={[bodyStyles.calcCard, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}
            activeOpacity={0.75}
          >
            <View style={[bodyStyles.calcIconWrap, { backgroundColor: c.color + '18' }]}>
              <Feather name={c.icon as any} size={16} color={c.color} />
            </View>
            <Text style={[bodyStyles.calcName, { color: '#FFFFFF', fontFamily: FONTS.bold }]} numberOfLines={1}>{c.name}</Text>
            <Text style={[bodyStyles.calcDesc, { color: '#606060', fontFamily: FONTS.regular }]} numberOfLines={2}>{c.desc}</Text>
            <View style={[bodyStyles.toolBadge, { borderColor: c.color + '40' }]}>
              <Text style={[{ fontSize: 8, color: c.color, fontFamily: FONTS.bold, letterSpacing: 0.8 }]}>OPEN</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function TrainScreen() {
  const { theme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Body');
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTodayCompletions(); }, [user]);

  const fetchTodayCompletions = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('workout_completions')
        .select('exercise_key')
        .eq('user_id', user.id)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59');
      setCompletedToday((data || []).map((d: any) => d.exercise_key));
    } catch (e) {}
    finally { setLoading(false); }
  };

  const markComplete = async (exercise: any) => {
    if (!user || completedToday.includes(exercise.key)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedToday(prev => [...prev, exercise.key]);
    try {
      await supabase.from('workout_completions').insert({
        user_id: user.id, exercise_key: exercise.key,
        exercise_title: exercise.title, completed_at: new Date().toISOString(),
      });
      await supabase.from('xp_log').insert({
        user_id: user.id, amount: 15, reason: `Completed ${exercise.title}`,
        created_at: new Date().toISOString(),
      });
    } catch {}
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Stats',
      'This will clear your saved weight, height, and calculator results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await supabase.from('profiles').update({
                weight_kg: null, height_cm: null,
              }).eq('id', user.id);
              await refreshProfile();
              Alert.alert('Done', 'Stats reset. Re-enter below to recalculate.');
            } catch {}
          },
        },
      ]
    );
  };

  const getExercises = (tab: string) => {
    const seen = new Set<string>();
    return (EXERCISES[tab] || []).filter(ex => {
      if (seen.has(ex.key)) return false;
      seen.add(ex.key);
      return true;
    });
  };

  const exercises = getExercises(activeTab);
  const doneCount = exercises.filter(e => completedToday.includes(e.key)).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSub, { color: '#606060', fontFamily: FONTS.bold }]}>THE CAPTAIN'S GYM</Text>
          <Text style={[styles.title, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>BODY</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/supplements' as any)} style={styles.suppBtn}>
          <Feather name="package" size={18} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            style={[styles.tabBtn, { borderBottomColor: activeTab === tab ? GOLD : 'transparent', borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? GOLD : '#606060', fontFamily: activeTab === tab ? FONTS.bold : FONTS.regular }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={GOLD} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* ── Body Tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'Body' && (
            <>
              {/* Stats section */}
              <BodyStatsSection profile={profile} onReset={handleResetStats} />

              {/* Calculator grid */}
              <CalculatorGrid router={router} />

              {/* Workout program */}
              <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
                <Text style={[styles.programLabel, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>WORKOUT PROGRAM</Text>
                <Text style={[styles.programSub, { color: '#2ECC71', fontFamily: FONTS.bold }]}>4 WEEKS — BEGINNER</Text>
              </View>

              {/* Natural Max banner */}
              <View style={[styles.naturalMax, { backgroundColor: '#0d2010', borderColor: '#2ECC7133' }]}>
                <Text style={[styles.naturalMaxText, { color: '#2ECC71', fontFamily: FONTS.bold }]}>
                  NATURAL MAX — NO TRT · NO PEDs · NO STEROIDS
                </Text>
              </View>
            </>
          )}

          {/* Progress bar (non-Body tabs) */}
          {activeTab !== 'Body' && !loading && exercises.length > 0 && (
            <View style={[styles.progressWrap]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.progressLabel, { color: '#606060', fontFamily: FONTS.bold }]}>TODAY'S PROGRESS</Text>
                <Text style={[styles.progressLabel, { color: GOLD, fontFamily: FONTS.bold }]}>{doneCount}/{exercises.length}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: '#1A1A1A' }]}>
                <View style={[styles.progressFill, { width: `${(doneCount / exercises.length) * 100}%`, backgroundColor: GOLD }]} />
              </View>
            </View>
          )}

          {/* Exercise cards */}
          <View style={{ paddingHorizontal: SPACING.lg }}>
            {exercises.map(ex => {
              const done = completedToday.includes(ex.key);
              return (
                <PressableScale
                  key={ex.key}
                  onPress={() => router.push({ pathname: '/exercise', params: { exerciseKey: ex.key, title: ex.title, videoId: ex.videoId, sets: ex.sets, muscle: ex.muscle } } as any)}
                  style={[styles.exCard, { backgroundColor: '#111111', borderColor: done ? GOLD + '60' : '#2A2A2A' }]}
                >
                  <View style={styles.exLeft}>
                    <View style={[styles.exIcon, { backgroundColor: done ? GOLD + '20' : '#1A1A1A' }]}>
                      <Feather name={done ? 'check' : 'play'} size={16} color={done ? GOLD : '#606060'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exTitle, { color: '#FFFFFF', fontFamily: FONTS.semiBold }]}>{ex.title}</Text>
                      <Text style={[styles.exMeta, { color: '#606060', fontFamily: FONTS.regular }]}>{ex.sets} · {ex.muscle}</Text>
                      {ex.bro && (
                        <Text style={[styles.broNote, { color: '#9A9A9A', fontFamily: FONTS.regular }]} numberOfLines={2}>
                          Your gym bro says: {ex.bro}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); markComplete(ex); }}
                    style={[styles.startBtn, { backgroundColor: done ? '#2ECC7120' : GOLD, borderColor: done ? '#2ECC71' : GOLD }]}
                  >
                    <Text style={[styles.startBtnText, { color: done ? '#2ECC71' : '#000', fontFamily: FONTS.bold }]}>
                      {done ? 'DONE' : 'START'}
                    </Text>
                  </TouchableOpacity>
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const bodyStyles = StyleSheet.create({
  sectionTitle: { fontSize: 11, letterSpacing: 2 },
  statsRow: { flexDirection: 'row', borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: 4 },
  statVal: { fontSize: 13, marginBottom: 2 },
  statLabel: { fontSize: 8, letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: '#2A2A2A', marginVertical: SPACING.sm },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 0.5 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  calcCard: { width: '48%', borderRadius: RADIUS.lg, borderWidth: 1, padding: 10, gap: 4 },
  calcIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  calcName: { fontSize: 10 },
  calcDesc: { fontSize: 8, lineHeight: 13 },
  toolBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs, borderWidth: 1, alignSelf: 'flex-start', marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  headerSub: { fontSize: 9, letterSpacing: 2 },
  title: { fontSize: 28, letterSpacing: 2 },
  suppBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: GOLD + '15', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: GOLD + '30' },
  progressWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  progressLabel: { fontSize: 10, letterSpacing: 1 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: 4, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  tabBtn: { paddingVertical: 10, paddingHorizontal: SPACING.md, marginRight: 8 },
  tabText: { fontSize: 14 },
  programLabel: { fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  programSub: { fontSize: 9, letterSpacing: 1.5, marginBottom: SPACING.md },
  naturalMax: {
    marginHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 0.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: SPACING.md,
  },
  naturalMaxText: { fontSize: 8, letterSpacing: 1.5 },
  exCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm,
  },
  exLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, flex: 1, marginRight: SPACING.sm },
  exIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  exTitle: { fontSize: 14, marginBottom: 2 },
  exMeta: { fontSize: 11, marginBottom: 4 },
  broNote: { fontSize: 10, lineHeight: 16, fontStyle: 'italic' },
  startBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, minWidth: 64, alignItems: 'center' },
  startBtnText: { fontSize: 11, letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
