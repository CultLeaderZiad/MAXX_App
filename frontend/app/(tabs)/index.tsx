import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ProgressBar } from '../../src/components/ProgressBar';
import { XPToast } from '../../src/components/XPToast';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { TrialBanner } from '../../src/components/TrialBanner';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { profile, user, fetchProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [missions, setMissions] = useState<any>(null);
  const [wisdom, setWisdom] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nofapTime, setNofapTime] = useState('00:00:00:00');
  
  const powerLevelAnim = useRef(new Animated.Value(0)).current;
  const xpFloatAnim = useRef(new Animated.Value(0)).current;
  const [xpFloatVisible, setXpFloatVisible] = useState(false);
  const [trialDismissed, setTrialDismissed] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, [user?.id]);

  useEffect(() => {
    // Real-time counter for NoFap
    const nofapStreak = profile?.streaks?.find((s: any) => s.type === 'nofap');
    if (!nofapStreak || !nofapStreak.start_date) return;

    const interval = setInterval(() => {
      const start = new Date(nofapStreak.start_date).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setNofapTime(`${days}d ${hours}h`);
    }, 1000 * 60); // update every minute

    // Initial calc
    const start = new Date(nofapStreak.start_date).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    setNofapTime(`${days}d ${hours}h`);

    return () => clearInterval(interval);
  }, [profile]);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [pRes, sRes, mRes, wRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('streaks').select('*').eq('user_id', user.id),
        supabase.from('daily_missions').select('*').eq('user_id', user.id).eq('mission_date', today).single(),
        supabase.from('wisdom_cards').select('*').eq('card_date', today).single()
      ]);

      if (pRes.data) {
        // Animate Power Level
        Animated.timing(powerLevelAnim, {
          toValue: (pRes.data.power_level || 0) / 10,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false
        }).start();
      }

      if (sRes.data) setStreak(sRes.data);
      if (wRes.data) {
        setWisdom(wRes.data);
      } else {
        // Fetch most recent available
        const { data: recentWisdom } = await supabase.from('wisdom_cards').select('*').order('card_date', { ascending: false }).limit(1).single();
        setWisdom(recentWisdom);
      }

      if (mRes.data) {
        setMissions(mRes.data);
      } else if (pRes.data) {
        // Generate daily missions
        const newMissions = {
          user_id: user.id,
          mission_date: today,
          tasks: [
            { id: '1', title: 'Jaw Set A — 3 sets mewing', xp: 40, completed: false },
            { id: '2', title: 'Posture check — 5 minutes', xp: 30, completed: false },
            { id: '3', title: 'Read today wisdom card', xp: 30, completed: false }
          ],
          completed_count: 0
        };
        const { data: createdMissions, error: mErr } = await supabase.from('daily_missions').insert(newMissions).select().single();
        if (createdMissions) setMissions(createdMissions);
        if (mErr) console.error('Mission generation failed:', mErr);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nofap = streak?.find((s: any) => s.streak_type === 'nofap');
    if (!nofap || nofap.current_streak === 0 || !nofap.last_activity_date) {
      setNofapTime('Start Today');
      return;
    }

    const interval = setInterval(() => {
      const lastActivity = new Date(nofap.last_activity_date).getTime();
      const streakInMs = nofap.current_streak * 24 * 60 * 60 * 1000;
      const start = lastActivity - streakInMs;
      const now = new Date().getTime();
      const diff = now - start;

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setNofapTime(`${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [streak]);

  const toggleMission = async (taskId: string) => {
    if (!missions || !user) return;
    
    const updatedTasks = missions.tasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const missionCount = updatedTasks.filter((t: any) => t.completed).length;
    const task = missions.tasks.find((t: any) => t.id === taskId);
    const isNowCompleted = !task.completed;

    // Immediate local update
    setMissions({ ...missions, tasks: updatedTasks, completed_count: missionCount });

    // DB Update
    await supabase.from('daily_missions')
      .update({ tasks: updatedTasks, completed_count: missionCount })
      .eq('id', missions.id);

    if (isNowCompleted) {
      // XP Log & Profile Update
      await supabase.from('xp_log').insert({
        user_id: user.id,
        amount: task.xp,
        reason: task.title,
        source: 'daily'
      });
      
      const { data: pData } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
      const newTotalXp = (pData?.xp || 0) + task.xp;
      await supabase.from('profiles').update({ xp: newTotalXp }).eq('id', user.id);
      
      // Floating XP animation
      setXpFloatVisible(true);
      xpFloatAnim.setValue(0);
      Animated.parallel([
        Animated.timing(xpFloatAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ]).start(() => setXpFloatVisible(false));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchProfile(); // Refresh global state
    }

    if (missionCount === 3 && isNowCompleted) {
      // Bonus for completing all
      await supabase.from('xp_log').insert({
        user_id: user.id,
        amount: 50,
        reason: 'All daily missions complete',
        source: 'daily'
      });
      const { data: pData } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
      await supabase.from('profiles').update({ xp: (pData?.xp || 0) + 50 }).eq('id', user.id);
      fetchProfile();
    }
  };

  if (loading) {
     return (
       <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems:'center' }]}>
          <ActivityIndicator size="large" color={theme.gold} />
       </SafeAreaView>
     );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="alert-circle" size={48} color={theme.red} />
        <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18, marginTop: 16 }}>Mission Uplink Failed</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>The brotherhood server is unreachable. Check your connection.</Text>
        <TouchableOpacity onPress={fetchHomeData} style={{ marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: theme.gold, borderRadius: RADIUS.pill }}>
          <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold }}>RETRY</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentLevelTitle = profile?.level_title || 'Beginner';
  const currentTotalXp = profile?.xp || 0;
  const xpForNextLevel = 1000; // Simplified
  const xpProgress = Math.min(1, (currentTotalXp % xpForNextLevel) / xpForNextLevel);

  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="home-screen">
      <XPToast amount={0} visible={false} onDone={() => {}} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Premium Header with Gradient */}
        <LinearGradient
          colors={[theme.gold + '33', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>
                Welcome, {profile?.full_name?.split(' ')[0] || 'Brother'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4, fontFamily: FONTS.regular }}>
                Day {profile?.nofap_days || 0} of your ascension
              </Text>
            </View>
            <TouchableOpacity testID="home-bell-btn" onPress={() => Alert.alert('Notifications', 'No new alerts.')} style={[styles.bellBtn, { backgroundColor: theme.bgElevated, borderRadius: 22 }]}>
              <Feather name="bell" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Power Level Glowing Card */}
          <View style={[styles.powerCard, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,169,110,0.3)', borderWidth: 1, borderRadius: 20, padding: SPACING.lg, overflow: 'hidden' }]}>
            <BlurView intensity={30} style={StyleSheet.absoluteFill} />
            <View style={styles.powerHeader}>
              <Text style={[styles.powerLabel, { color: theme.textSecondary, fontFamily: FONTS.medium, letterSpacing: 2 }]}>ALPHA STATUS: {profile?.rank ? profile.rank.toUpperCase() : 'BEGINNER'}</Text>
              <View style={styles.powerScore}>
                <Feather name="zap" size={20} color={theme.gold} />
                <Text style={[styles.powerValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{profile?.power_level || 0}</Text>
              </View>
            </View>
            
            {(() => {
               const rank = profile?.rank || 'Beginner';
               const curXp = profile?.xp || 0;
               let cMin = 0, nReq = 1000, nRank = 'Intermediate';
               if (rank === 'Intermediate') { cMin = 1000; nReq = 3000; nRank = 'Pro'; }
               else if (rank === 'Pro') { cMin = 3000; nReq = 6000; nRank = 'World Class'; }
               else if (rank === 'WorldClass' || rank === 'World Class') { cMin = 6000; nReq = 10000; nRank = 'MAX'; }
               
               const progressPct = Math.max(0, Math.min(100, ((curXp - cMin) / (nReq - cMin)) * 100));
               return (
                 <>
                   <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginVertical: 10 }}>
                     <View 
                       style={{ 
                         height: '100%', 
                         backgroundColor: theme.gold, 
                         width: `${progressPct}%`,
                         shadowColor: theme.gold,
                         shadowOffset: { width: 0, height: 0 },
                         shadowOpacity: 0.8,
                         shadowRadius: 10,
                       }} 
                     />
                   </View>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Text style={[styles.levelTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
                       {nRank}
                     </Text>
                     <Text style={{ color: theme.textMuted, fontSize: 10 }}>{curXp} / {nReq} XP</Text>
                   </View>
                 </>
               );
            })()}
          </View>
        </LinearGradient>

        {xpFloatVisible && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute',
            top: 100,
            alignSelf: 'center',
            opacity: xpFloatAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [{ translateY: xpFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }]
          }}>
            <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 24 }}>+XP</Text>
          </Animated.View>
        )}

        {/* Free Trial Banner */}
        <TrialBanner />

        {/* Today's Mission */}
        <View style={[styles.missionCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md }]}>
          <View style={styles.missionHeader}>
            <Text style={[styles.missionTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>Today's Mission</Text>
            <View>
               <Text style={[{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 12 }]}>{missions?.completed_count || 0}/{missions?.tasks?.length || 0} done</Text>
            </View>
          </View>
          
          {missions?.tasks?.map((m: any) => (
            <TouchableOpacity key={m.id} onPress={() => toggleMission(m.id)} style={styles.missionRow}>
              <View style={[styles.missionCheck, { borderColor: m.completed ? theme.gold : theme.border, backgroundColor: m.completed ? theme.gold : 'transparent' }]}>
                {m.completed && <Feather name="check" size={12} color="#0A0A0A" />}
              </View>
              <Text style={[styles.missionName, { color: m.completed ? theme.textMuted : theme.textPrimary, fontFamily: FONTS.medium, textDecorationLine: m.completed ? 'line-through' : 'none', flex: 1, marginLeft: 12 }]}>
                {m.title}
              </Text>
              <View style={[styles.xpPill, { backgroundColor: theme.bgElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: FONTS.medium }}>+{m.xp} XP</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wisdom Drop */}
        <View style={[styles.wisdomCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md }]}>
          <Text style={[styles.wisdomLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>WISDOM DROP</Text>
          <Text style={[styles.wisdomQuote, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            "{wisdom?.quote || 'Focus on the mission.'}"
          </Text>
          <Text style={[styles.wisdomAuthor, { color: theme.textSecondary, fontFamily: FONTS.regular, marginTop: 4 }]}>— {wisdom?.author || 'The Council'}</Text>
          <Text style={[styles.wisdomLesson, { color: theme.textMuted, fontSize: 12, marginTop: 8, fontFamily: FONTS.regular }]}>{wisdom?.lesson}</Text>
        </View>

        {/* Bottom Progress Row */}
        <View style={styles.bottomStatsRow}>
          {[
            { label: 'NOFAP', val: nofapTime, unit: nofapTime.includes(':') ? 'live' : '', icon: 'zap' },
            { label: 'WORKOUTS', val: `${profile?.workouts_completed || 0}`, unit: 'total', icon: 'target' },
            { label: 'XP', val: `${profile?.xp || 0}`, unit: 'total', icon: 'award' },
          ].map((s, i) => (
            <View key={i} style={[styles.statBox, { backgroundColor: theme.bgSurface, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 10, flex: 1 }]}>
              <Text style={[styles.statLabelMini, { color: theme.textMuted, fontFamily: FONTS.medium }]}>{s.label}</Text>
              <Text style={[styles.statValLarge, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{s.val}</Text>
              <Text style={[styles.statUnitMini, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{s.unit}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: SPACING.xxl },
  headerGradient: { padding: SPACING.lg, paddingBottom: SPACING.xl, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xl, marginTop: SPACING.sm },
  greeting: { fontSize: 26 },
  bellBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  powerCard: { marginTop: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  powerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  powerLabel: { fontSize: 10, textTransform: 'uppercase' },
  powerScore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  powerValue: { fontSize: 32 },
  levelTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  
  trialBanner: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.md, marginHorizontal: SPACING.lg },
  trialContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  trialText: { fontSize: 13, flex: 1 },
  trialDays: { fontSize: 12 },
  
  missionCard: { marginHorizontal: SPACING.lg },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  missionTitle: { fontSize: 16 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 12 },
  missionCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  missionName: { fontSize: 14, flex: 1 },
  xpPill: { },
  
  wisdomCard: { marginHorizontal: SPACING.lg },
  wisdomLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: SPACING.sm },
  wisdomQuote: { fontSize: 18, fontStyle: 'italic', lineHeight: 26, marginTop: 8 },
  wisdomAuthor: { fontSize: 13, marginTop: 8 },
  wisdomLesson: { fontSize: 13, marginTop: 8 },
  
  bottomStatsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, marginHorizontal: SPACING.lg },
  statBox: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  statLabelMini: { letterSpacing: 1, fontSize: 9 },
  statValLarge: { fontSize: 16 },
  statUnitMini: { fontSize: 9 },
});
