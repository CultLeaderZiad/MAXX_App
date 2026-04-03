import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING } from '../src/constants/theme';
import { supabase } from '../lib/supabase';
import { api } from '../src/services/api';

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { user, fetchProfile } = useAuth();
  const router = useRouter();
  const { plan, price } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            plan: (plan as string).toLowerCase(),
            trial_start: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) {
           console.log("update error:", error);
           // Not throwing yet just in case trial_start column is missing
        }
      }

      try {
        await api.post('/api/user/update-plan', { plan });
      } catch (e) {
        console.warn('Sync to MongoDB failed', e);
      }

      await fetchProfile();
      Alert.alert('Welcome to MAXX', `Your 7-day free trial for ${plan?.toString().toUpperCase() || 'Pro'} has started!`, [
        { text: 'START TRAINING', onPress: () => router.replace('/(tabs)/train') }
      ]);
    } catch (e: any) {
      Alert.alert('Activation Failed', e.message || 'Trial could not be started');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Selected Plan</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.planName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{plan?.toString().toUpperCase() || 'PRO'}</Text>
          </View>
          
          <View style={{ marginTop: SPACING.md, padding: SPACING.md, backgroundColor: 'rgba(200,169,110,0.05)', borderRadius: 12, borderWidth: 1, borderColor: theme.gold }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="clock" size={18} color={theme.gold} />
                <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 16 }}>7-Day Free Trial</Text>
             </View>
             <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 }}>
                Enjoy full access to {plan?.toString().toUpperCase()} tier securely. No credit card required to start. You will only be billed if you decide to subscribe after your 7 days are over.
             </Text>
          </View>
        </View>

        <Button 
            title={loading ? "ACTIVATING..." : `START MY 7 FREE DAYS`} 
            onPress={handleStartTrial} 
            loading={loading}
            style={{ marginTop: SPACING.lg }}
        />
        <Text style={[styles.legal, { color: theme.textMuted }]}>
          By clicking Start Trial, you agree to our Terms of Service. You can change your plan at any time in the settings.
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
  planName: { fontSize: 24, letterSpacing: 1 },
  legal: { fontSize: 11, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 16 },
});
