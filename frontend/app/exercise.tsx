import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { XPToast } from '../src/components/XPToast';
import { CaptainCard } from '../src/components/CaptainCard';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { supabase } from '../lib/supabase';

export default function ExerciseScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    sets: string; 
    hold: string; 
    rest: string; 
    xp: string;
    description?: string;
    coach_note?: string;
    pro_tip?: string;
  }>();

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
          finishWorkout();
        }
      } else {
        // Set complete
        if (currentSet < totalSets) {
          setIsResting(true);
          setTimeLeft(restTime);
        } else {
          finishWorkout();
        }
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isRunning, timeLeft, isResting, currentSet]);

  const finishWorkout = async () => {
    setCompleted(true);
    setIsRunning(false);
    setShowXP(true);
    
    // Log completion to Supabase
    if (user && params.id) {
        try {
            await supabase.from('workout_completions').insert({
                user_id: user.id,
                exercise_id: params.id,
                xp_earned: xpReward,
                completed_at: new Date().toISOString()
            });
            
            await supabase.from('xp_log').insert({
                user_id: user.id,
                amount: xpReward,
                source: 'workout',
                description: `Completed ${params.name}`
            });
        } catch (e) {
            console.log('Error logging workout', e);
        }
    }
  };

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

  const ringSize = 240;
  const circumference = ringSize * Math.PI; // Approximation for rendering logic, handled by styling

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="exercise-screen">
      <XPToast amount={xpReward} visible={showXP} onDone={() => setShowXP(false)} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
          {isResting ? 'REST' : 'WORKOUT'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.exName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{params.name || 'Exercise'}</Text>
        
        {/* Timer Ring */}
        <View style={styles.timerWrap}>
          <View style={[styles.timerRing, { borderColor: theme.bgElevated, width: ringSize, height: ringSize, borderRadius: ringSize/2 }]}>
            <Animated.View style={[styles.timerFill, {
              width: ringSize, height: ringSize, borderRadius: ringSize/2,
              borderColor: theme.gold,
              borderTopColor: isResting ? theme.blue : theme.gold,
              transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '180deg'] }) }],
            }]} />
            <View style={styles.timerInner}>
              <Text style={[styles.timerText, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{formatTime(timeLeft)}</Text>
              <View style={[styles.setPill, { backgroundColor: theme.bgElevated }]}>
                <Text style={[styles.setLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
                  SET {currentSet} OF {totalSets}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {completed ? (
          <View style={styles.doneSection}>
            <Feather name="check-circle" size={48} color={theme.green} />
            <Text style={[styles.doneText, { color: theme.green, fontFamily: FONTS.cinzelBold }]}>SESSION COMPLETE</Text>
            <Text style={[styles.doneSub, { color: theme.textMuted }]}>+{xpReward} XP Earned</Text>
            <Button title="FINISH" onPress={() => router.back()} style={{ width: '100%', marginTop: SPACING.lg }} />
          </View>
        ) : (
          <View style={styles.controls}>
            {!isRunning ? (
              <Button title={currentSet === 1 && timeLeft === holdTime ? 'START' : 'RESUME'} onPress={() => setIsRunning(true)} />
            ) : (
              <Button title="PAUSE" variant="secondary" onPress={() => setIsRunning(false)} />
            )}
            <Button title="RESET" variant="ghost" onPress={handleReset} />
          </View>
        )}

        <View style={styles.infoSection}>
            <CaptainCard title="Coach Note">
                {params.coach_note || "Focus on form. Don't cheat the reps."}
            </CaptainCard>
            
            {params.pro_tip && (
                <View style={[styles.proTip, { borderColor: theme.gold }]}>
                    <Text style={[styles.proTipTitle, { color: theme.gold, fontFamily: FONTS.bold }]}>PRO TIP</Text>
                    <Text style={[styles.proTipText, { color: theme.textSecondary }]}>{params.pro_tip}</Text>
                </View>
            )}

            <Text style={[styles.descTitle, { color: theme.textMuted, fontFamily: FONTS.medium }]}>INSTRUCTIONS</Text>
            <Text style={[styles.descText, { color: theme.textSecondary }]}>
                {params.description || "Perform the movement with control. Keep your core tight and breathe rhythmically."}
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 16, letterSpacing: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  exName: { fontSize: 24, textAlign: 'center', marginVertical: SPACING.md },
  timerWrap: { marginVertical: SPACING.lg },
  timerRing: { borderWidth: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  timerFill: { position: 'absolute', borderWidth: 8, borderRightColor: 'transparent', borderBottomColor: 'transparent' },
  timerInner: { alignItems: 'center', gap: 8 },
  timerText: { fontSize: 48 },
  setPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  setLabel: { fontSize: 12, letterSpacing: 1 },
  controls: { gap: SPACING.md, width: '100%', maxWidth: 300 },
  doneSection: { alignItems: 'center', gap: SPACING.sm, width: '100%', paddingVertical: SPACING.xl },
  doneText: { fontSize: 24 },
  doneSub: { fontSize: 16 },
  infoSection: { width: '100%', marginTop: SPACING.xxl, gap: SPACING.lg },
  proTip: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, borderStyle: 'dashed' },
  proTipTitle: { fontSize: 12, marginBottom: 4 },
  proTipText: { fontSize: 14, lineHeight: 20 },
  descTitle: { fontSize: 12, letterSpacing: 1 },
  descText: { fontSize: 14, lineHeight: 22 },
});
