import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
  Alert, TextInput, Modal, Linking, LayoutAnimation, UIManager, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING } from '../../src/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  { q: 'How does the XP system work?', a: 'You earn XP by completing workouts, logging streaks, finishing convo lab sessions, and completing onboarding modules. XP determines your rank level.' },
  { q: 'What is the Convo Lab?', a: 'An AI-powered simulation for social skills practice — first dates, cold approaches, salary negotiations, and frame control. Uses your Gemini API key.' },
  { q: 'How do I get a free Gemini API key?', a: 'Visit aistudio.google.com/app/apikey, create a free Google account, and generate a key. The free tier supports hundreds of daily requests.' },
  { q: 'What is mewing and how do I do it correctly?', a: 'Mewing is resting the entire tongue on the palate with a suction hold. The key is posterior tongue engagement — not just tip pressure. See the Video Guide in exercise screens.' },
  { q: 'Is my data private?', a: 'Yes. All data is stored in Supabase (encrypted at rest and in transit). Your Gemini API key is stored locally on your device only and never sent to our servers.' },
  { q: 'How do I cancel or change my plan?', a: 'Go to Profile → Upgrade to manage your subscription. You can downgrade or cancel any time. Changes take effect at the end of the billing period.' },
];

export default function SettingsScreen() {
  const { theme, toggleTheme, mode } = useTheme();
  const { user, signOut, profile } = useAuth();
  const router = useRouter();

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Biometrics
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(has => setBiometricsAvailable(has));
    LocalAuthentication.isEnrolledAsync().then(enrolled => setBiometricsEnabled(enrolled));
  }, []);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); },
      },
    ]);
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Too Short', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Done', 'Password updated successfully.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // ── Face ID / Biometrics ──────────────────────────────────────────────────
  const handleToggleBiometrics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!biometricsAvailable) {
      Alert.alert('Not Available', 'This device does not support biometric authentication.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to toggle Face ID / Fingerprint',
      fallbackLabel: 'Use passcode',
    });
    if (result.success) {
      setBiometricsEnabled(prev => !prev);
      Alert.alert('Updated', `Biometric login ${biometricsEnabled ? 'disabled' : 'enabled'}.`);
    } else {
      Alert.alert('Failed', 'Biometric authentication was not successful.');
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Incorrect', 'Type DELETE exactly to confirm account deletion.');
      return;
    }
    setDeletingAccount(true);
    try {
      // Remove profile data
      if (user?.id) {
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      await supabase.auth.signOut();
      setShowDeleteModal(false);
      Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
      router.replace('/');
    } catch (err: any) {
      setDeletingAccount(false);
      Alert.alert('Error', 'Could not delete account. Contact support@maxxapp.com');
    }
  };

  // ── FAQ accordion ─────────────────────────────────────────────────────────
  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenFaq(prev => prev === index ? null : index);
  };

  const planLabel: Record<string, string> = {
    free_trial: 'Free Trial', grind: 'Grind', alpha: 'Alpha', sigma: 'Sigma',
  };
  const currentPlanLabel = planLabel[(profile as any)?.plan] || 'Free Trial';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.bold }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const Item = ({ label, value, onPress, icon = 'chevron-right', color, sub }: any) => (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={[styles.item, { borderBottomColor: theme.border }]}
    >
      <View style={styles.itemLeft}>
        <Text style={[styles.itemLabel, { color: color || theme.textPrimary, fontFamily: FONTS.regular }]}>{label}</Text>
        {sub && <Text style={[styles.itemSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{sub}</Text>}
      </View>
      {value && <Text style={[styles.itemValue, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{value}</Text>}
      {icon && <Feather name={icon} size={16} color={color || theme.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Settings</Text>
        {profile?.role === 'admin' && (
          <TouchableOpacity onPress={() => router.push('/admin' as any)} style={styles.adminBtn}>
            <Feather name="shield" size={18} color={theme.gold} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

        {/* ACCOUNT */}
        <Section title="ACCOUNT">
          <Item
            label="Edit Profile"
            sub="Name, bio, avatar"
            onPress={() => router.push('/settings/edit-profile' as any)}
          />
          <Item
            label="Change Password"
            sub="Update your login password"
            onPress={() => setShowPasswordModal(true)}
          />
          <Item
            label="Plan"
            value={currentPlanLabel}
            onPress={() => router.push('/plans' as any)}
          />
        </Section>

        {/* SECURITY */}
        <Section title="SECURITY">
          <View style={[styles.item, { borderBottomColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>
                {biometricsAvailable ? 'Face ID / Fingerprint' : 'Biometrics'}
              </Text>
              <Text style={[styles.itemSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                {biometricsAvailable ? 'Quick sign-in with biometrics' : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled && biometricsAvailable}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: theme.border, true: theme.gold + '80' }}
              thumbColor={biometricsEnabled ? theme.gold : theme.textMuted}
              disabled={!biometricsAvailable}
            />
          </View>
          <View style={[styles.item, { borderBottomColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <Text style={[styles.itemLabel, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>Dark Mode</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Current: {mode === 'dark' ? 'Dark' : 'Light'}</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
              trackColor={{ false: theme.border, true: theme.gold + '80' }}
              thumbColor={mode === 'dark' ? theme.gold : theme.textMuted}
            />
          </View>
        </Section>

        {/* AI */}
        <Section title="AI FEATURES">
          <Item
            label="Gemini API Key"
            sub="Configure for Convo Lab, Stack Builder, Profile Audit"
            onPress={() => router.push('/convo-lab' as any)}
          />
        </Section>

        {/* SUPPORT */}
        <Section title="SUPPORT">
          <Item label="Contact Support" onPress={() => router.push('/support' as any)} />
          <Item label="Supplement Catalog" onPress={() => router.push('/supplements' as any)} />
          <Item
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://maxxapp.com/privacy').catch(() => {})}
            icon="external-link"
          />
          <Item
            label="Terms of Service"
            onPress={() => Linking.openURL('https://maxxapp.com/terms').catch(() => {})}
            icon="external-link"
          />
        </Section>

        {/* FAQ ACCORDION */}
        <Section title="FAQ">
          {FAQ_ITEMS.map((faq, i) => (
            <View key={i} style={{ borderBottomWidth: i < FAQ_ITEMS.length - 1 ? 1 : 0, borderBottomColor: theme.border }}>
              <TouchableOpacity
                onPress={() => toggleFaq(i)}
                style={[styles.faqQuestion]}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQ, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{faq.q}</Text>
                <Feather
                  name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
              {openFaq === i && (
                <View style={[styles.faqAnswer, { backgroundColor: theme.bgElevated }]}>
                  <Text style={[styles.faqA, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{faq.a}</Text>
                </View>
              )}
            </View>
          ))}
        </Section>

        {/* DANGER ZONE */}
        <Section title="DANGER ZONE">
          <Item
            label="Sign Out"
            color="#E74C3C"
            onPress={handleSignOut}
            icon="log-out"
          />
          <Item
            label="Delete Account"
            sub="Permanently erase all data"
            color="#E74C3C"
            onPress={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
            icon="trash-2"
          />
        </Section>

        <Text style={[styles.version, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          MAXX v1.0.0 — {user?.email || 'Member'}
        </Text>
      </ScrollView>

      {/* ── Change Password Modal ─────────────────────────────────────────── */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Change Password</Text>
            <Text style={[styles.inputLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>NEW PASSWORD</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Min. 8 characters"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            />
            <Text style={[styles.inputLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>CONFIRM PASSWORD</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repeat password"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={[styles.modalBtn, { backgroundColor: theme.bgElevated, flex: 1 }]}
              >
                <Text style={[{ color: theme.textSecondary, fontFamily: FONTS.semiBold, fontSize: 13 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPw}
                style={[styles.modalBtn, { backgroundColor: theme.gold, flex: 2 }]}
              >
                {changingPw
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={[{ color: '#000', fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }]}>CHANGE PASSWORD</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete Account Modal ──────────────────────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bgSurface, borderColor: '#E74C3C44' }]}>
            <Feather name="alert-triangle" size={32} color="#E74C3C" style={{ marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: '#E74C3C', fontFamily: FONTS.cinzelBold }]}>Delete Account</Text>
            <Text style={[{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20, marginBottom: 20, textAlign: 'center' }]}>
              This will permanently delete all your XP, progress, streaks, and data. This cannot be undone.
            </Text>
            <Text style={[styles.inputLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>
              Type DELETE to confirm:
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              style={[styles.input, {
                backgroundColor: theme.bgElevated,
                borderColor: deleteConfirmText === 'DELETE' ? '#E74C3C' : theme.border,
                color: '#E74C3C',
                fontFamily: FONTS.bold,
                letterSpacing: 4,
              }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={[styles.modalBtn, { backgroundColor: theme.bgElevated, flex: 1 }]}
              >
                <Text style={[{ color: theme.textSecondary, fontFamily: FONTS.semiBold, fontSize: 13 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                style={[styles.modalBtn, { backgroundColor: deleteConfirmText === 'DELETE' ? '#E74C3C' : theme.bgElevated, flex: 2, opacity: deleteConfirmText === 'DELETE' ? 1 : 0.4 }]}
              >
                {deletingAccount
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[{ color: '#fff', fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }]}>PERMANENTLY DELETE</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  adminBtn: { padding: 8, marginLeft: 'auto' },
  title: { fontSize: 24, marginLeft: SPACING.xs, flex: 1 },
  scroll: { paddingBottom: SPACING.xl },
  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: SPACING.sm, marginLeft: 4 },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, minHeight: 56 },
  itemLeft: { flex: 1 },
  itemLabel: { fontSize: 15 },
  itemSub: { fontSize: 12, marginTop: 2 },
  itemValue: { fontSize: 13, marginRight: 8 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, minHeight: 56 },
  faqQ: { fontSize: 14, flex: 1, marginRight: 12 },
  faqAnswer: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, paddingTop: 4 },
  faqA: { fontSize: 13, lineHeight: 21 },
  version: { textAlign: 'center', fontSize: 12, marginTop: SPACING.xl, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: SPACING.xl, alignItems: 'center' },
  modalTitle: { fontSize: 18, marginBottom: 8 },
  inputLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8, alignSelf: 'flex-start' },
  input: { width: '100%', height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 14, marginBottom: 16 },
  modalBtn: { height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
});
