import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { PressableScale } from '../../src/components/PressableScale';

const XP_LEVELS = [
  { level: 1, title: 'Beginner', min: 0 },
  { level: 2, title: 'Apprentice', min: 200 },
  { level: 3, title: 'Grinder', min: 500 },
  { level: 4, title: 'Alpha', min: 1000 },
  { level: 5, title: 'Sigma', min: 2000 },
  { level: 6, title: 'Legend', min: 5000 },
];

function getLevelInfo(xp: number) {
  let current = XP_LEVELS[0];
  let next = XP_LEVELS[1];
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].min) {
      current = XP_LEVELS[i];
      next = XP_LEVELS[i + 1] || XP_LEVELS[i];
    }
  }
  const progress = next.min > current.min
    ? Math.min((xp - current.min) / (next.min - current.min), 1)
    : 1;
  return { current, next, progress };
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({ workouts: 0, streak: 0, totalXP: 0, daysActive: 0 });
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [workoutsRes, xpRes, streakRes] = await Promise.all([
        supabase.from('workout_completions').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('xp_log').select('amount').eq('user_id', user.id),
        supabase.from('workout_completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(30),
      ]);

      const totalXP = (xpRes.data || []).reduce((s: number, x: any) => s + (x.amount || 0), 0);
      const workoutCount = workoutsRes.count || 0;

      // Calculate streak
      let streak = 0;
      const dates = new Set((streakRes.data || []).map((d: any) => d.completed_at?.split('T')[0]));
      let checkDate = new Date();
      while (dates.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      setStats({ workouts: workoutCount, streak, totalXP, daysActive: dates.size });
    } catch (e) {
      console.log('Stats fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const xp = profile?.xp || stats.totalXP;
      const { progress } = getLevelInfo(xp);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [loading, stats]);

  const xp = profile?.xp || stats.totalXP;
  const { current: lvl, next: nextLvl, progress } = getLevelInfo(xp);
  const name = profile?.full_name || 'Brother';
  const initials = name[0]?.toUpperCase() || 'B';

  const STAT_CARDS = [
    { label: 'Workouts', value: stats.workouts, icon: 'activity' },
    { label: 'Day Streak', value: stats.streak, icon: 'zap' },
    { label: 'XP Total', value: xp, icon: 'award' },
    { label: 'Days Active', value: stats.daysActive, icon: 'calendar' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/settings/index' as any)}>
            <Feather name="settings" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.gold} size="large" />
          </View>
        ) : (
          <>
            {/* Avatar + Info */}
            <View style={[styles.profileCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <View style={styles.avatarRow}>
                {profile?.avatar_url ? (
                  <Animated.Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.gold + '22' }]}>
                    <Text style={[styles.avatarInitial, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{initials}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{name}</Text>
                  <View style={styles.levelRow}>
                    <View style={[styles.levelBadge, { backgroundColor: theme.gold + '22' }]}>
                      <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1 }]}>LVL {lvl.level} — {lvl.title}</Text>
                    </View>
                  </View>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 4 }]}>
                    {profile?.bio || 'Building the best version of myself.'}
                  </Text>
                </View>
              </View>

              {/* XP Progress */}
              <View style={{ marginTop: SPACING.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1 }]}>XP PROGRESS</Text>
                  <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 10 }]}>{xp} / {nextLvl.min} XP</Text>
                </View>
                <View style={[styles.xpBar, { backgroundColor: theme.bgElevated }]}>
                  <Animated.View
                    style={[styles.xpFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                      backgroundColor: theme.gold,
                    }]}
                  />
                </View>
                <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 6 }]}>
                  {nextLvl.min - xp > 0 ? `${nextLvl.min - xp} XP to ${nextLvl.title}` : 'Max level reached!'}
                </Text>
              </View>
            </View>

            {/* Stat Grid */}
            <View style={styles.statGrid}>
              {STAT_CARDS.map(s => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                  <Feather name={s.icon as any} size={18} color={theme.gold} />
                  <Text style={[styles.statVal, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={[styles.section, { paddingHorizontal: SPACING.lg }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.bold }]}>QUICK ACTIONS</Text>
              <PressableScale
                onPress={() => router.push('/stack-builder' as any)}
                style={[styles.actionRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              >
                <Feather name="cpu" size={20} color={theme.gold} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 15 }]}>AI Supplement Stack</Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12 }]}>Generate your custom protocol</Text>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </PressableScale>
              <PressableScale
                onPress={() => router.push('/settings/edit-profile' as any)}
                style={[styles.actionRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginTop: SPACING.sm }]}
              >
                <Feather name="edit-3" size={20} color={theme.textSecondary} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 15 }]}>Edit Profile</Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12 }]}>Update name, bio, avatar</Text>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </PressableScale>
              <PressableScale
                onPress={() => router.push('/settings/index' as any)}
                style={[styles.actionRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginTop: SPACING.sm }]}
              >
                <Feather name="settings" size={20} color={theme.textSecondary} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 15 }]}>Settings</Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12 }]}>Account, security, preferences</Text>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </PressableScale>

              {profile?.role === 'admin' && (
                <PressableScale
                  onPress={() => router.push('/admin' as any)}
                  style={[styles.actionRow, { backgroundColor: '#E74C3C15', borderColor: '#E74C3C40', marginTop: SPACING.sm }]}
                >
                  <Feather name="shield" size={20} color="#E74C3C" />
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={[{ color: '#E74C3C', fontFamily: FONTS.semiBold, fontSize: 15 }]}>Super Admin Panel</Text>
                    <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12 }]}>Manage users, content, analytics</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#E74C3C" />
                </PressableScale>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  title: { fontSize: 28 },
  center: { height: 200, justifyContent: 'center', alignItems: 'center' },
  profileCard: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.lg },
  avatarRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32 },
  name: { fontSize: 20, marginBottom: 6 },
  levelRow: { flexDirection: 'row' },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  xpBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { width: '47%', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', gap: 6 },
  statVal: { fontSize: 24 },
  statLabel: { fontSize: 11, letterSpacing: 0.5 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 10, letterSpacing: 1.5, marginBottom: SPACING.sm, marginLeft: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
});
