import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { Button } from "../src/components/Button";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING } from "../src/constants/theme";

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      Alert.alert(
        "Password Updated",
        "Your password has been successfully reset. Please sign in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            },
          },
        ]
      );
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
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            New Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Please enter your new password.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>
              NEW PASSWORD
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: theme.bgInput,
                  borderColor: password ? theme.gold : theme.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  { color: theme.textPrimary },
                ]}
                placeholder="Min 8 chars"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>
              CONFIRM NEW PASSWORD
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: theme.bgInput,
                  borderColor: confirmPassword ? theme.gold : theme.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  { color: theme.textPrimary },
                ]}
                placeholder="Confirm password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { fontFamily: FONTS.medium }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="UPDATE PASSWORD"
              onPress={handleUpdate}
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
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 40 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeBtn: { padding: 4 },
  errorText: { color: "#E74C3C", textAlign: "center", marginBottom: 16 },
  actions: { marginTop: 8 },
});
