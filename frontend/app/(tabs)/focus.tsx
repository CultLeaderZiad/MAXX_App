import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, Animated, Easing, Share, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiCall } from '../../lib/api';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

const TABS = ['Wisdom', 'Confidence', 'Convo Lab'];

// ─── Confidence Modules ───────────────────────────────────────────────────────
const CONFIDENCE_MODULES = [
  {
    id: 1, title: 'Body Language Blueprint', plan: 'trial', duration: '5 min', xp: 30,
    content: 'Your body speaks before your mouth opens. 55% of communication is non-verbal.\n\nEye contact: hold it 3 seconds naturally.\n\nPosture: shoulders back, chest open. Slow down movement by 20%.\n\nVoice: speak from your chest. Pause before answering.',
    challenge: 'For the next 24 hours: hold eye contact 1 second longer than feels comfortable.'
  },
  {
    id: 2, title: 'Rejection Mastery', plan: 'trial', duration: '5 min', xp: 30,
    content: 'Rejection is data. Not judgment.\n\nThe man who approaches 100 women and gets rejected 85 times has more data than the man who gave up after 3.\n\nReframe: rejection means you are in the game.',
    challenge: 'Ask for something today where the answer might be no.'
  },
  {
    id: 3, title: 'Social Dynamics', plan: 'alpha', duration: '6 min', xp: 35,
    content: 'Every room has a social hierarchy. Entry: do not announce yourself. Enter calmly.\n\nLeading: make decisions. Suggest the venue. People follow those who move with certainty.',
    challenge: 'In your next social situation, speak 30% less than usual. Observe.'
  },
  {
    id: 4, title: 'Scarcity and Value', plan: 'alpha', duration: '5 min', xp: 30,
    content: 'Availability kills attraction. This is supply and demand applied to social dynamics.\n\nThe cure: have things you will not cancel. Training. Reading. Work.',
    challenge: 'Today: do not cancel any plan for anyone who does not deserve that priority.'
  },
  {
    id: 5, title: 'Identity vs Performance', plan: 'alpha', duration: '6 min', xp: 35,
    content: 'Most men perform confidence rather than having it.\n\nReal confidence: you do not need approval. You do not need to win every argument.',
    challenge: 'Notice one moment today when you seek approval. Catch it. Do not act on it.'
  },
  {
    id: 6, title: 'Sigma Presence', plan: 'sigma', duration: '7 min', xp: 50,
    content: 'Sigma is not a social rank. It is an operating mode.\n\nThe Sigma does not need the room to recognize him. He is not performing for the room.\n\nThis is the endpoint of all confidence work.',
    challenge: 'Define one personal standard today that you will not explain to anyone.'
  },
  {
    id: 7, title: 'Voice Tonality Mastery', plan: 'grind', duration: '5 min', xp: 35,
    content: 'Your voice is your instrument of influence. A deep, steady tone communicates authority.\n\nSpeak from your diaphragm, not your throat. Drop your pitch at the end of sentences — rising pitch sounds uncertain.\n\nPace: slightly slower than conversational speed. Pauses are power.',
    challenge: 'Record yourself talking for 2 minutes. Listen back. Identify one thing to improve.'
  },
  {
    id: 8, title: 'Emotional Control Under Pressure', plan: 'grind', duration: '6 min', xp: 40,
    content: 'Emotions are data, not directives. The man who reacts emotionally has given away his power.\n\nWhen provoked: breathe once, think twice, speak once.\n\nNever make a decision in the peak of emotion. The strongest response is often no response at all.',
    challenge: 'Today, when you feel irritated or anxious, wait 10 seconds before responding to anything.'
  },
  {
    id: 9, title: 'Storytelling & Narrative Power', plan: 'alpha', duration: '7 min', xp: 45,
    content: 'Facts tell. Stories sell. The most charismatic people in any room are storytellers.\n\nStructure: Setup → Tension → Resolution. Every story needs a lesson or emotional peak.\n\nDetails matter: "a red 1967 Mustang" hits harder than "a car."',
    challenge: 'Prepare one 2-minute personal story. Tell it to someone today. Notice their reaction.'
  },
  {
    id: 10, title: 'The Abundance Mindset', plan: 'sigma', duration: '8 min', xp: 55,
    content: 'Scarcity thinking: "She is the only one. I cannot lose this opportunity."\n\nAbundance thinking: "This is one of many opportunities. If this does not work, another will."\n\nAbundance is not arrogance. It is the deep knowing that your value does not depend on any single outcome.\n\nThis applies to women, jobs, friendships, and investments. The man with options never seems desperate — because he is not.',
    challenge: 'Identify one area where you are operating from scarcity. Write down 3 alternative options you have not considered.'
  }
];

// ─── Convo Scenarios ──────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'first_date', title: 'First Date', difficulty: 'EASY', desc: 'Break the ice and build rapport over coffee.', plan: 'trial', category: 'dating',
    prompt: 'You are a young woman on a first date at a coffee shop. React realistically — sometimes engaged, sometimes reserved. After 8 exchanges give a score 1-10 and feedback.' },
  { id: 'cold_approach', title: 'Street Cold Approach', difficulty: 'HARD', desc: 'Stop her on the street naturally.', plan: 'trial', category: 'dating',
    prompt: 'You are a young woman walking on a street. A man just stopped you. You are slightly surprised. React naturally. After 6 exchanges give feedback on the opener and delivery.' },
  { id: 'gym_approach', title: 'Gym Approach', difficulty: 'HARD', desc: 'Navigate the tricky gym environment.', plan: 'grind', category: 'dating',
    prompt: 'You are a woman working out at the gym in between sets. A guy approaches you. Be slightly guarded but open if his social calibration is perfect. After 6 exchanges give feedback.' },
  { id: 'bar_approach', title: 'Bar / Club Approach', difficulty: 'MEDIUM', desc: 'High energy environment, push through the noise.', plan: 'grind', category: 'dating',
    prompt: 'You are a woman at a loud bar. You are with a friend. A guy approaches. React to his energy. Give feedback after 6 exchanges.' },
  { id: 'library_approach', title: 'Library / Bookstore Approach', difficulty: 'MEDIUM', desc: 'Low energy, intellectual vibe.', plan: 'alpha', category: 'dating',
    prompt: 'You are a woman browsing books. A guy approaches. Be interested but keep your voice down. Gauge his intellectual connection. Feedback after 6 exchanges.' },
  { id: 'number_close', title: 'The Number Close', difficulty: 'MEDIUM', desc: 'Transition from small talk to getting the number.', plan: 'alpha', category: 'dating',
    prompt: 'You have been talking to a guy for 5 minutes. It went well. He is now trying to get your number. Put up a slight objection to test his frame. Feedback after 4 exchanges.' },
  { id: 'texting_game', title: 'Texting Game', difficulty: 'EASY', desc: 'Move from text to date.', plan: 'sigma', category: 'dating',
    prompt: 'You are a girl who met this guy once. He is texting you. You are slightly interested but testing. After 6 texts give feedback on whether he could have gotten a date.' },
  { id: 'salary_negotiation', title: 'Salary Negotiation', difficulty: 'MEDIUM', desc: 'Get what you are worth.', plan: 'grind', category: 'professional',
    prompt: 'You are a hiring manager. The candidate is negotiating salary. Be firm but fair. After 6 exchanges give feedback.' },
  { id: 'conflict_frame', title: 'Hold Your Frame', difficulty: 'MEDIUM', desc: 'Disagree without backing down.', plan: 'alpha', category: 'social',
    prompt: 'You are a peer who disagrees strongly. Push back firmly. After 6 exchanges give feedback on how well he maintained his frame.' },
  { id: 'group_social', title: 'Group Social', difficulty: 'HARD', desc: 'Own the room.', plan: 'alpha', category: 'social',
    prompt: 'You are part of a social group. The user is trying to integrate. React realistically. After 8 exchanges give score and feedback.' },
  { id: 'friend_zone_escape', title: 'Friend Zone Escape', difficulty: 'HARD', desc: 'Shift from friend to romantic interest.', plan: 'grind', category: 'dating',
    prompt: 'You are a girl who sees this guy as a close friend. He is trying to shift the dynamic towards romantic interest. React naturally — be slightly confused but open. After 6 exchanges give feedback on how well he escalated.' },
  { id: 'mentor_connection', title: 'Mentor Connection', difficulty: 'MEDIUM', desc: 'Impress a successful mentor at an event.', plan: 'trial', category: 'professional',
    prompt: 'You are a successful entrepreneur at a networking event. A young man approaches you for mentorship. Be selective — only invest time in someone with drive and vision. After 6 exchanges give feedback on their approach.' },
  { id: 'group_amog', title: 'Group Dominance (AMOG)', difficulty: 'HARD', desc: 'Handle a competing alpha in the group.', plan: 'sigma', category: 'social',
    prompt: 'You are a dominant guy in a social group. Another guy is trying to establish presence. Test him subtly — interrupt, challenge, redirect attention. After 6 exchanges give score on how well he handled social pressure.' },
  { id: 'ex_conversation', title: 'Post-Breakup Frame', difficulty: 'HARD', desc: 'Handle an ex reaching out without losing frame.', plan: 'alpha', category: 'dating',
    prompt: 'You are an ex-girlfriend reaching out after 3 months of no contact. You miss the connection but testing if he has changed. React to his emotional control. After 6 exchanges give feedback.' },
  { id: 'interview_alpha', title: 'Leadership Interview', difficulty: 'MEDIUM', desc: 'Show authority in a job interview.', plan: 'grind', category: 'professional',
    prompt: 'You are a panel interviewer for a leadership position. Ask challenging behavioral questions. Evaluate the candidate on confidence, clarity, and leadership presence. After 6 exchanges give score and feedback.' },
  // ─── NEW EXPANDED SCENARIOS ─────────────────────────────────────────────────
  { id: 'networking_event', title: 'Networking Event Power Move', difficulty: 'MEDIUM', desc: 'Work a room and make 3 valuable connections.', plan: 'grind', category: 'professional',
    prompt: 'You are an investor at a networking event. Someone young approaches you. Be polite but busy. Only engage deeply if their pitch is compelling. After 6 exchanges give detailed feedback on their networking skills.' },
  { id: 'confrontation', title: 'Verbal Confrontation', difficulty: 'HARD', desc: 'De-escalate a heated argument without backing down.', plan: 'alpha', category: 'social',
    prompt: 'You are angry and confrontational. Someone bumped into you and you blame them. You are testing their emotional control. After 6 exchanges give feedback on emotional regulation and assertiveness.' },
  { id: 'social_proof', title: 'The Social Proof Approach', difficulty: 'MEDIUM', desc: 'Leverage social proof to attract attention.', plan: 'alpha', category: 'dating',
    prompt: 'You are at a social gathering. A guy who seems popular approaches you. You notice others seem to know him. React based on how well he leverages his social status without bragging. After 6 exchanges give feedback.' },
  { id: 'boundary_setting', title: 'Setting Boundaries', difficulty: 'MEDIUM', desc: 'Say no without losing the relationship.', plan: 'trial', category: 'social',
    prompt: 'You are a close friend asking for a big favor. When declined, push back emotionally. Test if the user can maintain their boundary while keeping the friendship intact. After 6 exchanges give feedback.' },
  { id: 'public_speaking', title: 'Public Speaking Challenge', difficulty: 'HARD', desc: 'Handle tough audience questions after a speech.', plan: 'sigma', category: 'professional',
    prompt: 'You are a skeptical audience member who just heard a presentation. Ask challenging, even slightly hostile questions. Evaluate the speaker on composure, clarity, and assertiveness. After 6 exchanges give score and feedback.' },
  { id: 'parent_conversation', title: 'Serious Talk with Parents', difficulty: 'MEDIUM', desc: 'Share your unconventional life plan with family.', plan: 'grind', category: 'social',
    prompt: 'You are a concerned parent. Your son is telling you he wants to drop out and pursue entrepreneurship. Be worried but not dismissive. After 6 exchanges give feedback on how he communicated conviction and respect.' },
  { id: 'dating_app_openers', title: 'Dating App Texting', difficulty: 'EASY', desc: 'Stand out from 100 other matches.', plan: 'trial', category: 'dating',
    prompt: 'You are a woman on a dating app. You match with lots of guys. This one just messaged you. Be realistic — most openers bore you. Only engage if his message is creative and non-needy. After 6 messages give detailed feedback.' },
];

// ─── Convo Lab Guidelines ─────────────────────────────────────────────────────
const CONVO_GUIDELINES = [
  {
    title: 'Frame Control',
    icon: '🎯',
    points: [
      'Never enter someone else\'s frame — always lead the conversation',
      'If she tests you, pass by staying calm and amused',
      'Frame = reality. Whoever\'s frame is stronger dictates the dynamic',
      'Don\'t explain yourself excessively — confident people state, not justify',
    ]
  },
  {
    title: 'Listening & Calibration',
    icon: '👂',
    points: [
      'Listen 70%, talk 30% — especially in early interactions',
      'Mirror body language subtly (leaning, pace, energy)',
      'Read the room: high energy environment = high energy approach',
      'Silence is power — don\'t fill every gap',
    ]
  },
  {
    title: 'Openers That Work',
    icon: '💬',
    points: [
      'Situational openers > generic pickup lines',
      'State an observation, then ask a follow-up',
      'Never start with "Hey" or "What\'s up" on dating apps',
      'Be specific: "I noticed your book..." beats "You\'re cute"',
    ]
  },
  {
    title: 'Escalation Ladder',
    icon: '📈',
    points: [
      'Verbal → Light touch → More presence → Ask for number/date',
      'Never skip steps — calibrate based on her comfort',
      'If she pulls back, hold your ground but don\'t push',
      'The close should feel natural, not forced',
    ]
  },
  {
    title: 'Professional Communication',
    icon: '💼',
    points: [
      'Speak with authority: fewer words, more impact',
      'In negotiations, the first to speak after a number loses',
      'Always know your walk-away point before entering any negotiation',
      'Use silence strategically — it creates pressure on the other side',
    ]
  },
];

const RECOMMENDED_RESOURCES = [
  { title: 'Models — Mark Manson', type: 'Book', desc: 'Honest self-improvement approach to dating and attraction.' },
  { title: 'The Rational Male — Rollo Tomassi', type: 'Book', desc: 'Understanding intersexual dynamics and male sexual strategy.' },
  { title: 'How to Win Friends — Dale Carnegie', type: 'Book', desc: 'Timeless interpersonal communication fundamentals.' },
  { title: '48 Laws of Power — Robert Greene', type: 'Book', desc: 'Strategic social dynamics and power plays.' },
  { title: 'Never Split the Difference — Chris Voss', type: 'Book', desc: 'FBI negotiation tactics applied to everyday life.' },
  { title: 'Charisma on Command', type: 'YouTube', desc: 'Practical breakdowns of charisma, body language, and social skills.' },
  { title: 'The Art of Manliness', type: 'Podcast', desc: 'Conversations on developing masculine virtues and skills.' },
  { title: 'Jocko Willink — Discipline Equals Freedom', type: 'Book', desc: 'Navy SEAL mindset applied to discipline and leadership.' },
];

export default function FocusScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Wisdom');
  const userPlan = profile?.plan || 'trial';

  useEffect(() => {
    // If we have a specific tab in params, switch to it
    if (params.tab && params.tab !== activeTab) {
      setActiveTab(params.tab as string);
    }
    // If we have a scenario, it forces Convo Lab
    else if (params.scenario) {
      setActiveTab('Convo Lab');
    }
    // We don't want to force "Convo Lab" if the user is just clicking the tab bar normally
  }, [params.tab, params.scenario]);

  const handleTabChange = (tab: string) => {
    // Clear any temporary navigation params when switching tabs manually
    setActiveTab(tab);
    // Note: We don't explicitly clear params here as they are managed by the router,
    // but the useEffect dependency on specific params ensures we don't "stick"
  };

  const canAccessPlan = (required: string) => {
    const order: Record<string, number> = { trial: 0, free_trial: 0, grind: 1, alpha: 2, sigma: 3 };
    return (order[userPlan] ?? 0) >= (order[required] ?? 0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="focus-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Focus</Text>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, { backgroundColor: activeTab === tab ? 'rgba(200,169,110,0.1)' : 'transparent' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.flex}>
        {activeTab === 'Wisdom' && <WisdomView theme={theme} user={user} />}
        {activeTab === 'Confidence' && <ConfidenceView theme={theme} user={user} canAccess={canAccessPlan} userPlan={userPlan} />}
        {activeTab === 'Convo Lab' && <ConvoLabView theme={theme} user={user} canAccess={canAccessPlan} userPlan={userPlan} initialScenarioId={params.scenario} />}
      </View>
    </SafeAreaView>
  );
}

// ─── Wisdom View ──────────────────────────────────────────────────────────────
function WisdomView({ theme, user }: any) {
  const [card, setCard] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [cardRes, mentorRes, recentRes] = await Promise.all([
        supabase.from('wisdom_cards').select('*').eq('card_date', today).eq('is_active', true).maybeSingle(),
        supabase.from('mentors').select('*').eq('is_active', true),
        supabase.from('wisdom_cards').select('quote, author, card_date').order('card_date', { ascending: false }).limit(7)
      ]);

      if (cardRes.data) {
        setCard(cardRes.data);
      } else {
        // Fallback to most recent
        const { data: fallback } = await supabase.from('wisdom_cards').select('*').order('card_date', { ascending: false }).limit(1).maybeSingle();
        setCard(fallback);
      }
      setMentors(mentorRes.data || []);
      setRecentCards(recentRes.data || []);
    } catch (e) {
      console.log('Wisdom fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || !card) return;
    try {
      await supabase.from('wisdom_favorites').insert({ user_id: user.id, wisdom_card_id: card.id });
      Alert.alert('Saved', 'Added to your wisdom collection.');
    } catch (e) {}
  };

  const handleShare = async () => {
    if (!card) return;
    try {
      await Share.share({ message: `"${card.quote}"\n— ${card.author}\n\nFrom MAXX App` });
    } catch (e) {}
  };

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.gold} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Today's card */}
      <View style={[styles.wisdomCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Text style={[styles.wisdomLabel, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>TODAY'S WISDOM DROP</Text>
        <Text style={[styles.quote, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
          "{card?.quote || 'Discipline is not punishment. It is the price of becoming.'}"
        </Text>
        <Text style={[styles.author, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>— {card?.author || 'MAXX Doctrine'}</Text>
        {card?.lesson ? (
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 8, lineHeight: 20 }}>{card.lesson}</Text>
        ) : null}
        {card?.action_today ? (
          <View style={{ marginTop: 12, backgroundColor: theme.bgElevated, borderRadius: 10, padding: 12 }}>
            <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 12 }}>TODAY'S ACTION</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>{card.action_today}</Text>
          </View>
        ) : null}
        <View style={styles.wisdomActions}>
          <TouchableOpacity onPress={handleBookmark} style={[styles.actionBtn, { backgroundColor: theme.bgElevated }]}>
            <Feather name="bookmark" size={16} color={theme.gold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: theme.bgElevated }]}>
            <Feather name="share-2" size={16} color={theme.gold} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mentor profiles */}
      {mentors.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MENTOR PROFILES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mentorScroll}>
            {mentors.map((m: any) => (
              <TouchableOpacity key={m.id} style={[styles.mentorCard, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
                <View style={[styles.mentorAvatar, { backgroundColor: theme.bgSurface }]}>
                  <Text style={{ fontSize: 24 }}>{m.avatar_emoji || '👤'}</Text>
                </View>
                <Text style={[styles.mentorName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{m.name}</Text>
                <Text style={[styles.mentorTitle, { color: theme.textMuted }]}>{m.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Recent wisdom */}
      {recentCards.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: SPACING.lg }]}>RECENT DROPS</Text>
          {recentCards.slice(1).map((c: any, i: number) => (
            <View key={i} style={[styles.quoteSmall, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <Text style={[styles.quoteTextSmall, { color: theme.textSecondary, fontFamily: FONTS.semiBold }]}>"{c.quote}"</Text>
              <Text style={[styles.authorSmall, { color: theme.textMuted, fontFamily: FONTS.regular }]}>— {c.author}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Confidence View ──────────────────────────────────────────────────────────
function ConfidenceView({ theme, user, canAccess, userPlan }: any) {
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async (module: any) => {
    if (!user) return;
    setCompleting(true);
    try {
      await supabase.from('xp_log').insert({
        user_id: user.id,
        amount: module.xp,
        reason: module.title,
        source: 'module',
      });
      Alert.alert('Module Complete!', `+${module.xp} XP earned.`);
    } catch (e) { console.error(e); }
    setCompleting(false);
    setSelectedModule(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {CONFIDENCE_MODULES.map((item) => {
        const locked = !canAccess(item.plan);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.moduleCard, { backgroundColor: theme.bgSurface, borderColor: locked ? theme.border : theme.gold + '44', opacity: locked ? 0.6 : 1 }]}
            onPress={() => {
              if (locked) {
                Alert.alert('Locked', `Upgrade to ${item.plan.charAt(0).toUpperCase() + item.plan.slice(1)} to unlock this module.`);
              } else {
                setSelectedModule(item);
              }
            }}
          >
            <View style={[styles.moduleIcon, { backgroundColor: theme.bgElevated, borderColor: locked ? theme.border : theme.gold }]}>
              <Text style={[styles.moduleNum, { color: locked ? theme.textMuted : theme.gold, fontFamily: FONTS.cinzelBold }]}>{item.id}</Text>
            </View>
            <View style={styles.moduleMeta}>
              <Text style={[styles.moduleTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{item.title}</Text>
              <Text style={[styles.moduleSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                {locked ? `Upgrade to ${item.plan}` : `${item.duration} · +${item.xp} XP`}
              </Text>
            </View>
            <Feather name={locked ? 'lock' : 'chevron-right'} size={18} color={theme.textMuted} />
          </TouchableOpacity>
        );
      })}

      {/* Module detail modal */}
      <Modal visible={!!selectedModule} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18 }}>{selectedModule?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedModule(null)}>
                <Feather name="x" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>{selectedModule?.content}</Text>
              {selectedModule?.challenge && (
                <View style={{ backgroundColor: theme.bgElevated, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: theme.gold, marginBottom: 20 }}>
                  <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 13, marginBottom: 6 }}>CHALLENGE</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{selectedModule.challenge}</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => handleComplete(selectedModule)}
              style={{ backgroundColor: theme.gold, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold }}>
                {completing ? 'SAVING...' : `MARK COMPLETE · +${selectedModule?.xp} XP`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Convo Lab View ────────────────────────────────────────────────────────────
function ConvoLabView({ theme, user, canAccess, userPlan, initialScenarioId }: any) {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (initialScenarioId && !selectedScenario) {
      const found = SCENARIOS.find(s => s.id === initialScenarioId);
      if (found && canAccess(found.plan)) {
        setSelectedScenario(found);
        setMessages([]);
      }
    }
  }, [initialScenarioId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const userMsg = inputText.trim();
    setInputText('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setSending(true);
    setTyping(true);

    try {
      const data = await apiCall('/api/conversation', 'POST', {
        scenario: selectedScenario.id,
        messages: newMessages,
        user_message: userMsg,
      });
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || 'I see...' }]);
    } catch (err) {
      setTyping(false);
      // Fallback: simple ai response
      const fallbacks: Record<string, string> = {
        first_date: "That's interesting... tell me more about yourself.",
        cold_approach: "Oh, um... hi. That was unexpected.",
        salary_negotiation: "We were thinking more around the range we discussed.",
        default: "Hmm, let me think about that.",
      };
      setMessages(prev => [...prev, { role: 'assistant', content: fallbacks[selectedScenario.id] || fallbacks.default }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (selectedScenario) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.labContainer} keyboardVerticalOffset={90}>
        <View style={[styles.labHeader, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => { setSelectedScenario(null); setMessages([]); }} style={{ position: 'absolute', left: 16 }}>
            <Feather name="arrow-left" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.labTag, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
            AI Scenario: {selectedScenario.title}
          </Text>
        </View>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={[styles.msgBox, { backgroundColor: theme.bgElevated, maxWidth: '85%' }]}>
              <Text style={[styles.msgText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>
                {selectedScenario.id === 'first_date' ? "Hey, I didn't expect to be this nervous on a first date... What made you choose this place?" :
                 selectedScenario.id === 'cold_approach' ? "Oh... um, hi? Can I help you?" :
                 selectedScenario.id === 'salary_negotiation' ? "Thanks for coming in. So, what were you expecting in terms of compensation?" :
                 "Let's begin the scenario. Go ahead."}
              </Text>
            </View>
          )}
          {messages.map((msg, i) => (
            <View key={i} style={[styles.msgRow, { justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.msgBox, {
                backgroundColor: msg.role === 'user' ? theme.gold : '#1A1A1A',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                borderBottomLeftRadius: msg.role === 'user' ? 14 : 4,
                maxWidth: '85%',
              }]}>
                <Text style={[styles.msgText, { color: msg.role === 'user' ? '#0A0A0A' : theme.textPrimary, fontFamily: FONTS.regular }]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {typing && (
            <View style={[styles.msgBox, { backgroundColor: '#1A1A1A', maxWidth: 80 }]}>
              <Text style={{ color: theme.textMuted, fontSize: 18, letterSpacing: 4 }}>···</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput
            style={[styles.chatInput, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendCircle, { backgroundColor: theme.gold }]} disabled={sending}>
            <Feather name="send" size={16} color="#0A0A0A" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const [showGuide, setShowGuide] = useState<string | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');

  const filteredScenarios = scenarioFilter === 'all' ? SCENARIOS : SCENARIOS.filter(s => s.category === scenarioFilter);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* ── Conversation Guidelines ── */}
      <Text style={[styles.sectionTitle, { color: theme.gold, marginBottom: SPACING.sm }]}>CONVERSATION GUIDELINES</Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: SPACING.md, fontFamily: FONTS.regular }}>Master these principles before entering any scenario.</Text>
      {CONVO_GUIDELINES.map((g, i) => (
        <TouchableOpacity key={i} onPress={() => setShowGuide(showGuide === g.title ? null : g.title)} activeOpacity={0.8}>
          <View style={[styles.guideCard, { backgroundColor: theme.bgSurface, borderColor: showGuide === g.title ? theme.gold + '44' : theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18 }}>{g.icon}</Text>
                <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 }}>{g.title}</Text>
              </View>
              <Feather name={showGuide === g.title ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
            </View>
            {showGuide === g.title && (
              <View style={{ marginTop: 12, gap: 6 }}>
                {g.points.map((p, j) => (
                  <View key={j} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.gold, marginTop: 6 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, flex: 1, lineHeight: 20, fontFamily: FONTS.regular }}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* ── Scenario Filter ── */}
      <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>SELECT SCENARIO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md, marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['all', 'dating', 'social', 'professional'].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setScenarioFilter(cat)}
              style={[styles.filterPill, { backgroundColor: scenarioFilter === cat ? theme.gold + '22' : theme.bgElevated }]}
            >
              <Text style={{ color: scenarioFilter === cat ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold, fontSize: 12, textTransform: 'uppercase' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {filteredScenarios.map(s => {
        const locked = !canAccess(s.plan);
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => {
              if (locked) {
                Alert.alert('Locked', `Upgrade to ${s.plan.charAt(0).toUpperCase() + s.plan.slice(1)} to unlock this scenario.`);
              } else {
                setSelectedScenario(s);
                setMessages([]);
              }
            }}
            activeOpacity={0.8}
          >
            <Card style={[styles.scenarioCard, { opacity: locked ? 0.6 : 1, borderColor: locked ? theme.border : theme.gold + '33' }] as any}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.scenTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{s.title}</Text>
                  <Badge label={s.difficulty} />
                </View>
                <Text style={[styles.scenDesc, { color: theme.textSecondary }]}>{s.desc}</Text>
              </View>
              {locked ? <Feather name="lock" size={18} color={theme.textMuted} /> : <Feather name="chevron-right" size={20} color={theme.gold} />}
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* ── Recommended Resources ── */}
      <Text style={[styles.sectionTitle, { color: theme.gold, marginTop: SPACING.xl, marginBottom: SPACING.sm }]}>RECOMMENDED RESOURCES</Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: SPACING.md, fontFamily: FONTS.regular }}>Level up your social intelligence with these handpicked resources.</Text>
      {RECOMMENDED_RESOURCES.map((r, i) => (
        <View key={i} style={[styles.resourceCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={[styles.resourceType, { backgroundColor: theme.bgElevated }]}>
            <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 10 }}>{r.type.toUpperCase()}</Text>
          </View>
          <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 }}>{r.title}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4, fontFamily: FONTS.regular }}>{r.desc}</Text>
        </View>
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  tabText: { fontSize: 13 },
  tabContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },

  // Wisdom
  wisdomCard: { borderRadius: 16, borderWidth: 1, padding: SPACING.lg },
  wisdomLabel: { fontSize: 10, letterSpacing: 1.2, marginBottom: SPACING.md },
  quote: { fontSize: 20, lineHeight: 30, fontStyle: 'italic' },
  author: { fontSize: 13, marginTop: SPACING.sm, opacity: 0.8 },
  wisdomActions: { flexDirection: 'row', gap: 12, marginTop: SPACING.xl, justifyContent: 'flex-end' },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.md },
  mentorScroll: { marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg },
  mentorCard: { width: 120, padding: 12, borderRadius: 12, borderWidth: 1, marginRight: 12, alignItems: 'center' },
  mentorAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  mentorName: { fontSize: 12, textAlign: 'center' },
  mentorTitle: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  quoteSmall: { padding: SPACING.lg, borderRadius: 14, borderWidth: 1 },
  quoteTextSmall: { fontSize: 14, lineHeight: 20 },
  authorSmall: { fontSize: 12, marginTop: 4, opacity: 0.6 },

  // Confidence
  moduleCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 14, borderWidth: 1, gap: SPACING.md, marginBottom: 12 },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moduleNum: { fontSize: 16 },
  moduleMeta: { flex: 1 },
  moduleTitle: { fontSize: 15 },
  moduleSub: { fontSize: 12, marginTop: 2 },

  // Convo Lab
  scenarioCard: { padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  scenTitle: { fontSize: 15 },
  scenDesc: { fontSize: 12, marginTop: 4, maxWidth: '90%' },
  guideCard: { padding: SPACING.md, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  resourceCard: { padding: SPACING.md, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  resourceType: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },

  labContainer: { flex: 1 },
  labHeader: { padding: SPACING.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderBottomWidth: 1 },
  labTag: { fontSize: 12, letterSpacing: 1 },
  chatScroll: { padding: SPACING.lg, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  msgBox: { padding: SPACING.md, borderRadius: 14 },
  msgText: { fontSize: 14, lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: SPACING.lg, gap: 12, alignItems: 'center' },
  chatInput: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, paddingHorizontal: 20 },
  sendCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
