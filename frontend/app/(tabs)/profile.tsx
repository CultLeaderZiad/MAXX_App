import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { ProgressBar } from '../../src/components/ProgressBar';
import { supabase } from '../../lib/supabase';

const STATS = [
  { label: 'STREAK', value: 12 },
  { label: 'WORKOUTS', value: 26 },
  { label: 'WISDOM', value: 18 },
  { label: 'DAYS', value: 34 },
];

const BADGES = [
  { id: 1, label: 'Week 1', icon: 'star', unlocked: true },
  { id: 2, label: 'Iron Will', icon: 'anchor', unlocked: true },
  { id: 3, label: 'Consistent', icon: 'activity', unlocked: true },
  { id: 4, label: 'Day 30', icon: 'lock', unlocked: false },
  { id: 5, label: 'NoFap 30', icon: 'lock', unlocked: false },
  { id: 6, label: 'Sigma', icon: 'lock', unlocked: false },
  { id: 7, label: 'Legend', icon: 'lock', unlocked: false },
  { id: 8, label: '365 Days', icon: 'lock', unlocked: false },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);

  const powerLevel = profile?.power_level || 750; // Mock default if not set
  const maxPower = 1000;
  const progress = powerLevel / maxPower;
  
  const size = 100;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleAvatarPress = async () => {
    Alert.alert(
        'Update Profile Photo',
        'Choose an option',
        [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Take Photo', onPress: () => pickImage(true) },
            { text: 'Choose from Library', onPress: () => pickImage(false) },
        ]
    );
  };

  const pickImage = async (useCamera: boolean) => {
      let result;
      if (useCamera) {
          await ImagePicker.requestCameraPermissionsAsync();
          result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
          });
      } else {
          result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
          });
      }

      if (!result.canceled) {
          setAvatar(result.assets[0].uri);
          // Upload to Supabase Storage (Mock for now or implement if bucket exists)
          // const file = result.assets[0];
          // supabase.storage.from('avatars').upload(...)
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
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={styles.avatarWrapper}>
             <View style={{ position: 'absolute' }}>
                 <Svg width={size} height={size}>
                     <Circle
                        stroke={theme.bgElevated}
                        cx={center}
                        cy={center}
                        r={radius}
                        strokeWidth={strokeWidth}
                     />
                     <Circle
                        stroke={theme.gold}
                        cx={center}
                        cy={center}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${center}, ${center}`}
                     />
                 </Svg>
             </View>
             <View style={[styles.avatarCircle, { backgroundColor: theme.bgElevated }]}>
                {avatar || profile?.avatar_url ? (
                    <Image source={{ uri: avatar || profile?.avatar_url }} style={styles.avatarImg} />
                ) : (
                    <Text style={[styles.initials, { color: theme.textMuted, fontFamily: FONTS.cinzelBold }]}>
                        {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                )}
             </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: -4 }}>@{profile?.username || 'username'}</Text>
          
          <View style={[styles.titlePill, { backgroundColor: '#8A642022', marginTop: 12 }]}>
             <Feather name="zap" size={12} color={theme.gold} />
             <Text style={[styles.titleText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
                {profile?.level_title || 'BEGINNER'}
             </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {STATS.map(s => (
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
               <Text style={[styles.powerVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{powerLevel} / {maxPower}</Text>
            </View>
          </View>
          <ProgressBar progress={progress} />
          <Text style={[styles.xpToNext, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
            {maxPower - powerLevel} XP TO NEXT LEVEL
          </Text>
        </View>
        
        {/* Plan Card */}
        <View style={[styles.planCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={[styles.planLabel, { color: theme.textMuted }]}>CURRENT PLAN</Text>
                    <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{profile?.plan || 'Free Plan'}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/plans')} style={[styles.upgradeBtn, { backgroundColor: theme.gold }]}>
                    <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 12 }}>UPGRADE</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesWrap}>
           <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>BADGES</Text>
           <View style={styles.badgeGrid}>
              {BADGES.map(b => (
                <View key={b.id} style={styles.badgeItem}>
                   <View style={[styles.badgeIcon, { backgroundColor: theme.bgElevated, opacity: b.unlocked ? 1 : 0.3 }]}>
                      <Feather name={b.icon as any} size={22} color={b.unlocked ? theme.gold : theme.textMuted} />
                   </View>
                   <Text style={[styles.badgeLabel, { color: b.unlocked ? theme.textSecondary : theme.textMuted, fontFamily: FONTS.regular }]}>{b.label}</Text>
                </View>
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
