import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password'>('code');
  const refs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (val: string, idx: number) => {
    const clean = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[idx] = clean;
    setCode(next);
    if (clean && idx < 5) refs.current[idx + 1]?.focus();
    if (!clean && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerifyCode = async () => {
    const token = code.join('');
    if (token.length < 6) {
      Alert.alert('Incomplete', 'Enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email || '',
        token,
        type: 'recovery',
      });
      if (error) throw error;
      setStep('password');
    } catch (e: any) {
      Alert.alert('Invalid Code', e.message || 'Code is wrong or expired. Request a new one.');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPw) {
      Alert.alert('Mismatch', "Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Password Updated', 'You can now sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.replace('/auth/login' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          {step === 'code' ? (
            <>
              <Text style={styles.title}>Enter Reset Code</Text>
              <Text style={styles.sub}>
                Code sent to <Text style={{ color: GOLD }}>{email}</Text>
              </Text>

              <View style={styles.codeRow}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => { refs.current[i] = r; }}
                    value={digit}
                    onChangeText={v => handleCodeChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[styles.codeBox, { borderColor: digit ? GOLD : '#2A2A2A' }]}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={loading}
                style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
              >
                {loading
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.btnText}>VERIFY CODE</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.successIcon}>
                <Feather name="check" size={28} color={GOLD} />
              </View>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.sub}>Choose a strong password for your account.</Text>

              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPw}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                />
                <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="#555" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>CONFIRM PASSWORD</Text>
              <TextInput
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Repeat password"
                placeholderTextColor="#555"
                secureTextEntry={!showPw}
                style={styles.input}
              />

              <TouchableOpacity
                onPress={handleSetPassword}
                disabled={loading}
                style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
              >
                {loading
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.btnText}>UPDATE PASSWORD</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  backBtn: { padding: SPACING.lg },
  content: { flex: 1, paddingHorizontal: SPACING.xl },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 26, marginBottom: SPACING.sm },
  sub: { color: '#666', fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, marginBottom: SPACING.xl },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: SPACING.xl, maxWidth: 360, alignSelf: 'center', width: '100%' },
  codeBox: {
    width: 48, height: 60, borderRadius: RADIUS.md, borderWidth: 2,
    backgroundColor: '#111111', color: '#FFFFFF', fontFamily: FONTS.cinzelBold,
    fontSize: 22, textAlign: 'center',
  },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: GOLD + '20',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.lg,
  },
  label: { color: '#606060', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1C1C1C', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2A2A2A',
    color: '#FFFFFF', fontFamily: FONTS.regular, fontSize: 15, paddingHorizontal: 16, height: 52, marginBottom: SPACING.md,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  eyeBtn: { padding: 12, marginLeft: 8 },
  btn: { backgroundColor: GOLD, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1.5 },
});
