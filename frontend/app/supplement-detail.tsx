import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SupplementDetail() {
  const router = useRouter();
  const { theme } = useTheme();
  const { supplement: supplementJson } = useLocalSearchParams();
  const supplement = supplementJson ? JSON.parse(supplementJson as string) : null;
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  if (!supplement) return null;

  const handleAddToStack = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Added to Stack", `${supplement.name} has been added to your personalized alpha stack.`);
  };

  const planRequired = supplement.required_plan || 'trial';
  const hasAccess = profile?.plan === 'sigma' || 
                    (profile?.plan === 'alpha' && ['trial', 'grind', 'alpha'].includes(planRequired)) ||
                    (profile?.plan === 'grind' && ['trial', 'grind'].includes(planRequired)) ||
                    (profile?.plan === 'trial' && planRequired === 'trial');

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={[(theme.gold || '#C8A96E') + '22', theme.bgPrimary]}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.heroButtonActive, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Feather name="chevron-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={[
              styles.planBadgeLarge,
              { backgroundColor: planRequired === 'alpha' ? 'rgba(74, 55, 33, 0.8)' : planRequired === 'sigma' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(30, 70, 32, 0.8)' }
            ]}>
              <Text style={[styles.planBadgeTextLarge, { fontFamily: FONTS.bold }]}>{planRequired.toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.heroImageContainer, { backgroundColor: '#FFF', shadowColor: theme.gold || '#C8A96E' }]}>
            <Image source={{ uri: supplement.image_url }} style={styles.heroImage} />
          </View>

          <Text style={[styles.brandAttribution, { fontFamily: FONTS.regular, color: theme.textMuted }]}>BIO-AUTHENTICATED BY: ALPHA PHARMA</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>{supplement.name}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <Feather key={i} name="star" size={14} color={theme.gold || '#C8A96E'} />
              ))}
              <Text style={[styles.ratingText, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>4.9</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            <View style={[styles.categoryPill, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}><Text style={[styles.categoryPillText, { color: theme.textMuted, fontFamily: FONTS.bold }]}>{supplement.category.toUpperCase()}</Text></View>
            <View style={[styles.categoryPill, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}><Text style={[styles.categoryPillText, { color: theme.textMuted, fontFamily: FONTS.bold }]}>SCIENCE-BACKED</Text></View>
            <View style={[styles.categoryPill, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}><Text style={[styles.categoryPillText, { color: theme.textMuted, fontFamily: FONTS.bold }]}>GENOME-STABLE</Text></View>
          </ScrollView>

          {/* WHY Section */}
          <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, color: theme.textPrimary }]}>BIO-MECHANISMS</Text>
          <View style={[styles.infoBox, { backgroundColor: theme.bgSurface }]}>
            <View style={styles.benefitRow}>
              <View style={[styles.bullet, { backgroundColor: theme.gold || '#C8A96E' }]} />
              <Text style={[styles.benefitText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.bold }}>{supplement.category} synthesis</Text> — Primary cofactor in Leydig cell production. Direct impact on androgenic results.</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={[styles.bullet, { backgroundColor: theme.gold || '#C8A96E' }]} />
              <Text style={[styles.benefitText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.bold }}>Enzyme inhibition</Text> — Regulates the conversion of free testosterone to dihydrotestosterone.</Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={[styles.bullet, { backgroundColor: theme.gold || '#C8A96E' }]} />
              <Text style={[styles.benefitText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.bold }}>Structural integrity</Text> — Enhances collagen cross-linking in high-stress biological tissues.</Text>
            </View>
          </View>

          {/* Science Card */}
          <View style={[styles.scienceCard, { backgroundColor: 'rgba(200,169,110,0.03)', borderColor: (theme.gold || '#C8A96E') + '22' }]}>
            <View style={styles.scienceLabelRow}>
              <Feather name="book-open" size={16} color={theme.gold || '#C8A96E'} />
              <Text style={[styles.scienceLabel, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>CLINICAL DATA</Text>
            </View>
            <Text style={[styles.scienceText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{supplement.science_desc}</Text>
            <Text style={[styles.studyReference, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Ref: Alpha Pharma Bio-Logistics Index (2025)</Text>
          </View>

          {/* Dosage Protocol */}
          <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, color: theme.textPrimary }]}>ADMINISTRATION PROTOCOL</Text>
          <View style={[styles.protocolCard, { backgroundColor: theme.bgSurface }]}>
            <View style={styles.protocolRow}>
              <Text style={[styles.protocolLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>DAILY DOSE</Text>
              <Text style={[styles.protocolValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{supplement.dose_text}</Text>
            </View>
            <View style={styles.protocolRow}>
              <Text style={[styles.protocolLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>BIO-AVAILABILITY</Text>
              <Text style={[styles.protocolValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>PICOLINATE / GLYCINATE</Text>
            </View>
            <View style={styles.protocolRow}>
              <Text style={[styles.protocolLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>TIMING</Text>
              <Text style={[styles.protocolValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{supplement.best_time.toUpperCase()}</Text>
            </View>
            <View style={[styles.warningRow, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
              <Feather name="alert-triangle" size={14} color="#E74C3C" />
              <Text style={[styles.warningText, { color: '#E74C3C', fontFamily: FONTS.semiBold }]}>Do not exceed established clinical maximums.</Text>
            </View>
          </View>

          {/* Where to Buy */}
          <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, color: theme.textPrimary }]}>ACQUISITION NODES</Text>
          <View style={styles.buyGrid}>
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://gorillamind.com')}
              style={[styles.buyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            >
              <Text style={[styles.buyName, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>Gorilla Mind</Text>
              <Text style={[styles.buyDesc, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Optimal Ratios</Text>
              <Text style={[styles.buyLink, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>ACCESS →</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://thorne.com')}
              style={[styles.buyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            >
              <Text style={[styles.buyName, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>Thorne</Text>
              <Text style={[styles.buyDesc, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Clinical Grade</Text>
              <Text style={[styles.buyLink, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>ACCESS →</Text>
            </TouchableOpacity>
          </View>

          {!hasAccess && (
            <View style={[styles.lockOverlay, { backgroundColor: 'rgba(10,10,10,0.95)' }]}>
              <Feather name="lock" size={40} color={theme.gold || '#C8A96E'} />
              <Text style={[styles.lockText, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>REQUIRES {planRequired.toUpperCase()} CLEARANCE</Text>
              <TouchableOpacity onPress={() => router.push('/plans')} style={[styles.upgradeButton, { backgroundColor: theme.gold || '#C8A96E' }]}>
                <Text style={[styles.upgradeButtonText, { fontFamily: FONTS.bold, color: '#000' }]}>UPGRADE PROFILE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bgPrimary, paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity 
          onPress={handleAddToStack}
          style={styles.mainButton}
          disabled={!hasAccess}
        >
          <LinearGradient
            colors={hasAccess ? [(theme.gold || '#C8A96E'), '#8A6420'] : ['#333', '#222']}
            style={styles.mainButtonGradient}
          >
            <Text style={[styles.mainButtonText, { fontFamily: FONTS.bold, color: hasAccess ? '#000' : '#666' }]}>+ ADD TO BIO-STACK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: '100%', height: 380, alignItems: 'center' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, zIndex: 10 },
  heroButtonActive: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  heroImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  heroImage: { width: 140, height: 140, resizeMode: 'contain' },
  brandAttribution: { fontSize: 10, marginTop: 40, letterSpacing: 1 },
  planBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  planBadgeTextLarge: { color: '#FFF', fontSize: 10 },
  content: { paddingHorizontal: 20, paddingTop: 30 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, marginLeft: 4 },
  pillRow: { marginTop: 15, marginBottom: 25 },
  categoryPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  categoryPillText: { fontSize: 9, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 12, letterSpacing: 2, marginTop: 10, marginBottom: 15 },
  infoBox: { borderRadius: 16, padding: 18 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 7, marginRight: 12 },
  benefitText: { flex: 1, fontSize: 13, lineHeight: 18 },
  scienceCard: { borderRadius: 16, padding: 20, marginTop: 15, borderWidth: 1 },
  scienceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  scienceLabel: { fontSize: 10, letterSpacing: 1 },
  scienceText: { fontSize: 13, lineHeight: 20, opacity: 0.9 },
  studyReference: { fontSize: 9, marginTop: 15, opacity: 0.6 },
  protocolCard: { borderRadius: 16, padding: 20 },
  protocolRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  protocolLabel: { fontSize: 10, letterSpacing: 0.5 },
  protocolValue: { fontSize: 12 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, padding: 12, borderRadius: 8 },
  warningText: { fontSize: 11, flex: 1 },
  buyGrid: { flexDirection: 'row', gap: 12, marginTop: 5 },
  buyCard: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1 },
  buyName: { fontSize: 13 },
  buyDesc: { fontSize: 10, marginTop: 4 },
  buyLink: { fontSize: 10, marginTop: 12 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 10 },
  mainButton: { height: 56, borderRadius: 16, overflow: 'hidden' },
  mainButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainButtonText: { fontSize: 15, letterSpacing: 1 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', borderRadius: 20, zIndex: 100 },
  lockText: { fontSize: 14, marginTop: 15, letterSpacing: 1 },
  upgradeButton: { marginTop: 25, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  upgradeButtonText: { fontSize: 14, letterSpacing: 1 },
});
