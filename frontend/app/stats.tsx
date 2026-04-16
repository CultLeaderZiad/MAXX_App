import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../src/constants/theme';

const GOALS = [
  'Build Muscle', 'Lose Fat', 'Improve Jawline', 'Better Posture',
  'Increase Confidence', 'Social Skills', 'Mental Toughness', 'Bone Structure',
];

const WEAK_SPOTS = [
  'Jawline', 'Neck', 'Shoulders', 'Chest', 'Core',
  'Posture', 'Skin', 'Confidence', 'Frame', 'Voice',
];

const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph'];
const PLAY_TYPES = ['The Grinder', 'The Visionary', 'The Warrior', 'The Sigma'];

export default function StatsScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [playType, setPlayType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          goals,
          weak_spots: weakSpots,
          body_type: bodyType,
          play_type: playType,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', 'Could not save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'What are your goals?',
      sub: 'Select all that apply',
      content: (
        <View style={styles.chips}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g}
              onPress={() => toggle(goals, g, setGoals)}
              style={[styles.chip, goals.includes(g) && styles.chipActive]}
            >
              <Text style={[styles.chipText, goals.includes(g) && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
      valid: goals.length > 0,
    },
    {
      title: 'Your weak spots?',
      sub: 'What do you want to improve most?',
      content: (
        <View style={styles.chips}>
          {WEAK_SPOTS.map(w => (
            <TouchableOpacity
              key={w}
              onPress={() => toggle(weakSpots, w, setWeakSpots)}
              style={[styles.chip, weakSpots.includes(w) && styles.chipActive]}
            >
              <Text style={[styles.chipText, weakSpots.includes(w) && styles.chipTextActive]}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
      valid: weakSpots.length > 0,
    },
    {
      title: 'Body Type',
      sub: 'Which best describes your natural build?',
      content: (
        <View style={styles.chips}>
          {BODY_TYPES.map(b => (
            <TouchableOpacity
              key={b}
              onPress={() => setBodyType(b)}
              style={[styles.chip, bodyType === b && styles.chipActive]}
            >
              <Text style={[styles.chipText, bodyType === b && styles.chipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
      valid: true,
    },
    {
      title: 'Your Archetype',
      sub: 'How do you operate?',
      content: (
        <View style={{ gap: SPACING.md }}>
          {PLAY_TYPES.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPlayType(p)}
              style={[styles.archetypeCard, playType === p && { borderColor: GOLD, backgroundColor: GOLD + '15' }]}
            >
              <Text style={[styles.archetypeName, { color: playType === p ? GOLD : '#FFFFFF' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
      valid: true,
    },
  ];

  const current = steps[step];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>STEP {step + 1} OF {steps.length}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.sub}>{current.sub}</Text>

        <View style={{ marginTop: SPACING.lg }}>{current.content}</View>

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < steps.length - 1 ? (
            <TouchableOpacity
              onPress={() => setStep(s => s + 1)}
              style={[styles.nextBtn, { opacity: current.valid ? 1 : 0.4 }]}
              disabled={!current.valid}
            >
              <Text style={styles.nextText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              disabled={saving}
              style={[styles.nextBtn, { opacity: saving ? 0.7 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.nextText}>ENTER THE ARENA</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  dots: { flexDirection: 'row', gap: 8, marginTop: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A2A2A' },
  dotActive: { backgroundColor: GOLD, width: 24 },
  dotDone: { backgroundColor: GOLD + '60' },
  stepLabel: { color: '#606060', fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1.5, marginTop: SPACING.xl },
  title: { color: '#FFFFFF', fontFamily: FONTS.cinzelBold, fontSize: 28, marginTop: 8, lineHeight: 38 },
  sub: { color: '#606060', fontFamily: FONTS.regular, fontSize: 14, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#111111',
  },
  chipActive: { borderColor: GOLD, backgroundColor: GOLD + '20' },
  chipText: { color: '#B0B0B0', fontFamily: FONTS.semiBold, fontSize: 13 },
  chipTextActive: { color: GOLD },
  archetypeCard: {
    padding: SPACING.lg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#111111',
  },
  archetypeName: { fontFamily: FONTS.cinzelBold, fontSize: 18 },
  nav: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.md, marginTop: SPACING.xxl },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: 16 },
  backText: { color: '#666', fontFamily: FONTS.semiBold, fontSize: 14 },
  nextBtn: { backgroundColor: GOLD, paddingHorizontal: SPACING.xl, paddingVertical: 16, borderRadius: RADIUS.md },
  nextText: { color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1 },
});
