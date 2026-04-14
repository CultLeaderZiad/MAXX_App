import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SPACING } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

export function TrialBanner() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const trialEndStr = profile?.trial_end || profile?.created_at;
    if (!trialEndStr) return;

    const trialEnds = profile?.trial_end 
      ? new Date(profile.trial_end).getTime() 
      : new Date(profile.created_at).getTime() + (7 * 24 * 60 * 60 * 1000);
      
    const now = new Date().getTime();

    const diffTime = Math.max(0, trialEnds - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysLeft(diffDays);
  }, [profile?.trial_end, profile?.created_at]);

  if (!profile || daysLeft === null || daysLeft <= 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(200, 169, 110, 0.1)",
          borderColor: theme.gold,
        },
      ]}
    >
      <Feather name="clock" size={16} color={theme.gold} />
      <Text style={[styles.text, { color: theme.gold }]}>
        <Text style={{ fontFamily: FONTS.bold }}>{daysLeft} days</Text> left in
        your {profile.plan ? profile.plan.toUpperCase() : "Free"} Trial
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
});
