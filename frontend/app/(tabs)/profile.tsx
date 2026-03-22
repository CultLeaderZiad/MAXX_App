import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { FONTS, SPACING } from '../../src/constants/theme';
import { MOCK_PROFILE, MOCK_STREAKS } from '../../src/constants/mockData';
import { getLevelTitle } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const initials = (user?.full_name || 'ZS').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="profile-screen">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Profile</Text>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <TouchableOpacity testID="profile-settings-btn" style={styles.settingsBtn}>
            <Feather name="settings" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { borderColor: theme.gold }]}>
          <Text style={[styles.initials, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{user?.full_name || 'Ziad'}</Text>
        <Badge label={getLevelTitle(MOCK_PROFILE.power_level)} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Streak', value: MOCK_STREAKS.daily.current_streak },
          { label: 'Workouts', value: MOCK_STREAKS.workout.current_streak },
          { label: 'Wisdom', value: 24 },
          { label: 'Days', value: 7 },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Power Level */}
      <Card testID="profile-power-card" style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.md }}>
        <View style={styles.powerRow}>
          <Text style={[styles.powerLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>POWER LEVEL</Text>
          <Text style={[styles.powerVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{MOCK_PROFILE.power_level}/1000</Text>
        </View>
        <ProgressBar progress={MOCK_PROFILE.power_level / 1000} />
      </Card>

      {/* Sign Out */}
      <View style={styles.signOutWrap}>
        <Button
          title="SIGN OUT"
          variant="danger"
          onPress={async () => { await signOut(); router.replace('/'); }}
          testID="profile-signout-btn"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  title: { fontSize: 28 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  settingsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', marginTop: SPACING.xl, gap: SPACING.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 28 },
  name: { fontSize: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, marginTop: 2 },
  powerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  powerLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  powerVal: { fontSize: 16 },
  signOutWrap: { paddingHorizontal: SPACING.lg, marginTop: 'auto', paddingBottom: SPACING.xl },
});
