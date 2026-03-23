import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';

const MILESTONES = [
  { days: 3, label: 'Iron Will' },
  { days: 7, label: 'One Week' },
  { days: 14, label: 'Two Weeks' },
  { days: 30, label: 'Monk Mode' },
  { days: 90, label: 'Rebooted' },
  { days: 365, label: 'Legendary' }
];

export default function NoFapScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { profile, user, fetchProfile } = useAuth();
  
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const nofapStreak = profile?.streaks?.find((s: any) => s.type === 'nofap');
    if (nofapStreak && nofapStreak.start_date) {
        const start = new Date(nofapStreak.start_date).getTime();
        const now = new Date().getTime();
        setStreakDays(Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    }
  }, [profile]);

  const handleRelapse = () => {
      Alert.alert(
          'Confirm Relapse',
          'Are you sure you want to reset your counter? Be honest with yourself.',
          [
              { text: 'Keep Pushing', style: 'cancel' },
              { text: 'I Relapsed', style: 'destructive', onPress: async () => {
                  setLoading(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  
                  try {
                      // 1. Log relapse
                      await supabase.from('relapse_log').insert({
                          user_id: user?.id,
                          streak_type: 'nofap',
                          days_lost: streakDays,
                          reason: 'Manual reset'
                      });

                      // 2. Reset streak table
                      await supabase.from('streaks')
                        .update({ current_streak: 0, last_activity_date: new Date().toISOString() })
                        .eq('user_id', user?.id)
                        .eq('streak_type', 'nofap');

                      // 3. Update profile streaks (legacy)
                      const activeStreaks = profile?.streaks?.filter((s:any) => s.type !== 'nofap') || [];
                      activeStreaks.push({ type: 'nofap', start_date: new Date().toISOString() });
                      await supabase.from('profiles').update({ streaks: activeStreaks }).eq('id', user?.id);
                      
                      setStreakDays(0);
                      fetchProfile();
                      Alert.alert('Reset Complete', 'Yesterday is gone. Today we win.');
                  } catch(e) { 
                      console.error('Relapse failed', e);
                  } finally {
                      setLoading(false);
                  }
              } }
          ]
      );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="nofap-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>NoFap Tracker</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.streakCircleWrap}>
           <View style={[styles.streakCircle, { borderColor: theme.gold }]}>
              <Text style={[styles.streakNum, { color: theme.gold, fontFamily: FONTS.bold }]}>{streakDays}</Text>
              <Text style={[styles.streakLabel, { color: theme.textMuted }]}>DAYS</Text>
           </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MILESTONES</Text>
        <View style={styles.milestoneGrid}>
            {MILESTONES.map(m => {
                const unlocked = streakDays >= m.days;
                return (
                    <View key={m.days} style={[styles.milestoneBox, { 
                        backgroundColor: theme.bgSurface, 
                        borderColor: unlocked ? theme.gold : theme.border, 
                        borderWidth: 1 
                    }]}>
                       {unlocked ? (
                           <Feather name="check" size={24} color={theme.gold} style={{ marginBottom: 4 }} />
                       ) : (
                           <Feather name="lock" size={20} color={theme.textMuted} style={{ marginBottom: 4 }} />
                       )}
                       <Text style={[styles.msDesc, { color: unlocked ? theme.textPrimary : theme.textMuted, fontFamily: FONTS.semiBold }]}>
                           {m.label}
                       </Text>
                       <Text style={[styles.msDays, { color: unlocked ? theme.gold : theme.textMuted }]}>
                           {m.days} Days
                       </Text>
                    </View>
                )
            })}
        </View>

        <View style={styles.actions}>
           <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity onPress={handleRelapse} disabled={loading} style={{ padding: 18, borderRadius: 16, alignItems: 'center', backgroundColor: '#E74C3C22', borderColor: '#E74C3C', borderWidth: 1.5 }}>
                  <Text style={{ color: '#E74C3C', fontFamily: FONTS.cinzelBold, letterSpacing: 1.5 }}>I RELAPSED (RESET)</Text>
              </TouchableOpacity>
           </Animated.View>
           <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 16, fontSize: 12 }}>Relapsing is a choice. Winning is a habit.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.lg },
  backBtn: { padding: 8 },
  title: { fontSize: 20 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  streakCircleWrap: { alignItems: 'center', marginVertical: SPACING.xl },
  streakCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  streakNum: { fontSize: 56 },
  streakLabel: { fontSize: 14, letterSpacing: 2 },
  sectionTitle: { fontSize: 13, letterSpacing: 1.2, fontFamily: FONTS.semiBold, marginBottom: SPACING.md, marginTop: SPACING.xl },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  milestoneBox: { width: '48%', padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginBottom: SPACING.md },
  msDesc: { fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' },
  msDays: { fontSize: 11, marginTop: 4 },
  actions: { marginTop: SPACING.xxl, marginBottom: SPACING.lg },
});
