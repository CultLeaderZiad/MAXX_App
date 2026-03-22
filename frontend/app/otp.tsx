import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING } from '../src/constants/theme';

export default function OTPScreen() {
  const { theme } = useTheme();
  const { verifyOtp } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const otp = fullCode || code.join('');
    if (otp.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await verifyOtp(otp);
      if (res.success) {
        router.push('/goals');
      } else {
        setError(res.error || 'Invalid code');
        setCode(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="otp-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="otp-back-btn">
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Verify It's You</Text>
          <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Enter the 6-digit code sent to{'\n'}{params.email || 'your email'}
          </Text>
          <View style={styles.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                testID={`otp-input-${i}`}
                style={[
                  styles.digitInput,
                  {
                    backgroundColor: theme.bgInput,
                    color: theme.textPrimary,
                    borderColor: error ? theme.red : digit ? theme.borderActive : theme.border,
                    fontFamily: FONTS.bold,
                  },
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          {error ? <Text style={[styles.error, { fontFamily: FONTS.medium }]}>{error}</Text> : null}
          <Text style={[styles.resend, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
            {countdown > 0 ? `Resend code in ${formatTime(countdown)}` : ''}
          </Text>
          {countdown === 0 && (
            <TouchableOpacity onPress={() => setCountdown(60)} testID="resend-otp-btn">
              <Text style={[styles.resendActive, { color: theme.gold, fontFamily: FONTS.semiBold }]}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottom}>
          <Button title="VERIFY" onPress={() => handleVerify()} loading={loading} testID="otp-verify-btn" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginLeft: SPACING.md, marginTop: SPACING.sm },
  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginTop: SPACING.sm, lineHeight: 22 },
  codeRow: { flexDirection: 'row', gap: 12, marginTop: SPACING.xl, justifyContent: 'center' },
  digitInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 24 },
  error: { color: '#E74C3C', fontSize: 13, marginTop: SPACING.md, textAlign: 'center' },
  resend: { fontSize: 13, marginTop: SPACING.lg, textAlign: 'center' },
  resendActive: { fontSize: 14, textAlign: 'center', marginTop: SPACING.sm },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
