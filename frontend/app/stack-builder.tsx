import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOALS = ['Jawline', 'Testosterone', 'Energy', 'Sexual Health', 'Skin', 'Sleep', 'Focus', 'Recovery'];

export default function StackBuilder() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [stackResults, setStackResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanAnim = useRef(new Animated.Value(0)).current;

  const toggleGoal = (goal: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const generateStack = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert("Select Goals", "Please select at least one goal to generate your stack.");
      return;
    }

    setLoading(true);
    scanAnim.setValue(0);
    setScanProgress(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // AI Scanning Animation
    Animated.timing(scanAnim, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: true,
    }).start();

    // Visual progress percentage updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.03;
      if (progress >= 1) {
        setScanProgress(1);
        clearInterval(interval);
      } else {
        setScanProgress(progress);
      }
    }, 100);

    try {
      const { data, error } = await supabase
        .from('supplement_catalog')
        .select('*')
        .contains('goal_tags', selectedGoals)
        .order('sort_order', { ascending: true })
        .limit(4);

      if (error) throw error;

      setTimeout(() => {
        setStackResults(data || []);
        setShowResults(true);
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3500);
      
    } catch (err) {
       setLoading(false);
       clearInterval(interval);
       Alert.alert("Scan Interrupted", "Neural link failed. Re-attempting connection...");
    }
  };

  const saveStack = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('supplement_stacks').insert({
        user_id: user.id,
        stack_name: 'Alpha Bio-Protocol',
        supplements: stackResults,
        goals: selectedGoals
      });

      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("protocol Encrypted", "Biological stack saved to your central nervous system (Profile).");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Failed to save protocol. Re-calibrate scanner.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={theme.gold || '#C8A96E'} />
          <Text style={[styles.backText, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>BACK TO LIBRARY</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>GENOME ANALYZER</Text>
          <Text style={[styles.subtitle, { fontFamily: FONTS.regular, color: theme.textMuted }]}>Alpha Pharma biological vector classification system</Text>
        </View>

        {!loading && !showResults && (
            <View style={styles.goalsSection}>
            <Text style={[styles.sectionLabel, { fontFamily: FONTS.bold, color: theme.textMuted }]}>SELECT OPTIMIZATION VECTORS</Text>
            <View style={styles.goalsGrid}>
                {GOALS.map(goal => {
                const isSelected = selectedGoals.includes(goal);
                return (
                    <TouchableOpacity
                    key={goal}
                    onPress={() => toggleGoal(goal)}
                    style={[
                        styles.goalPill, 
                        { backgroundColor: theme.bgSurface, borderColor: isSelected ? (theme.gold || '#C8A96E') : theme.border },
                        isSelected && { shadowColor: theme.gold || '#C8A96E', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }
                    ]}
                    >
                    <Text style={[
                        styles.goalPillText, 
                        { color: isSelected ? (theme.gold || '#C8A96E') : theme.textMuted, fontFamily: isSelected ? FONTS.bold : FONTS.medium }
                    ]}>{goal.toUpperCase()}</Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            <TouchableOpacity 
                onPress={generateStack}
                style={styles.generateButton}
                activeOpacity={0.8}
            >
                <LinearGradient
                colors={loading ? ['#333', '#222'] : [(theme.gold || '#C8A96E'), '#8A6420']}
                style={styles.generateButtonGradient}
                >
                <Text style={[styles.generateButtonText, { fontFamily: FONTS.bold, color: '#000' }]}>⚡ START ANALYTIC SCAN</Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.scanOverlay}>
                <Animated.View style={[
                   styles.scanLine, 
                   { 
                     backgroundColor: theme.gold || '#C8A96E',
                     transform: [{
                       translateY: scanAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 200, 0]
                       })
                     }]
                   }
                ]} />
                <ActivityIndicator color={theme.gold || '#C8A96E'} size="large" />
                <Text style={[styles.loadingText, { fontFamily: FONTS.cinzelBold, color: theme.gold || '#C8A96E' }]}>SCANNING BIOMARKERS...</Text>
                <Text style={[styles.scanSubText, { color: theme.textMuted }]}>{Math.round(scanProgress * 100)}% SEQUENCING COMPLETE</Text>
            </View>
          </View>
        )}

        {showResults && !loading && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { fontFamily: FONTS.bold, color: theme.gold || '#C8A96E' }]}>OPTIMIZED BIO-STACK</Text>
              <View style={[styles.countBadge, { backgroundColor: theme.bgSurface }]}>
                <Text style={[styles.countText, { color: theme.textMuted, fontFamily: FONTS.bold }]}>{stackResults.length} VECTORS</Text>
              </View>
            </View>

            {stackResults.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push({
                   pathname: '/supplement-detail',
                   params: { supplement: JSON.stringify(item) }
                })}
                style={[styles.stackCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              >
                <LinearGradient
                  colors={[(theme.gold || '#C8A96E') + '22', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.stackIndex, { backgroundColor: theme.gold || '#C8A96E' }]}>
                  <Text style={[styles.indexText, { fontFamily: FONTS.bold }]}>{index + 1}</Text>
                </View>
                <View style={[styles.stackImageContainer, { backgroundColor: '#FFF' }]}>
                  <Image source={{ uri: item.image_url }} style={styles.stackImage} />
                </View>
                <View style={styles.stackInfo}>
                  <Text style={[styles.stackName, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{item.name}</Text>
                  <Text style={[styles.stackCategory, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>{item.category.toUpperCase()}</Text>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailCol}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>PROTOCOL</Text>
                      <Text style={[styles.detailValue, { color: theme.textSecondary, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{item.dose_text}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>PRIORITY</Text>
                      <Text style={[styles.detailValue, { 
                        color: index === 0 ? '#4CAF50' : index === 1 ? (theme.gold || '#C8A96E') : theme.textMuted,
                        fontFamily: FONTS.bold 
                      }]}>
                        {index === 0 ? 'CRITICAL' : index === 1 ? 'HIGH' : 'MEDIUM'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}

            <View style={[styles.disclaimerCard, { backgroundColor: 'rgba(200,169,110,0.05)', borderColor: (theme.gold || '#C8A96E') + '22' }]}>
              <Feather name="shield" size={24} color={theme.gold || '#C8A96E'} />
              <Text style={[styles.disclaimerText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                BIO-DISCLAIMER: Analysis calibrated for Alpha-Grade results. Consult biological counsel before execution of protocol.
              </Text>
            </View>

            <TouchableOpacity onPress={saveStack} style={[styles.saveButton, { borderColor: theme.border }]}>
               <LinearGradient
                  colors={[(theme.gold || '#C8A96E'), '#8A6420']}
                  style={[styles.saveButtonGradient, { borderRadius: 12 }]}
               >
                 <Text style={[styles.saveButtonText, { fontFamily: FONTS.bold, color: '#000' }]}>ENCRYPT & SAVE PROTOCOL</Text>
               </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowResults(false)} style={{ marginTop: 20, alignItems: 'center' }}>
               <Text style={{ color: theme.textMuted, fontFamily: FONTS.bold, fontSize: 12 }}>RE-CALIBRATE SCANNERS</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  backText: { fontSize: 11, marginLeft: 8, letterSpacing: 1 },
  header: { paddingHorizontal: 20, marginTop: 25 },
  title: { fontSize: 28, letterSpacing: 2 },
  subtitle: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  goalsSection: { paddingHorizontal: 20, marginTop: 30 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 20 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalPill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  goalPillText: { fontSize: 12, letterSpacing: 0.5 },
  generateButton: { marginTop: 40, height: 64, borderRadius: 18, overflow: 'hidden' },
  generateButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  generateButtonText: { fontSize: 15, letterSpacing: 1 },
  loadingContainer: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
  scanOverlay: { width: '100%', height: 200, backgroundColor: '#0A0A0A', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  scanLine: { position: 'absolute', width: '100%', height: 2, zIndex: 10, top: 0 },
  loadingText: { fontSize: 18, marginTop: 20, letterSpacing: 2 },
  scanSubText: { fontSize: 11, marginTop: 8, letterSpacing: 1 },
  resultsContainer: { marginTop: 40, paddingHorizontal: 20 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  resultsTitle: { fontSize: 13, letterSpacing: 2 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  countText: { fontSize: 10 },
  stackCard: { borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 16, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  stackIndex: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 10, left: 10, zIndex: 10 },
  indexText: { color: '#000', fontSize: 10 },
  stackImageContainer: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 8 },
  stackImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  stackInfo: { flex: 1, marginLeft: 16 },
  stackName: { fontSize: 15 },
  stackCategory: { fontSize: 9, marginTop: 2, letterSpacing: 1 },
  detailRow: { flexDirection: 'row', marginTop: 12, gap: 15 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 8, letterSpacing: 1, marginBottom: 4 },
  detailValue: { fontSize: 11 },
  disclaimerCard: { padding: 20, borderRadius: 18, marginTop: 20, flexDirection: 'row', gap: 15, borderWidth: 1 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18, opacity: 0.8 },
  saveButton: { marginTop: 30, height: 56, borderRadius: 12, borderBottomWidth: 1 },
  saveButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { fontSize: 14, letterSpacing: 1 },
});
