import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { ProgressBar } from '../../src/components/ProgressBar';
import { supabase } from '../../lib/supabase';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, profile, fetchProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [streaks, setStreaks] = useState<any[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [displayStats, setDisplayStats] = useState({ streak: 0, workouts: 0, days: 0, xp: 0 });
  const powerLevelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [sRes, wRes, bRes] = await Promise.all([
        supabase.from('streaks').select('*').eq('user_id', user.id),
        supabase.from('workout_completions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('badges').select('*').eq('user_id', user.id)
      ]);

      setStreaks(sRes.data || []);
      setWorkoutCount(wRes.count || 0);
      setBadges(bRes.data || []);
      
      const streakVal = sRes.data?.find((s: any) => s.streak_type === 'daily')?.current_streak || 0;
      const daysActive = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;
      const targetStats = {
        streak: streakVal,
        workouts: wRes.count || 0,
        days: daysActive,
        xp: profile?.xp || 0
      };

      animateNumbers(targetStats);

      Animated.timing(powerLevelAnim, {
        toValue: (profile?.power_level || 0) / 10,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }).start();

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const animateNumbers = (targets: any) => {
    const duration = 1000;
    const interval = 20;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setDisplayStats({
        streak: Math.floor((targets.streak / steps) * currentStep),
        workouts: Math.floor((targets.workouts / steps) * currentStep),
        days: Math.floor((targets.days / steps) * currentStep),
        xp: Math.floor((targets.xp / steps) * currentStep),
      });

      if (currentStep >= steps) {
        setDisplayStats(targets);
        clearInterval(timer);
      }
    }, interval);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && user) {
      const file = result.assets[0];
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri: file.uri, name: 'avatar.jpg', type: 'image/jpeg' });

      try {
        const filePath = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData as any, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
          fetchProfile();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="profile-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Profile</Text>
        <TouchableOpacity style={styles.gearBtn} onPress={() => router.push('/settings')} testID="profile-settings-btn">
          <Feather name="settings" size={24} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={[styles.avatarImg, { borderRadius: 50, borderWidth: 2, borderColor: theme.gold }]} />
            ) : (
              <LinearGradient
                colors={[theme.gold, '#8A6420']}
                style={[styles.avatarCircle, { borderRadius: 50, alignItems: 'center', justifyContent: 'center' }]}
              >
                <Text style={[styles.initials, { color: '#FFF', fontFamily: FONTS.cinzelBold }]}>
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.textPrimary, fontFamily: FONTS.semiBold, marginTop: 12 }]}>
            {profile?.full_name || 'Alchemist'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: -4 }}>@{profile?.username || 'brother'}</Text>
          
          <View style={[styles.titlePill, { backgroundColor: '#C8A96E22', marginTop: 12 }]}>
             <Feather name="zap" size={12} color={theme.gold} />
             <Text style={[styles.titleText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
                {profile?.level_title || 'BEGINNER'}
             </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'STREAK', value: displayStats.streak },
            { label: 'WORKOUTS', value: displayStats.workouts },
            { label: 'DAYS', value: displayStats.days },
            { label: 'XP', value: displayStats.xp },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
               <Text style={[styles.statValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
               <Text style={[styles.statLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Power Level */}
        <View style={[styles.powerCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.powerInfo}>
            <Text style={[styles.powerLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>POWER LEVEL</Text>
            <View style={styles.powerValRow}>
               <Feather name="zap" size={16} color={theme.gold} />
               <Text style={[styles.powerVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{profile?.power_level || 0}</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
            <Animated.View 
              style={{ 
                height: '100%', 
                backgroundColor: theme.gold, 
                width: powerLevelAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                }) 
              }} 
            />
          </View>
          <Text style={[styles.xpToNext, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
            XP PROGRESS LOADED
          </Text>
        </View>
        
        {/* Plan Card */}
        <View style={[styles.planCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={[styles.planLabel, { color: theme.textMuted }]}>CURRENT PLAN</Text>
                    <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                        {profile?.plan?.replace('_', ' ').toUpperCase() || 'FREE PLAN'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/plans')} style={[styles.upgradeBtn, { backgroundColor: theme.gold }]}>
                    <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 12 }}>UPGRADE</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesWrap}>
           <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>BADGES {badges.length}</Text>
           <View style={styles.badgeGrid}>
              {badges.map(b => (
                <View key={b.id} style={styles.badgeItem}>
                   <View style={[styles.badgeIcon, { backgroundColor: theme.bgElevated, borderColor: theme.gold, borderWidth: 1 }]}>
                      <Feather name="award" size={22} color={theme.gold} />
                   </View>
                   <Text style={[styles.badgeLabel, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{b.name || 'Achievement'}</Text>
                </View>
              ))}
              {/* Locked placeholders */}
              {[1, 2, 3, 4].map(i => (
                <TouchableOpacity key={'locked-'+i} onPress={() => Alert.alert('Locked', 'Continue your journey to earn this badge.')} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: theme.bgElevated, opacity: 0.3 }]}>
                      <Feather name="lock" size={22} color={theme.textMuted} />
                   </View>
                   <Text style={[styles.badgeLabel, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Locked</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  title: { fontSize: 28 },
  gearBtn: { padding: 8 },
  scroll: { paddingBottom: SPACING.xl },
  avatarSection: { alignItems: 'center', marginTop: SPACING.xl },
  avatarWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  initials: { fontSize: 32 },
  userName: { fontSize: 24, marginTop: 12 },
  titlePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  titleText: { fontSize: 13, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  statCard: { flex: 1, height: 70, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 9, letterSpacing: 1, marginTop: 4 },
  powerCard: { marginTop: SPACING.xl, marginHorizontal: SPACING.lg, padding: SPACING.lg, borderRadius: 16, borderWidth: 1 },
  powerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  powerLabel: { fontSize: 11, letterSpacing: 1.2 },
  powerValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  powerVal: { fontSize: 16 },
  xpToNext: { fontSize: 11, textAlign: 'center', marginTop: SPACING.md, letterSpacing: 1 },
  planCard: { marginTop: SPACING.md, marginHorizontal: SPACING.lg, padding: SPACING.lg, borderRadius: 16, borderWidth: 1 },
  planLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  planName: { fontSize: 18 },
  upgradeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  badgesWrap: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 12, letterSpacing: 1.2, marginBottom: SPACING.lg },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeItem: { width: '25%', alignItems: 'center', marginBottom: SPACING.lg },
  badgeIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 11, marginTop: 8 },
});
