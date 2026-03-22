import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING } from '../src/constants/theme';

export default function SettingsScreen() {
  const { theme, toggleTheme, mode } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const Item = ({ label, value, onPress, icon = 'chevron-right', color }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.item, { borderBottomColor: theme.border }]}
    >
      <View style={styles.itemLeft}>
        <Text style={[styles.itemLabel, { color: color || theme.textPrimary, fontFamily: FONTS.medium }]}>{label}</Text>
        {value && <Text style={[styles.itemSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{value}</Text>}
      </View>
      {icon && <Feather name={icon} size={16} color={theme.textMuted} />}
    </TouchableOpacity>
  );

  const ToggleItem = ({ label, value, onToggle }: any) => (
    <View style={[styles.item, { borderBottomColor: theme.border }]}>
      <Text style={[styles.itemLabel, { color: theme.textPrimary, fontFamily: FONTS.medium }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.gold }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="settings-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="ACCOUNT">
          <Item label="Edit Profile" onPress={() => {}} />
          <Item label="Change Password" onPress={() => {}} />
          <Item label="Delete Account" value="30-day grace period" color="#E74C3C" onPress={() => {}} icon={null} />
        </Section>

        <Section title="SECURITY">
          <ToggleItem label="Face ID / Touch ID" value={true} onToggle={() => {}} />
          <Item label="Active Sessions" value="2 devices" onPress={() => {}} />
        </Section>

        <Section title="APPEARANCE">
          <ToggleItem label="Dark Mode" value={mode === 'dark'} onToggle={toggleTheme} />
          <Item label="AI Engine" value="Claude" onPress={() => {}} />
        </Section>

        <Section title="SUBSCRIPTION">
          <Item label="Current Plan" value="Alpha" onPress={() => {}} />
          <Item label="Cancel Subscription" color={theme.textMuted} onPress={() => {}} icon={null} />
        </Section>
        
        <Section title="SUPPORT">
          <Item label="Contact Support" onPress={() => router.push('/support')} />
          <Item label="Supplements" onPress={() => router.push('/supplements')} />
        </Section>

        <View style={styles.footer}>
          <Button title="SIGN OUT" onPress={handleSignOut} variant="danger" />
          <Text style={[styles.version, { color: theme.textMuted, fontFamily: FONTS.regular }]}>MAXX v1.0.0 — Licensed to {user?.full_name || 'Member'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 24, marginLeft: SPACING.xs },
  scroll: { paddingBottom: SPACING.xl },
  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: SPACING.sm, marginLeft: 4 },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  itemLeft: { flex: 1 },
  itemLabel: { fontSize: 15 },
  itemSub: { fontSize: 12, marginTop: 2 },
  footer: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl, gap: SPACING.md, alignItems: 'center' },
  version: { fontSize: 12, opacity: 0.6 },
});
