import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
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
  const [sosActive, setSosActive] = useState(true);
  const [sosCountdown, setSosCountdown] = useState(30);
  const sosPulse = useRef(new Animated.Value(1)).current;

  // SOS Pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation logic
  useEffect(() => {
    if (sosActive) return;
    if (phaseIdx === 0) {
      // Inhale
      Animated.timing(scaleAnim, { toValue: 1.5, duration: 4000, useNativeDriver: true, easing: Easing.linear }).start();
    } else if (phaseIdx === 2) {
      // Exhale
      Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.linear }).start();
    }
  }, [phaseIdx, sosActive]);

  const anyChecked = tasks.some(t => t.checked);

  useEffect(() => {
    if (sosActive) return;
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
  }, [sosActive]);

  const startSOS = () => {
    console.log('[AUDIO] Playing MAXX Doctrine (Level 10 Intensity)...');
    let count = 30;
    const cd = setInterval(() => {
      count--;
      setSosCountdown(count);
      if (count <= 0) {
        clearInterval(cd);
        setSosActive(false);
      }
    }, 1000);
  };

  const toggleTask = (id: number) => {
    setTasks((prev: any[]) => prev.map((t: any) => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="emergency-screen">
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>EMERGENCY MODE SCREEN</Text>
      </View>

      {sosActive ? (
        <View style={[styles.sosContainer, { backgroundColor: '#000' }]}>
           <Text style={[styles.sosTitle, { color: '#E74C3C', fontFamily: FONTS.cinzelBold }]}>DONT GIVE UP</Text>
           <Text style={[styles.sosSub, { color: '#FFF' }]}>The pain of discipline is better than the pain of regret.</Text>
           
           <Animated.View style={{ transform: [{ scale: sosPulse }], marginTop: 60 }}>
              <TouchableOpacity onPress={startSOS} style={styles.sosCircle}>
                 <Text style={{ color: '#FFF', fontFamily: FONTS.bold, fontSize: 32 }}>{sosCountdown === 30 ? 'HELP' : sosCountdown}</Text>
              </TouchableOpacity>
           </Animated.View>
           
           <Text style={{ color: '#E74C3C', marginTop: 40, fontSize: 12, letterSpacing: 2 }}>HOLD THE LINE</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>EMERGENCY MODE</Text>
          <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Breathe. You've got this. Follow the steps.</Text>
  
          {/* Breathing Circle */}
          <View style={styles.breathingWrap}>
            <Animated.View style={[styles.breathingCircle, { borderColor: theme.gold + '33', transform: [{ scale: scaleAnim }] }]}>
               <View style={[styles.breathingInner]}>
                  <Text style={[styles.phaseText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>{BREATH_PHASES[phaseIdx]}</Text>
                  <Text style={[styles.timerText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{timer}s</Text>
               </View>
            </Animated.View>
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
              title="I Survived (Close)"
              disabled={!anyChecked}
              onPress={() => router.back()}
              testID="emergency-close-btn"
            />
            <Text style={[styles.helpText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Must complete 1 physical task to exit</Text>
          </View>
        </View>
      )}
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
  breathingInner: { alignItems: 'center', transform: [{ scale: 1 }] },
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
  sosContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  sosTitle: { fontSize: 42, textAlign: 'center' },
  sosSub: { fontSize: 16, textAlign: 'center', marginTop: 20, opacity: 0.8 },
  sosCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#E74C3C', shadowOpacity: 0.8, shadowRadius: 20 },
});
