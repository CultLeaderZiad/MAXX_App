import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../src/components/Button";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { supabase } from "../lib/supabase";
import { api } from "../src/services/api";
import { safeBack } from "../lib/safeBack";

const PAYMENT_METHODS = [
  { id: "apple_pay", label: "Apple Pay", icon: "smartphone" as const, badge: "Recommended" },
  { id: "stripe", label: "Stripe", icon: "credit-card" as const, badge: null },
  { id: "paypal", label: "PayPal", icon: "dollar-sign" as const, badge: null },
];

const TRUST_BADGES = [
  { icon: "shield" as const, label: "SSL Encrypted" },
  { icon: "lock" as const, label: "Secure Payments" },
  { icon: "refresh-cw" as const, label: "Cancel Anytime" },
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { user, fetchProfile } = useAuth();
  const router = useRouter();
  const { plan, price } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("apple_pay");

  const handleStartTrial = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: (plan as string).toLowerCase(),
            trial_start: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.log("update error:", error);
        }
      }

      // Update profile in Supabase
      try {
        await supabase.from("profiles").update({ plan }).eq("id", user.id);
      } catch (e) {
        console.warn("Sync to Supabase failed", e);
      }

      await fetchProfile();
      Alert.alert(
        "Welcome to MAXX",
        `Your 7-day free trial for ${plan?.toString().toUpperCase() || "Pro"} has started!`,
        [
          {
            text: "START TRAINING",
            onPress: () => setTimeout(() => router.replace("/(tabs)/train"), 100),
          },
        ],
      );
    } catch (e: any) {
      Alert.alert(
        "Activation Failed",
        e.message || "Trial could not be started",
      );
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = price?.toString() || "$9.99";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            safeBack();
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
          ]}
        >
          Checkout
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.bgSurface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            Selected Plan
          </Text>
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.planName,
                { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
              ]}
            >
              {plan?.toString().toUpperCase() || "PRO"}
            </Text>
            <Text style={[styles.priceTag, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
              {displayPrice}<Text style={{ fontSize: 12, color: theme.textMuted, fontFamily: FONTS.regular }}>/mo</Text>
            </Text>
          </View>

          <View
            style={[styles.trialBadge, { borderColor: theme.gold }]}
          >
            <View style={styles.trialRow}>
              <Feather name="clock" size={18} color={theme.gold} />
              <Text
                style={{
                  color: theme.gold,
                  fontFamily: FONTS.bold,
                  fontSize: 16,
                }}
              >
                7-Day Free Trial
              </Text>
            </View>
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: FONTS.regular,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              Enjoy full access to {plan?.toString().toUpperCase()} tier
              securely. No credit card required to start. You will only be
              billed if you decide to subscribe after your 7 days are over.
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PAYMENT METHOD</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMethod(method.id);
            }}
            style={[
              styles.methodRow,
              {
                backgroundColor: theme.bgSurface,
                borderColor: selectedMethod === method.id ? theme.gold : theme.border,
                borderWidth: selectedMethod === method.id ? 1.5 : 1,
              },
            ]}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: selectedMethod === method.id ? theme.gold + '15' : theme.bgElevated }]}>
                <Feather name={method.icon} size={20} color={selectedMethod === method.id ? theme.gold : theme.textMuted} />
              </View>
              <Text style={[styles.methodLabel, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
                {method.label}
              </Text>
              {method.badge && (
                <View style={[styles.methodBadge, { backgroundColor: theme.gold + '22' }]}>
                  <Text style={{ color: theme.gold, fontSize: 9, fontFamily: FONTS.bold }}>{method.badge}</Text>
                </View>
              )}
            </View>
            <View style={[styles.radioOuter, { borderColor: selectedMethod === method.id ? theme.gold : theme.textMuted }]}>
              {selectedMethod === method.id && <View style={[styles.radioInner, { backgroundColor: theme.gold }]} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* CTA */}
        <Button
          title={loading ? "ACTIVATING..." : "START MY 7 FREE DAYS"}
          onPress={handleStartTrial}
          loading={loading}
          style={{ marginTop: SPACING.xl }}
        />

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          {TRUST_BADGES.map((badge) => (
            <View key={badge.label} style={styles.trustItem}>
              <Feather name={badge.icon} size={14} color={theme.textMuted} />
              <Text style={[styles.trustText, { color: theme.textMuted }]}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.legal, { color: theme.textMuted }]}>
          By clicking Start Trial, you agree to our Terms of Service. You can
          change your plan at any time in the settings. No charge until your trial ends.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  summaryCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  summaryLabel: { fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: FONTS.bold },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: { fontSize: 24, letterSpacing: 1 },
  priceTag: { fontSize: 22 },
  trialBadge: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: "rgba(200,169,110,0.05)",
    borderRadius: 12,
    borderWidth: 1,
  },
  trialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 11, letterSpacing: 2, marginBottom: SPACING.md, fontFamily: FONTS.bold },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  methodIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  methodLabel: { fontSize: 15 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  trustRow: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: SPACING.lg },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustText: { fontSize: 10, fontFamily: FONTS.medium },
  legal: {
    fontSize: 11,
    textAlign: "center",
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
});
