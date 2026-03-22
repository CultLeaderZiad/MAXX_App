import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Athlete'];

export default function StatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(75);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState('Moderate');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const { goals, weak_spots } = require('expo-router').useLocalSearchParams();
  const { api } = require('../src/services/api');

  const handleContinue = async () => {
    try {
      const goalsData = await AsyncStorage.getItem('onboarding_goals');
      const weakSpotsData = await AsyncStorage.getItem('onboarding_weak_spots');
      
      const payload = {
        goals: JSON.parse(goalsData || '[]'),
        weak_spots: JSON.parse(weakSpotsData || '[]'),
        height_cm: heightUnit === 'cm' ? height : Math.round(height * 2.54),
        weight_kg: weightUnit === 'kg' ? weight : Math.round(weight / 2.205),
        sleep_hours: sleep,
        activity_level: activity,
      };

      await api.post('/api/user/onboarding', payload);
      router.push('/plans');
    } catch(e: any) {
      console.error(e);
      Alert.alert('Save Failed', 'Failed to save, try again');
    }
  };

  const Slider = require('react-native').View; // Placeholder, using text input + buttons

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="stats-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="stats-back-btn" style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? theme.gold : theme.border }]} />
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Quick Stats</Text>
        <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>We personalize your program from this.</Text>

        {/* Height */}
        <View style={styles.statSection}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>HEIGHT</Text>
            <View style={styles.unitToggle}>
              {(['cm', 'ft'] as const).map((u) => (
                <TouchableOpacity key={u} onPress={() => setHeightUnit(u)} testID={`height-unit-${u}`}
                  style={[styles.unitBtn, { backgroundColor: heightUnit === u ? theme.gold : theme.bgElevated }]}>
                  <Text style={[styles.unitText, { color: heightUnit === u ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.sliderRow}>
            <TouchableOpacity onPress={() => setHeight(Math.max(140, height - 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="minus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
              {heightUnit === 'cm' ? height : `${Math.floor(height / 30.48)}'${Math.round((height % 30.48) / 2.54)}"`}
            </Text>
            <Text style={[styles.statUnit, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{heightUnit}</Text>
            <TouchableOpacity onPress={() => setHeight(Math.min(220, height + 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="plus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight */}
        <View style={styles.statSection}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>WEIGHT</Text>
            <View style={styles.unitToggle}>
              {(['kg', 'lbs'] as const).map((u) => (
                <TouchableOpacity key={u} onPress={() => setWeightUnit(u)} testID={`weight-unit-${u}`}
                  style={[styles.unitBtn, { backgroundColor: weightUnit === u ? theme.gold : theme.bgElevated }]}>
                  <Text style={[styles.unitText, { color: weightUnit === u ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.sliderRow}>
            <TouchableOpacity onPress={() => setWeight(Math.max(40, weight - 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="minus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
              {weightUnit === 'kg' ? weight : Math.round(weight * 2.205)}
            </Text>
            <Text style={[styles.statUnit, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{weightUnit}</Text>
            <TouchableOpacity onPress={() => setWeight(Math.min(200, weight + 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="plus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.statSection}>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>SLEEP PER NIGHT</Text>
          <View style={styles.sliderRow}>
            <TouchableOpacity onPress={() => setSleep(Math.max(3, sleep - 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="minus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.statValue, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{sleep}</Text>
            <Text style={[styles.statUnit, { color: theme.textMuted, fontFamily: FONTS.regular }]}>hrs</Text>
            <TouchableOpacity onPress={() => setSleep(Math.min(12, sleep + 1))} style={[styles.adjBtn, { borderColor: theme.border }]}>
              <Feather name="plus" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.statSection}>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>ACTIVITY LEVEL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  testID={`activity-${level.toLowerCase()}`}
                  onPress={() => setActivity(level)}
                  style={[styles.chip, { backgroundColor: activity === level ? theme.gold : theme.bgElevated }]}
                >
                  <Text style={[styles.chipText, { color: activity === level ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.semiBold }]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
      <View style={styles.bottom}>
        <Button title="CONTINUE" onPress={handleContinue} testID="stats-continue-btn" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginLeft: 'auto', marginRight: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: SPACING.lg },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  statSection: { marginBottom: SPACING.xl },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  statLabel: { fontSize: 11, letterSpacing: 1.2 },
  unitToggle: { flexDirection: 'row', gap: 4 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  unitText: { fontSize: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  adjBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 36, minWidth: 60, textAlign: 'center' },
  statUnit: { fontSize: 14 },
  chipScroll: { marginTop: SPACING.sm },
  chipRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.pill },
  chipText: { fontSize: 13 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
