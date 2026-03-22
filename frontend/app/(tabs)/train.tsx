import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CaptainCard } from '../../src/components/CaptainCard';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const SUB_TABS = ['Jaw & Face', 'Body', 'Posture', 'Nutrition', 'Guides'] as const;
type SubTab = typeof SUB_TABS[number];

export default function TrainScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>('Jaw & Face');
  const [nofapDays, setNofapDays] = useState(0);

  useEffect(() => {
    const nofapStreak = profile?.streaks?.find((s: any) => s.type === 'nofap');
    if (nofapStreak && nofapStreak.start_date) {
        const start = new Date(nofapStreak.start_date).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setNofapDays(days);
    }
  }, [profile]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="train-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>The Captain's Gym</Text>
        <View style={[styles.captainBadge, { backgroundColor: theme.bgElevated }]}>
          <Text style={{ fontSize: 16 }}>🎯</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {SUB_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabPill, { backgroundColor: activeTab === tab ? theme.bgElevated : theme.bgSurface }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.contentWrap}>
        {activeTab === 'Jaw & Face' && <ProgramsTab category="jaw_face" theme={theme} />}
        {activeTab === 'Body' && <ProgramsTab category="body" theme={theme} />}
        {activeTab === 'Posture' && <ProgramsTab category="posture" theme={theme} />}
        {activeTab === 'Nutrition' && <NutritionTab theme={theme} />}
        {activeTab === 'Guides' && <GuidesTab theme={theme} />}
      </View>
      
      {/* Floating NoFap Tracker */}
      <TouchableOpacity 
         onPress={() => router.push('/nofap')}
         style={[styles.nofapFloat, { backgroundColor: theme.bgElevated, borderColor: theme.gold }]}>
        <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 12 }}>NoFap 🔥 {nofapDays}d</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function ProgramsTab({ category, theme }: { category: string; theme: any }) {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchPrograms();
  }, [category, profile]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase.from('training_programs').select('*').eq('category', category);
    if (!error && data && data.length > 0) {
      const progs = data.map(p => {
         // Determine lock state based on power_level or plan
         let isLocked = false;
         if (p.required_level && (profile?.power_level || 1) < p.required_level) isLocked = true;
         if (p.required_plan && profile?.plan === 'free_tier') isLocked = true;
         return { ...p, locked: isLocked };
      });
      setPrograms(progs);
    } else {
        // Fallback mock
        setPrograms([
            { id: '1', title: 'Mewing Mastery', difficulty: 'Beginner', duration: '4 weeks', locked: false, progress: 0.2 },
            { id: '2', title: 'Iron Jaw', difficulty: 'Intermediate', duration: '6 weeks', locked: (profile?.power_level || 1) < 50, required_plan: 'Alpha' }
        ]);
    }
  };

  const handlePress = (prog: any) => {
      if (prog.locked) {
          router.push('/plans');
      } else {
          router.push(`/exercise?id=${prog.id}&name=${encodeURIComponent(prog.title)}&sets=3&hold=45&rest=30&xp=50`);
      }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {category === 'body' && (
        <View style={[styles.badgeContainer, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
          <Text style={{ color: '#2ecc71', fontSize: 11, fontFamily: FONTS.medium }}>Natural Max — No TRT · No PEDs · No Steroids</Text>
        </View>
      )}
      
      {category === 'posture' && (
        <Card style={StyleSheet.flatten([styles.featureCard, { borderColor: theme.gold }])}>
          <Text style={[styles.featureTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            Fix Your Posture = Look Taller Instantly
          </Text>
          <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
            Height is status. Don't lose 2 inches to bad habits.
          </Text>
        </Card>
      )}

      {programs.map((prog) => (
        <TouchableOpacity key={prog.id} onPress={() => handlePress(prog)} activeOpacity={0.9} style={{ marginBottom: SPACING.md }}>
          <Card style={StyleSheet.flatten([styles.progCard, { borderColor: prog.locked ? theme.border : theme.gold, opacity: prog.locked ? 0.6 : 1 }])}>
            <View style={styles.progHeader}>
              <View>
                <Text style={[styles.progTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{prog.title}</Text>
                <Text style={[styles.progSub, { color: theme.textMuted }]}>{prog.duration} · {prog.difficulty}</Text>
              </View>
              {prog.locked ? (
                 <Feather name="lock" size={18} color={theme.textMuted} />
              ) : (
                 <Badge label={prog.progress > 0 ? `${Math.round(prog.progress * 100)}%` : 'START'} />
              )}
            </View>
            {!prog.locked && (
                <View style={[styles.progressBarBg, { backgroundColor: theme.bgElevated }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: theme.gold, width: `${(prog.progress || 0) * 100}%` }]} />
                </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function NutritionTab({ theme }: { theme: any }) {
  const router = useRouter();
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    // Mock
    setGuides([
        { id: '1', title: 'The Looksmaxx Diet', category: 'Fundamentals', read_time: '5 min' },
        { id: '2', title: 'Testosterone Foods', category: 'Hormones', read_time: '8 min' }
    ]);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <CaptainCard title="The Captain on Diet">
        "You are what you eat. If you eat processed garbage, you look like garbage. Fuel the machine."
      </CaptainCard>
      
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>GUIDES</Text>
      {guides.map((g) => (
        <TouchableOpacity key={g.id}>
          <Card style={styles.guideCard}>
            <View>
              <Text style={[styles.guideTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{g.title}</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>{g.category} · {g.read_time}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Card>
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: SPACING.xl }}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SUPPLEMENT STACK</Text>
        <Card style={styles.stackCard}>
            <Text style={[styles.stackTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>Generate My Stack</Text>
            <Text style={[styles.stackDesc, { color: theme.textSecondary }]}> AI-customized supplements based on your goals.</Text>
            <TouchableOpacity onPress={() => router.push('/supplements')} style={[styles.genBtn, { backgroundColor: theme.bgElevated }]}>
                <Text style={{ color: theme.gold, fontFamily: FONTS.bold }}>BUILD STACK</Text>
            </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

function GuidesTab({ theme }: { theme: any }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <CaptainCard>
        "Knowledge is only power if applied. Read these, then execute."
      </CaptainCard>
      <Card style={styles.guideCard}>
        <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>Skin Care 101</Text>
        <Text style={[styles.guideSub, { color: theme.textMuted }]}>Clear skin = status</Text>
      </Card>
      <Card style={styles.guideCard}>
        <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>Style Theory</Text>
        <Text style={[styles.guideSub, { color: theme.textMuted }]}>Dress like a king</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  title: { fontSize: 24 },
  captainBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tabScroll: { marginTop: SPACING.md, maxHeight: 48 },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  tabPill: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.sm },
  tabText: { fontSize: 13 },
  contentWrap: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 80 },
  badgeContainer: { padding: 8, borderRadius: 8, marginBottom: SPACING.md, alignItems: 'center' },
  featureCard: { marginBottom: SPACING.md, padding: SPACING.lg, borderWidth: 1, backgroundColor: 'rgba(200,169,110,0.05)' },
  featureTitle: { fontSize: 16, marginBottom: 4 },
  featureDesc: { fontSize: 12 },
  progCard: { padding: SPACING.lg, borderWidth: 1 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  progTitle: { fontSize: 16 },
  progSub: { fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 4, width: '100%', borderRadius: 2 },
  progressBarFill: { height: 4, borderRadius: 2 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: SPACING.sm },
  guideCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginBottom: SPACING.sm },
  guideTitle: { fontSize: 15 },
  guideSub: { fontSize: 12, marginTop: 2 },
  stackCard: { padding: SPACING.lg, alignItems: 'center' },
  stackTitle: { fontSize: 18, marginBottom: 4 },
  stackDesc: { fontSize: 12, textAlign: 'center', marginBottom: SPACING.md },
  genBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: SPACING.sm },
  nofapFloat: { position: 'absolute', bottom: 20, right: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, elevation: 5 },
});
