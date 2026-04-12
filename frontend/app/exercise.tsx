import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
  Share,
  Linking,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../src/components/Button";
import { XPToast } from "../src/components/XPToast";
import { CaptainCard } from "../src/components/CaptainCard";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { supabase } from "../lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Maintain 16:9 ratio for video
const VIDEO_HEIGHT = (SCREEN_WIDTH - SPACING.lg * 2) * (9 / 16);

// ─── HIGH-FIDELITY EXERCISE VIDEO LIBRARY ────────────────────────────────────
interface ExerciseVideoEntry {
  videoId: string;
  title: string;
  guidelines: string[];
  formCues: string[];
  commonMistakes: string[];
}

const EXERCISE_VIDEO_LIBRARY: Record<string, ExerciseVideoEntry> = {
  // ─── FACIAL VECTORS ──────────────────────────────────────────────────────────
  mewing: {
    videoId: "zbZwLFBsOiM",
    title: "Genetic Jaw Alignment (Mewing)",
    guidelines: [
      "Suction entire tongue to palate",
      "Teeth should not overlap, but lightly touch",
      "Engage the posterior third of the tongue",
    ],
    formCues: ["Vacuum seal tongue", "Nose breathe only"],
    commonMistakes: ["Tongue tip pressure only", "Clenching teeth"],
  },
  "tongue posture": {
    videoId: "zbZwLFBsOiM",
    title: "Structural Palate Support",
    guidelines: ["Maintain suction hold throughout", "Flatten tongue against palate"],
    formCues: ["Seal the back of the throat"],
    commonMistakes: ["Mouth breathing"],
  },
  "jawline exercise": {
    videoId: "GEUF2v-6OUo",
    title: "Masseter Hypertrophy Protocol",
    guidelines: ["Controlled bite resistance", "Focus on the jaw angle", "Balanced chewing"],
    formCues: ["Squeeze masseters", "Even pressure"],
    commonMistakes: ["Overtraining", "Jaw clicking"],
  },
  "chin tuck": {
    videoId: "k3mqkYDkPsk",
    title: "Cervical Spine Optimization",
    guidelines: ["Pull chin straight back toward spine", "Lengthen the back of the neck"],
    formCues: ["Imagine a string pulling head up"],
    commonMistakes: ["Tilting head down", "Shoulder shrugging"],
  },

  // ─── BODY VECTORS ──────────────────────────────────────────────────────────
  "push up": {
    videoId: "IODxDxX7oi4",
    title: "Tactical Push-Up Mechanics",
    guidelines: ["Elbows at 45 degree angle", "Full extension at top", "Core fully engaged"],
    formCues: ["Screw hands into floor", "Chest to floor"],
    commonMistakes: ["Sagging hips", "Flared elbows"],
  },
  "pull up": {
    videoId: "eGo4IYlbE5g",
    title: "Latissimus Dorsi Optimization",
    guidelines: ["Full dead hang", "Pull until chest reaches bar", "Stretch at bottom"],
    formCues: ["Pull through elbows", "Scapular retraction"],
    commonMistakes: ["Kicking legs", "Half reps"],
  },
  squat: {
    videoId: "ultWZbUMPL8",
    title: "Kinetic Lower Body Drive",
    guidelines: ["Weight on midfoot/heels", "Hips back first", "Keep chest proud"],
    formCues: ["Spread the floor", "Brace core"],
    commonMistakes: ["Heels lifting", "Knees caving"],
  },
  deadlift: {
    videoId: "op9kVnSso6Q",
    title: "Posterior Chain Force Production",
    guidelines: ["Shin contact with bar", "Hinge at hips", "Engage lats before pull"],
    formCues: ["Push through the floor", "Tuck chin"],
    commonMistakes: ["Cat back", "Bending elbows"],
  },
  "bench press": {
    videoId: "vcBig73ojpE",
    title: "Pectoral Vector Drive",
    guidelines: ["Shoulder blades pinned", "Feet planted", "Control the eccentric"],
    formCues: ["Break the bar", "Leg drive"],
    commonMistakes: ["Lifting glutes", "Bouncing off sternum"],
  },
  "bicep curl": {
    videoId: "ykJmrZ5v0Oo",
    title: "Peak Bicep Hypertrophy",
    guidelines: ["Full elbow extension", "No body momentum", "Focus on the squeeze"],
    formCues: ["Elbows pinned", "Rotate pinky up"],
    commonMistakes: ["Using legs", "Partial range"],
  },
  plank: {
    videoId: "ASdvN_XEl_c",
    title: "Total Core Isometrics",
    guidelines: ["Tuck pelvis", "Forearms parallel", "Neutral spine"],
    formCues: ["Brace for a punch", "Squeeze glutes"],
    commonMistakes: ["Head drop", "Arching back"],
  },
  // ─── CONFIRMED FIX MAP ────────────────────────────────────────────────────────
  "face pull": {
    videoId: "HSoHeSjovGc",
    title: "Rear Delt & Rotator Cuff Protocol",
    guidelines: ["Cable at face height", "Pull to ears with external rotation", "Squeeze shoulder blades"],
    formCues: ["Elbows high", "Rope to face level"],
    commonMistakes: ["Using body momentum", "Too heavy"],
  },
  "overhead press": {
    videoId: "2yjwXTZQDDI",
    title: "Overhead Press Force Production",
    guidelines: ["Strict form — no leg drive", "Lock out at top", "Brace core throughout"],
    formCues: ["Bar path vertical", "Head through at top"],
    commonMistakes: ["Leaning back", "Flared elbows"],
  },
  ohp: {
    videoId: "2yjwXTZQDDI",
    title: "Overhead Press Force Production",
    guidelines: ["Strict form — no leg drive", "Lock out at top", "Brace core throughout"],
    formCues: ["Bar path vertical", "Head through at top"],
    commonMistakes: ["Leaning back", "Flared elbows"],
  },
  "lateral raise": {
    videoId: "3VcKaXpzqRo",
    title: "Lateral Deltoid Isolation",
    guidelines: ["Slight bend in elbows", "Raise to shoulder height", "Control the negative"],
    formCues: ["Lead with pinky", "Slow eccentric"],
    commonMistakes: ["Swinging weights", "Shrugging traps"],
  },
  "wall stand": {
    videoId: "RqcOCBb4arc",
    title: "Wall Handstand Progression",
    guidelines: ["Face the wall", "Walk feet up slowly", "Lock arms overhead"],
    formCues: ["Core tight", "Look at the wall"],
    commonMistakes: ["Arching back", "Holding breath"],
  },
  "cold shower": {
    videoId: "pq6WHJzOkno",
    title: "Cold Exposure Protocol",
    guidelines: ["Start with 30 seconds", "Focus on controlled breathing", "Gradually increase duration"],
    formCues: ["Breathe through the discomfort", "Relax shoulders"],
    commonMistakes: ["Hyperventilating", "Tensing entire body"],
  },
};

function findVideoForExercise(name: string): ExerciseVideoEntry {
  const DEFAULT = EXERCISE_VIDEO_LIBRARY["mewing"];
  if (!name) return DEFAULT;
  const lower = name.toLowerCase().trim();

  // Try exact or partial match in library
  const match = Object.keys(EXERCISE_VIDEO_LIBRARY).find(k => lower.includes(k) || k.includes(lower));
  if (match) return EXERCISE_VIDEO_LIBRARY[match];

  // Logic to categorize if no direct match
  const jawCat = ["jaw", "face", "face", "mew", "tongue", "chin", "chew", "chewing"];
  if (jawCat.some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["mewing"];
  
  const pushCat = ["push", "press", "chest", "bench", "shoulder"];
  if (pushCat.some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["push up"];

  const pullCat = ["pull", "row", "lat", "bicep", "curl", "back"];
  if (pullCat.some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["pull up"];

  const legCat = ["squat", "leg", "quad", "calf", "deadlift", "lung", "glute"];
  if (legCat.some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["squat"];

  return DEFAULT;
}

export default function ExerciseScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    sets: string;
    reps: string;
    rest: string;
    xp: string;
    description?: string;
    coach_note?: string;
    pro_tip?: string;
    youtube_id?: string;
  }>();

  const totalSets = parseInt(params.sets || "3");
  const xpReward = parseInt(params.xp || "40");
  const [phase, setPhase] = useState<"video" | "workout">("video");
  const [currentSet, setCurrentSet] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [webViewLoading, setWebViewLoading] = useState(true);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerDuration = params.rest ? parseInt(params.rest) : 60;

  // Pulse animation for timer
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get the video for this exercise
  const videoData = params.youtube_id
    ? ({
        videoId: params.youtube_id,
        title: params.name || "Dynamic Force Protocol",
        guidelines: ["Execute with tactical precision", "Maintain biological equilibrium"],
        formCues: ["Engage stabilizers"],
        commonMistakes: ["Compromising joint integrity"],
      } as ExerciseVideoEntry)
    : findVideoForExercise(params.name || "");

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Pulse animation loop
  useEffect(() => {
    if (timerActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timerActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleNextSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setTimeLeft(timerDuration);
      setTimerActive(true);
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
        await supabase.from("workout_completions").insert({
          user_id: user.id,
          exercise_id: params.id,
          workout_id: params.id, // Fallback
          xp_earned: xpReward,
          completed_at: new Date().toISOString(),
        });

        await supabase.from("xp_log").insert({
          user_id: user.id,
          amount: xpReward,
          reason: `Mission: ${params.name || "Exercise"}`,
        });
      } catch (e) {
        console.log("Error logging workout", e);
      }
    }
  };

  const handlePhaseChange = (newPhase: "video" | "workout") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase(newPhase);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <XPToast amount={xpReward} visible={showXP} onDone={() => setShowXP(false)} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textSecondary, fontFamily: FONTS.cinzelBold }]}>
            {params.name?.toUpperCase() || "MISSION"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowGuidelines(!showGuidelines)} style={styles.backBtn}>
          <Feather name="shield" size={20} color={theme.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Phase Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => handlePhaseChange("video")} style={[styles.tabItem, phase === "video" && { backgroundColor: theme.gold }]}>
              <Text style={[styles.tabText, { color: phase === "video" ? "#000" : theme.textMuted, fontFamily: FONTS.bold }]}>BIO-FORM VIDEO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePhaseChange("workout")} style={[styles.tabItem, phase === "workout" && { backgroundColor: theme.gold }]}>
              <Text style={[styles.tabText, { color: phase === "workout" ? "#000" : theme.textMuted, fontFamily: FONTS.bold }]}>EXECUTE MISSION</Text>
          </TouchableOpacity>
        </View>

        {phase === "video" ? (
          <View style={styles.videoSection}>
            <View style={[styles.videoWrapper, { borderColor: theme.gold + "15", backgroundColor: "#000" }]}>
              {webViewLoading && (
                  <View style={styles.videoLoader}>
                      <ActivityIndicator color={theme.gold} size="large" />
                  </View>
              )}
              <WebView
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                onLoad={() => setWebViewLoading(false)}
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                source={{
                    uri: `https://www.youtube.com/embed/${videoData.videoId}?rel=0&autoplay=1&showinfo=0&controls=1&modestbranding=1&playsinline=1&origin=${Platform.OS === 'ios' ? 'http://localhost' : 'http://localhost:19006'}`
                }}
                style={{ flex: 1, backgroundColor: '#000' }}
              />
            </View>

            {/* Caption bar + Share/Save buttons */}
            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, marginTop: 16, fontFamily: FONTS.regular }} numberOfLines={3}>
              {params.description || videoData.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    const ytUrl = `https://youtu.be/${videoData.videoId}`;
                    await Share.share({ message: `${params.name} \u2014 ${videoData.title}\n${ytUrl}\n\nShared from MAXX App`, url: ytUrl });
                  } catch (e) {}
                }}
                style={[styles.shareBtn, { borderColor: theme.gold }]}
              >
                <Feather name="share" size={14} color={theme.gold} />
                <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 13 }}>Share Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  if (!user) return;
                  try {
                    await supabase.from('favorites').insert({
                      user_id: user.id,
                      item_type: 'exercise',
                      item_id: params.id || videoData.videoId,
                      item_title: params.name || videoData.title,
                      item_image_url: `https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg`,
                      item_subtitle: 'Exercise Video',
                    });
                    Alert.alert('Saved', 'Added to your favorites.');
                  } catch (e) {
                    console.log(e);
                  }
                }}
                style={[styles.saveBtn, { backgroundColor: theme.gold }]}
              >
                <Feather name="bookmark" size={14} color="#000" />
                <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 13 }}>Add to Favorites</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.guideContainer}>
                <Text style={[styles.guideHeader, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>TACTICAL PROTOCOL</Text>
                {videoData.guidelines.map((g, i) => (
                    <View key={i} style={styles.bulletRow}>
                        <View style={[styles.bulletPoint, { backgroundColor: theme.gold }]} />
                        <Text style={[styles.bulletLabel, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{g}</Text>
                    </View>
                ))}

                <View style={[styles.proTipBox, { backgroundColor: theme.gold + '08', borderColor: theme.gold + '22' }]}>
                    <Text style={{ color: theme.gold, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 2 }}>GENOME NOTE</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
                        {params.pro_tip || "Maximize mind-muscle connection. Control every millisecond of the movement."}
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
                onPress={() => handlePhaseChange("workout")}
                style={[styles.confirmBtn, { backgroundColor: theme.gold }]}
                activeOpacity={0.9}
            >
                <Text style={{ color: "#000", fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 1 }}>CONFIRM FORM & START</Text>
                <Feather name="arrow-right" size={20} color="#000" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workoutSection}>
            {completed ? (
              <View style={styles.doneContainer}>
                <View style={[styles.doneIconWrap, { borderColor: theme.gold }]}>
                    <Feather name="check-circle" size={60} color={theme.gold} />
                </View>
                <Text style={[styles.doneHeading, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>EVOLUTION LOGGED</Text>
                <Text style={[styles.doneInfo, { color: theme.textMuted }]}>
                  Vector engagement confirmed. +{xpReward} XP synced to your profile.
                </Text>
                <Button title="COMPLETE SESSION" onPress={() => router.back()} style={{ width: "100%", marginTop: 40 }} />
              </View>
            ) : (
              <>
                <View style={styles.displayRow}>
                  <View style={styles.displayItem}>
                    <Text style={[styles.displayLabel, { color: theme.textMuted }]}>SET VECTOR</Text>
                    <Text style={[styles.displayValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                      {currentSet}<Text style={{ fontSize: 16, color: theme.textMuted }}> / {totalSets}</Text>
                    </Text>
                  </View>
                  <View style={[styles.vLine, { backgroundColor: theme.border }]} />
                  <View style={styles.displayItem}>
                    <Text style={[styles.displayLabel, { color: theme.textMuted }]}>INTENSITY</Text>
                    <Text style={[styles.displayValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                      {params.reps || "MAX"}
                    </Text>
                  </View>
                </View>

                {timerActive ? (
                  <View style={styles.timerWrap}>
                    <Animated.View style={[styles.timerPulse, { transform: [{ scale: pulseAnim }], borderColor: theme.gold }]}>
                        <Text style={[styles.timerDigit, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
                        {formatTime(timeLeft)}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 3, marginTop: 4 }}>RE-CALIBRATING</Text>
                    </Animated.View>
                    <TouchableOpacity onPress={() => setTimerActive(false)} style={styles.skipTimer}>
                        <Text style={{ color: theme.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>Skip Recovery</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.executeWrap}>
                    <TouchableOpacity onPress={handleNextSet} style={[styles.executeBtn, { backgroundColor: theme.gold }]}>
                      <Text style={{ color: "#000", fontFamily: FONTS.bold, fontSize: 20 }}>
                        {currentSet === totalSets ? "TERMINATE PROTOCOL" : "SET COMPLETE"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <CaptainCard title="COACH TRANSMISSION">
                  {params.coach_note || "Focus on the biological response. Feel the structural tension."}
                </CaptainCard>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 12, letterSpacing: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  tabBar: { flexDirection: "row", height: 50, borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 25 },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 11, letterSpacing: 1 },
  videoSection: { width: "100%" },
  videoWrapper: { width: "100%", borderRadius: 20, borderWidth: 1, overflow: "hidden", height: VIDEO_HEIGHT, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  videoLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: '#000' },
  guideContainer: { marginTop: 30 },
  guideHeader: { fontSize: 15, letterSpacing: 3, marginBottom: 20 },
  bulletRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 14 },
  bulletPoint: { width: 6, height: 6, borderRadius: 3 },
  bulletLabel: { fontSize: 14, lineHeight: 22 },
  proTipBox: { marginTop: 20, padding: 20, borderRadius: 18, borderLeftWidth: 4 },
  confirmBtn: { marginTop: 40, height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  workoutSection: { width: "100%", alignItems: "center" },
  displayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingVertical: 30 },
  displayItem: { flex: 1, alignItems: "center" },
  displayLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: FONTS.bold },
  displayValue: { fontSize: 32 },
  vLine: { width: 1, height: 45, opacity: 0.2 },
  timerWrap: { marginVertical: 30, alignItems: 'center' },
  timerPulse: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timerDigit: { fontSize: 56 },
  skipTimer: { marginTop: 25, padding: 10 },
  executeWrap: { width: '100%', height: 250, justifyContent: 'center', alignItems: 'center' },
  executeBtn: { width: '100%', paddingVertical: 24, borderRadius: 22, alignItems: 'center', shadowColor: '#C8A96E', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  doneContainer: { alignItems: "center", paddingVertical: 40 },
  doneIconWrap: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  doneHeading: { fontSize: 24, textAlign: "center", letterSpacing: 2 },
  doneInfo: { fontSize: 14, textAlign: "center", marginTop: 12, lineHeight: 22, opacity: 0.7 },
});
