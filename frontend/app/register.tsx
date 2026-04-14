import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { safeBack } from "../lib/safeBack";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import PhoneInput from "react-native-phone-number-input";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";

import { Button } from "../src/components/Button";

const { width } = Dimensions.get("window");

const STEPS = 5;

const BODY_TYPES = [
  {
    id: "ectomorph",
    label: "Ectomorph",
    emoji: "🏃",
    desc: "Lean & long, difficulty building muscle",
  },
  {
    id: "mesomorph",
    label: "Mesomorph",
    emoji: "💪",
    desc: "Athletic build, gains muscle easily",
  },
  {
    id: "endomorph",
    label: "Endomorph",
    emoji: "🐻",
    desc: "Wider build, gains weight easily",
  },
];

const FITNESS_GOALS = [
  { id: "build_muscle", label: "Build Muscle", emoji: "💪" },
  { id: "lose_fat", label: "Lose Fat", emoji: "🔥" },
  { id: "jawline", label: "Sharp Jawline", emoji: "🗡️" },
  { id: "posture", label: "Fix Posture", emoji: "🧍" },
  { id: "confidence", label: "Build Confidence", emoji: "👑" },
  { id: "discipline", label: "Discipline & Focus", emoji: "🎯" },
  { id: "attract", label: "Attract Women", emoji: "🧲" },
  { id: "looksmax", label: "Full Looksmax", emoji: "⚡" },
];

const PLAY_TYPES = [
  {
    id: "grind",
    label: "The Grind",
    emoji: "⚒️",
    desc: "Hardcore discipline, daily missions, no excuses",
  },
  {
    id: "balanced",
    label: "Balanced Alpha",
    emoji: "⚖️",
    desc: "Steady progress with recovery days built in",
  },
  {
    id: "sigma",
    label: "Sigma Mode",
    emoji: "🐺",
    desc: "Full protocol — body, mind, social dominance",
  },
];

export default function RegisterWizard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: DOB + Phone
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  const minDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  );
  const [dob, setDob] = useState(
    new Date(today.getFullYear() - 22, today.getMonth(), today.getDate()),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");

  // Step 3: Body Stats
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyType, setBodyType] = useState("");

  // Step 4: Goals & Play Type
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [playType, setPlayType] = useState("");

  // Step 5: Avatar + Terms
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
    if (fullName.length < 2) return "Name must be at least 2 characters";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email address";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const validateStep2 = () => {
    let ageCheck = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      ageCheck--;
    }
    if (ageCheck < 18) return "You must be 18 or older to use MAXX";
    return null;
  };

  const validateStep3 = () => {
    if (!bodyType) return "Select your body type";
    return null;
  };

  const validateStep4 = () => {
    if (selectedGoals.length === 0) return "Select at least one goal";
    if (!playType) return "Choose your play type";
    return null;
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId],
    );
  };

  const handleNext = () => {
    setError("");
    let err = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();
    if (step === 4) err = validateStep4();

    if (err) {
      setError(err);
      return;
    }

    if (step < STEPS) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
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
      safeBack();
    }
  };

  const handleSignUp = async () => {
    if (!termsAccepted) {
      setError("You must accept the Terms & Privacy Policy");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const dobStr = dob.toISOString().split("T")[0];
      const finalPhone = formattedPhone || phoneNumber;

      const { data, error } = await signUp(
        email,
        password,
        fullName,
        finalPhone,
        dobStr,
        {
          height_cm: heightCm ? parseInt(heightCm) : null,
          weight_kg: weightKg ? parseInt(weightKg) : null,
          body_type: bodyType || null,
          fitness_goals: selectedGoals,
          play_type: playType || null,
        }
      );

      if (error) throw error;

      // Detect "fake" signup — user already exists
      // Supabase returns a user with empty identities for repeated signups
      const isRepeatedSignup =
        data?.user &&
        (!data.user.identities || data.user.identities.length === 0);

      if (isRepeatedSignup) {
        // User already registered — redirect to login instead
        Alert.alert(
          "Account Exists",
          "This email is already registered. Please sign in instead.",
          [
            {
              text: "Go to Login",
              onPress: () => setTimeout(() => router.replace("/login"), 100),
            },
          ],
        );
        return;
      }

      router.push({ pathname: "/otp", params: { email, mode: "signup" } });
    } catch (e: any) {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        Alert.alert(
          "Account Exists",
          "This email is already registered. Please sign in.",
          [{ text: "Go to Login", onPress: () => setTimeout(() => router.replace("/login"), 100) }],
        );
      } else {
        setError(e.message || "An unexpected error occurred");
      }
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
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
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
  const strengthColor =
    strength < 2 ? theme.red : strength < 4 ? theme.orange : theme.green;

  const stepTitles: Record<number, string> = {
    1: "Create Account",
    2: "About You",
    3: "Your Body",
    4: "Your Goals",
    5: "Finish Setup",
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.gold} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBarBg, { backgroundColor: theme.border }]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.gold,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.stepText,
                { color: theme.textMuted, fontFamily: FONTS.medium },
              ]}
            >
              Step {step} of {STEPS}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
        >
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            {/* STEP 1: Account Details */}
            {step === 1 && (
              <>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
                  ]}
                >
                  Create Account
                </Text>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.textSecondary, fontFamily: FONTS.medium },
                    ]}
                  >
                    FULL NAME
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.bgInput,
                        color: theme.textPrimary,
                        borderColor:
                          fullName.length > 0 && fullName.length < 2
                            ? theme.red
                            : theme.border,
                        fontFamily: FONTS.regular,
                      },
                    ]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.textSecondary, fontFamily: FONTS.medium },
                    ]}
                  >
                    EMAIL
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.bgInput,
                        color: theme.textPrimary,
                        borderColor:
                          error && error.includes("email")
                            ? theme.red
                            : theme.border,
                        fontFamily: FONTS.regular,
                      },
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.textSecondary, fontFamily: FONTS.medium },
                    ]}
                  >
                    PASSWORD
                  </Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      {
                        backgroundColor: theme.bgInput,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.passwordInput,
                        { color: theme.textPrimary, fontFamily: FONTS.regular },
                      ]}
                      placeholder="Min 8 chars"
                      placeholderTextColor={theme.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color={theme.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Strength Bar */}
                  <View style={styles.strengthContainer}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              strength >= i ? strengthColor : theme.bgElevated,
                            flex: 1,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Chips */}
                  <View style={styles.chipContainer}>
                    <Chip
                      label="8+ chars"
                      met={password.length >= 8}
                      theme={theme}
                    />
                    <Chip
                      label="Uppercase"
                      met={/[A-Z]/.test(password)}
                      theme={theme}
                    />
                    <Chip
                      label="Number"
                      met={/[0-9]/.test(password)}
                      theme={theme}
                    />
                    <Chip
                      label="Symbol"
                      met={/[^A-Za-z0-9]/.test(password)}
                      theme={theme}
                    />
                  </View>
                </View>
              </>
            )}

            {/* STEP 2: DOB + Phone */}
            {step === 2 && (
              <>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
                  ]}
                >
                  About You
                </Text>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.textSecondary, fontFamily: FONTS.medium },
                    ]}
                  >
                    DATE OF BIRTH
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.bgInput,
                        borderColor: dob ? theme.gold : theme.border,
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.textPrimary,
                        fontFamily: FONTS.regular,
                      }}
                    >
                      {dob.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dob}
                      maximumDate={maxDate}
                      minimumDate={minDate}
                      mode="date"
                      display={
                        Platform.OS === "android" ? "spinner" : "spinner"
                      }
                      onChange={(event, date) => {
                        if (Platform.OS === "android") {
                          setShowDatePicker(false);
                        }
                        if (event.type === "set" && date) {
                          setDob(date);
                        } else if (Platform.OS === "ios" && date) {
                          setDob(date);
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.textSecondary, fontFamily: FONTS.medium },
                    ]}
                  >
                    PHONE NUMBER (OPTIONAL)
                  </Text>
                  <PhoneInput
                    defaultValue={phoneNumber}
                    defaultCode="EG"
                    layout="first"
                    onChangeText={(text) => setPhoneNumber(text)}
                    onChangeFormattedText={(text) => setFormattedPhone(text)}
                    withDarkTheme={false}
                    withShadow={false}
                    autoFocus={false}
                    containerStyle={[
                      styles.phoneContainer,
                      {
                        backgroundColor: theme.bgInput,
                        borderColor: theme.border,
                      },
                    ]}
                    textContainerStyle={[
                      styles.phoneTextContainer,
                      { backgroundColor: theme.bgInput },
                    ]}
                    textInputStyle={{
                      color: theme.textPrimary,
                      fontFamily: FONTS.regular,
                      fontSize: 16,
                      height: 56,
                    }}
                    codeTextStyle={{
                      color: theme.textPrimary,
                      fontFamily: FONTS.regular,
                      fontSize: 16,
                    }}
                    textInputProps={{
                      placeholderTextColor: theme.textMuted,
                      selectionColor: theme.gold,
                    }}
                  />
                </View>
              </>
            )}

            {/* STEP 3: Body Stats */}
            {step === 3 && (
              <>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
                  ]}
                >
                  Your Body
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.textSecondary, fontFamily: FONTS.regular },
                  ]}
                >
                  We'll customize workouts and nutrition based on your body
                </Text>

                <View style={styles.statsRow}>
                  <View style={[styles.statInput, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: theme.textSecondary,
                          fontFamily: FONTS.medium,
                        },
                      ]}
                    >
                      HEIGHT (CM)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.bgInput,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          fontFamily: FONTS.regular,
                          textAlign: "center",
                          fontSize: 20,
                        },
                      ]}
                      placeholder="175"
                      placeholderTextColor={theme.textMuted}
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  <View style={[styles.statInput, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: theme.textSecondary,
                          fontFamily: FONTS.medium,
                        },
                      ]}
                    >
                      WEIGHT (KG)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.bgInput,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          fontFamily: FONTS.regular,
                          textAlign: "center",
                          fontSize: 20,
                        },
                      ]}
                      placeholder="70"
                      placeholderTextColor={theme.textMuted}
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.textSecondary, fontFamily: FONTS.medium },
                  ]}
                >
                  BODY TYPE
                </Text>
                {BODY_TYPES.map((bt) => (
                  <TouchableOpacity
                    key={bt.id}
                    onPress={() => setBodyType(bt.id)}
                    style={[
                      styles.selectCard,
                      {
                        backgroundColor:
                          bodyType === bt.id
                            ? theme.gold + "15"
                            : theme.bgSurface,
                        borderColor:
                          bodyType === bt.id ? theme.gold : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{bt.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.selectTitle,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {bt.label}
                      </Text>
                      <Text
                        style={[
                          styles.selectDesc,
                          { color: theme.textMuted, fontFamily: FONTS.regular },
                        ]}
                      >
                        {bt.desc}
                      </Text>
                    </View>
                    {bodyType === bt.id && (
                      <Feather
                        name="check-circle"
                        size={20}
                        color={theme.gold}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* STEP 4: Goals & Play Type */}
            {step === 4 && (
              <>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
                  ]}
                >
                  Your Goals
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.textSecondary, fontFamily: FONTS.regular },
                  ]}
                >
                  Select all that apply — we'll tailor your experience
                </Text>

                <View style={styles.goalsGrid}>
                  {FITNESS_GOALS.map((goal) => {
                    const selected = selectedGoals.includes(goal.id);
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        onPress={() => toggleGoal(goal.id)}
                        style={[
                          styles.goalPill,
                          {
                            backgroundColor: selected
                              ? theme.gold + "1A"
                              : theme.bgSurface,
                            borderColor: selected ? theme.gold : theme.border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{goal.emoji}</Text>
                        <Text
                          style={[
                            styles.goalLabel,
                            {
                              color: selected
                                ? theme.gold
                                : theme.textSecondary,
                              fontFamily: FONTS.medium,
                            },
                          ]}
                        >
                          {goal.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    {
                      color: theme.textSecondary,
                      fontFamily: FONTS.medium,
                      marginTop: 24,
                    },
                  ]}
                >
                  CHOOSE YOUR PLAY TYPE
                </Text>
                {PLAY_TYPES.map((pt) => (
                  <TouchableOpacity
                    key={pt.id}
                    onPress={() => setPlayType(pt.id)}
                    style={[
                      styles.selectCard,
                      {
                        backgroundColor:
                          playType === pt.id
                            ? theme.gold + "15"
                            : theme.bgSurface,
                        borderColor:
                          playType === pt.id ? theme.gold : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{pt.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.selectTitle,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {pt.label}
                      </Text>
                      <Text
                        style={[
                          styles.selectDesc,
                          { color: theme.textMuted, fontFamily: FONTS.regular },
                        ]}
                      >
                        {pt.desc}
                      </Text>
                    </View>
                    {playType === pt.id && (
                      <Feather
                        name="check-circle"
                        size={20}
                        color={theme.gold}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* STEP 5: Avatar + Terms */}
            {step === 5 && (
              <>
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
                  ]}
                >
                  Add Your Photo
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.textSecondary, fontFamily: FONTS.regular },
                  ]}
                >
                  Help us track your progress from day one
                </Text>

                <View style={styles.avatarContainer}>
                  <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={[
                          styles.avatarImage,
                          { borderColor: theme.gold },
                        ]}
                      />
                    ) : (
                      <LinearGradient
                        colors={[theme.gold, "#8A6420"]}
                        style={styles.avatarPlaceholder}
                      >
                        <Text
                          style={[
                            styles.initials,
                            { fontFamily: FONTS.cinzelBold },
                          ]}
                        >
                          {fullName[0]?.toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{ marginTop: 16 }}
                  >
                    <Text
                      style={{ color: theme.gold, fontFamily: FONTS.medium }}
                    >
                      Choose Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: theme.bgSurface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryTitle,
                      { color: theme.gold, fontFamily: FONTS.cinzelBold },
                    ]}
                  >
                    YOUR PROFILE SUMMARY
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.textMuted, fontFamily: FONTS.medium },
                      ]}
                    >
                      Name
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: theme.textPrimary,
                          fontFamily: FONTS.semiBold,
                        },
                      ]}
                    >
                      {fullName}
                    </Text>
                  </View>
                  {heightCm ? (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textMuted, fontFamily: FONTS.medium },
                        ]}
                      >
                        Height
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {heightCm} cm
                      </Text>
                    </View>
                  ) : null}
                  {weightKg ? (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textMuted, fontFamily: FONTS.medium },
                        ]}
                      >
                        Weight
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {weightKg} kg
                      </Text>
                    </View>
                  ) : null}
                  {bodyType ? (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textMuted, fontFamily: FONTS.medium },
                        ]}
                      >
                        Body Type
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {BODY_TYPES.find((b) => b.id === bodyType)?.label}
                      </Text>
                    </View>
                  ) : null}
                  {playType ? (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: theme.textMuted, fontFamily: FONTS.medium },
                        ]}
                      >
                        Play Type
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {PLAY_TYPES.find((p) => p.id === playType)?.label}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.textMuted, fontFamily: FONTS.medium },
                      ]}
                    >
                      Goals
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: theme.gold, fontFamily: FONTS.semiBold },
                      ]}
                    >
                      {selectedGoals.length} selected
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={styles.termsContainer}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: termsAccepted ? theme.gold : theme.border,
                        backgroundColor: termsAccepted
                          ? theme.gold
                          : "transparent",
                      },
                    ]}
                  >
                    {termsAccepted && (
                      <Feather name="check" size={12} color="#FFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.termsText,
                      { color: theme.textSecondary, fontFamily: FONTS.regular },
                    ]}
                  >
                    I agree to the{" "}
                    <Text style={{ color: theme.gold }}>Terms of Service</Text>{" "}
                    and{" "}
                    <Text style={{ color: theme.gold }}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Error Message */}
          {error ? (
            <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>
              {error}
            </Text>
          ) : null}

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {error && error.includes("taken") && step === STEPS ? (
              <TouchableOpacity
                onPress={() => router.replace("/login")}
                style={{ marginBottom: 16, alignItems: "center" }}
              >
                <Text style={{ color: theme.gold, fontFamily: FONTS.bold }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            ) : null}

            <Button
              title={step === STEPS ? "CREATE ACCOUNT" : "CONTINUE"}
              onPress={handleNext}
              loading={loading}
              disabled={step === STEPS && !termsAccepted}
            />

            <TouchableOpacity 
              onPress={() => router.push("/login")}
              style={{ alignItems: "center", marginTop: 16, marginBottom: 8 }}
              testID="register-login-link"
            >
              <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13 }}>
                Already have an account? <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  met,
  theme,
}: {
  label: string;
  met: boolean;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: met ? theme.gold : theme.bgElevated },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: met ? "#000" : theme.textMuted, fontFamily: FONTS.medium },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingBottom: 0 },
  backBtn: { marginBottom: SPACING.md },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: "100%" },
  stepText: { fontSize: 12 },

  content: { padding: SPACING.lg, flexGrow: 1 },
  title: { fontSize: 24, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
  },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, height: "100%", fontSize: 16 },
  eyeBtn: { padding: 4 },

  strengthContainer: { flexDirection: "row", gap: 4, marginTop: 8, height: 4 },
  strengthBar: { borderRadius: 2 },

  chipContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontSize: 10 },

  phoneContainer: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    overflow: "hidden",
  },
  phoneTextContainer: { height: 56 },

  // Step 3: Body Stats
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statInput: {},

  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  selectTitle: { fontSize: 15 },
  selectDesc: { fontSize: 12, marginTop: 2 },

  // Step 4: Goals
  goalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  goalLabel: { fontSize: 13 },

  // Step 5
  avatarContainer: { alignItems: "center", marginVertical: 24 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  initials: { fontSize: 40, color: "#FFF" },

  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 12, letterSpacing: 1, marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13 },

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },

  errorText: { color: "#E74C3C", textAlign: "center", marginBottom: 16 },
  bottomActions: { marginTop: "auto", paddingTop: 24 },
});
