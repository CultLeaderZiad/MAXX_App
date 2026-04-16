import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>MAXX</Text>
            <Text style={styles.tagline}>Build the man you were meant to be.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.pwWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry={!showPw}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password' as any)}
              style={{ alignSelf: 'flex-end', marginBottom: SPACING.md }}
            >
              <Text style={{ color: GOLD + 'AA', fontFamily: FONTS.regular, fontSize: 13 }}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.btnText}>SIGN IN</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/auth/register' as any)}
              style={styles.linkWrap}
            >
              <Text style={styles.link}>Don't have an account? <Text style={{ color: GOLD }}>Register</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  logoText: { fontSize: 44, color: GOLD, fontFamily: FONTS.cinzelBold, letterSpacing: 6 },
  tagline: { color: '#666', fontFamily: FONTS.regular, fontSize: 13, marginTop: 8, letterSpacing: 0.5 },
  card: {
    backgroundColor: '#111111',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 22, marginBottom: SPACING.lg },
  label: { color: '#606060', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
    fontSize: 15,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: SPACING.md,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  eyeBtn: { padding: 12, marginLeft: 8 },
  btn: {
    backgroundColor: GOLD,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1.5 },
  linkWrap: { alignItems: 'center', marginTop: SPACING.lg },
  link: { color: '#666', fontFamily: FONTS.regular, fontSize: 14 },
});
