import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../src/context/ThemeContext";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { TrialBanner } from "../src/components/TrialBanner";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_GAP = 20;

const PLANS = [
  {
    key: "grind",
    name: "GRIND",
    tagline: "Foundations of Dominance",
    price: "$9.99",
    priceNote: "/ month",
    trial: "7 DAYS FREE",
    color: "#9A9A9A",
    icon: "target" as const,
    features: [
      "Jaw & face training programs",
      "Full body workout library",
      "NoFap tracker + streaks",
      "Daily wisdom drops",
      "Community access",
    ],
    excluded: ["AI Face Coach", "Profile audit", "Convo simulator"],
  },
  {
    key: "alpha",
    name: "ALPHA",
    tagline: "Engineered for Ascension",
    price: "$19.99",
    priceNote: "/ month",
    trial: "7 DAYS FREE",
    color: "#C8A96E",
    icon: "zap" as const,
    popular: true,
    features: [
      "Everything in Grind",
      "AI Face Coach (Gemini)",
      "Profile audit (3/mo)",
      "Brotherhood feed access",
      "Convo simulator (3/mo)",
      "Priority support",
    ],
    excluded: [],
  },
  {
    key: "sigma",
    name: "SIGMA",
    tagline: "The Final Form",
    price: "$34.99",
    priceNote: "/ month",
    trial: "7 DAYS FREE",
    color: "#E8C88E",
    icon: "award" as const,
    features: [
      "Everything in Alpha",
      "Unlimited AI sessions",
      "Unlimited convo simulator",
      "Early feature access",
      "1-on-1 session (monthly)",
    ],
    excluded: [],
  },
];

export default function PlansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activePage, setActivePage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleSelect = (planKey: string, price: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/payment", params: { plan: planKey, price } });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
    setActivePage(page);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      testID="plans-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)");
          }}
          testID="plans-back-btn"
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
          CHOOSE YOUR PATH
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Trial Banner */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md }}>
        <TrialBanner />
      </View>

      {/* Swipeable Cards */}
      <FlatList
        ref={flatListRef}
        data={PLANS}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item: plan }) => {
          const isPopular = plan.popular;
          return (
            <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: isPopular ? plan.color : theme.border }]}>

              {isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={[styles.popularText, { fontFamily: FONTS.bold }]}>MOST POPULAR</Text>
                </View>
              )}

              {/* Plan Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { borderColor: plan.color + "44", backgroundColor: plan.color + "11" }]}>
                  <Feather name={plan.icon} size={22} color={plan.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.planName, { color: plan.color, fontFamily: FONTS.cinzelBold }]}>{plan.name}</Text>
                  <Text style={[styles.planTagline, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{plan.tagline}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: plan.color, fontFamily: FONTS.cinzelBold }]}>{plan.price}</Text>
                <Text style={[styles.priceNote, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{plan.priceNote}</Text>
              </View>

              {/* Trial Tag */}
              <View style={[styles.trialTag, { borderColor: plan.color + "55", backgroundColor: plan.color + "11" }]}>
                <Feather name="gift" size={11} color={plan.color} />
                <Text style={[styles.trialText, { color: plan.color, fontFamily: FONTS.bold }]}>{plan.trial}</Text>
              </View>

              {/* Features */}
              <View style={styles.featuresBlock}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name="check" size={13} color={plan.color} />
                    <Text style={[styles.featureText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{f}</Text>
                  </View>
                ))}
                {plan.excluded.map((f, i) => (
                  <View key={i} style={[styles.featureRow, { opacity: 0.35 }]}>
                    <Feather name="x" size={13} color={theme.textMuted} />
                    <Text style={[styles.featureText, { color: theme.textMuted, fontFamily: FONTS.regular, textDecorationLine: "line-through" }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity
                testID={`plan-select-${plan.key}`}
                onPress={() => handleSelect(plan.key, plan.price)}
                activeOpacity={0.85}
                style={{ marginTop: "auto", borderRadius: 14, overflow: "hidden" }}
              >
                {isPopular ? (
                  <LinearGradient
                    colors={[plan.color, "#8A6420"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaBtn}
                  >
                    <Text style={[styles.ctaText, { fontFamily: FONTS.bold, color: "#000" }]}>Start Free Trial</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.ctaBtn, { backgroundColor: theme.bgElevated, borderColor: plan.color + "55", borderWidth: 1 }]}>
                    <Text style={[styles.ctaText, { fontFamily: FONTS.bold, color: plan.color }]}>Start Free Trial</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {PLANS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, {
              width: activePage === i ? 20 : 8,
              backgroundColor: activePage === i ? theme.gold : theme.border,
            }]}
          />
        ))}
      </View>
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
  backBtn: { width: 44, height: 44, justifyContent: "center" },
  navTitle: { fontSize: 14, letterSpacing: 2 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    minHeight: 500,
    flexDirection: "column",
  },
  popularBadge: {
    position: "absolute",
    top: -13,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: { fontSize: 10, color: "#000", letterSpacing: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 22, letterSpacing: 1.5 },
  planTagline: { fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 20, gap: 6 },
  price: { fontSize: 36 },
  priceNote: { fontSize: 14, marginBottom: 4 },
  trialTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  trialText: { fontSize: 10, letterSpacing: 1 },
  featuresBlock: { marginTop: 20, gap: 11, flex: 1 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 13, lineHeight: 18 },
  ctaBtn: { height: 54, justifyContent: "center", alignItems: "center", borderRadius: 14 },
  ctaText: { fontSize: 16 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 20 },
  dot: { height: 8, borderRadius: 4 },
});
