import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING } from '../src/constants/theme';


export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) throw error;
      // Success handled by AuthContext listener -> redirects to (tabs)
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.gold} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Sign in to continue your journey
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
              <View style={[styles.passwordContainer, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.textPrimary }]}
                  placeholder="Enter password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>{error}</Text>
            ) : null}

            <View style={styles.actions}>
              <Button 
                title="SIGN IN" 
                onPress={handleSignIn} 
                loading={loading}
              />
            </View>

            <TouchableOpacity onPress={() => router.push('/register')} style={styles.footerLink}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Don't have an account? <Text style={{ color: theme.gold, fontFamily: FONTS.bold }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, flexGrow: 1 },
  backBtn: { marginBottom: SPACING.md },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 40 },
  form: { flex: 1 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.medium },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 50, paddingHorizontal: 16 },
  passwordInput: { flex: 1, height: '100%', fontSize: 16, fontFamily: FONTS.regular },
  eyeBtn: { padding: 4 },
  errorText: { color: '#E74C3C', textAlign: 'center', marginBottom: 16 },
  actions: { marginTop: 8 },
  footerLink: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, fontFamily: FONTS.medium },
});
