import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../src/components/Button';

import { FONTS, SPACING } from '../src/constants/theme';

export default function OTPScreen() {
  const { theme } = useTheme();
  const { verifyOtp, signInAsAdmin } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text: string, index: number) => {
    // Handle paste logic if text > 1
    if (text.length > 1) {
      const digits = text.split('').slice(0, 6);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 8) newCode[index + i] = d;
      });
      setCode(newCode);
      if (digits.length === 8) {
        handleVerify(newCode.join(''));
      } else {
        const nextIndex = Math.min(index + digits.length, 7);
        inputs.current[nextIndex]?.focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');
    
    if (text && index < 7) {
      inputs.current[index + 1]?.focus();
    }
    if (index === 7 && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const promptBiometric = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      Alert.alert(
        'Enable Face ID / Touch ID?',
        'Sign in faster next time',
        [
          { text: 'Skip', style: 'cancel', onPress: () => router.replace('/goals') },
          { 
            text: 'Enable', 
            onPress: async () => {
              await AsyncStorage.setItem('maxx_biometric', 'true');
              router.replace('/goals');
            } 
          }
        ]
      );
    } else {
      router.replace('/goals');
    }
  };

  const handleLinkVerified = async () => {
    setLoading(true);
    try {
      // Try to get session - if the user clicked the link in browser, 
      // they might already be logged in if deep linking worked, 
      // or we can try to sign them in if we have the email.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        setError('Verification not detected yet. Please click the link in your email first.');
        shake();
      }
    } catch (e) {
      setError('Could not refresh session.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    // For testing/admin bypass: go straight to dashboard with a mock session
    Alert.alert(
      "Admin Mode",
      "Login as Admin/Tester and view all features?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Enter App", 
          onPress: () => {
            signInAsAdmin();
            router.replace('/(tabs)');
          } 
        }
      ]
    );
  };

  const handleVerify = async (fullCode?: string) => {
    const otpCode = fullCode || code.join('');
    if (otpCode.length < 6) { setError('Please enter your code'); shake(); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: params.email as string,
        token: otpCode,
        type: 'signup'
      });
      if (error) throw error;
      // SUCCESS! Auth listener in _layout will handle redirect
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
      shake();
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
            Enter the code or click the <Text style={{ color: theme.gold, fontWeight: 'bold' }}>Verification Link</Text> sent to{'\n'}{params.email || 'your email'}
          </Text>
          
          <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
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
                    width: 38, // Slightly smaller to fit 8 boxes
                  },
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={8} // Allow paste of full code
                selectTextOnFocus
              />
            ))}
          </Animated.View>
          
          {error ? <Text style={[styles.error, { fontFamily: FONTS.medium, marginTop: 24 }]}>{error}</Text> : null}
          
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
          <Button title="VERIFY CODE" onPress={() => handleVerify()} loading={loading} testID="otp-verify-btn" style={{ marginBottom: 12 }} />
          <TouchableOpacity onPress={handleLinkVerified} style={styles.linkVerifyBtn}>
            <Text style={[styles.linkVerifyText, { color: theme.gold }]}>I clicked the verification link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDevBypass} style={{ marginTop: 24, alignSelf: 'center', opacity: 0.5 }}>
            <Text style={{ color: theme.textMuted, fontSize: 12, textDecorationLine: 'underline' }}>ADMIN/TESTER BYPASS</Text>
          </TouchableOpacity>
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
  codeRow: { flexDirection: 'row', gap: 8, marginTop: SPACING.xl, justifyContent: 'center' },
  digitInput: { width: 44, height: 52, borderRadius: 10, borderWidth: 1, textAlign: 'center', fontSize: 20 },
  error: { color: '#E74C3C', fontSize: 13, marginTop: SPACING.md, textAlign: 'center' },
  resend: { fontSize: 13, marginTop: SPACING.lg, textAlign: 'center' },
  resendActive: { fontSize: 14, textAlign: 'center', marginTop: SPACING.sm },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  linkVerifyBtn: { alignItems: 'center', paddingVertical: 8 },
  linkVerifyText: { fontSize: 14, fontFamily: FONTS.semiBold, textDecorationLine: 'underline' },
});
