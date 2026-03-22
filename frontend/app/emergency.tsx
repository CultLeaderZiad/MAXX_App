import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS, SPACING } from '../src/constants/theme';
import { Button } from '../src/components/Button';

const BREATH_PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];

export default function EmergencyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timer, setTimer] = useState(4);
  const [tasks, setTasks] = useState([
    { id: 1, text: '20 push-ups — do them now', checked: false },
    { id: 2, text: 'Cold shower — minimum 2 minutes', checked: false },
    { id: 3, text: 'Walk outside — minimum 10 min', checked: false },
  ]);

  const anyChecked = tasks.some(t => t.checked);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t: number) => {
        if (t === 1) {
          setPhaseIdx((p: number) => (p + 1) % 4);
          return 4;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTask = (id: number) => {
    setTasks((prev: any[]) => prev.map((t: any) => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="emergency-screen">
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>EMERGENCY MODE SCREEN</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>EMERGENCY MODE</Text>
        <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Breathe. You've got this. Follow the steps.</Text>

        {/* Breathing Circle */}
        <View style={styles.breathingWrap}>
          <View style={[styles.breathingCircle, { borderColor: theme.gold + '33' }]}>
             <View style={[styles.breathingInner]}>
                <Text style={[styles.phaseText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>{BREATH_PHASES[phaseIdx]}</Text>
                <Text style={[styles.timerText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{timer}s</Text>
             </View>
          </View>
          <Text style={[styles.breathGuide, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Hold 4s · Exhale 4s · Repeat 3x</Text>
        </View>

        {/* Physical Actions */}
        <View style={styles.actionSection}>
          <Text style={[styles.stepLabel, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>STEP 2 — PHYSICAL ACTION (CHECK 1+)</Text>
          {tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              onPress={() => toggleTask(task.id)}
              style={[styles.taskBtn, { backgroundColor: theme.bgSurface, borderColor: task.checked ? theme.gold : theme.border }]}
            >
              <View style={[styles.checkbox, { backgroundColor: task.checked ? theme.gold : 'transparent', borderColor: task.checked ? theme.gold : theme.border }]}>
                {task.checked && <Feather name="check" size={12} color="#0A0A0A" />}
              </View>
              <Text style={[styles.taskText, { color: theme.textPrimary, fontFamily: FONTS.medium }]}>{task.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title="Close Emergency Mode"
            disabled={!anyChecked}
            onPress={() => router.back()}
            testID="emergency-close-btn"
          />
          <Text style={[styles.helpText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Must complete 1 task to close</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: SPACING.md },
  headerLabel: { fontSize: 11, letterSpacing: 1.2 },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  title: { fontSize: 24, textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  breathingWrap: { alignItems: 'center', marginVertical: SPACING.xxl },
  breathingCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  breathingInner: { alignItems: 'center' },
  phaseText: { fontSize: 16 },
  timerText: { fontSize: 20, marginTop: 4 },
  breathGuide: { fontSize: 11, marginTop: SPACING.lg },
  actionSection: { gap: SPACING.md },
  stepLabel: { fontSize: 11, letterSpacing: 1, marginBottom: SPACING.sm },
  taskBtn: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 14, borderWidth: 1, gap: SPACING.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  taskText: { fontSize: 14, flex: 1 },
  footer: { marginTop: 'auto', paddingBottom: SPACING.xl, alignItems: 'center', gap: 8 },
  helpText: { fontSize: 11 },
});
