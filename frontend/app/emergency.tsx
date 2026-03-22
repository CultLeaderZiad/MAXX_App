import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

const PHYSICAL_TASKS = [
  { id: 'pushups', label: '20 push-ups — do them now' },
  { id: 'shower', label: 'Cold shower — minimum 2 minutes' },
  { id: 'walk', label: 'Walk outside — minimum 10 min' },
];

export default function EmergencyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCycle, setBreathCycle] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const breathScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (step !== 1) return;
    let cycle = 0;
    const runCycle = () => {
      // Inhale
      setBreathPhase('inhale');
      Animated.timing(breathScale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start(() => {
        // Hold
        setBreathPhase('hold');
        setTimeout(() => {
          // Exhale
          setBreathPhase('exhale');
          Animated.timing(breathScale, { toValue: 0.5, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start(() => {
            cycle++;
            setBreathCycle(cycle);
            if (cycle < 3) runCycle();
            else setStep(2);
          });
        }, 4000);
      });
    };
    runCycle();
  }, [step]);

  const toggleTask = (id: string) => {
    setCheckedTasks((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const canClose = checkedTasks.length >= 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="emergency-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>EMERGENCY MODE</Text>
      </View>

      {step === 1 ? (
        <View style={styles.breathSection}>
          <Text style={[styles.instruction, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Breathe. You've got this. Follow the steps.
          </Text>
          <View style={styles.breathWrap}>
            <Animated.View style={[styles.breathCircle, { backgroundColor: theme.gold, opacity: 0.2, transform: [{ scale: breathScale }] }]} />
            <Animated.View style={[styles.breathCircleInner, { borderColor: theme.gold, transform: [{ scale: breathScale }] }]} />
            <Text style={[styles.breathText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
              {breathPhase === 'inhale' ? 'Inhale 4s' : breathPhase === 'hold' ? 'Hold 4s' : 'Exhale 4s'}
            </Text>
          </View>
          <Text style={[styles.cycleText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
            Cycle {breathCycle + 1} of 3 · Repeat 3x
          </Text>
        </View>
      ) : (
        <View style={styles.taskSection}>
          <Text style={[styles.stepTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
            STEP 2 — PHYSICAL ACTION
          </Text>
          <Text style={[styles.taskInstruction, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Must complete 1 task to close
          </Text>
          {PHYSICAL_TASKS.map((task) => {
            const isChecked = checkedTasks.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                testID={`emergency-task-${task.id}`}
                onPress={() => toggleTask(task.id)}
                style={[styles.taskRow, { backgroundColor: isChecked ? 'rgba(200,169,110,0.08)' : theme.bgSurface, borderColor: isChecked ? theme.borderActive : theme.border }]}
              >
                <View style={[styles.taskCheck, { borderColor: isChecked ? theme.gold : theme.border, backgroundColor: isChecked ? theme.gold : 'transparent' }]}>
                  {isChecked && <Feather name="check" size={14} color="#0A0A0A" />}
                </View>
                <Text style={[styles.taskLabel, { color: isChecked ? theme.gold : theme.textPrimary, fontFamily: FONTS.medium }]}>{task.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.bottom}>
        <Button
          title="Close Emergency Mode"
          variant={canClose ? 'primary' : 'secondary'}
          disabled={!canClose && step === 2}
          onPress={() => router.back()}
          testID="emergency-close-btn"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: SPACING.lg },
  title: { fontSize: 24, letterSpacing: 2 },
  breathSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  instruction: { fontSize: 16, textAlign: 'center', paddingHorizontal: SPACING.xl },
  breathWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  breathCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  breathCircleInner: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2 },
  breathText: { fontSize: 18, letterSpacing: 1 },
  cycleText: { fontSize: 13 },
  taskSection: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  stepTitle: { fontSize: 16, letterSpacing: 1 },
  taskInstruction: { fontSize: 13, marginBottom: SPACING.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  taskCheck: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskLabel: { fontSize: 15, flex: 1 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
