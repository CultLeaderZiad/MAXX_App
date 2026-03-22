import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { PLAN_OPTIONS } from '../src/constants/mockData';

export default function PlansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('alpha');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (planKey: string) => {
    setSelectedPlan(planKey);
    setLoading(true);
    try {
      await AsyncStorage.setItem('maxx_selected_plan', planKey);
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="plans-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="plans-back-btn" style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: theme.gold }]} />
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Choose Your Path</Text>
        <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          All plans start with 7 days free
        </Text>

        {PLAN_OPTIONS.map((plan) => {
          const isSel = selectedPlan === plan.key;
          const isAlpha = plan.key === 'alpha';
          return (
            <TouchableOpacity
              key={plan.key}
              testID={`plan-${plan.key}`}
              onPress={() => setSelectedPlan(plan.key)}
              activeOpacity={0.8}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.bgSurface,
                  borderColor: isSel ? theme.borderActive : theme.border,
                  borderWidth: isAlpha ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{plan.name}</Text>
                <View style={styles.planRight}>
                  {plan.badge && (
                    <View style={[styles.badge, { backgroundColor: theme.gold }]}>
                      <Text style={[styles.badgeText, { fontFamily: FONTS.semiBold }]}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={[styles.freePill, { borderColor: theme.gold }]}>
                    <Text style={[styles.freeText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>7 DAYS FREE</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.price, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
                {plan.price}<Text style={[styles.priceUnit, { fontFamily: FONTS.regular }]}>/month</Text>
              </Text>
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name={f.included ? 'check' : 'x'} size={14} color={f.included ? theme.gold : theme.textMuted} />
                    <Text style={[styles.featureText, { color: f.included ? theme.textSecondary : theme.textMuted, fontFamily: FONTS.regular }]}>
                      {f.name}
                    </Text>
                  </View>
                ))}
              </View>
              {isAlpha ? (
                <TouchableOpacity onPress={() => handleSelect(plan.key)} testID={`select-${plan.key}-btn`} activeOpacity={0.8}>
                  <LinearGradient colors={[...theme.goldGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.selectBtn}>
                    <Text style={[styles.selectBtnText, { fontFamily: FONTS.semiBold }]}>
                      {loading && selectedPlan === plan.key ? 'Loading...' : 'START FREE TRIAL'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSelect(plan.key)}
                  testID={`select-${plan.key}-btn`}
                  style={[styles.selectBtnOutline, { borderColor: theme.selectedBorder }]}
                >
                  <Text style={[styles.selectBtnOutlineText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
                    {loading && selectedPlan === plan.key ? 'Loading...' : 'SELECT PLAN'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.disclaimer, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          NOT charged until Day 8. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginLeft: 'auto', marginRight: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginBottom: SPACING.md },
  planCard: { borderRadius: RADIUS.lg, padding: SPACING.md },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 20 },
  planRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 9, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: 0.5 },
  freePill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill },
  freeText: { fontSize: 9, letterSpacing: 0.5 },
  price: { fontSize: 24, marginTop: SPACING.sm },
  priceUnit: { fontSize: 14, color: '#9A9A9A' },
  featureList: { marginTop: SPACING.md, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13 },
  selectBtn: { height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  selectBtnText: { color: '#0A0A0A', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  selectBtnOutline: { height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, borderWidth: 1 },
  selectBtnOutlineText: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  disclaimer: { fontSize: 12, textAlign: 'center', marginTop: SPACING.md },
});
