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
  ActivityIndicator,
  Share,
  Linking,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { safeBack } from "../lib/safeBack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../src/components/Button";
import { XPToast } from "../src/components/XPToast";
import { CaptainCard } from "../src/components/CaptainCard";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { supabase } from "../lib/supabase";
import { FALLBACK_VIDEOS } from "../lib/youtubePlayer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = (SCREEN_WIDTH - SPACING.lg * 2) * (9 / 16);

// ─── Exercise Video Library ───────────────────────────────────────────────────
interface ExerciseVideoEntry {
  videoId: string;
  title: string;
  guidelines: string[];
  formCues: string[];
  commonMistakes: string[];
}

const EXERCISE_VIDEO_LIBRARY: Record<string, ExerciseVideoEntry> = {
  mewing: {
    videoId: "zbZwLFBsOiM",
    title: "Genetic Jaw Alignment (Mewing)",
    guidelines: ["Suction entire tongue to palate", "Teeth should not overlap, but lightly touch", "Engage the posterior third of the tongue"],
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
  // ── CONFIRMED VIDEO IDs ─────────────────────────────────────────────────────
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
  const match = Object.keys(EXERCISE_VIDEO_LIBRARY).find(
    k => lower.includes(k) || k.includes(lower)
  );
  if (match) return EXERCISE_VIDEO_LIBRARY[match];

  if (["jaw", "face", "mew", "tongue", "chin", "chew"].some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["mewing"];
  if (["push", "press", "chest", "bench"].some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["push up"];
  if (["pull", "row", "lat", "bicep", "curl", "back"].some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["pull up"];
  if (["squat", "leg", "quad", "deadlift", "glute"].some(k => lower.includes(k))) return EXERCISE_VIDEO_LIBRARY["squat"];
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
    pro_tip?: string;
    youtube_id?: string;
    gif_url?: string;
    description?: string;
    coach_note?: string;
  }>();

  const totalSets = parseInt(params.sets || "3");
  const xpReward = parseInt(params.xp || "40");

  const [phase, setPhase] = useState<"video" | "workout">("video");
  const [currentSet, setCurrentSet] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [videoIndex, setVideoIndex] = useState(0);

  // YouTube player state
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerDuration = params.rest ? parseInt(params.rest) : 60;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const baseVideoData = params.youtube_id
    ? ({
        videoId: params.youtube_id,
        title: params.name || "Dynamic Force Protocol",
        guidelines: ["Execute with tactical precision", "Maintain biological equilibrium"],
        formCues: ["Engage stabilizers"],
        commonMistakes: ["Compromising joint integrity"],
      } as ExerciseVideoEntry)
    : findVideoForExercise(params.name || "");

  const exerciseKey = Object.keys(EXERCISE_VIDEO_LIBRARY).find(k =>
    (params.name || '').toLowerCase().includes(k) || k.includes((params.name || '').toLowerCase())
  ) || '';
  const fallbackIds = FALLBACK_VIDEOS[exerciseKey] || [baseVideoData.videoId];
  const currentVideoId = fallbackIds[videoIndex] || baseVideoData.videoId;
  const videoData = { ...baseVideoData, videoId: currentVideoId };

  const tryNextVideo = () => {
    setVideoError(false);
    setVideoReady(false);
    setVideoPlaying(false);
    if (videoIndex < fallbackIds.length - 1) {
      setVideoIndex(prev => prev + 1);
    } else {
      Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(params.name || 'exercise form')}`);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (timerActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
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
          workout_id: params.id,
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

  return (
    <>
      <XPToast visible={showXP} onHide={() => setShowXP(false)} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.gold, fontFamily: FONTS.bold }]}>
              {params.name?.toUpperCase() || "MISSION"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowGuidelines(!showGuidelines)} style={styles.backBtn}>
            <Feather name="info" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Phase Tabs: VIDEO GUIDE | START WORKOUT */}
        <View style={[styles.tabBar, { borderColor: theme.border, marginHorizontal: SPACING.lg }]}>
          <TouchableOpacity
            onPress={() => setPhase("video")}
            style={[styles.tabItem, phase === "video" && { backgroundColor: theme.gold }]}
          >
            <Text style={[styles.tabText, { color: phase === "video" ? "#000" : theme.textSecondary, fontFamily: FONTS.bold }]}>
              VIDEO GUIDE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPhase("workout")}
            style={[styles.tabItem, phase === "workout" && { backgroundColor: theme.gold }]}
          >
            <Text style={[styles.tabText, { color: phase === "workout" ? "#000" : theme.textSecondary, fontFamily: FONTS.bold }]}>
              START WORKOUT
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {phase === "video" ? (
            <View style={styles.videoSection}>
              {/* ── VIDEO PLAYER ──────────────────────────────────────────── */}
              <View style={[styles.videoWrapper, { borderColor: theme.border }]}>
                {params.gif_url ? (
                  <Image
                    source={{ uri: params.gif_url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                ) : !videoError ? (
                  <>
                    {Platform.OS === 'web' ? (
                      // Web: show thumbnail with direct YouTube link (iframe embedding often blocked)
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${currentVideoId}`)}
                        style={[styles.videoWrapper, { height: VIDEO_HEIGHT, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: `https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg` }}
                          style={{ width: '100%', height: '100%', position: 'absolute' }}
                          resizeMode="cover"
                        />
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' }}>
                          <Feather name="play" size={28} color={FONTS.cinzelBold ? "rgba(200,169,110,0.95)" : '#C8A96E'} />
                        </View>
                        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'System', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            Tap to watch on YouTube
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <>
                        {/* Native: react-native-youtube-iframe embed */}
                        {((): React.ReactNode => {
                          const YoutubeIframe = require('react-native-youtube-iframe').default;
                          return (
                            <YoutubeIframe
                              height={VIDEO_HEIGHT}
                              width={SCREEN_WIDTH - SPACING.lg * 2}
                              videoId={currentVideoId}
                              play={videoPlaying}
                              onReady={() => setVideoReady(true)}
                              onChangeState={(state: string) => {
                                if (state === "ended") setVideoPlaying(false);
                                if (state === "playing") setVideoReady(true);
                              }}
                              onError={() => setVideoError(true)}
                              webViewStyle={{ opacity: 0.99 }}
                              initialPlayerParams={{ preventFullScreen: false, rel: 0, modestbranding: 1 }}
                            />
                          );
                        })()}
                        {!videoPlaying && (
                          <TouchableOpacity
                            onPress={() => setVideoPlaying(true)}
                            style={styles.videoLoader}
                            activeOpacity={0.8}
                          >
                            <Feather name="play-circle" size={56} color="rgba(200, 169, 110, 0.9)" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // ── Fallback: Watch on YouTube ─────────────────────────
                  <View style={styles.videoFallback}>
                    <Feather name="youtube" size={40} color={theme.gold} />
                    <Text style={[styles.videoFallbackText, { color: theme.textSecondary }]}>
                      Video unavailable in-app
                    </Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${currentVideoId}`)}
                      style={[styles.watchYTBtn, { backgroundColor: theme.gold }]}
                    >
                      <Feather name="external-link" size={14} color="#000" />
                      <Text style={[styles.watchYTText, { fontFamily: FONTS.bold }]}>Watch on YouTube</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Error recovery row */}
              {videoError && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  {videoIndex < fallbackIds.length - 1 && (
                    <TouchableOpacity
                      onPress={tryNextVideo}
                      style={[styles.fallbackBtn, { borderColor: theme.border, backgroundColor: theme.bgElevated }]}
                    >
                      <Text style={{ color: theme.textPrimary, fontSize: 12, fontFamily: FONTS.semiBold }}>NEXT VIDEO</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${currentVideoId}`)}
                    style={[styles.fallbackBtn, { backgroundColor: theme.gold }]}
                  >
                    <Text style={{ color: "#000", fontSize: 12, fontFamily: FONTS.bold }}>OPEN YOUTUBE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Video caption + Share + Add to Favorites ───────────── */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: SPACING.lg }}>
                <Text
                  style={[
                    { flex: 1, color: theme.textSecondary, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18 },
                  ]}
                >
                  {params.description || videoData.title}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const ytUrl = `https://youtu.be/${videoData.videoId}`;
                      await Share.share({
                        message: `${params.name} — ${videoData.title}\n${ytUrl}\n\nShared from MAXX App`,
                        url: ytUrl,
                      });
                    } catch (e) {}
                  }}
                  style={[styles.shareBtn, { borderColor: theme.gold }]}
                >
                  <Feather name="share-2" size={14} color={theme.gold} />
                  <Text style={{ color: theme.gold, fontSize: 12, fontFamily: FONTS.semiBold }}>Share Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (!user) return;
                    try {
                      await supabase.from("favorites").insert({
                        user_id: user.id,
                        item_type: "exercise",
                        item_id: params.id || videoData.videoId,
                        item_title: params.name || videoData.title,
                        item_image_url: `https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg`,
                        item_subtitle: "Exercise Video",
                      });
                      Alert.alert("Saved", "Added to your favorites.");
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                  style={[styles.saveBtn, { backgroundColor: theme.gold }]}
                >
                  <Feather name="bookmark" size={14} color="#000" />
                  <Text style={{ color: "#000", fontSize: 12, fontFamily: FONTS.bold }}>Add to Favorites</Text>
                </TouchableOpacity>
              </View>

              {/* ── Form guidelines ────────────────────────────────────── */}
              {showGuidelines && (
                <View style={styles.guideContainer}>
                  <Text style={[styles.guideHeader, { color: theme.gold, fontFamily: FONTS.bold }]}>3-STEP BIO-LINK</Text>
                  {(videoData.guidelines.length > 0
                    ? videoData.guidelines
                    : ["Initialize biological core", "Execute with maximal tension", "Control the negative phase"]
                  ).slice(0, 3).map((g, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.stepCircle, { backgroundColor: theme.gold }]}>
                        <Text style={{ color: "#000", fontSize: 9, fontFamily: FONTS.bold }}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.bulletLabel, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{g}</Text>
                    </View>
                  ))}
                  <View style={[styles.proTipBox, { backgroundColor: theme.bgElevated, borderLeftColor: theme.gold }]}>
                    <Text style={{ color: theme.gold, fontSize: 10, letterSpacing: 1, fontFamily: FONTS.bold, marginBottom: 6 }}>GENOME NOTE</Text>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 20 }}>
                      {params.pro_tip || "Maximize mind-muscle connection. Control every millisecond of the movement."}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setPhase("workout")}
                style={[styles.confirmBtn, { backgroundColor: theme.gold }]}
                activeOpacity={0.9}
              >
                <Feather name="check-circle" size={18} color="#000" style={{ marginRight: 10 }} />
                <Text style={{ color: "#000", fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1 }}>CONFIRM FORM & START</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ── WORKOUT PHASE ───────────────────────────────────────────────
            <View style={styles.workoutSection}>
              {completed ? (
                <View style={styles.doneContainer}>
                  <View style={[styles.doneIconWrap, { borderColor: theme.gold }]}>
                    <Feather name="check" size={50} color={theme.gold} />
                  </View>
                  <Text style={[styles.doneHeading, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>EVOLUTION LOGGED</Text>
                  <Text style={[styles.doneInfo, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                    Vector engagement confirmed. +{xpReward} XP synced to your profile.
                  </Text>
                  <Button label="BACK TO TRAINING" onPress={() => safeBack()} style={{ width: "100%", marginTop: 40 }} />
                </View>
              ) : (
                <>
                  <View style={styles.displayRow}>
                    <View style={styles.displayItem}>
                      <Text style={[styles.displayLabel, { color: theme.textMuted }]}>SET VECTOR</Text>
                      <Text style={[styles.displayValue, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                        {currentSet} / {totalSets}
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
                      <Animated.View style={[styles.timerPulse, { borderColor: theme.gold, transform: [{ scale: pulseAnim }] }]}>
                        <Text style={[styles.timerDigit, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{formatTime(timeLeft)}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, fontFamily: FONTS.semiBold, marginTop: 4 }}>RE-CALIBRATING</Text>
                      </Animated.View>
                      <TouchableOpacity onPress={() => setTimerActive(false)} style={styles.skipTimer}>
                        <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>Skip Recovery</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.executeWrap}>
                      <TouchableOpacity
                        onPress={handleNextSet}
                        style={[styles.executeBtn, { backgroundColor: theme.gold }]}
                        activeOpacity={0.9}
                      >
                        <Text style={{ color: "#000", fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 2 }}>
                          {currentSet === totalSets ? "TERMINATE PROTOCOL" : "SET COMPLETE"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {params.coach_note ? (
                    <View style={[styles.proTipBox, { backgroundColor: theme.bgElevated, borderLeftColor: theme.gold, marginTop: SPACING.xl }]}>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 20 }}>
                        {params.coach_note}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 12, letterSpacing: 2 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 60 },
  tabBar: { flexDirection: "row", height: 50, borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 25 },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabText: { fontSize: 11, letterSpacing: 1 },
  videoSection: { width: "100%" },
  videoWrapper: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    height: VIDEO_HEIGHT,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: "#000",
  },
  videoLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  videoFallbackText: {
    fontSize: 13,
    textAlign: "center",
  },
  watchYTBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  watchYTText: { fontSize: 13, color: "#000" },
  fallbackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  guideContainer: { marginTop: 30 },
  guideHeader: { fontSize: 15, letterSpacing: 3, marginBottom: 20 },
  bulletRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 14 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  bulletLabel: { fontSize: 13, lineHeight: 20, flex: 1 },
  proTipBox: { marginTop: 20, padding: 20, borderRadius: 18, borderLeftWidth: 4 },
  confirmBtn: { marginTop: 40, height: 60, borderRadius: 18, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  workoutSection: { width: "100%", alignItems: "center" },
  displayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingVertical: 30 },
  displayItem: { flex: 1, alignItems: "center" },
  displayLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: FONTS.bold },
  displayValue: { fontSize: 32 },
  vLine: { width: 1, height: 45, opacity: 0.2 },
  timerWrap: { marginVertical: 30, alignItems: "center" },
  timerPulse: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  timerDigit: { fontSize: 56 },
  skipTimer: { marginTop: 25, padding: 10 },
  executeWrap: { width: "100%", height: 250, justifyContent: "center", alignItems: "center" },
  executeBtn: { width: "100%", paddingVertical: 24, borderRadius: 22, alignItems: "center", shadowColor: "#C8A96E", shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  doneContainer: { alignItems: "center", paddingVertical: 40 },
  doneIconWrap: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, justifyContent: "center", alignItems: "center", marginBottom: 30 },
  doneHeading: { fontSize: 24, textAlign: "center", letterSpacing: 2 },
  doneInfo: { fontSize: 14, textAlign: "center", marginTop: 12, lineHeight: 22, opacity: 0.7 },
});
