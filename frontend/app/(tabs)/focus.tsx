import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { PressableScale } from '../../src/components/PressableScale';

const TABS = ['Wisdom', 'Confidence', 'Supps'];

const SUPP_CATEGORIES = [
  { id: 'testosterone', name: 'Testosterone', icon: 'activity', color: GOLD, desc: 'Optimize T naturally with Ashwagandha, Zinc, Boron' },
  { id: 'focus', name: 'Focus Stack', icon: 'zap', color: '#4A90D9', desc: 'Lion\'s Mane, L-Theanine, Alpha GPC for mental clarity' },
  { id: 'recovery', name: 'Recovery', icon: 'moon', color: '#9B59B6', desc: 'Magnesium Glycinate, Creatine, NMN for faster recovery' },
  { id: 'physique', name: 'Physique', icon: 'trending-up', color: '#2ECC71', desc: 'Whey Protein, Creatine, Omega-3 for muscle building' },
  { id: 'mood', name: 'Mood & Drive', icon: 'sun', color: '#E67E22', desc: 'Rhodiola, Vitamin D3, Tyrosine for motivation' },
  { id: 'sleep', name: 'Sleep Quality', icon: 'eye-off', color: '#8E44AD', desc: 'Glycine, L-Theanine, Melatonin for deep sleep' },
];

const FALLBACK_CARD = {
  quote: 'Discipline is the bridge between goals and accomplishment.',
  author: 'Jim Rohn',
  lesson: 'Every action you take is a vote for the person you wish to become.',
  action_today: 'Write down your top goal and one action you will take today.',
};

const CONFIDENCE_MODULES = [
  { id: 'voice', title: 'Voice & Tonality', icon: 'mic', xp: 20, duration: '8 min', description: 'Lower your pitch, slow down, project confidence through sound.' },
  { id: 'posture', title: 'Power Posture', icon: 'user', xp: 15, duration: '5 min', description: 'Chest up, shoulders back, chin parallel to the ground. Hormones follow form.' },
  { id: 'eye_contact', title: 'Eye Contact Drill', icon: 'eye', xp: 25, duration: '10 min', description: 'Maintain eye contact until the other person breaks first. Practice daily.' },
  { id: 'frame', title: 'Frame Control', icon: 'shield', xp: 30, duration: '12 min', description: 'Your reality is the one that matters. Never react — respond.' },
  { id: 'walk', title: 'The Walk', icon: 'trending-up', xp: 10, duration: '3 min', description: 'Slow down. Take up space. Walk like you own the room.' },
  { id: 'cold_approach_prep', title: 'Approach Mindset', icon: 'compass', xp: 35, duration: '15 min', description: 'Rejection is irrelevant data. Approach as an experiment, not a test.' },
];

export default function FocusScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Wisdom');
  const [wisdomCard, setWisdomCard] = useState<any>(null);
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchWisdom();
    fetchCompletedModules();
  }, [user]);

  const fetchWisdom = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try today's card first
      const { data: todayCard } = await supabase
        .from('wisdom_cards')
        .select('*')
        .eq('card_date', today)
        .maybeSingle();

      if (todayCard) {
        setWisdomCard(todayCard);
      } else {
        // Fallback to most recent
        const { data: recent } = await supabase
          .from('wisdom_cards')
          .select('*')
          .order('card_date', { ascending: false })
          .limit(1);
        setWisdomCard(recent?.[0] || FALLBACK_CARD);
      }

      // Recent 7 cards
      const { data: last7 } = await supabase
        .from('wisdom_cards')
        .select('*')
        .order('card_date', { ascending: false })
        .limit(7);
      setRecentCards(last7 || []);

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {
      setWisdomCard(FALLBACK_CARD);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedModules = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('xp_log')
        .select('reason')
        .eq('user_id', user.id)
        .like('reason', 'Confidence module:%');
      setCompletedModules((data || []).map((d: any) => d.reason?.replace('Confidence module:', '').trim()));
    } catch (e) {
      console.log('Modules fetch error:', e);
    }
  };

  const handleFavorite = async () => {
    if (!user || !wisdomCard?.id || favorited) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorited(true);
    try {
      await supabase.from('wisdom_favorites').insert({ user_id: user.id, card_id: wisdomCard.id });
    } catch (e) {
      console.log('Favorite error:', e);
    }
  };

  const handleShare = async () => {
    if (!wisdomCard) return;
    try {
      await Share.share({
        message: `"${wisdomCard.quote}" — ${wisdomCard.author}\n\n📱 MAXX App`,
      });
    } catch (e) {}
  };

  const completeModule = async (mod: any) => {
    if (!user || completedModules.includes(mod.id)) {
      Alert.alert('Already Done', 'You completed this module today.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletedModules(prev => [...prev, mod.id]);
    try {
      await supabase.from('xp_log').insert({
        user_id: user.id,
        amount: mod.xp,
        reason: `Confidence module: ${mod.id}`,
        created_at: new Date().toISOString(),
      });
    } catch (e) {}
  };

  const WisdomView = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {loading ? (
        <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
      ) : !wisdomCard ? (
        <EmptyState icon="sun" title="No Wisdom Today" subtitle="Check back tomorrow for your daily card." />
      ) : (
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Main Quote Card */}
          <View style={[styles.quoteCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold + '40' }]}>
            <Text style={[styles.quoteText, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
              "{wisdomCard.quote}"
            </Text>
            <Text style={[styles.quoteAuthor, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
              — {wisdomCard.author || 'Unknown'}
            </Text>

            {wisdomCard.lesson && (
              <View style={[styles.lessonBox, { backgroundColor: theme.bgElevated }]}>
                <Text style={[styles.lessonLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>THE LESSON</Text>
                <Text style={[styles.lessonText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{wisdomCard.lesson}</Text>
              </View>
            )}

            {wisdomCard.action_today && (
              <View style={[styles.actionBox, { borderLeftColor: theme.gold }]}>
                <Text style={[styles.lessonLabel, { color: theme.gold, fontFamily: FONTS.bold }]}>ACTION TODAY</Text>
                <Text style={[styles.lessonText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{wisdomCard.action_today}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={handleFavorite}
                style={[styles.cardActionBtn, { backgroundColor: favorited ? theme.gold + '22' : theme.bgElevated }]}
              >
                <Feather name="heart" size={16} color={favorited ? theme.gold : theme.textMuted} />
                <Text style={[{ color: favorited ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold, fontSize: 12 }]}>
                  {favorited ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.cardActionBtn, { backgroundColor: theme.bgElevated }]}
              >
                <Feather name="share-2" size={16} color={theme.textMuted} />
                <Text style={[{ color: theme.textMuted, fontFamily: FONTS.semiBold, fontSize: 12 }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent drops */}
          {recentCards.length > 0 && (
            <View style={{ marginTop: SPACING.lg }}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>RECENT DROPS</Text>
              {recentCards.map((card, i) => (
                <View key={card.id || i} style={[styles.recentCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 13, lineHeight: 20 }]}>"{card.quote}"</Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 4 }]}>— {card.author}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );

  const ConfidenceView = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: FONTS.bold, marginBottom: SPACING.md }]}>
        CONFIDENCE MODULES
      </Text>
      {CONFIDENCE_MODULES.map(mod => {
        const done = completedModules.includes(mod.id);
        return (
          <PressableScale
            key={mod.id}
            onPress={() => completeModule(mod)}
            style={[styles.modCard, { backgroundColor: theme.bgSurface, borderColor: done ? theme.gold + '50' : theme.border }]}
          >
            <View style={[styles.modIcon, { backgroundColor: done ? theme.gold + '20' : theme.bgElevated }]}>
              <Feather name={mod.icon as any} size={20} color={done ? theme.gold : theme.textSecondary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 15 }]}>{mod.title}</Text>
              <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2, lineHeight: 18 }]}>{mod.description}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 11 }]}>+{mod.xp} XP</Text>
                <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11 }]}>{mod.duration}</Text>
              </View>
            </View>
            <Feather name={done ? 'check-circle' : 'circle'} size={20} color={done ? theme.gold : theme.textMuted} />
          </PressableScale>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Focus</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingHorizontal: SPACING.lg }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            style={[styles.tabBtn, { borderBottomColor: activeTab === tab ? theme.gold : 'transparent', borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textMuted, fontFamily: activeTab === tab ? FONTS.bold : FONTS.regular }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Wisdom' ? <WisdomView /> : activeTab === 'Confidence' ? <ConfidenceView /> : <SuppsView />}
    </SafeAreaView>
  );
}

function SuppsView() {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100, backgroundColor: '#0A0A0A' }} showsVerticalScrollIndicator={false} style={{ backgroundColor: '#0A0A0A' }}>
      {/* Hero */}
      <View style={[suppStyles.heroCard, { backgroundColor: GOLD + '12', borderColor: GOLD + '30' }]}>
        <Feather name="package" size={24} color={GOLD} />
        <Text style={[suppStyles.heroTitle, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>SUPPLEMENT STACK</Text>
        <Text style={[suppStyles.heroSub, { color: '#9A9A9A', fontFamily: FONTS.regular }]}>
          Evidence-based protocols for men who want more.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/supplements' as any)}
          style={[suppStyles.heroBtn, { backgroundColor: GOLD }]}
        >
          <Feather name="layers" size={14} color="#000" />
          <Text style={[{ color: '#000', fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }]}>OPEN FULL DECK</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: SPACING.md }]}>
        STACK CATEGORIES
      </Text>
      {SUPP_CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          onPress={() => router.push('/supplements' as any)}
          style={[suppStyles.catCard, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}
          activeOpacity={0.8}
        >
          <View style={[suppStyles.catIcon, { backgroundColor: cat.color + '18' }]}>
            <Feather name={cat.icon as any} size={18} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14, marginBottom: 3 }]}>{cat.name}</Text>
            <Text style={[{ color: '#606060', fontFamily: FONTS.regular, fontSize: 12 }]}>{cat.desc}</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#606060" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  title: { fontSize: 28 },
  tabBar: { flexDirection: 'row', marginBottom: SPACING.md, gap: 4 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: SPACING.md, marginRight: 8 },
  tabText: { fontSize: 14 },
  tabContent: { padding: SPACING.lg, paddingBottom: 100 },
  quoteCard: { padding: SPACING.xl, borderRadius: RADIUS.xl, borderWidth: 1 },
  quoteText: { fontSize: 18, lineHeight: 30, marginBottom: SPACING.md },
  quoteAuthor: { fontSize: 14, marginBottom: SPACING.lg },
  lessonBox: { padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  lessonLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  lessonText: { fontSize: 13, lineHeight: 21 },
  actionBox: { padding: SPACING.md, borderLeftWidth: 3, marginBottom: SPACING.md },
  cardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5 },
  recentCard: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  modCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  modIcon: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
});

const suppStyles = StyleSheet.create({
  heroCard: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  heroTitle: { fontSize: 18, letterSpacing: 3 },
  heroSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  heroBtn: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.sm },
  catCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  catIcon: { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
});
