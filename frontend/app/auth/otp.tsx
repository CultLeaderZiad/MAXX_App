import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

export default function OtpScreen() {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    const clean = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[idx] = clean;
    setCode(next);
    if (clean && idx < 5) refs.current[idx + 1]?.focus();
    if (!clean && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length < 6) {
      Alert.alert('Incomplete', 'Enter all 6 digits.');
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(email || '', token);
    setLoading(false);
    if (error) {
      Alert.alert('Invalid Code', 'The code is wrong or expired. Try resending.');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    }
    // Auth state change will redirect automatically
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await resendOtp(email || '');
    setResending(false);
    if (error) {
      Alert.alert('Failed', 'Could not resend. Try again.');
    } else {
      Alert.alert('Sent', 'A new code was sent to your email.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: SPACING.lg }}>

        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: SPACING.xl }}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.sub}>
          Enter the 6-digit code sent to{'\n'}<Text style={{ color: GOLD }}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r; }}
              value={digit}
              onChangeText={v => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.codeBox,
                { borderColor: digit ? GOLD : '#2A2A2A' },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading}
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.btnText}>VERIFY CODE</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendWrap}>
          {resending
            ? <ActivityIndicator color={GOLD} size="small" />
            : <Text style={styles.resend}>Didn't get it? <Text style={{ color: GOLD }}>Resend code</Text></Text>
          }
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 28, marginBottom: SPACING.sm },
  sub: { color: '#666', fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, marginBottom: SPACING.xl },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: SPACING.xl, maxWidth: 360, alignSelf: 'center', width: '100%' },
  codeBox: {
    width: 48, height: 60, borderRadius: RADIUS.md, borderWidth: 2,
    backgroundColor: '#111111', color: '#FFFFFF', fontFamily: FONTS.cinzelBold,
    fontSize: 22, textAlign: 'center',
  },
  btn: { backgroundColor: GOLD, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1.5 },
  resendWrap: { alignItems: 'center', marginTop: SPACING.lg },
  resend: { color: '#666', fontFamily: FONTS.regular, fontSize: 14 },
});
