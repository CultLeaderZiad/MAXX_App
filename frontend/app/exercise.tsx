import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { XPToast } from '../src/components/XPToast';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

export default function ExerciseScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ name: string; sets: string; hold: string; rest: string; xp: string }>();

  const totalSets = parseInt(params.sets || '3');
  const holdTime = parseInt(params.hold || '60');
  const restTime = parseInt(params.rest || '30');
  const xpReward = parseInt(params.xp || '40');

  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(holdTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showXP, setShowXP] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      if (isResting) {
        setIsResting(false);
        if (currentSet < totalSets) {
          setCurrentSet(currentSet + 1);
          setTimeLeft(holdTime);
        } else {
          setCompleted(true);
          setIsRunning(false);
          setShowXP(true);
        }
      } else {
        if (currentSet < totalSets) {
          setIsResting(true);
          setTimeLeft(restTime);
        } else {
          setCompleted(true);
          setIsRunning(false);
          setShowXP(true);
        }
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isRunning, timeLeft, isResting, currentSet]);

  useEffect(() => {
    const total = isResting ? restTime : holdTime;
    Animated.timing(progress, { toValue: timeLeft / total, duration: 300, useNativeDriver: false }).start();
  }, [timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleReset = useCallback(() => {
    setCurrentSet(1);
    setTimeLeft(holdTime);
    setIsRunning(false);
    setIsResting(false);
    setCompleted(false);
  }, [holdTime]);

  const ringSize = 200;
  const circumference = ringSize * Math.PI;
  const strokeDashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="exercise-screen">
      <XPToast amount={xpReward} visible={showXP} onDone={() => setShowXP(false)} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="exercise-back-btn" style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>Exercise</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.exName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{params.name || 'Exercise'}</Text>
        <Text style={[styles.exDesc, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          {isResting ? 'Rest — breathe and recover' : 'Maintain proper form throughout'}
        </Text>

        {/* Timer Ring */}
        <View style={styles.timerWrap}>
          <View style={[styles.timerRing, { borderColor: theme.bgElevated }]}>
            <Animated.View style={[styles.timerFill, {
              borderColor: theme.gold,
              borderTopColor: isResting ? theme.blue : theme.gold,
              transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '180deg'] }) }],
            }]} />
            <View style={styles.timerInner}>
              <Text style={[styles.timerText, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{formatTime(timeLeft)}</Text>
              <Text style={[styles.timerLabel, { color: isResting ? theme.blue : theme.gold, fontFamily: FONTS.medium }]}>
                {completed ? 'Complete!' : isResting ? 'REST' : 'HOLD'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'SETS', value: `${totalSets}` },
            { label: 'HOLD', value: `${holdTime}s` },
            { label: 'REST', value: `${restTime}s` },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <Text style={[styles.statVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.setInfo, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          Set {currentSet} of {totalSets} {isRunning ? (isResting ? '— resting' : '— in progress') : completed ? '— done!' : ''}
        </Text>

        {completed ? (
          <View style={styles.doneSection}>
            <Feather name="check-circle" size={32} color={theme.green} />
            <Text style={[styles.doneText, { color: theme.green, fontFamily: FONTS.semiBold }]}>Well done! +{xpReward} XP</Text>
            <Button title="BACK TO TRAINING" onPress={() => router.back()} testID="exercise-done-btn" />
          </View>
        ) : (
          <View style={styles.controls}>
            {!isRunning ? (
              <Button title={currentSet === 1 && timeLeft === holdTime ? 'START' : 'RESUME'} onPress={() => setIsRunning(true)} testID="exercise-start-btn" />
            ) : (
              <Button title="PAUSE" variant="secondary" onPress={() => setIsRunning(false)} testID="exercise-pause-btn" />
            )}
            <Button title="RESET" variant="ghost" onPress={handleReset} testID="exercise-reset-btn" />
          </View>
        )}

        <Text style={[styles.xpHint, { color: theme.textMuted, fontFamily: FONTS.regular }]}>+{xpReward} XP on complete</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 16 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  exName: { fontSize: 22, textAlign: 'center' },
  exDesc: { fontSize: 14, marginTop: SPACING.xs, textAlign: 'center' },
  timerWrap: { marginVertical: SPACING.xl },
  timerRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  timerFill: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderRightColor: 'transparent', borderBottomColor: 'transparent' },
  timerInner: { alignItems: 'center' },
  timerText: { fontSize: 36 },
  timerLabel: { fontSize: 12, letterSpacing: 1.5, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statCard: { alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  statVal: { fontSize: 20 },
  statLabel: { fontSize: 10, letterSpacing: 1, marginTop: 2 },
  setInfo: { fontSize: 14, marginTop: SPACING.lg },
  controls: { gap: SPACING.sm, marginTop: SPACING.lg, width: '100%' },
  doneSection: { alignItems: 'center', gap: SPACING.md, marginTop: SPACING.lg, width: '100%' },
  doneText: { fontSize: 18 },
  xpHint: { fontSize: 12, marginTop: SPACING.lg },
});
