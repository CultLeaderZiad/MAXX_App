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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPw) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
      phone,
      dob
    );
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong.');
      return;
    }

    // Navigate to OTP verification
    router.push({ pathname: '/auth/otp', params: { email: email.trim().toLowerCase() } } as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>MAXX</Text>
            <Text style={styles.tagline}>Your transformation starts here.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.label}>FULL NAME *</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor="#555" style={styles.input} />

            <Text style={styles.label}>EMAIL *</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" style={styles.input} />

            <Text style={styles.label}>PHONE (optional)</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" placeholderTextColor="#555" keyboardType="phone-pad" style={styles.input} />

            <Text style={styles.label}>DATE OF BIRTH (optional)</Text>
            <TextInput value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor="#555" style={styles.input} />

            <Text style={styles.label}>PASSWORD *</Text>
            <View style={styles.pwWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor="#555"
                secureTextEntry={!showPw}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: SPACING.md }]}>CONFIRM PASSWORD *</Text>
            <TextInput
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Repeat password"
              placeholderTextColor="#555"
              secureTextEntry={!showPw}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.btnText}>CREATE ACCOUNT</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={styles.linkWrap}>
              <Text style={styles.link}>Already have an account? <Text style={{ color: GOLD }}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  backBtn: { paddingVertical: SPACING.md },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  logoText: { fontSize: 44, color: GOLD, fontFamily: FONTS.cinzelBold, letterSpacing: 6 },
  tagline: { color: '#666', fontFamily: FONTS.regular, fontSize: 13, marginTop: 8 },
  card: { backgroundColor: '#111111', borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: '#2A2A2A' },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 22, marginBottom: SPACING.lg },
  label: { color: '#606060', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#1C1C1C', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2A2A2A',
    color: '#FFFFFF', fontFamily: FONTS.regular, fontSize: 15, paddingHorizontal: 16, height: 52, marginBottom: SPACING.md,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  eyeBtn: { padding: 12, marginLeft: 8 },
  btn: { backgroundColor: GOLD, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  btnText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1.5 },
  linkWrap: { alignItems: 'center', marginTop: SPACING.lg },
  link: { color: '#666', fontFamily: FONTS.regular, fontSize: 14 },
});
