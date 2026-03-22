import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { FONTS, SPACING } from '../src/constants/theme';
import { TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

function GoldParticle({ delay, startX }: { delay: number; startX: number; key?: any }) {
  const y = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      y.setValue(height);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -20, duration: 4000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 3200, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C8A96E',
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { user, isOnboarded, loading } = useAuth();
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && user && isOnboarded) {
      router.replace('/(tabs)');
    }
  }, [loading, user, isOnboarded]);

  const particles = [
    { delay: 0, x: width * 0.15 },
    { delay: 600, x: width * 0.35 },
    { delay: 1200, x: width * 0.55 },
    { delay: 400, x: width * 0.7 },
    { delay: 800, x: width * 0.85 },
    { delay: 1600, x: width * 0.45 },
  ];

  if (showAuth) {
    return <AuthForm theme={theme} onBack={() => setShowAuth(false)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="welcome-screen">
      {particles.map((p, i) => (
        <GoldParticle key={i} delay={p.delay} startX={p.x} />
      ))}
      <View style={styles.topRight}>
        <ThemeToggle />
      </View>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={[styles.logo, { fontFamily: FONTS.cinzelBold, color: '#C8A96E' }]}>MAXX</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          Become the man you were <Text style={{ color: theme.gold }}>built</Text> to be.
        </Text>
      </Animated.View>
      <View style={styles.bottom}>
        <Button title="START YOUR FREE 7 DAYS" onPress={() => setShowAuth(true)} testID="start-trial-btn" />
        <Text style={[styles.subtext, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          No charge until Day 8 · Cancel anytime
        </Text>
      </View>
    </SafeAreaView>
  );
}

function AuthForm({ theme, onBack }: { theme: any; onBack: () => void }) {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await signIn(email, password);
        if (res.success) {
          router.replace('/(tabs)');
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        if (!fullName?.trim()) { setError('Full name required'); setLoading(false); return; }
        if (!dob?.trim()) { setError('Date of birth required (YYYY-MM-DD)'); setLoading(false); return; }
        const res = await signUp(email, password, fullName, dob);
        if (res.requiresOtp) {
          router.push({ pathname: '/otp', params: { email } });
        } else if (!res.success) {
          setError(res.error || 'Registration failed');
        }
      }
  } catch (e: any) {
    setError(e?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

return (
  <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="auth-form-screen">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backBtn} testID="auth-back-btn">
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
          <Text style={[styles.authTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            {isLogin ? 'Welcome Back' : 'Join MAXX'}
          </Text>
          <Text style={[styles.authSub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            {isLogin ? 'Sign in to continue your journey' : 'Start your 7-day free trial'}
          </Text>
          {!isLogin && (
            <>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>FULL NAME</Text>
              <TextInput
                testID="auth-fullname-input"
                style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border, fontFamily: FONTS.regular }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>DATE OF BIRTH</Text>
              <TextInput
                testID="auth-dob-input"
                style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border, fontFamily: FONTS.regular }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                value={dob}
                onChangeText={setDob}
              />
            </>
          )}
          <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>EMAIL</Text>
          <TextInput
            testID="auth-email-input"
            style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border, fontFamily: FONTS.regular }]}
            placeholder="you@example.com"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>PASSWORD</Text>
          <TextInput
            testID="auth-password-input"
            style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border, fontFamily: FONTS.regular }]}
            placeholder="Min 8 characters"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>{error}</Text> : null}
          <View style={{ marginTop: SPACING.lg }}>
            <Button title={isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'} onPress={handleSubmit} loading={loading} testID="auth-submit-btn" />
          </View>
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); }} style={styles.switchBtn} testID="auth-switch-btn">
            <Text style={[styles.switchText, { color: theme.gold, fontFamily: FONTS.medium }]}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRight: { position: 'absolute', top: 60, right: 16, zIndex: 10 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  logoGradient: { borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  logo: { fontSize: 80, letterSpacing: 12, textAlign: 'center' },
  tagline: { fontSize: 18, marginTop: SPACING.md, textAlign: 'center', opacity: 0.9 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md },
  subtext: { fontSize: 11, textAlign: 'center' },
  authScroll: { padding: SPACING.lg, paddingTop: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  authTitle: { fontSize: 28, marginTop: SPACING.md },
  authSub: { fontSize: 14, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  inputLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 6, marginTop: SPACING.md },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  errorText: { color: '#E74C3C', fontSize: 13, marginTop: SPACING.sm },
  switchBtn: { marginTop: SPACING.lg, alignItems: 'center', paddingVertical: SPACING.sm },
  switchText: { fontSize: 14 },
});
