import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button } from "../../src/components/Button";
import { FONTS, SPACING } from "../../src/constants/theme";
import { TrialBanner } from "../../src/components/TrialBanner";

export default function SettingsScreen() {
  const { theme, toggleTheme, mode } = useTheme();
  const { user, signOut, profile } = useAuth();
  const router = useRouter();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent. Contact support@maxx.app to delete your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Password changed successfully.");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const planLabel: Record<string, string> = {
    free_trial: "Free Trial",
    grind: "Grind",
    alpha: "Alpha",
    sigma: "Sigma",
  };
  const currentPlanLabel = planLabel[(profile as any)?.plan] || "Free Trial";

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textMuted, fontFamily: FONTS.semiBold },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: theme.bgSurface, borderColor: theme.border },
        ]}
      >
        {children}
      </View>
    </View>
  );

  const Item = ({
    label,
    value,
    onPress,
    icon = "chevron-right",
    color,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.item, { borderBottomColor: theme.border }]}
    >
      <View style={styles.itemLeft}>
        <Text
          style={[
            styles.itemLabel,
            { color: color || theme.textPrimary, fontFamily: FONTS.medium },
          ]}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={[
              styles.itemSub,
              { color: theme.textMuted, fontFamily: FONTS.regular },
            ]}
          >
            {value}
          </Text>
        )}
      </View>
      {icon && <Feather name={icon} size={16} color={theme.textMuted} />}
    </TouchableOpacity>
  );

  const ToggleItem = ({ label, value, onToggle }: any) => (
    <View style={[styles.item, { borderBottomColor: theme.border }]}>
      <Text
        style={[
          styles.itemLabel,
          { color: theme.textPrimary, fontFamily: FONTS.medium },
        ]}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.gold }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      testID="settings-screen"
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)");
          }}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
          ]}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <TrialBanner />
        </View>
        <Section title="ACCOUNT">
          <Item
            label="Edit Profile"
            onPress={() => router.push("/settings/edit-profile" as any)}
          />
          <Item
            label="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />
          <Item
            label="Delete Account"
            value="Contact support"
            color="#E74C3C"
            onPress={handleDeleteAccount}
            icon={null}
          />
        </Section>

        <Section title="SECURITY">
          <ToggleItem
            label="Face ID / Touch ID"
            value={false}
            onToggle={() =>
              Alert.alert("Biometrics", "Configure in your device settings.")
            }
          />
          <Item
            label="Active Sessions"
            value="Manage in Supabase"
            onPress={() => {}}
          />
        </Section>

        <Section title="APPEARANCE">
          <ToggleItem
            label="Dark Mode"
            value={mode === "dark"}
            onToggle={toggleTheme}
          />
          <Item label="AI Engine" value="Gemini" onPress={() => {}} />
        </Section>

        <Section title="SUBSCRIPTION">
          <Item
            label="Current Plan"
            value={currentPlanLabel}
            onPress={() => router.push("/plans")}
          />
          <Item
            label="Cancel Subscription"
            color={theme.textMuted}
            onPress={() =>
              Alert.alert("Cancel", "Contact support@maxx.app to cancel.")
            }
            icon={null}
          />
        </Section>

        <Section title="SUPPORT">
          <Item
            label="Contact Support"
            onPress={() => router.push("/support" as any)}
          />
          <Item
            label="Supplements"
            onPress={() => router.push("/supplements" as any)}
          />
        </Section>

        <View style={styles.footer}>
          <Button title="SIGN OUT" onPress={handleSignOut} variant="danger" />
          <Text
            style={[
              styles.version,
              { color: theme.textMuted, fontFamily: FONTS.regular },
            ]}
          >
            MAXX v1.0.0 — {user?.email || "Member"}
          </Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: theme.bgSurface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: FONTS.cinzelBold,
                fontSize: 18,
                marginBottom: 20,
              }}
            >
              Change Password
            </Text>
            <Text
              style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6 }}
            >
              NEW PASSWORD
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.bgElevated,
                color: theme.textPrimary,
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Min. 8 characters"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Text
              style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6 }}
            >
              CONFIRM PASSWORD
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.bgElevated,
                color: theme.textPrimary,
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Repeat password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: theme.bgElevated,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: theme.textMuted, fontFamily: FONTS.semiBold }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={{
                  flex: 2,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: theme.gold,
                  alignItems: "center",
                }}
                disabled={changingPw}
              >
                <Text style={{ color: "#0A0A0A", fontFamily: FONTS.bold }}>
                  {changingPw ? "Saving..." : "CHANGE PASSWORD"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 24, marginLeft: SPACING.xs },
  scroll: { paddingBottom: SPACING.xl },
  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  itemLeft: { flex: 1 },
  itemLabel: { fontSize: 15 },
  itemSub: { fontSize: 12, marginTop: 2 },
  footer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
    alignItems: "center",
  },
  version: { fontSize: 12, opacity: 0.6 },
});
