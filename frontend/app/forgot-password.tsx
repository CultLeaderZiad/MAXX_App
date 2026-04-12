import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { Button } from "../src/components/Button";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING } from "../src/constants/theme";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      // Redirect to OTP screen with mode="recovery"
      router.push({ pathname: "/otp", params: { email, mode: "recovery" } });
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Enter your email to receive a password reset code.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.bgInput,
                  color: theme.textPrimary,
                  borderColor: email ? theme.gold : theme.border,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="SEND RESET CODE"
              onPress={handleReset}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, flexGrow: 1, paddingTop: SPACING.xl },
  backBtn: { width: 44, height: 44, justifyContent: "center", marginLeft: SPACING.md, marginTop: SPACING.sm },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 40 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: { color: "#E74C3C", textAlign: "center", marginBottom: 16 },
  actions: { marginTop: 8 },
});
