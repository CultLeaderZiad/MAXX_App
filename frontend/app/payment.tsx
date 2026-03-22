import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { supabase } from '../lib/supabase';

const METHODS = [
  { id: 'card', label: 'Credit Card', icon: 'credit-card' },
  { id: 'paypal', label: 'PayPal', icon: 'dollar-sign' },
  { id: 'apple', label: 'Apple Pay', icon: 'smartphone' },
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ plan: string; price: string }>();
  
  const [method, setMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPlan = params.plan || 'alpha';
  const price = params.price || '$19.99';

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handlePay = async () => {
    setLoading(true);
    // Mock Payment Delay
    setTimeout(async () => {
      setLoading(false);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update Supabase
      if (user) {
        await supabase.from('profiles').update({ plan: selectedPlan }).eq('id', user.id);
        await supabase.from('subscriptions').upsert({ 
            user_id: user.id, 
            plan: selectedPlan, 
            status: 'trialing', 
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
        });
        await refreshProfile();
      }

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2500);
    }, 2000);
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.successCircle, { backgroundColor: theme.gold }]}>
          <Feather name="check" size={48} color="#000" />
        </View>
        <Text style={[styles.successTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>TRIAL STARTED</Text>
        <Text style={[styles.successSub, { color: theme.textMuted }]}>Welcome to the elite.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold }]}>
          <View>
            <Text style={[styles.planLabel, { color: theme.textMuted }]}>SELECTED PLAN</Text>
            <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{selectedPlan.toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.price, { color: theme.gold, fontFamily: FONTS.bold }]}>{price}</Text>
            <Text style={[styles.trialBadge, { color: theme.green }]}>7 Days Free</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PAYMENT METHOD</Text>
        <View style={styles.methodsRow}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[
                styles.methodBtn,
                {
                  backgroundColor: theme.bgSurface,
                  borderColor: method === m.id ? theme.gold : theme.border,
                  opacity: method === m.id ? 1 : 0.6
                }
              ]}
            >
              <Feather name={m.icon as any} size={20} color={method === m.id ? theme.gold : theme.textMuted} />
              <Text style={[styles.methodLabel, { color: method === m.id ? theme.textPrimary : theme.textMuted }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'card' && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>CARD NUMBER</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                <Feather name="credit-card" size={18} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>EXPIRY</Text>
                <TextInput
                  style={[styles.inputBox, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.textPrimary }]}
                  placeholder="MM/YY"
                  placeholderTextColor={theme.textMuted}
                  maxLength={5}
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>CVV</Text>
                <TextInput
                  style={[styles.inputBox, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.textPrimary }]}
                  placeholder="123"
                  placeholderTextColor={theme.textMuted}
                  maxLength={4}
                  keyboardType="number-pad"
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button 
            title={`START FREE TRIAL • ${price}/mo`} 
            onPress={handlePay} 
            loading={loading}
            disabled={method === 'card' && cardNumber.length < 16}
          />
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            You won't be charged until the trial ends. Cancel anytime in settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18 },
  content: { padding: SPACING.lg },
  summaryCard: { padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  planLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  planName: { fontSize: 20 },
  price: { fontSize: 18 },
  trialBadge: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: SPACING.md },
  methodsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.xl },
  methodBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 8 },
  methodLabel: { fontSize: 11 },
  form: { gap: SPACING.lg },
  inputGroup: {},
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.medium },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: FONTS.regular },
  row: { flexDirection: 'row', gap: SPACING.md },
  inputBox: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular },
  footer: { marginTop: SPACING.xxl },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: SPACING.md, lineHeight: 16 },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: 24, marginBottom: 8 },
  successSub: { fontSize: 16 },
});
