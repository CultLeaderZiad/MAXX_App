import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhoneInput from 'react-native-phone-number-input';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

import { Button } from '../src/components/Button';

const { width } = Dimensions.get('window');

const STEPS = 3;

export default function RegisterWizard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const [dob, setDob] = useState(new Date(today.getFullYear() - 22, today.getMonth(), today.getDate()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const validateStep1 = () => {
    if (fullName.length < 2) return 'Name must be at least 2 characters';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email address';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const validateStep2 = () => {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      // age--; 
      // Handled by logic below effectively
    }
    // Exact check
    let ageCheck = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      ageCheck--;
    }

    if (ageCheck < 18) return 'You must be 18 or older to use MAXX';
    return null;
  };

  const handleNext = () => {
    setError('');
    let err = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();

    if (err) {
      setError(err);
      return;
    }

    if (step < STEPS) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setStep(step + 1), 150);
    } else {
      handleSignUp();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSignUp = async () => {
    if (!termsAccepted) {
      setError('You must accept the Terms & Privacy Policy');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Format DOB as YYYY-MM-DD
      const dobStr = dob.toISOString().split('T')[0];
      const finalPhone = formattedPhone || phoneNumber; // Use formatted if available

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) throw error;
      router.push({ pathname: '/otp', params: { email } });
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // We might need base64 for profile update later or just upload file
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      // In a real app, we'd upload this to Supabase Storage here or after signup.
      // For now we just keep local uri to show preview.
    }
  };

  // Password Strength Logic
  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getPasswordStrength();
  const strengthColor = strength < 2 ? theme.red : strength < 4 ? theme.orange : theme.green;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.gold} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: theme.gold,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.stepText, { color: theme.textMuted }]}>Step {step} of {STEPS}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            
            {/* STEP 1: Account Details */}
            {step === 1 && (
              <>
                <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                  Create Account
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>FULL NAME</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.bgInput, 
                      color: theme.textPrimary, 
                      borderColor: fullName.length > 0 && fullName.length < 2 ? theme.red : theme.border 
                    }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.bgInput, 
                      color: theme.textPrimary, 
                      borderColor: error && error.includes('email') ? theme.red : theme.border 
                    }]}
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
                      placeholder="Min 8 chars"
                      placeholderTextColor={theme.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Strength Bar */}
                  <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { 
                      backgroundColor: strength > 0 ? strengthColor : theme.bgElevated,
                      flex: 1 
                    }]} />
                     <View style={[styles.strengthBar, { 
                      backgroundColor: strength > 1 ? strengthColor : theme.bgElevated,
                      flex: 1 
                    }]} />
                     <View style={[styles.strengthBar, { 
                      backgroundColor: strength > 2 ? strengthColor : theme.bgElevated,
                      flex: 1 
                    }]} />
                     <View style={[styles.strengthBar, { 
                      backgroundColor: strength > 3 ? strengthColor : theme.bgElevated,
                      flex: 1 
                    }]} />
                  </View>
                  
                  {/* Chips */}
                  <View style={styles.chipContainer}>
                    <Chip label="8+ chars" met={password.length >= 8} theme={theme} />
                    <Chip label="Uppercase" met={/[A-Z]/.test(password)} theme={theme} />
                    <Chip label="Number" met={/[0-9]/.test(password)} theme={theme} />
                    <Chip label="Symbol" met={/[^A-Za-z0-9]/.test(password)} theme={theme} />
                  </View>
                </View>
              </>
            )}

            {/* STEP 2: DOB + Phone */}
            {step === 2 && (
              <>
                <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                  About You
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>DATE OF BIRTH</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.input, { 
                      backgroundColor: theme.bgInput, 
                      borderColor: dob ? theme.gold : theme.border,
                      justifyContent: 'center'
                    }]}
                  >
                    <Text style={{ color: theme.textPrimary, fontFamily: FONTS.regular }}>
                      {dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dob}
                      maximumDate={maxDate}
                      minimumDate={minDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setDob(date);
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>PHONE NUMBER (OPTIONAL)</Text>
                  <PhoneInput
                    defaultValue={phoneNumber}
                    defaultCode="EG"
                    layout="first"
                    onChangeText={(text) => setPhoneNumber(text)}
                    onChangeFormattedText={(text) => setFormattedPhone(text)}
                    withDarkTheme={true}
                    withShadow={false}
                    autoFocus={false}
                    containerStyle={[styles.phoneContainer, { backgroundColor: theme.bgInput, borderColor: theme.border }]}
                    textContainerStyle={[styles.phoneTextContainer, { backgroundColor: theme.bgInput }]}
                    textInputStyle={{ color: theme.textPrimary, fontFamily: FONTS.regular }}
                    codeTextStyle={{ color: theme.textPrimary, fontFamily: FONTS.regular }}
                  />
                </View>
              </>
            )}

            {/* STEP 3: Avatar + Terms */}
            {step === 3 && (
              <>
                <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                  Add Your Photo
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Help us track your progress from day one
                </Text>

                <View style={styles.avatarContainer}>
                  <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={[styles.avatarImage, { borderColor: theme.gold }]} />
                    ) : (
                      <LinearGradient
                        colors={[theme.gold, '#8A6420']}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.initials}>{fullName[0]?.toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickImage} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.gold, fontFamily: FONTS.medium }}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={styles.termsContainer}
                >
                  <View style={[styles.checkbox, { 
                    borderColor: termsAccepted ? theme.gold : theme.border,
                    backgroundColor: termsAccepted ? theme.gold : 'transparent'
                  }]}>
                    {termsAccepted && <Feather name="check" size={12} color="#FFF" />}
                  </View>
                  <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                    I agree to the <Text style={{ color: theme.gold }}>Terms of Service</Text> and <Text style={{ color: theme.gold }}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>

          {/* Error Message */}
          {error ? (
            <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>{error}</Text>
          ) : null}

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
             {error && error.includes('taken') && step === STEPS ? (
                 <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginBottom: 16, alignItems: 'center' }}>
                     <Text style={{ color: theme.gold, fontFamily: FONTS.bold }}>Sign In</Text>
                 </TouchableOpacity>
             ) : null}
             
             <Button 
               title={step === STEPS ? "CREATE ACCOUNT" : "CONTINUE"} 
               onPress={handleNext} 
               loading={loading}
               disabled={step === STEPS && !termsAccepted}
             />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, met, theme }: { label: string; met: boolean; theme: any }) {
  return (
    <View style={[styles.chip, { backgroundColor: met ? theme.gold : theme.bgElevated }]}>
      <Text style={[styles.chipText, { color: met ? '#000' : theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingBottom: 0 },
  backBtn: { marginBottom: SPACING.md },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  stepText: { fontSize: 12, fontFamily: FONTS.medium },
  
  content: { padding: SPACING.lg, flexGrow: 1 },
  title: { fontSize: 24, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.medium },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 50, paddingHorizontal: 16 },
  passwordInput: { flex: 1, height: '100%', fontSize: 16, fontFamily: FONTS.regular },
  eyeBtn: { padding: 4 },
  
  strengthContainer: { flexDirection: 'row', gap: 4, marginTop: 8, height: 4 },
  strengthBar: { borderRadius: 2 },
  
  chipContainer: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontSize: 10, fontFamily: FONTS.medium },
  
  phoneContainer: { width: '100%', borderRadius: 12, borderWidth: 1, height: 56, overflow: 'hidden' },
  phoneTextContainer: { height: 56 },
  
  avatarContainer: { alignItems: 'center', marginVertical: 32 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  initials: { fontSize: 40, color: '#FFF', fontFamily: FONTS.cinzelBold },
  
  termsContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },
  
  errorText: { color: '#E74C3C', textAlign: 'center', marginBottom: 16 },
  bottomActions: { marginTop: 'auto', paddingTop: 24 },
});
