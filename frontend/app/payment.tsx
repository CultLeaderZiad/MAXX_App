import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { supabase } from '../lib/supabase';
import { api } from '../src/services/api';

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { user, fetchProfile } = useAuth();
  const router = useRouter();
  const { plan, price } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePay = async () => {
    if (!cardNumber || !expiry || !cvv) {
      Alert.alert('Error', 'Please fill all payment details');
      return;
    }

    setLoading(true);
    try {
      // 1. Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Update Supabase
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: (plan as string).toLowerCase() })
          .eq('id', user.id);
        
        if (error) throw error;
      }

      // 3. Update MongoDB (optional, but keep in sync)
      try {
        await api.post('/api/user/update-plan', { plan });
      } catch (e) {
        console.warn('Sync to MongoDB failed', e);
      }

      await fetchProfile();
      Alert.alert('Welcome to Alpha', 'Your plan has been upgraded successfully.', [
        { text: 'START TRAINING', onPress: () => router.replace('/(tabs)/train') }
      ]);
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message || 'Transaction could not be completed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Selected Plan</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{plan?.toString().toUpperCase()}</Text>
            <Text style={[styles.planPrice, { color: theme.gold, fontFamily: FONTS.bold }]}>{price || '$19.99'}</Text>
          </View>
          <Text style={[styles.trialText, { color: theme.gold, fontSize: 11 }]}>7-DAY FREE TRIAL · THEN {price}/MONTH</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Credit Card</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="Card Number"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="MM/YY"
              placeholderTextColor={theme.textMuted}
              value={expiry}
              onChangeText={setExpiry}
            />
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="CVV"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              maxLength={3}
              value={cvv}
              onChangeText={setCvv}
            />
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR PAY WITH</Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>

        <View style={{ gap: SPACING.md }}>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#FFFFFF' }]} onPress={handlePay}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo_%282020%29.svg' }} style={{ width: 60, height: 24 }} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#000000', borderColor: '#333', borderWidth: 1 }]} onPress={handlePay}>
                <AntDesign name="apple" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 18, fontFamily: FONTS.semiBold, marginLeft: 8 }}>Pay</Text>
            </TouchableOpacity>
        </View>

        <Button 
            title={loading ? "PROCESSING..." : `START ${plan?.toString().toUpperCase()} TRIAL`} 
            onPress={handlePay} 
            loading={loading}
            style={{ marginTop: SPACING.xl }}
        />
        <Text style={[styles.legal, { color: theme.textMuted }]}>
          By clicking Start Trial, you agree to our Terms of Service. Your subscription will renew automatically.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: SPACING.sm },
  backBtn: { padding: 8 },
  title: { fontSize: 20 },
  content: { padding: SPACING.lg },
  summaryCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 1, marginBottom: SPACING.xl },
  summaryLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 24 },
  planPrice: { fontSize: 24 },
  trialText: { marginTop: 8 },
  sectionTitle: { fontSize: 13, marginBottom: SPACING.md, fontFamily: FONTS.semiBold },
  inputGroup: { gap: SPACING.md, marginBottom: SPACING.xl },
  input: { height: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.xl },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, letterSpacing: 1 },
  payBtn: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  legal: { fontSize: 11, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 16 },
});
