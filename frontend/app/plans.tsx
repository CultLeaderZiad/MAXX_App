import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

export default function PlansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('alpha');

  const handleSelect = (planKey: string, price: string) => {
    setSelectedPlan(planKey);
    router.push({ pathname: '/payment', params: { plan: planKey, price } });
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
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold, textAlign: 'center' }]}>Choose Plan</Text>

        {[
          {
            key: 'grind',
            name: 'Grind',
            price: '$9.99',
            features: [
              'Jaw & face training',
              'Body programs + NoFap tracker',
              'Daily wisdom drops',
            ],
            excluded: ['AI Face Coach'],
            trial: '7 DAYS FREE',
          },
          {
            key: 'alpha',
            name: 'Alpha',
            price: '$19.99',
            features: [
              'Everything in Grind',
              'AI Face Coach (Claude + Gemini)',
              'Profile audit + Brotherhood feed',
              'Convo simulator (3/mo)',
            ],
            trial: '7 DAYS FREE',
            popular: true,
          },
          {
            key: 'sigma',
            name: 'Sigma',
            price: '$34.99',
            features: [
              'Everything unlocked',
              'Unlimited convo simulator',
            ],
            trial: '7 DAYS FREE',
          }
        ].map((plan) => {
          const isAlpha = plan.popular;
          return (
            <View
              key={plan.key}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.bgSurface,
                  borderColor: isAlpha ? theme.gold : theme.border,
                  borderWidth: isAlpha ? 1.5 : 1,
                  padding: SPACING.lg,
                  borderRadius: 20,
                  marginBottom: SPACING.md,
                },
              ]}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 24 }]}>{plan.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(200,169,110,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: theme.gold }}>
                       <Text style={{ color: theme.gold, fontSize: 10, fontFamily: FONTS.bold }}>{plan.trial}</Text>
                    </View>
                    <Text style={{ color: theme.gold, fontSize: 22, fontFamily: FONTS.bold }}>{plan.price}</Text>
                </View>
              </View>

              {isAlpha && (
                <View style={{ position: 'absolute', top: -12, right: 20, backgroundColor: theme.gold, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#000', fontSize: 10, fontFamily: FONTS.bold }}>MOST POPULAR</Text>
                </View>
              )}

              <View style={{ marginTop: SPACING.md, gap: 10 }}>
                {plan.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Feather name="check" size={14} color={theme.gold} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: FONTS.medium }}>{f}</Text>
                  </View>
                ))}
                {(plan as any).excluded?.map((f: string, i: number) => (
                   <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.4 }}>
                    <Feather name="x" size={14} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: FONTS.medium, textDecorationLine: 'line-through' }}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => handleSelect(plan.key, plan.price)}
                style={[
                    styles.planBtn,
                    {
                        backgroundColor: isAlpha ? 'transparent' : theme.bgElevated,
                        borderColor: theme.border,
                        borderWidth: isAlpha ? 1 : 0,
                        marginTop: SPACING.lg,
                        height: 54,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }
                ]}
              >
                 <Text style={{ color: theme.textPrimary, fontSize: 20, fontFamily: FONTS.bold }}>Start Free Trial</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
  planCard: { borderRadius: RADIUS.lg, padding: SPACING.md },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 20 },
  planBtn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
