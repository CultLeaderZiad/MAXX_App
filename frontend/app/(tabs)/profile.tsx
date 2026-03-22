import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { FONTS, SPACING } from '../../src/constants/theme';
import { ProgressBar } from '../../src/components/ProgressBar';

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
  const { user } = useAuth();
  const router = useRouter();

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
          <View style={[styles.avatarCircle, { borderColor: theme.gold }]}>
             <Feather name="user" size={40} color={theme.textMuted} />
          </View>
          <Text style={[styles.userName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{user?.full_name || 'Ziad Sabry'}</Text>
          <View style={[styles.titlePill, { backgroundColor: '#8A642022' }]}>
             <Feather name="zap" size={12} color={theme.gold} />
             <Text style={[styles.titleText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>ALPHA RISING</Text>
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
               <Text style={[styles.powerVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>780 / 1000</Text>
            </View>
          </View>
          <ProgressBar progress={0.78} />
          <Text style={[styles.xpToNext, { color: theme.textMuted, fontFamily: FONTS.medium }]}>ALPHA RISING — 220 XP TO SIGMA</Text>
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
  avatarSection: { alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.sm },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 24, marginVertical: 4 },
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
  badgesWrap: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 12, letterSpacing: 1.2, marginBottom: SPACING.lg },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeItem: { width: '25%', alignItems: 'center', marginBottom: SPACING.lg },
  badgeIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 11, marginTop: 8 },
});
