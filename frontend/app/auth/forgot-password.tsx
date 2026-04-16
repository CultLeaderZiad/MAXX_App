import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Enter your account email.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: undefined }
      );
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Feather name="mail" size={36} color={GOLD} />
          </View>
          <Text style={styles.sentTitle}>Check Your Email</Text>
          <Text style={styles.sentSub}>
            We sent a password reset code to{'\n'}
            <Text style={{ color: GOLD }}>{email.trim()}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/auth/reset-password', params: { email: email.trim() } } as any)}
            style={styles.btn}
          >
            <Text style={styles.btnText}>ENTER RESET CODE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.resendWrap}>
            <Text style={styles.resend}>Didn't get it? <Text style={{ color: GOLD }}>Resend</Text></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="lock" size={32} color={GOLD} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.sub}>
            Enter your account email and we'll send you a reset code.
          </Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.btnText}>SEND RESET CODE</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  backBtn: { padding: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: GOLD + '20', justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 26, textAlign: 'center', marginBottom: SPACING.sm },
  sub: { color: '#666', fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  sentTitle: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 26, textAlign: 'center', marginBottom: SPACING.sm },
  sentSub: { color: '#666', fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  label: { color: '#606060', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1C1C1C', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2A2A2A',
    color: '#FFFFFF', fontFamily: FONTS.regular, fontSize: 15, paddingHorizontal: 16, height: 52, marginBottom: SPACING.lg,
  },
  btn: { backgroundColor: GOLD, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1.5 },
  resendWrap: { alignItems: 'center', marginTop: SPACING.lg },
  resend: { color: '#666', fontFamily: FONTS.regular, fontSize: 14 },
});
