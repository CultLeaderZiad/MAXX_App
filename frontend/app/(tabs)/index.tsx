import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing, Dimensions, Image, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { TrialBanner } from '../../src/components/TrialBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Local Animation Wrapper - Optimized
const AnimCard = ({ children, delay = 0, style = {} }: { children: React.ReactNode, delay?: number, style?: any }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={[style, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {children}
    </Animated.View>
  );
};

// Glowing Button Component - Optimized
const FuturisticButton = ({ label, icon, onPress, delay = 0, color }: { label: string, icon: any, onPress: () => void, delay?: number, color?: string }) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const activeColor = color || theme.gold;

  return (
    <AnimCard delay={delay} style={{ flex: 1 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          style={[styles.actionBtn, { backgroundColor: theme.bgSurface, borderColor: activeColor + '15' }]}
        >
          <Animated.View style={[styles.glowRing, { 
            borderColor: activeColor,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.25] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
          }]} />
          <View style={[styles.actionIconWrap, { backgroundColor: activeColor + '08' }]}>
            <Feather name={icon} size={22} color={activeColor} />
          </View>
          <Text style={[styles.actionLabel, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    </AnimCard>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { profile, user, fetchProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [missions, setMissions] = useState<any>(null);
  const [wisdom, setWisdom] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nofapTime, setNofapTime] = useState({ d: '0', h: '00', m: '00', s: '00' });
  const [xpVisible, setXpVisible] = useState(false);
  const [liveXp, setLiveXp] = useState(0);
  const xpAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile?.xp !== undefined) {
      setLiveXp(profile.xp);
    }
  }, [profile?.xp]);

  // Pulse animation for the Status Hub
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [user?.id]);

  const fetchHomeData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [sRes, mRes, wRes] = await Promise.all([
        supabase.from('streaks').select('*').eq('user_id', user.id),
        supabase.from('daily_missions').select('*').eq('user_id', user.id).eq('mission_date', today).maybeSingle(),
        supabase.from('wisdom_cards').select('*').eq('card_date', today).maybeSingle()
      ]);

      if (sRes.data) setStreak(sRes.data);
      if (wRes.data) {
        setWisdom(wRes.data);
      } else {
        const { data: recentWisdom } = await supabase.from('wisdom_cards').select('*').order('card_date', { ascending: false }).limit(1).maybeSingle();
        setWisdom(recentWisdom);
      }

      if (mRes.data) {
        setMissions(mRes.data);
      } else {
        const defaultMissions = {
          tasks: [
            { id: '1', title: 'Complete a workout', xp: 40, completed: false },
            { id: '2', title: 'Daily meditation', xp: 30, completed: false },
            { id: '3', title: 'Log supplements', xp: 30, completed: false }
          ],
          completed_count: 0
        };
        setMissions(defaultMissions);
      }
    } catch (e) {
      console.error('Home data fetch error:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nofap = streak?.find((s: any) => s.streak_type === 'nofap');
    if (!nofap) {
      setNofapTime({ d: '0', h: '00', m: '00', s: '00' });
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const last = new Date(nofap.last_activity_date).getTime();
      const diff = now - (last - (nofap.current_streak * 24 * 60 * 60 * 1000));
      if (diff < 0) return;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setNofapTime({ d: d.toString(), h: h.toString().padStart(2, '0'), m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') });
    }, 1000);
    return () => clearInterval(interval);
  }, [streak]);

  const toggleMission = async (id: string) => {
    if (!missions) return;
    const task = missions.tasks.find((t: any) => t.id === id);
    if (!task || task.completed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedTasks = missions.tasks.map((t: any) => t.id === id ? { ...t, completed: true } : t);
    const completedCount = updatedTasks.filter((t: any) => t.completed).length;
    setMissions({ ...missions, tasks: updatedTasks, completed_count: completedCount });
    setXpVisible(true);
    xpAnim.setValue(0);
    Animated.timing(xpAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => setXpVisible(false));
    
    // immediate optimistic update
    setLiveXp(prev => prev + task.xp);
    
    await supabase.from('profiles').update({ xp: (profile?.xp || 0) + task.xp }).eq('id', user?.id);
    fetchProfile();
  };

  const rank = profile?.rank || 'Beginner';
  const curXp = liveXp;
  let cMin = 0, nReq = 500, nRank = 'Intermediate';
  if (curXp >= 500) { cMin = 500; nReq = 1500; nRank = 'Pro'; }
  if (curXp >= 1500) { cMin = 1500; nReq = 5000; nRank = 'World Class'; }
  const progressPct = Math.max(2, Math.min(100, ((curXp - cMin) / (nReq - cMin)) * 100)); // min 2% so it looks alive for new users

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressPct,
      friction: 5,
      tension: 40,
      useNativeDriver: false
    }).start();
  }, [progressPct]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color={theme.gold} />
        <Text style={{ color: theme.gold, marginTop: 20, fontFamily: FONTS.cinzelBold, letterSpacing: 2 }}>DECODING BIO-STATS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Futuristic Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.gold }} />
               <Text style={[styles.welcome, { color: theme.textMuted }]}>MISSION CONTROL</Text>
            </View>
            <Text style={[styles.userName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
              {profile?.username?.toUpperCase() || 'OPERATIVE'}
            </Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/profile');
            }}
            style={[styles.profileCircle, { borderColor: theme.gold + '44' }]}
          >
             {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={24} color={theme.gold} />
            )}
            <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
          </TouchableOpacity>
        </View>

        {/* Status Hub Card with Breathing Effect */}
        <AnimCard delay={100} style={styles.cardWrap}>
          <Animated.View style={{ 
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) }]
          }}>
            <LinearGradient 
                colors={[theme.bgElevated, theme.bgSurface, '#000']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.statusCard, { borderColor: theme.gold + '33' }]}
            >
                <View style={[styles.matrixGridLines, { borderColor: theme.gold + '05' }]} />
                <View style={styles.statusRow}>
                <View>
                    <View style={styles.rankBadge}>
                    <Text style={[styles.rankLabel, { color: theme.gold }]}>{rank.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.xpValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                    {curXp} <Text style={{ fontSize: 16, color: theme.textMuted, fontFamily: FONTS.bold }}>XP</Text>
                    </Text>
                </View>
                <View style={styles.streakIndicator}>
                    <LinearGradient colors={[theme.gold, '#8B7355']} style={styles.streakIcon}>
                    <Feather name="zap" size={22} color="#000" />
                    </LinearGradient>
                    <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 26, marginTop: 4 }}>
                    {profile?.streak_days || 0}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 8, letterSpacing: 1.5, fontFamily: FONTS.bold }}>STREAK</Text>
                </View>
                </View>

                <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>PROGRESS TO {nRank.toUpperCase()}</Text>
                    <Text style={[styles.progressText, { color: theme.gold }]}>{progressPct.toFixed(1)}%</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Animated.View style={{ width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }}>
                      <LinearGradient colors={[theme.gold, '#8B7355']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', borderRadius: 4 }} />
                    </Animated.View>
                </View>
                </View>
            </LinearGradient>
          </Animated.View>
        </AnimCard>

        {/* Counter Card - Retention */}
        <AnimCard delay={200} style={styles.cardWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/nofap')} style={[styles.counterCard, { backgroundColor: '#000', borderColor: theme.gold + '22' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(200,169,110,0.1)' }} />
                <Text style={[styles.counterLabel, { color: theme.textMuted, marginBottom: 0 }]}>RETENTION PROTOCOL</Text>
                <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(200,169,110,0.1)' }} />
            </View>
            <View style={styles.timerRow}>
              <View style={styles.timerSegment}><Text style={[styles.timerValue, { color: theme.gold }]}>{nofapTime.d}</Text><Text style={styles.timerLabel}>DAYS</Text></View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerSegment}><Text style={[styles.timerValue, { color: theme.gold }]}>{nofapTime.h}</Text><Text style={styles.timerLabel}>HRS</Text></View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerSegment}><Text style={[styles.timerValue, { color: theme.gold }]}>{nofapTime.m}</Text><Text style={styles.timerLabel}>MIN</Text></View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerSegment}><Text style={[styles.timerValue, { color: theme.gold, width: 34 }]}>{nofapTime.s}</Text><Text style={styles.timerLabel}>SEC</Text></View>
            </View>
          </TouchableOpacity>
        </AnimCard>

        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: 10 }}>
          <TrialBanner />
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <FuturisticButton label="TRAIN" icon="activity" onPress={() => router.push('/(tabs)/train')} delay={300} />
            <FuturisticButton label="FOCUS" icon="target" onPress={() => router.push('/(tabs)/focus')} delay={350} color="#4A90D9" />
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 14 }}>
            <FuturisticButton label="SUPPS" icon="command" onPress={() => router.push('/supplements')} delay={400} color="#2ECC71" />
            <FuturisticButton label="LIBRARY" icon="book-open" onPress={() => router.push('/library')} delay={450} color="#9b59b6" />
          </View>
        </View>

        {/* Active Missions */}
        <AnimCard delay={500} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>ACTIVE MISSIONS</Text>
            <View style={[styles.badge, { backgroundColor: theme.gold + '15' }]}>
              <Text style={{ color: theme.gold, fontSize: 10, fontFamily: FONTS.bold }}>{missions?.completed_count || 0}/3 COMPLETE</Text>
            </View>
          </View>
          
          <View style={styles.missionList}>
            {missions?.tasks?.map((m: any, i: number) => (
              <TouchableOpacity key={m.id || i} onPress={() => toggleMission(m.id)} activeOpacity={0.8} style={[styles.missionCard, { backgroundColor: m.completed ? 'rgba(20,20,20,0.6)' : theme.bgSurface, borderColor: m.completed ? theme.gold + '22' : theme.border + '33' }]}>
                <View style={[styles.missionCheck, { borderColor: theme.gold, backgroundColor: m.completed ? theme.gold : 'transparent' }]}>{m.completed && <Feather name="check" size={12} color="#000" />}</View>
                <View style={styles.missionContent}>
                  <Text style={[styles.missionTitle, { color: m.completed ? theme.textMuted : theme.textPrimary, textDecorationLine: m.completed ? 'line-through' : 'none' }]}>{m.title}</Text>
                  <View style={styles.missionFooter}>
                    <Feather name="award" size={10} color={theme.gold} /><Text style={{ color: theme.gold, fontSize: 10, marginLeft: 6, letterSpacing: 1, fontFamily: FONTS.bold }}>+{m.xp} XP AWARD</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </AnimCard>

        {/* Wisdom of the Ancients */}
        {wisdom && (
          <AnimCard delay={600} style={styles.wisdomWrap}>
            <LinearGradient colors={[theme.bgElevated, 'transparent']} style={[styles.wisdomCard, { borderColor: theme.gold + '11' }]}>
              <View style={styles.wisdomHeader}>
                <View style={styles.wisdomLine} />
                <Feather name="shield" size={18} color={theme.gold} />
                <View style={styles.wisdomLine} />
              </View>
              <Text style={[styles.quoteText, { color: theme.textPrimary, fontStyle: 'italic', lineHeight: 28, fontFamily: FONTS.regular }]}>"{wisdom.content || wisdom.quote}"</Text>
              <Text style={[styles.quoteAuthor, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>— {wisdom.author || 'THE ARCHITECT'}</Text>
            </LinearGradient>
          </AnimCard>
        )}

        <View style={{ height: 120 }} />

        {/* Floating XP Animation */}
        {xpVisible && (
          <Animated.View style={[styles.xpFloat, { 
            opacity: xpAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateY: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }, { scale: xpAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0.8, 1.3, 1.3, 1] }) }]
          }]}>
            <LinearGradient colors={[theme.gold, '#FFE5B4']} style={styles.xpBubble}><Text style={{ color: '#000', fontSize: 20, fontFamily: FONTS.cinzelBold }}>+XP</Text></LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  welcome: { fontSize: 10, letterSpacing: 4, marginBottom: 4, fontFamily: FONTS.bold },
  userName: { fontSize: 30, letterSpacing: 1 },
  profileCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, overflow: 'hidden', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatar: { width: '100%', height: '100%' },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#000' },
  cardWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  statusCard: { padding: 26, borderRadius: 36, borderWidth: 1, overflow: 'hidden' },
  matrixGridLines: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rankBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(200,169,110,0.08)', marginBottom: 14 },
  rankLabel: { fontSize: 10, letterSpacing: 3, fontFamily: FONTS.bold },
  xpValue: { fontSize: 40, letterSpacing: -1.5 },
  streakIndicator: { alignItems: 'center' },
  streakIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#C8A96E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10 },
  progressSection: { marginTop: 28 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressText: { fontSize: 10, letterSpacing: 2, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.3)' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  counterCard: { padding: 24, borderRadius: 28, borderWidth: 1, alignItems: 'center' },
  counterLabel: { fontSize: 10, letterSpacing: 4, fontFamily: FONTS.bold },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerSegment: { alignItems: 'center', minWidth: 50 },
  timerValue: { fontSize: 26, fontFamily: FONTS.cinzelBold, textAlign: 'center' },
  timerLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, letterSpacing: 1.5, fontFamily: FONTS.bold },
  timerSeparator: { color: 'rgba(255,255,255,0.1)', fontSize: 22, marginBottom: 18 },
  actionGrid: { flexDirection: 'column', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  actionBtn: { flex: 1, borderRadius: 28, borderWidth: 1, paddingVertical: 24, alignItems: 'center', gap: 14, overflow: 'hidden' },
  glowRing: { position: 'absolute', width: '150%', height: '150%', borderRadius: 100, borderWidth: 2 },
  actionIconWrap: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, letterSpacing: 2.5 },
  sectionWrap: { paddingHorizontal: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  sectionTitle: { fontSize: 15, letterSpacing: 3 },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  missionList: { gap: 14 },
  missionCard: { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: 28, borderWidth: 1, gap: 18 },
  missionCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  missionContent: { flex: 1 },
  missionTitle: { fontSize: 17, fontFamily: FONTS.bold },
  missionFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wisdomWrap: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xxl },
  wisdomCard: { padding: 36, borderRadius: 36, borderWidth: 1, alignItems: 'center' },
  wisdomHeader: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 28 },
  wisdomLine: { flex: 1, height: 1, backgroundColor: 'rgba(200,169,110,0.05)' },
  quoteText: { fontSize: 18, textAlign: 'center', lineHeight: 30, marginBottom: 28 },
  quoteAuthor: { fontSize: 12, letterSpacing: 5 },
  xpFloat: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 1000 },
  xpBubble: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#C8A96E', shadowRadius: 20, shadowOpacity: 0.9 },
});
