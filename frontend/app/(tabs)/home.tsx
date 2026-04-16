import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Floating particle ─────────────────────────────────────────────────────────
function Particle({ x, delay }: { x: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 4000 + Math.random() * 3000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(SH * 0.6)] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.3] });

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: x, bottom: SH * 0.08, transform: [{ translateY }, { scale }], opacity },
      ]}
    />
  );
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function TrialTimer({ trialEnd }: { trialEnd: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const calc = () => {
      const diff = new Date(trialEnd).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, mins: 0 }); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, mins });
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [trialEnd]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cells = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.mins, label: 'MIN' },
  ];

  return (
    <Animated.View style={[styles.timerCard, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.timerHeader}>
        <Feather name="clock" size={14} color={GOLD} />
        <Text style={[styles.timerLabel, { fontFamily: FONTS.bold }]}>FREE TRIAL REMAINING</Text>
      </View>
      <View style={styles.timerRow}>
        {cells.map((c, i) => (
          <React.Fragment key={c.label}>
            <View style={styles.timerCell}>
              <Text style={[styles.timerNum, { fontFamily: FONTS.cinzelBold }]}>{String(c.value).padStart(2, '0')}</Text>
              <Text style={[styles.timerUnit, { fontFamily: FONTS.bold }]}>{c.label}</Text>
            </View>
            {i < 2 && <Text style={styles.timerColon}>:</Text>}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickBtn({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} style={styles.quickBtn} activeOpacity={0.8}>
        <View style={[styles.quickBtnIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
        <Text style={[styles.quickBtnLabel, { fontFamily: FONTS.semiBold }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { daysLeft, isInTrial, trialExpired } = usePlan();
  const router = useRouter();

  const [stats, setStats] = useState({ streak: 0, xp: 0, workouts: 0 });
  const [missions, setMissions] = useState<{ id: string; title: string; xp: number; done: boolean }[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
    x: (SW / 10) * i + Math.random() * 30,
    delay: i * 600,
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    fetchStats();
    buildMissions();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [xpRes, workRes, streakRes] = await Promise.all([
        supabase.from('xp_log').select('amount').eq('user_id', user.id),
        supabase.from('workout_completions').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('workout_completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(30),
      ]);
      const totalXP = (xpRes.data || []).reduce((s: number, x: any) => s + (x.amount || 0), 0);
      const workouts = workRes.count || 0;
      let streak = 0;
      const dates = new Set((streakRes.data || []).map((d: any) => d.completed_at?.split('T')[0]));
      let checkDate = new Date();
      while (dates.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      setStats({ streak, xp: totalXP, workouts });
    } catch (e) {}
  };

  const buildMissions = () => {
    const dailyMissions = [
      { id: '1', title: 'Complete a workout', xp: 40, done: false },
      { id: '2', title: 'Read today\'s wisdom card', xp: 20, done: false },
      { id: '3', title: 'Log your supplement stack', xp: 15, done: false },
    ];
    setMissions(dailyMissions);
  };

  const toggleMission = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMissions(prev => prev.map(m => m.id === id ? { ...m, done: !m.done } : m));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const name = profile?.full_name?.toUpperCase() || 'BROTHER';
  const doneMissions = missions.filter(m => m.done).length;
  const totalXP = profile?.xp || stats.xp;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      {/* Particles background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PARTICLES.map((p, i) => <Particle key={i} x={p.x} delay={p.delay} />)}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoRow}>
            <Text style={[styles.logo, { fontFamily: FONTS.cinzelBold }]}>MAXX</Text>
            <View style={[styles.sunIcon, { borderColor: GOLD + '40' }]}>
              <Feather name="sun" size={14} color={GOLD} />
            </View>
          </View>
          <Text style={[styles.greeting, { fontFamily: FONTS.bold }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { fontFamily: FONTS.cinzelBold }]}>{name}</Text>
          <Text style={[styles.tagline, { fontFamily: FONTS.regular }]}>
            Become the man you were built to be.
          </Text>
        </Animated.View>

        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* ── Trial Timer ───────────────────────────────────────────────── */}
          {profile?.trial_end && isInTrial() && (
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
              <TrialTimer trialEnd={profile.trial_end} />
            </View>
          )}

          {/* Trial expired CTA */}
          {trialExpired() && (
            <TouchableOpacity
              onPress={() => router.push('/plans' as any)}
              style={[styles.expiredBanner, { backgroundColor: '#E74C3C22', borderColor: '#E74C3C55' }]}
            >
              <Feather name="alert-circle" size={16} color="#E74C3C" />
              <Text style={[styles.expiredText, { fontFamily: FONTS.bold }]}>Trial ended — Upgrade to continue</Text>
              <Feather name="chevron-right" size={16} color="#E74C3C" />
            </TouchableOpacity>
          )}

          {/* ── Stats row ──────────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {[
              { label: 'STREAK', value: stats.streak, icon: 'zap', color: '#F39C12' },
              { label: 'TOTAL XP', value: totalXP, icon: 'award', color: GOLD },
              { label: 'WORKOUTS', value: stats.workouts, icon: 'activity', color: '#2ECC71' },
            ].map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
                <Feather name={s.icon as any} size={16} color={s.color} />
                <Text style={[styles.statVal, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: '#606060', fontFamily: FONTS.bold }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Daily Missions ─────────────────────────────────────────────── */}
          <View style={[styles.section, { paddingHorizontal: SPACING.lg }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>ACTIVE MISSIONS</Text>
              <View style={[styles.missionBadge, { backgroundColor: doneMissions === missions.length && missions.length > 0 ? GOLD + '30' : '#1A1A1A', borderColor: GOLD + '40' }]}>
                <Text style={[styles.missionBadgeText, { color: GOLD, fontFamily: FONTS.bold }]}>
                  {doneMissions}/{missions.length} COMPLETE
                </Text>
              </View>
            </View>
            {missions.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => toggleMission(m.id)}
                style={[styles.missionRow, {
                  backgroundColor: '#111111',
                  borderColor: m.done ? GOLD + '50' : '#2A2A2A',
                }]}
                activeOpacity={0.8}
              >
                <View style={[styles.missionCheck, {
                  backgroundColor: m.done ? GOLD : 'transparent',
                  borderColor: m.done ? GOLD : '#4A4A4A',
                }]}>
                  {m.done && <Feather name="check" size={12} color="#000" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.missionTitle, {
                    color: m.done ? '#606060' : '#FFFFFF',
                    fontFamily: FONTS.semiBold,
                    textDecorationLine: m.done ? 'line-through' : 'none',
                  }]}>
                    {m.title}
                  </Text>
                </View>
                <Text style={[styles.missionXP, { color: GOLD, fontFamily: FONTS.bold }]}>+{m.xp} XP</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Quick Actions ───────────────────────────────────────────────── */}
          <View style={[styles.section, { paddingHorizontal: SPACING.lg }]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, marginBottom: SPACING.md }]}>
              QUICK ACCESS
            </Text>
            <View style={styles.quickGrid}>
              <QuickBtn icon="activity" label="TRAIN" color={GOLD} onPress={() => router.push('/(tabs)/train' as any)} />
              <QuickBtn icon="sun" label="FOCUS" color="#9B59B6" onPress={() => router.push('/(tabs)/focus' as any)} />
              <QuickBtn icon="users" label="SOCIAL" color="#3498DB" onPress={() => router.push('/(tabs)/social' as any)} />
              <QuickBtn icon="package" label="SUPPS" color="#2ECC71" onPress={() => router.push('/supplements' as any)} />
              <QuickBtn icon="book-open" label="LIBRARY" color="#E67E22" onPress={() => router.push('/(tabs)/social' as any)} />
              <QuickBtn icon="cpu" label="AI STACK" color="#E74C3C" onPress={() => router.push('/stack-builder' as any)} />
            </View>
          </View>

          {/* ── Motivational footer ─────────────────────────────────────────── */}
          <View style={[styles.quoteCard, { backgroundColor: '#111111', borderColor: GOLD + '30' }]}>
            <Text style={[styles.quote, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>
              "Success is not given. It is built, rep by rep, day by day."
            </Text>
            <View style={[styles.quoteLine, { backgroundColor: GOLD }]} />
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  logo: { fontSize: 14, color: GOLD, letterSpacing: 6 },
  sunIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 12, color: '#606060', letterSpacing: 2, marginBottom: 4 },
  userName: { fontSize: 32, color: GOLD, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  tagline: { fontSize: 13, color: '#9A9A9A', textAlign: 'center', lineHeight: 20 },
  timerCard: {
    backgroundColor: '#111111',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: GOLD + '40',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  timerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md },
  timerLabel: { color: GOLD, fontSize: 10, letterSpacing: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  timerCell: { alignItems: 'center', minWidth: 60 },
  timerNum: { fontSize: 36, color: GOLD, lineHeight: 42 },
  timerUnit: { fontSize: 9, color: '#606060', letterSpacing: 1.5, marginTop: 2 },
  timerColon: { fontSize: 28, color: GOLD + '80', marginBottom: 16 },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  expiredText: { flex: 1, color: '#E74C3C', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statVal: { fontSize: 20 },
  statLabel: { fontSize: 8, letterSpacing: 0.8 },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 11, letterSpacing: 2 },
  missionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  missionBadgeText: { fontSize: 9, letterSpacing: 1 },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  missionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitle: { fontSize: 14 },
  missionXP: { fontSize: 11 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickBtn: { width: (SW - SPACING.lg * 2 - SPACING.sm * 2) / 3, alignItems: 'center', gap: 6 },
  quickBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBtnLabel: { fontSize: 9, color: '#9A9A9A', letterSpacing: 1 },
  quoteCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  quote: { fontSize: 14, lineHeight: 24, textAlign: 'center', marginBottom: SPACING.md },
  quoteLine: { width: 40, height: 2, borderRadius: 1 },
});
