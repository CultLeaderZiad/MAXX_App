import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../src/components/Button';
import { XPToast } from '../src/components/XPToast';
import { CaptainCard } from '../src/components/CaptainCard';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Curated YouTube video IDs for exercises (most viewed/rated)
const EXERCISE_VIDEOS: Record<string, { videoId: string; title: string }> = {
  // Jaw & Face
  'mewing': { videoId: 'eh9OqEd5MKk', title: 'How to Mew Properly - Full Guide' },
  'mewing : tongue posture': { videoId: 'eh9OqEd5MKk', title: 'How to Mew Properly - Full Guide' },
  'tongue posture': { videoId: 'eh9OqEd5MKk', title: 'How to Mew Properly - Full Guide' },
  'chewing exercise': { videoId: 'GEUF2v-6OUo', title: 'Jawline Chewing Exercise' },
  'jawline exercise': { videoId: 'GEUF2v-6OUo', title: 'Jawline Exercise Guide' },
  'jaw clenching': { videoId: 'GEUF2v-6OUo', title: 'Jaw Exercise Tutorial' },
  'facial exercise': { videoId: '2JvO-FhST9A', title: 'Facial Exercise Routine' },
  'chin tuck': { videoId: 'k3mqkYDkPsk', title: 'Chin Tuck Exercise Guide' },
  'neck exercise': { videoId: 'k3mqkYDkPsk', title: 'Neck Strengthening Exercises' },
  // Body
  'push up': { videoId: 'IODxDxX7oi4', title: 'Perfect Push-up Form' },
  'push ups': { videoId: 'IODxDxX7oi4', title: 'Perfect Push-up Form' },
  'pull up': { videoId: 'eGo4IYlbE5g', title: 'Pull-up Technique Guide' },
  'pull ups': { videoId: 'eGo4IYlbE5g', title: 'Pull-up Technique Guide' },
  'squat': { videoId: 'ultWZbUMPL8', title: 'How to Squat Properly' },
  'squats': { videoId: 'ultWZbUMPL8', title: 'How to Squat Properly' },
  'plank': { videoId: 'ASdvN_XEl_c', title: 'Perfect Plank Form' },
  'deadlift': { videoId: 'op9kVnSso6Q', title: 'Deadlift Form Guide' },
  'bench press': { videoId: '4Y2ZdHCOXok', title: 'Bench Press Technique' },
  'dip': { videoId: '2z8JmcrW-As', title: 'Dip Exercise Guide' },
  'dips': { videoId: '2z8JmcrW-As', title: 'Dip Exercise Guide' },
  'burpee': { videoId: 'dZgVxmf6jkA', title: 'Burpee Form Guide' },
  'burpees': { videoId: 'dZgVxmf6jkA', title: 'Burpee Form Guide' },
  'lunge': { videoId: 'QOVaHwm-Q6U', title: 'Lunge Form Guide' },
  'lunges': { videoId: 'QOVaHwm-Q6U', title: 'Lunge Form Guide' },
  // Posture
  'posture correction': { videoId: 'RqcOCBb4arc', title: 'Fix Your Posture in 10 Minutes' },
  'wall angel': { videoId: 'M_oCwl5R73E', title: 'Wall Angel Exercise' },
  'wall angels': { videoId: 'M_oCwl5R73E', title: 'Wall Angel Exercise' },
  'back stretch': { videoId: 'XeXz8fIZDCE', title: 'Back Stretching Routine' },
  'thoracic extension': { videoId: 'LT_dFRnmdYI', title: 'Thoracic Extension Guide' },
  'shoulder stretch': { videoId: 'SzYqMhI8XKk', title: 'Shoulder Mobility Routine' },
  'hip flexor stretch': { videoId: 'UGEpQ1BRx-4', title: 'Hip Flexor Stretch Guide' },
};

function findVideoForExercise(name: string): { videoId: string; title: string } | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  
  // Exact match
  if (EXERCISE_VIDEOS[lower]) return EXERCISE_VIDEOS[lower];
  
  // Partial match
  for (const [key, val] of Object.entries(EXERCISE_VIDEOS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  
  return null;
}

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
    youtube_id?: string;
  }>();

  const totalSets = parseInt(params.sets || '3');
  const xpReward = parseInt(params.xp || '40');

  const [phase, setPhase] = useState<'video' | 'workout'>('video');
  const [currentSet, setCurrentSet] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [showXP, setShowXP] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerDuration = params.rest ? parseInt(params.rest) : 60;

  // Get the video for this exercise
  const videoData = params.youtube_id 
    ? { videoId: params.youtube_id, title: params.name || 'Exercise' }
    : findVideoForExercise(params.name || '');

  // Fallback: use a search-based embed if no specific video found
  const videoEmbedUrl = videoData 
    ? `https://www.youtube.com/embed/${videoData.videoId}?rel=0&modestbranding=1&playsinline=1`
    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(params.name + ' exercise tutorial')}&rel=0&modestbranding=1`;

  React.useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startRestTimer = () => {
    setTimeLeft(timerDuration);
    setTimerActive(true);
    Haptics.selectionAsync();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNextSet = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (currentSet < totalSets) {
          setCurrentSet(currentSet + 1);
          startRestTimer();
      } else {
          finishWorkout();
      }
  };

  const finishWorkout = async () => {
    setTimerActive(false);
    setCompleted(true);
    setShowXP(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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

  const handleStartWorkout = () => {
    setPhase('workout');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="exercise-screen">
      <XPToast amount={xpReward} visible={showXP} onDone={() => setShowXP(false)} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
          {phase === 'video' ? 'WATCH & LEARN' : 'WORKOUT'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.exName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{params.name || 'Exercise'}</Text>
        
        {/* Phase indicator */}
        <View style={styles.phaseRow}>
          <View style={[styles.phasePill, { backgroundColor: phase === 'video' ? theme.gold : theme.bgElevated }]}>
            <Text style={[styles.phaseText, { color: phase === 'video' ? '#0A0A0A' : theme.textMuted, fontFamily: FONTS.semiBold }]}>1. WATCH</Text>
          </View>
          <View style={[styles.phaseLine, { backgroundColor: theme.border }]} />
          <View style={[styles.phasePill, { backgroundColor: phase === 'workout' ? theme.gold : theme.bgElevated }]}>
            <Text style={[styles.phaseText, { color: phase === 'workout' ? '#0A0A0A' : theme.textMuted, fontFamily: FONTS.semiBold }]}>2. TRAIN</Text>
          </View>
        </View>

        {/* PHASE 1: Video Guide */}
        {phase === 'video' && (
          <>
            <View style={[styles.videoContainer, { borderColor: theme.gold + '44' }]}>
              <WebView 
                source={{ uri: videoEmbedUrl }}
                style={{ flex: 1 }}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
              />
            </View>

            {videoData && (
              <Text style={[styles.videoTitle, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>
                📺 {videoData.title}
              </Text>
            )}

            {/* Instructions */}
            <View style={[styles.instructionBox, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <View style={styles.instructionRow}>
                <Feather name="eye" size={16} color={theme.gold} />
                <Text style={[styles.instructionText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                  Watch the form guide carefully before starting
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Feather name="target" size={16} color={theme.gold} />
                <Text style={[styles.instructionText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                  {params.description || "Focus on proper form over speed. Quality reps build quality physique."}
                </Text>
              </View>
              {params.pro_tip && (
                <View style={styles.instructionRow}>
                  <Feather name="award" size={16} color={theme.gold} />
                  <Text style={[styles.instructionText, { color: theme.gold, fontFamily: FONTS.medium }]}>
                    PRO TIP: {params.pro_tip}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ width: '100%', paddingHorizontal: SPACING.md, marginTop: SPACING.lg }}>
              <Button title="I'VE WATCHED — START WORKOUT" onPress={handleStartWorkout} />
            </View>
          </>
        )}

        {/* PHASE 2: Workout Execution */}
        {phase === 'workout' && (
          <>
            <View style={[styles.setPill, { backgroundColor: theme.bgElevated, marginVertical: SPACING.md }]}>
                <Text style={[styles.setLabel, { color: theme.textPrimary, fontFamily: FONTS.medium }]}>
                    SET {currentSet} OF {totalSets}
                </Text>
            </View>

            {/* Set progress dots */}
            <View style={styles.setDots}>
              {Array.from({ length: totalSets }).map((_, i) => (
                <View key={i} style={[styles.setDot, { 
                  backgroundColor: i < currentSet ? theme.gold : theme.bgElevated,
                  borderColor: i === currentSet - 1 ? theme.gold : theme.border
                }]} />
              ))}
            </View>

            {/* Timer UI Element */}
            {timerActive ? (
              <View style={[styles.timerCircle, { borderColor: theme.gold }]}>
                  <Text style={[styles.timerText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
                      {formatTime(timeLeft)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: FONTS.medium }}>RESTING</Text>
              </View>
            ) : null}

            {completed ? (
              <View style={styles.doneSection}>
                <View style={[styles.doneBadge, { backgroundColor: theme.green + '22' }]}>
                  <Feather name="check-circle" size={48} color={theme.green} />
                </View>
                <Text style={[styles.doneText, { color: theme.green, fontFamily: FONTS.cinzelBold }]}>EXERCISE COMPLETE</Text>
                <Text style={[styles.doneSub, { color: theme.textMuted, fontFamily: FONTS.medium }]}>+{xpReward} XP Earned</Text>
                <Button title="FINISH" onPress={() => router.back()} style={{ width: '100%', marginTop: SPACING.lg }} />
              </View>
            ) : (
              <View style={styles.controls}>
                 {!timerActive && (
                     <Button title={currentSet < totalSets ? `COMPLETE SET ${currentSet} / ${totalSets}` : "FINISH EXERCISE"} onPress={handleNextSet} />
                 )}
              </View>
            )}

            <View style={styles.infoSection}>
                <CaptainCard title="Coach Note">
                    {params.coach_note || "Focus on form. Don't cheat the reps."}
                </CaptainCard>
            </View>
          </>
        )}
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
  exName: { fontSize: 22, textAlign: 'center', marginVertical: SPACING.sm },

  phaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.md, gap: 8 },
  phasePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  phaseText: { fontSize: 11, letterSpacing: 1 },
  phaseLine: { width: 30, height: 2, borderRadius: 1 },

  videoContainer: { width: '100%', aspectRatio: 16/9, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1.5, backgroundColor: '#000', marginTop: SPACING.sm },
  videoTitle: { fontSize: 13, textAlign: 'center', marginTop: SPACING.sm },

  instructionBox: { width: '100%', borderRadius: 14, borderWidth: 1, padding: SPACING.md, marginTop: SPACING.lg, gap: 12 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  instructionText: { flex: 1, fontSize: 13, lineHeight: 20 },

  setPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  setLabel: { fontSize: 14, letterSpacing: 1 },
  setDots: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  setDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  controls: { gap: SPACING.md, width: '100%', maxWidth: 300 },
  doneSection: { alignItems: 'center', gap: SPACING.sm, width: '100%', paddingVertical: SPACING.xl },
  doneBadge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneText: { fontSize: 24 },
  doneSub: { fontSize: 16 },
  infoSection: { width: '100%', marginTop: SPACING.xxl, gap: SPACING.lg },
  timerCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.md },
  timerText: { fontSize: 32, marginBottom: 4 }
});
