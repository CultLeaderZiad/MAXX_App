import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeBack } from "../lib/safeBack";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "../src/components/Button";

import { FONTS, SPACING } from "../src/constants/theme";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    mode?: string; // "signup" | "login"
  }>();
  const email = (params.email ?? "") as string;
  const mode = (params.mode ?? "signup") as string;

  const [code, setCode] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 300);
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChange = (text: string, index: number) => {
    // Handle paste — user pastes the full 6-digit code
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").split("").slice(0, OTP_LENGTH);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newCode[index + i] = d;
      });
      setCode(newCode);
      setError("");
      const filled = newCode.join("");
      if (filled.length === OTP_LENGTH) {
        handleVerify(filled);
      } else {
        const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        inputs.current[nextIndex]?.focus();
      }
      return;
    }

    // Single digit
    const digit = text.replace(/\D/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when last digit entered
    if (index === OTP_LENGTH - 1 && digit) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const otpCode = (fullCode || code.join("")).trim();
    if (otpCode.length < OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code`);
      shake();
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await verifyOtp(email, otpCode, mode as string);
      if (verifyError) {
        // Provide user-friendly error messages
        const msg = verifyError.message?.toLowerCase() || "";
        if (msg.includes("expired")) {
          setError("Code expired. Tap Resend to get a new code.");
        } else if (msg.includes("invalid") || msg.includes("incorrect")) {
          setError("Invalid code. Check your email and try again.");
        } else {
          setError(verifyError.message || "Verification failed");
        }
        shake();
        // Clear the code inputs so user can re-enter
        setCode(Array(OTP_LENGTH).fill(""));
        inputs.current[0]?.focus();
      } else {
        if (mode === "recovery") {
          router.replace("/reset-password");
        }
        // If success and not recovery, AuthContext handles navigation
      }
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred");
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      // For signup mode, try resending the signup confirmation
      if (mode === "signup") {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
        });
        if (resendError) {
          // Fallback to signInWithOtp
          const { error: otpError } = await resendOtp(email);
          if (otpError) {
            setError(otpError.message || "Failed to resend. Please wait and try again.");
          } else {
            setCountdown(60);
            setCode(Array(OTP_LENGTH).fill(""));
            Alert.alert("Code Sent!", "Check your email for a new verification code.");
          }
        } else {
          setCountdown(60);
          setCode(Array(OTP_LENGTH).fill(""));
          Alert.alert("Code Sent!", "Check your email for a new verification code.");
        }
      } else if (mode === "recovery") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) {
          setError(resetError.message || "Failed to resend recovery code");
        } else {
          setCountdown(60);
          setCode(Array(OTP_LENGTH).fill(""));
          Alert.alert("Code Sent!", "Check your email for a new verification code.");
        }
      } else {
        // Login mode — use signInWithOtp
        const { error: otpError } = await resendOtp(email);
        if (otpError) {
          setError(otpError.message || "Failed to resend code");
        } else {
          setCountdown(60);
          setCode(Array(OTP_LENGTH).fill(""));
          Alert.alert("Code Sent!", "Check your email for a new verification code.");
        }
      }
    } catch (e: any) {
      setError("Failed to resend code. Try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      testID="otp-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => safeBack()}
          style={styles.backBtn}
          testID="otp-back-btn"
        >
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
            ]}
          >
            Verify It's You
          </Text>
          <Text
            style={[
              styles.sub,
              { color: theme.textSecondary, fontFamily: FONTS.regular },
            ]}
          >
            Enter the {OTP_LENGTH}-digit code sent to{"\n"}
            <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold }}>
              {email || "your email"}
            </Text>
          </Text>

          {/* Hint */}
          <Text
            style={[
              styles.hint,
              { color: theme.textMuted, fontFamily: FONTS.regular },
            ]}
          >
            Check your inbox and spam folder
          </Text>

          {/* Code inputs */}
          <Animated.View
            style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {code.map((digit: string, i: number) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                testID={`otp-input-${i}`}
                style={[
                  styles.digitInput,
                  {
                    backgroundColor: theme.bgInput,
                    color: theme.textPrimary,
                    borderColor: error
                      ? theme.red
                      : digit
                        ? theme.gold
                        : theme.border,
                    fontFamily: FONTS.bold,
                  },
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={OTP_LENGTH} // Allow paste of full code
                selectTextOnFocus
              />
            ))}
          </Animated.View>

          {error ? (
            <Text
              style={[
                styles.error,
                { fontFamily: FONTS.medium, marginTop: 20 },
              ]}
            >
              {error}
            </Text>
          ) : null}

          {/* Countdown / Resend */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text
                style={[
                  styles.resend,
                  { color: theme.textMuted, fontFamily: FONTS.regular },
                ]}
              >
                Resend code in {formatTime(countdown)}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resending}
                testID="resend-otp-btn"
                style={styles.resendBtn}
              >
                <Feather
                  name="refresh-cw"
                  size={14}
                  color={theme.gold}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.resendActive,
                    {
                      color: theme.gold,
                      fontFamily: FONTS.semiBold,
                      opacity: resending ? 0.5 : 1,
                    },
                  ]}
                >
                  {resending ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom CTA */}
        <View
          style={[
            styles.bottom,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <Button
            title="VERIFY CODE"
            onPress={() => handleVerify()}
            loading={loading}
            testID="otp-verify-btn"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginLeft: SPACING.md,
    marginTop: SPACING.sm,
  },
  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginTop: SPACING.sm, lineHeight: 22 },
  hint: { fontSize: 12, marginTop: 8, opacity: 0.6 },
  codeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: SPACING.xl,
    justifyContent: "center",
  },
  digitInput: {
    width: 38,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: 20,
  },
  error: {
    color: "#E74C3C",
    fontSize: 13,
    textAlign: "center",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  resend: { fontSize: 13, textAlign: "center" },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendActive: { fontSize: 14, textAlign: "center" },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
