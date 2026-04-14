import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { safeBack } from "../lib/safeBack";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import * as Haptics from "expo-haptics";
import { usePlan } from "../hooks/usePlan";

const PROTOCOLS = [
  { 
    id: "trial", 
    name: "Trial Protocol", 
    color: "#C8A96E",
    daily: ["Complete 1 Workout", "Read Wisdom Drops", "Basic App Access"] 
  },
  { 
    id: "alpha", 
    name: "Alpha Protocol", 
    color: "#4A90D9",
    daily: ["Access Alpha Training Programs", "Unlock Convo Lab AI", "Confidence Audio Modules", "Custom Diet Tracking"] 
  },
  { 
    id: "grind", 
    name: "Grind Protocol", 
    color: "#2ECC71",
    daily: ["Advanced Body Calculations", "Pro Supplement Scaffolding", "Priority Gym Routines"] 
  },
  { 
    id: "sigma", 
    name: "Sigma Protocol", 
    color: "#9B59B6",
    daily: ["Unlimited AI Mentor Scenarios", "Complete Library Access", "Full MAXX Ecosystem Unlocked"] 
  },
];

export default function RetentionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { handleGate } = usePlan();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [nofapTime, setNofapTime] = useState({ d: '0', h: '00', m: '00', s: '00' });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (!profile?.created_at) {
      setNofapTime({ d: '0', h: '00', m: '00', s: '00' });
      return;
    }
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const createdAt = new Date(profile.created_at).getTime();
      const trialEnds = createdAt + (7 * 24 * 60 * 60 * 1000);
      const diff = trialEnds - now;
      
      if (diff < 0) {
        setNofapTime({ d: '0', h: '00', m: '00', s: '00' });
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setNofapTime({ d: d.toString(), h: h.toString().padStart(2, '0'), m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [profile]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="nofap-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
          Retention Protocol
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
          <Text style={{ color: theme.textMuted, fontFamily: FONTS.semiBold, letterSpacing: 1.5, fontSize: 12 }}>
            FREE TRIAL TIME REMAINING
          </Text>
        </View>

        <View style={styles.streakCircleWrap}>
          <Animated.View style={[styles.streakCircle, { borderColor: theme.gold, transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.streakNum, { color: theme.gold, fontFamily: FONTS.bold }]}>{nofapTime.d}</Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>DAYS</Text>
          </Animated.View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 30 }}>
              <View style={{ alignItems: 'center', minWidth: 50 }}><Text style={{ fontSize: 26, fontFamily: FONTS.cinzelBold, color: theme.gold }}>{nofapTime.h}</Text><Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, letterSpacing: 1.5, fontFamily: FONTS.bold }}>HRS</Text></View>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 22, marginBottom: 18 }}>:</Text>
              <View style={{ alignItems: 'center', minWidth: 50 }}><Text style={{ fontSize: 26, fontFamily: FONTS.cinzelBold, color: theme.gold }}>{nofapTime.m}</Text><Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, letterSpacing: 1.5, fontFamily: FONTS.bold }}>MIN</Text></View>
              <Text style={{ color: 'rgba(255,255,255,0.1)', fontSize: 22, marginBottom: 18 }}>:</Text>
              <View style={{ alignItems: 'center', minWidth: 50 }}><Text style={{ fontSize: 26, fontFamily: FONTS.cinzelBold, color: theme.gold, width: 34, textAlign: 'center' }}>{nofapTime.s}</Text><Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, letterSpacing: 1.5, fontFamily: FONTS.bold }}>SEC</Text></View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DAILY PLAN CHECKLISTS</Text>
        
        {PROTOCOLS.map((p) => (
          <View key={p.id} style={[styles.protocolBox, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="shield" size={18} color={p.color} style={{ marginRight: 8 }} />
              <Text style={{ color: p.color, fontFamily: FONTS.cinzelBold, fontSize: 16, flex: 1 }}>{p.name}</Text>
              {p.id !== 'trial' && (
                <TouchableOpacity onPress={() => handleGate(p.id)} style={{ backgroundColor: theme.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 11, fontFamily: FONTS.semiBold }}>UPGRADE</Text>
                </TouchableOpacity>
              )}
            </View>
            {p.daily.map((task, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 12 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.color, marginRight: 10 }} />
                <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13 }}>{task}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ padding: 18, borderRadius: 16, alignItems: "center", backgroundColor: theme.gold }}
          >
            <Text style={{ color: "#0A0A0A", fontFamily: FONTS.cinzelBold, letterSpacing: 1.5 }}>
              MANAGE SUBSCRIPTION
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  streakCircleWrap: { alignItems: "center", marginBottom: SPACING.xl },
  streakCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  streakNum: { fontSize: 46 },
  streakLabel: { fontSize: 13, letterSpacing: 2 },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 1.2,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  protocolBox: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  actions: { marginTop: SPACING.lg, marginBottom: SPACING.lg },
});
