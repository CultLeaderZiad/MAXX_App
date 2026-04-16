import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../lib/safeBack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiCall } from '../lib/api';
import { GeminiKeyService } from '../lib/geminiKey';
import { GeminiKeyModal } from '../src/components/GeminiKeyModal';
import { FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOALS = ['Jawline', 'Testosterone', 'Energy', 'Sexual Health', 'Skin', 'Sleep', 'Focus', 'Recovery'];

export default function StackBuilder() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [geminiKey, setGeminiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    GeminiKeyService.get().then(k => k && setGeminiKey(k));
    // Pre-select goals from user profile
    if (profile?.goals?.length) setSelectedGoals(profile.goals.slice(0, 3));
  }, []);

  const toggleGoal = (goal: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const generateStack = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert('Select Goals', 'Choose at least one goal to generate your stack.');
      return;
    }

    if (!geminiKey) {
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setAiResult(null);
    scanAnim.setValue(0);
    setScanProgress(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Scanning animation
    Animated.timing(scanAnim, { toValue: 1, duration: 3500, useNativeDriver: true }).start();
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.028;
      if (progress >= 1) { setScanProgress(1); clearInterval(interval); }
      else setScanProgress(progress);
    }, 100);

    try {
      // ── REAL AI call to backend ──────────────────────────────────────────
      const result = await apiCall('/api/supplement-stack', 'POST', {
        goals: selectedGoals,
        current_plan: profile?.plan || 'trial',
        weak_spots: profile?.weak_spots || [],
        height_cm: profile?.height_cm || null,
        weight_kg: profile?.weight_kg || null,
        api_key: geminiKey,
      });

      clearInterval(interval);
      setScanProgress(1);

      setTimeout(() => {
        setAiResult(result);
        setShowResults(true);
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setLoading(false);
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('api key') || errMsg.includes('no_api_key')) {
        await GeminiKeyService.clear();
        setGeminiKey(null);
        setShowKeyModal(true);
      } else {
        Alert.alert('AI Unavailable', 'Could not generate stack. Check your connection and try again.');
      }
    }
  };

  const saveStack = async () => {
    if (!user || !aiResult) return;
    try {
      await supabase.from('supplement_stacks').insert({
        user_id: user.id,
        stack_name: aiResult.stack_name || 'Alpha Bio-Protocol',
        stack_data: aiResult,
        goals: selectedGoals,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Stack Saved', 'Your personalized stack is saved to your profile.');
      safeBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save. Try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'essential') return '#E74C3C';
    if (priority === 'recommended') return '#F39C12';
    return '#27AE60';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Nav */}
        <TouchableOpacity onPress={() => safeBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={18} color={theme.textSecondary} />
          <Text style={[styles.backText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            GENOME ANALYZER
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            AI-personalized supplement protocol based on your bio-markers
          </Text>
          {/* AI key status pill */}
          <TouchableOpacity
            onPress={() => setShowKeyModal(true)}
            style={[styles.keyStatusPill, {
              backgroundColor: geminiKey ? theme.gold + '22' : theme.bgElevated,
              borderColor: geminiKey ? theme.gold : theme.border,
            }]}
          >
            <Feather name="zap" size={11} color={geminiKey ? theme.gold : theme.textMuted} />
            <Text style={[styles.keyStatusText, {
              color: geminiKey ? theme.gold : theme.textMuted,
              fontFamily: FONTS.semiBold,
            }]}>
              {geminiKey ? 'AI Ready' : 'Add Gemini Key'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Goal selection */}
        {!loading && !showResults && (
          <View style={styles.goalsSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: FONTS.bold }]}>
              SELECT OPTIMIZATION VECTORS
            </Text>
            <View style={styles.goalsGrid}>
              {GOALS.map(goal => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => toggleGoal(goal)}
                    style={[
                      styles.goalPill,
                      {
                        backgroundColor: isSelected ? theme.gold + '22' : theme.bgSurface,
                        borderColor: isSelected ? theme.gold : theme.border,
                        shadowColor: isSelected ? theme.gold : 'transparent',
                        shadowOpacity: isSelected ? 0.2 : 0,
                        shadowRadius: 10,
                        elevation: isSelected ? 4 : 0,
                      },
                    ]}
                  >
                    <Text style={[styles.goalPillText, {
                      color: isSelected ? theme.gold : theme.textSecondary,
                      fontFamily: isSelected ? FONTS.bold : FONTS.regular,
                    }]}>
                      {goal.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Generate button */}
            <TouchableOpacity
              onPress={generateStack}
              style={[styles.generateButton, { opacity: selectedGoals.length === 0 ? 0.5 : 1 }]}
            >
              <LinearGradient
                colors={['#C8A96E', '#A0824E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                <Feather name="cpu" size={18} color="#000" style={{ marginRight: 10 }} />
                <Text style={[styles.generateButtonText, { fontFamily: FONTS.bold, color: '#000' }]}>
                  GENERATE MY STACK (AI)
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading / scanning */}
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={[styles.scanOverlay, { borderColor: theme.border }]}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: theme.gold,
                    transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 200] }) }],
                  },
                ]}
              />
              <Feather name="cpu" size={40} color={theme.gold} />
            </View>
            <Text style={[styles.loadingText, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>
              SCANNING BIOMARKERS...
            </Text>
            <Text style={[styles.scanSubText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
              {Math.round(scanProgress * 100)}% — AI generating your protocol
            </Text>
          </View>
        )}

        {/* Results */}
        {showResults && aiResult && !loading && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                {aiResult.stack_name || 'OPTIMIZED BIO-STACK'}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: theme.gold + '22' }]}>
                <Text style={[styles.countText, { color: theme.gold, fontFamily: FONTS.bold }]}>
                  {aiResult.supplements?.length || 0} VECTORS
                </Text>
              </View>
            </View>

            {/* Rationale */}
            {aiResult.stack_rationale && (
              <View style={[styles.rationaleCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <Text style={[{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: FONTS.regular }]}>
                  {aiResult.stack_rationale}
                </Text>
              </View>
            )}

            {/* Supplement cards */}
            {(aiResult.supplements || []).map((item: any, index: number) => (
              <View
                key={index}
                style={[styles.stackCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              >
                <View style={[styles.stackIndex, { backgroundColor: theme.gold }]}>
                  <Text style={{ color: '#000', fontSize: 10, fontFamily: FONTS.bold }}>{index + 1}</Text>
                </View>
                <View style={styles.stackInfo}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.stackName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
                      {item.name || item.supplement_key}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || 'essential') + '22' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(item.priority || 'essential'), fontFamily: FONTS.bold }]}>
                        {(item.priority || 'ESSENTIAL').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.stackReason, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                    {item.reason}
                  </Text>
                  {item.timing_note && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <Feather name="clock" size={11} color={theme.gold} />
                      <Text style={[{ color: theme.gold, fontSize: 11, fontFamily: FONTS.semiBold }]}>
                        {item.timing_note}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Protocols */}
            {(aiResult.morning_protocol || aiResult.evening_protocol) && (
              <View style={[styles.protocolCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold + '44' }]}>
                <Text style={[{ color: theme.gold, fontSize: 11, letterSpacing: 2, fontFamily: FONTS.bold, marginBottom: 12 }]}>
                  DAILY PROTOCOL
                </Text>
                {aiResult.morning_protocol && (
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <Text style={{ color: theme.gold, fontSize: 12, fontFamily: FONTS.bold }}>AM →</Text>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, flex: 1, fontFamily: FONTS.regular, lineHeight: 20 }}>
                      {aiResult.morning_protocol}
                    </Text>
                  </View>
                )}
                {aiResult.evening_protocol && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontFamily: FONTS.bold }}>PM →</Text>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, flex: 1, fontFamily: FONTS.regular, lineHeight: 20 }}>
                      {aiResult.evening_protocol}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Disclaimer */}
            <View style={[styles.disclaimerCard, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
              <Feather name="info" size={14} color={theme.textMuted} />
              <Text style={[styles.disclaimerText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                {aiResult.disclaimer || 'General wellness information. Consult a healthcare professional before starting any supplement protocol.'}
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity onPress={saveStack} style={[styles.saveButton, { backgroundColor: theme.gold }]}>
              <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1 }}>
                SAVE PROTOCOL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowResults(false); setAiResult(null); }}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 13 }}>Re-calibrate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Gemini Key Modal */}
      <GeminiKeyModal
        visible={showKeyModal}
        onSuccess={key => { setGeminiKey(key); setShowKeyModal(false); }}
        onDismiss={() => setShowKeyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  backText: { fontSize: 13, marginLeft: 8 },
  header: { paddingHorizontal: 20, marginTop: 20 },
  title: { fontSize: 26, letterSpacing: 2 },
  subtitle: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  keyStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
    marginTop: 12, alignSelf: 'flex-start',
  },
  keyStatusText: { fontSize: 11 },
  goalsSection: { paddingHorizontal: 20, marginTop: 28 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 18 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalPill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  goalPillText: { fontSize: 12, letterSpacing: 0.5 },
  generateButton: { marginTop: 36, height: 64, borderRadius: 18, overflow: 'hidden' },
  generateButtonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  generateButtonText: { fontSize: 14, letterSpacing: 1 },
  loadingContainer: { marginTop: 50, alignItems: 'center', paddingHorizontal: 40 },
  scanOverlay: {
    width: 200, height: 200, borderRadius: 100,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', borderWidth: 1, marginBottom: 24,
  },
  scanLine: { position: 'absolute', width: '100%', height: 2, zIndex: 10 },
  loadingText: { fontSize: 16, letterSpacing: 2 },
  scanSubText: { fontSize: 12, marginTop: 10 },
  resultsContainer: { marginTop: 30, paddingHorizontal: 20 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultsTitle: { fontSize: 18, letterSpacing: 1 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  countText: { fontSize: 10 },
  rationaleCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  stackCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden',
  },
  stackIndex: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 2,
  },
  stackInfo: { flex: 1 },
  stackName: { fontSize: 15 },
  stackReason: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 9 },
  protocolCard: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 16, marginTop: 4 },
  disclaimerCard: {
    padding: 16, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', gap: 12, marginBottom: 20,
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  saveButton: {
    height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
});
