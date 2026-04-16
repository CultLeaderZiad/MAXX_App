import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { safeBack } from '../lib/safeBack';
import { FONTS, SPACING, RADIUS, GOLD } from '../src/constants/theme';

const BG = '#0A0A0A';
const SURFACE = '#111111';
const TEXT = '#FFFFFF';
const MUTED = '#9A9A9A';
const BORDER = '#2A2A2A';

const PLANS = [
  {
    id: 'grind',
    name: 'GRIND',
    price: '$9.99',
    period: '/month',
    color: '#3498DB',
    tagline: 'Start building discipline.',
    features: [
      'Full workout library (Body, Face, Mind)',
      'Supplement swipe deck',
      'All 6 body calculators',
      'Wisdom cards + daily missions',
      'Brotherhood community feed',
    ],
    locked: ['Convo Lab AI', 'Profile Audit AI', 'Dating IQ Advanced'],
  },
  {
    id: 'alpha',
    name: 'ALPHA',
    price: '$19.99',
    period: '/month',
    color: GOLD,
    tagline: 'Unlock everything.',
    popular: true,
    features: [
      'Everything in Grind',
      'Convo Lab AI (all scenarios)',
      'Profile Audit AI',
      'Dating IQ full course',
      'AI Supplement Stack Builder',
      'Priority support',
    ],
    locked: [],
  },
  {
    id: 'sigma',
    name: 'SIGMA',
    price: '$34.99',
    period: '/month',
    color: '#E74C3C',
    tagline: 'No limits. No ceiling.',
    features: [
      'Everything in Alpha',
      'Unlimited AI sessions',
      'Early access to new features',
      'Direct founder feedback',
      'Sigma community access',
    ],
    locked: [],
  },
];

export default function PlansScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('alpha');

  const currentPlan = (profile as any)?.plan || 'free_trial';

  const handleUpgrade = (planId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Upgrade to ' + planId.toUpperCase(),
      'To complete your upgrade, contact support or visit our website.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => Linking.openURL('mailto:cultleaderziad.dev@gmail.com?subject=Upgrade to ' + planId.toUpperCase()),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: GOLD, fontFamily: FONTS.cinzelBold }]}>UPGRADE</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Trial info */}
        <View style={[styles.trialBanner, { backgroundColor: GOLD + '15', borderColor: GOLD + '40' }]}>
          <Feather name="star" size={16} color={GOLD} />
          <Text style={[styles.trialText, { color: TEXT, fontFamily: FONTS.semiBold }]}>
            7-day free trial includes full Alpha access
          </Text>
        </View>

        {/* Plan cards */}
        {PLANS.map(plan => {
          const isSelected = selected === plan.id;
          const isCurrent = currentPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => { Haptics.selectionAsync(); setSelected(plan.id); }}
              style={[
                styles.planCard,
                {
                  backgroundColor: SURFACE,
                  borderColor: isSelected ? plan.color : BORDER,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              activeOpacity={0.9}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={[styles.popularText, { fontFamily: FONTS.bold }]}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planTop}>
                <View style={[styles.planDot, { backgroundColor: plan.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: plan.color, fontFamily: FONTS.cinzelBold }]}>{plan.name}</Text>
                  <Text style={[styles.planTagline, { color: MUTED, fontFamily: FONTS.regular }]}>{plan.tagline}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, { color: TEXT, fontFamily: FONTS.cinzelBold }]}>{plan.price}</Text>
                  <Text style={[styles.planPeriod, { color: MUTED, fontFamily: FONTS.regular }]}>{plan.period}</Text>
                </View>
              </View>

              {/* Features */}
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather name="check" size={14} color={plan.color} />
                  <Text style={[styles.featureText, { color: TEXT, fontFamily: FONTS.regular }]}>{f}</Text>
                </View>
              ))}
              {plan.locked.map((f, i) => (
                <View key={`l${i}`} style={styles.featureRow}>
                  <Feather name="lock" size={12} color={MUTED} />
                  <Text style={[styles.featureText, { color: MUTED, fontFamily: FONTS.regular }]}>{f}</Text>
                </View>
              ))}

              {isCurrent ? (
                <View style={[styles.currentBadge, { borderColor: plan.color }]}>
                  <Text style={[{ color: plan.color, fontFamily: FONTS.bold, fontSize: 12 }]}>CURRENT PLAN</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleUpgrade(plan.id)}
                  style={[styles.upgradeBtn, { backgroundColor: isSelected ? plan.color : 'transparent', borderColor: plan.color }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.upgradeText, { color: isSelected ? '#000' : plan.color, fontFamily: FONTS.bold }]}>
                    {isSelected ? 'UPGRADE NOW' : 'SELECT PLAN'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.disclaimer, { color: MUTED, fontFamily: FONTS.regular }]}>
          Cancel anytime. No questions asked. 7-day free trial gives you full Alpha access.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 20, letterSpacing: 4 },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1 },
  trialText: { flex: 1, fontSize: 13 },
  planCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.lg, overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: RADIUS.md },
  popularText: { fontSize: 9, color: '#000', letterSpacing: 1 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  planDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  planName: { fontSize: 18, letterSpacing: 2 },
  planTagline: { fontSize: 12, marginTop: 2 },
  planPrice: { fontSize: 22 },
  planPeriod: { fontSize: 11 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  featureText: { fontSize: 13, flex: 1 },
  upgradeBtn: { marginTop: SPACING.md, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center', borderWidth: 2 },
  upgradeText: { fontSize: 13, letterSpacing: 1 },
  currentBadge: { marginTop: SPACING.md, paddingVertical: 12, borderRadius: RADIUS.lg, alignItems: 'center', borderWidth: 2 },
  disclaimer: { textAlign: 'center', fontSize: 12, marginHorizontal: SPACING.xl, marginTop: SPACING.md, lineHeight: 20 },
});
