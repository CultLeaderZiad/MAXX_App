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
    if (!profile) return;

    // If they have no trial_start, we fallback to created_at or assume no trial.
    // If they don't have a plan set yet, maybe they aren't on trial?
    // Actually, all new users should be on a trial of 7 days according to the prompt request.
    const startTime = profile.trial_start
      ? new Date(profile.trial_start)
      : new Date(profile.created_at || new Date());
    const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const diffTime = Math.max(0, endTime.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysLeft(diffDays);
  }, [profile]);

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
