import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, Animated, Easing, Share, KeyboardAvoidingView, Platform,
  Image, Linking, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePlan } from '../../hooks/usePlan';
import { apiCall } from '../../lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const TABS = ['Wisdom', 'Confidence', 'Convo Lab', 'Library'];
const { width: SCREEN_W } = Dimensions.get('window');

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
  { id: 'maxx_mentor', title: 'MAXX AI Mentor', difficulty: 'MEDIUM', desc: 'The ultimate AI guide. Discuss goals, strategies, and mindset.', plan: 'alpha', category: 'mentor',
    prompt: 'You are the core MAXX AI Mentor. Ask the user about their goals and help them build a roadmap.' },
  { id: 'porn_avoidance', title: 'Brain Rewire (Stop Porn)', difficulty: 'HARD', desc: 'Handle urges and rewire your reward system.', plan: 'grind', category: 'social',
    prompt: 'You are a stoic mentor helping the user stop porn addiction. Ask about their current triggers.' },
  { id: 'money_mastery', title: 'Wealth Strategist', difficulty: 'MEDIUM', desc: 'Identify high-value skills and money routes.', plan: 'alpha', category: 'professional',
    prompt: 'You are a wealth strategist. Guide the user through financial traps and opportunities.' },
  { id: 'skill_acquisition', title: 'The Polymath (Learn Fast)', difficulty: 'MEDIUM', desc: 'Learn anything 5x faster than average.', plan: 'alpha', category: 'mentor',
    prompt: 'Help the user identify the 20% of effort that gives 80% of results for any skill.' },
  { id: 'speak_women', title: 'Master Social Calibration', difficulty: 'MEDIUM', desc: 'Speak to women naturally with zero anxiety.', plan: 'grind', category: 'dating',
    prompt: 'Teach the user how to calibrate their approach based on social cues.' },
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
  { id: 'gym_approach_v2', title: 'Gym Approach (Advanced)', difficulty: 'MEDIUM', desc: 'Approach her between sets without Being "That Guy".', plan: 'trial', category: 'dating',
    prompt: 'You are a girl at the gym wearing headphones. You are focused on your workout but open to being approached IF it is done respectfully and non-creepily. If the guy interrupts a set or stares too long, react coldly. After 6 exchanges give feedback on timing and social awareness.' },
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
  const { canAccess, handleGate } = usePlan();

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

  // Access logic managed by usePlan hook

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="focus-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Focus</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabBar} 
        contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.lg, alignItems: 'center' }}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, { backgroundColor: activeTab === tab ? 'rgba(200,169,110,0.1)' : 'transparent' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.flex}>
        {activeTab === 'Wisdom' && <WisdomView theme={theme} user={user} />}
        {activeTab === 'Confidence' && <ConfidenceView theme={theme} user={user} canAccess={canAccess} handleGate={handleGate} />}
        {activeTab === 'Convo Lab' && <ConvoLabView theme={theme} user={user} canAccess={canAccess} handleGate={handleGate} initialScenarioId={params.scenario} />}
        {activeTab === 'Library' && <LibraryView theme={theme} user={user} />}
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
    let active = true;
    const timeout = setTimeout(() => {
      if (active && loading) setLoading(false);
    }, 6000);

    fetchData().then(() => {
      if (active) clearTimeout(timeout);
    });

    return () => { active = false; clearTimeout(timeout); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Parallel fetch but with explicit defaults if one fails
      const results = await Promise.allSettled([
        supabase.from('wisdom_cards').select('*').eq('card_date', today).eq('is_active', true).maybeSingle(),
        supabase.from('mentors').select('*').eq('is_active', true),
        supabase.from('wisdom_cards').select('quote, author, card_date').order('card_date', { ascending: false }).limit(7)
      ]);

      const cardRes = results[0].status === 'fulfilled' ? results[0].value : { data: null };
      const mentorRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const recentRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };

      if (cardRes.data) {
        setCard(cardRes.data);
      } else {
        // Fallback to most recent card before or on today
        const { data: fallback } = await supabase
          .from('wisdom_cards')
          .select('*')
          .lte('card_date', today)
          .order('card_date', { ascending: false })
          .limit(1)
          .maybeSingle();
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
            <View key={`wisdom_${c.card_date || i}`} style={[styles.quoteSmall, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
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
function ConfidenceView({ theme, user, canAccess, handleGate }: any) {
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
                handleGate(item.plan);
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
function ConvoLabView({ theme, user, canAccess, handleGate, initialScenarioId }: any) {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; image?: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showGuide, setShowGuide] = useState<string | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const scrollRef = useRef<ScrollView>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [pendingScenario, setPendingScenario] = useState<any>(null);
  const [userModel, setUserModel] = useState('gemini-2.0-flash');
  const msgCounter = useRef(0);

  // ─── Tier Gate: Only Alpha / Sigma can access Convo Lab ──────────
  const convoLabUnlocked = canAccess('convo_lab');

  useEffect(() => {
    AsyncStorage.getItem('maxx_convo_api_key').then(val => {
      if (val) {
        setUserApiKey(val);
        setApiKeyInput(val);
      }
    });
    AsyncStorage.getItem('maxx_convo_model').then(val => {
      if (val && val !== 'gemini-1.5-flash') {
        setUserModel(val);
      } else {
        setUserModel('gemini-2.0-flash');
      }
    });
  }, []);

  useEffect(() => {
    if (initialScenarioId && !selectedScenario && convoLabUnlocked) {
      const found = SCENARIOS.find(s => s.id === initialScenarioId);
      if (found && canAccess(found.plan)) {
        handleEnterScenario(found);
      }
    }
  }, [initialScenarioId, userApiKey]);

  const nextMsgId = useCallback(() => {
    msgCounter.current += 1;
    return `msg_${Date.now()}_${msgCounter.current}`;
  }, []);

  const handleEnterScenario = (scenario: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedScenario(scenario);
    setMessages([]);
    msgCounter.current = 0;
    
    // AI starts the conversation automatically to make it non-static
    console.log(`[CONVO] Entering scenario: ${scenario.id}. Model: ${userModel}`);
    setTyping(true);
    apiCall('/api/conversation', 'POST', {
      scenario: scenario.id,
      messages: [],
      user_message: "START_CONVERSATION_GREETING",
      api_key: userApiKey || null,
      model: userModel,
    }).then(data => {
      console.log(`[CONVO] Backend replied successfully:`, data.reply?.substring(0, 30));
      setMessages([{ id: nextMsgId(), role: 'assistant', content: data.reply || "Let's begin. How can I help you with this today?" }]);
    }).catch((err) => {
      console.error(`[CONVO] API Error during entry:`, err.message);
      const g: any = {
        first_date: "Hey, I didn't expect to be this nervous on a first date... What made you choose this place?",
        cold_approach: "Oh... um, hi? Can I help you?",
        salary_negotiation: "Thanks for coming in. So, what were you expecting in terms of compensation?",
        maxx_mentor: "I am the MAXX AI Mentor. I have been watching your progress. Tell me, what is your #1 goal right now?",
        porn_avoidance: "The path to rewiring your brain is difficult but necessary. Are you currently facing an urge, or are we planning your reboot protocol?",
        money_mastery: "Wealth is not about what you earned, but what you keep and how you leverage. What is your current income source?",
      };
      setMessages([{ id: nextMsgId(), role: 'assistant', content: g[scenario.id] || "Let's begin the scenario. Go ahead." }]);
    }).finally(() => {
      setTyping(false);
    });
  };

  const saveApiKey = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserApiKey(apiKeyInput);
    AsyncStorage.setItem('maxx_convo_api_key', apiKeyInput);
    AsyncStorage.setItem('maxx_convo_model', userModel);
    setShowApiModal(false);
    if (pendingScenario) {
      handleEnterScenario(pendingScenario);
      setPendingScenario(null);
    }
  };

  const renderApiModal = () => (
    <Modal visible={showApiModal} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.bgSurface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18 }}>
              AI ENGINE SETTINGS
            </Text>
            <TouchableOpacity onPress={() => setShowApiModal(false)}>
              <Feather name="x" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 12, fontFamily: FONTS.regular, lineHeight: 20 }}>
            MAXX Convo Lab uses the Google Gemini API to power real-time AI simulations. You need your own API key to continue.
          </Text>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
            style={{ backgroundColor: theme.gold + '15', padding: 12, borderRadius: 10, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Feather name="external-link" size={16} color={theme.gold} />
            <Text style={{ color: theme.gold, fontSize: 13, fontFamily: FONTS.semiBold }}>
              Get Free Gemini API Key
            </Text>
          </TouchableOpacity>
          
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8 }}>API KEY</Text>
          <TextInput
            style={{ backgroundColor: theme.bgElevated, color: theme.textPrimary, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}
            placeholder="Enter your Gemini Key..."
            placeholderTextColor={theme.textMuted}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            autoCapitalize="none"
            secureTextEntry
          />

          <Text style={{ color: theme.textSecondary, fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8 }}>MODEL SELECTION</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {[
              { id: 'gemini-2.0-flash', label: '2.0 Flash', sub: 'New, Fast & Efficient' },
              { id: 'gemini-1.5-pro', label: '1.5 Pro', sub: 'Maximum Intel' }
            ].map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setUserModel(m.id)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: userModel === m.id ? theme.gold : theme.border,
                  backgroundColor: userModel === m.id ? theme.gold + '10' : theme.bgElevated,
                }}
              >
                <Text style={{ color: userModel === m.id ? theme.gold : theme.textPrimary, fontFamily: FONTS.bold, fontSize: 12 }}>{m.label}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>{m.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            onPress={saveApiKey} 
            style={{ backgroundColor: theme.gold, padding: 16, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 14 }}>SAVE CONFIGURATION</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || sending || !selectedScenario) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMsg = inputText.trim();
    const currentImage = selectedImage;
    setSending(true);

    let base64 = null;
    if (currentImage) {
      try {
        base64 = await FileSystem.readAsStringAsync(currentImage, { encoding: 'base64' });
      } catch (err) {
        console.error("Base64 error:", err);
      }
    }

    const userMsgObj = { 
      id: nextMsgId(), 
      role: 'user', 
      content: userMsg || "[Image]", 
      image: currentImage || undefined 
    };
    
    const newMessages = [...messages, userMsgObj];
    setMessages(newMessages);
    setInputText('');
    setSelectedImage(null);
    setTyping(true);

    try {
      console.log("[ConvoLab] Sending request to:", selectedScenario.id);
      const data = await apiCall('/api/conversation', 'POST', {
        scenario: selectedScenario.id,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        user_message: userMsg,
        api_key: userApiKey || undefined,
        image_base64: base64 || undefined,
        model: userModel,
      });
      setTyping(false);
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: data.reply || data.message || 'I see...' }]);
    } catch (err) {
      console.error("[ConvoLab] API Error:", err);
      setTyping(false);
      const fallbacks: Record<string, string> = {
        first_date: "That's interesting... tell me more about yourself.",
        cold_approach: "Oh, um... hi. That was unexpected.",
        salary_negotiation: "We were thinking more around the range we discussed.",
        maxx_mentor: "Got it. Based on your goals, we need to look at your daily habits first. What does your morning look like?",
        porn_avoidance: "I understand. Discipline starts with the mind. Let's redirect that energy into your mission. Talk to me.",
        money_mastery: "Leverage is the key. Tell me about your current skillset, and we'll see how to scale it.",
        default: "Hmm, let me think about that. Tell me more.",
      };
      setMessages(prev => [...prev, { id: nextMsgId(), role: 'assistant', content: fallbacks[selectedScenario.id] || fallbacks.default }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isRecording) {
      setIsRecording(true);
      // Mock recording behavior
      setTimeout(() => {
        setIsRecording(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setInputText("I want to work on my leadership skills... (Simulated Voice)");
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.IMAGE,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const filteredScenarios = scenarioFilter === 'all' ? SCENARIOS : SCENARIOS.filter(s => s.category === scenarioFilter);

  if (selectedScenario) {
    return (
      <View style={[styles.labContainer, { paddingBottom: insets.bottom + 100 }]}>
        {renderApiModal()}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
        >
          <View style={[styles.labHeader, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => { setSelectedScenario(null); setMessages([]); }} style={{ padding: 10 }}>
              <Feather name="arrow-left" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.labTag, { color: theme.gold, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
                {selectedScenario.title}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setApiKeyInput(userApiKey); setShowApiModal(true); }} style={{ padding: 10 }}>
              <Feather name="settings" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[styles.chatScroll, { paddingBottom: 100 }]}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && !typing && (
              <View style={[styles.msgBox, { backgroundColor: theme.bgElevated, maxWidth: '85%', alignSelf: 'flex-start', marginBottom: 16 }]}>
                <Text style={[styles.msgText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>
                  Loading AI response...
                </Text>
              </View>
            )}
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgRow, { justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.msgBox, {
                  backgroundColor: msg.role === 'user' ? theme.gold : theme.bgElevated,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: msg.role === 'user' ? 14 : 4,
                  borderWidth: 1,
                  borderColor: msg.role === 'user' ? theme.gold : theme.border,
                  maxWidth: '85%',
                }]}>
                  {msg.image && (
                    <Image 
                      source={{ uri: msg.image }} 
                      style={{ width: 180, height: 180, borderRadius: 8, marginBottom: 8 }} 
                      resizeMode="cover"
                    />
                  )}
                  {msg.content ? (
                    <Text style={[styles.msgText, { color: msg.role === 'user' ? '#0A0A0A' : theme.textPrimary, fontFamily: FONTS.regular }]}>{msg.content}</Text>
                  ) : null}
                </View>
              </View>
            ))}
            {typing && (
              <View style={[styles.msgBox, { backgroundColor: theme.bgElevated, maxWidth: 80, alignSelf: 'flex-start' }]}>
                <ActivityIndicator color={theme.gold} size="small" />
              </View>
            )}
          </ScrollView>

          {selectedImage && (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 10, flexDirection: 'row' }}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: selectedImage }} style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: theme.gold }} />
                <TouchableOpacity 
                  onPress={() => setSelectedImage(null)}
                  style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#FF4444', borderRadius: 10, padding: 2 }}
                >
                  <Feather name="x" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.chatInputRow, { backgroundColor: theme.bgSurface, borderTopWidth: 1, borderColor: theme.border, elevation: 15 }]}>
            <TouchableOpacity onPress={pickImage} style={[styles.micBtn, { backgroundColor: theme.bgElevated }]}>
              <Feather name="image" size={20} color={theme.gold} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleRecording} 
              style={[styles.micBtn, { backgroundColor: isRecording ? '#FF4444' : theme.bgElevated, borderColor: isRecording ? '#FF4444' : theme.gold + '44' }]}
            >
              <Feather name={isRecording ? "square" : "mic"} size={22} color={isRecording ? "#FFF" : theme.gold} />
            </TouchableOpacity>

            <TextInput
              style={[styles.chatInput, { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular, minHeight: 46 }]}
              placeholder={isRecording ? "Recording..." : "Message Agent..."}
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!sending && !isRecording}
              multiline={false}
            />
            
            <TouchableOpacity 
              onPress={handleSend} 
              style={[styles.sendCircle, { backgroundColor: (inputText.trim() || selectedImage) ? theme.gold : theme.bgElevated, opacity: (inputText.trim() || selectedImage) ? 1 : 0.5 }]} 
              disabled={sending || (!inputText.trim() && !selectedImage)}
            >
              <Feather name="send" size={18} color={(inputText.trim() || selectedImage) ? "#0A0A0A" : theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={{ height: Platform.OS === 'ios' ? 34 : 20, backgroundColor: theme.bgSurface }} />
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ─── LOCKED SCREEN for Free / Grind tier ──────────────────────────
  if (!convoLabUnlocked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Feather name="lock" size={48} color={theme.gold} />
        <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 20, marginTop: 20, textAlign: 'center' }}>
          ALPHA ACCESS REQUIRED
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20, fontFamily: FONTS.regular }}>
          The Convo Lab AI Simulator is available exclusively for Alpha and Sigma members. Upgrade your plan to unlock 22+ conversation scenarios, AI coaching, and real-time practice.
        </Text>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleGate('convo_lab'); }}
          style={{ marginTop: 24, backgroundColor: theme.gold, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
        >
          <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 14 }}>UPGRADE NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Absolute Settings Button - Ensures clickability */}
      <View style={{ position: 'absolute', top: 12, right: 16, zIndex: 100 }}>
        <TouchableOpacity 
          onPress={() => { 
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setApiKeyInput(userApiKey); 
            setShowApiModal(true); 
          }}
          style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: theme.gold, elevation: 5, shadowColor: theme.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="settings" size={14} color={theme.gold} />
            <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.5 }}>AI SETTINGS</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Header Bar */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.bgSurface }}>
        <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>CONVO LAB</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.tabContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
        {/* ── Conversation Guidelines ── */}
      <Text style={[styles.sectionTitle, { color: theme.gold, marginBottom: SPACING.sm }]}>CONVERSATION GUIDELINES</Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: SPACING.md, fontFamily: FONTS.regular }}>Master these principles before entering any scenario.</Text>
      {CONVO_GUIDELINES.map((g) => (
        <TouchableOpacity key={g.title} onPress={() => setShowGuide(showGuide === g.title ? null : g.title)} activeOpacity={0.8}>
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
          {['all', 'mentor', 'dating', 'social', 'professional'].map(cat => (
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

      {filteredScenarios.map((s, sIdx) => {
        const locked = !canAccess(s.plan);
        return (
          <TouchableOpacity
            key={`${s.id}_${sIdx}`}
            onPress={() => {
              if (locked) {
                handleGate(s.plan);
              } else if (!userApiKey) {
                setPendingScenario(s);
                setShowApiModal(true);
              } else {
                handleEnterScenario(s);
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
      {RECOMMENDED_RESOURCES.map((r) => (
        <View key={r.title} style={[styles.resourceCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={[styles.resourceType, { backgroundColor: theme.bgElevated }]}>
            <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 10 }}>{r.type.toUpperCase()}</Text>
          </View>
          <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 }}>{r.title}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4, fontFamily: FONTS.regular }}>{r.desc}</Text>
        </View>
      ))}

      {renderApiModal()}
      <View style={{ height: 80 }} />
    </ScrollView>
    </View>
  );
}

// ─── Library View ─────────────────────────────────────────────────────────────
const CHANNEL_COLORS: Record<string, string> = {
  'Sneako': '#E74C3C',
  'Shneako': '#C0392B',
  'Myron Gaines': '#2C3E50',
  'Joe Rogan': '#E67E22',
  'David Goggins': '#7F8C8D',
  'Jack Neel': '#8E44AD',
  'Mike Thurston': '#27AE60',
  'Andrew Tate': '#F1C40F',
  'Andrew Huberman': '#2980B9',
  'Ryan Holiday': '#16A085',
  'Athlean-X': '#E67E22',
  'Jeff Nippard': '#9B59B6',
};

const CHANNEL_GROUPS: { name: string; platform: string; creators: string[] }[] = [
  { name: 'Sneako', platform: 'YouTube', creators: ['Sneako'] },
  { name: 'Shneako', platform: 'YouTube', creators: ['Shneako'] },
  { name: 'Myron Gaines', platform: 'YouTube', creators: ['Myron Gaines'] },
  { name: 'Joe Rogan', platform: 'YouTube', creators: ['Joe Rogan'] },
  { name: 'David Goggins', platform: 'YouTube', creators: ['David Goggins'] },
  { name: 'Jack Neel', platform: 'YouTube', creators: ['Jack Neel'] },
  { name: 'Mike Thurston', platform: 'YouTube', creators: ['Mike Thurston'] },
  { name: 'Andrew Tate', platform: 'Rumble', creators: ['Andrew Tate'] },
  { name: 'Self Improvement', platform: 'YouTube', creators: ['Andrew Huberman', 'Ryan Holiday', 'Better Ideas'] },
  { name: 'Fitness', platform: 'YouTube', creators: ['Athlean-X', 'Jeff Nippard', 'Chris Bumstead'] },
];

function LibraryView({ theme, user }: any) {
  const router = useRouter();
  const [libTab, setLibTab] = useState<'videos' | 'books'>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoFilter, setVideoFilter] = useState('all');
  const [bookFilter, setBookFilter] = useState('all');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedCreator, setSelectedCreator] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active && loading) setLoading(false);
    }, 8000); // 8s timeout for library as it has more data

    fetchAll().then(() => {
      if (active) clearTimeout(timeout);
    });

    return () => { active = false; clearTimeout(timeout); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase.from('library_videos').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('library_books').select('*').eq('is_active', true).order('sort_order'),
        user ? supabase.from('favorites').select('item_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
        supabase.from('library_creators').select('*'),
      ]);

      const vRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
      const bRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const fRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
      const cRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };

      setVideos(vRes.data || []);
      setBooks(bRes.data || []);
      setCreators(cRes.data || []);
      const ids = new Set<string>((fRes.data || []).map((f: any) => f.item_id));
      setSavedIds(ids);
    } catch (e) {
      console.log('Library fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemType: string, itemId: string, title: string, imageUrl?: string, subtitle?: string) => {
    if (!user) return;
    if (savedIds.has(itemId)) {
      Alert.alert('Already Saved', 'This item is in your wishlist.');
      return;
    }
    try {
      await supabase.from('favorites').insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        item_title: title,
        item_image_url: imageUrl || null,
        item_subtitle: subtitle || null,
      });
      setSavedIds(prev => new Set([...prev, itemId]));
      Alert.alert('Saved', 'Added to your wishlist.');
    } catch (e) {
      console.log(e);
    }
  };

  const handleShareVideo = async (video: any) => {
    const isRealYT = video.youtube_id && !video.youtube_id.includes('_');
    const url = isRealYT ? `https://youtu.be/${video.youtube_id}` : `MAXX Library — ${video.title}`;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ 
        message: `${video.title}\nWatch here: ${url}\n\nShared from MAXX App`, 
        url: isRealYT ? url : undefined 
      });
    } catch (e) {}
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getChannelColor = (name: string) => {
    // Pick color from the first creator match
    for (const key of Object.keys(CHANNEL_COLORS)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return CHANNEL_COLORS[key];
    }
    return '#C8A96E';
  };

  const videoCategories = ['all', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];
  const bookCategories = ['all', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];

  const filteredVideos = videoFilter === 'all' ? videos : videos.filter(v => v.category === videoFilter);

  // Group filtered videos by channel group
  const channelSections = CHANNEL_GROUPS.map(group => {
    const groupVids = filteredVideos.filter(v => group.creators.some(c => c.toLowerCase() === v.creator?.toLowerCase()));
    return { ...group, videos: groupVids };
  }).filter(g => g.videos.length > 0);

  const filteredBooks = bookFilter === 'all' ? books : books.filter(b => b.category === bookFilter);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.gold} size="large" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Inner Tabs */}
      <View style={[styles.libInnerTabs, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.libInnerTab, libTab === 'videos' && { backgroundColor: theme.gold + '22' }]}
          onPress={() => setLibTab('videos')}
        >
          <Text style={{ color: libTab === 'videos' ? theme.gold : theme.textMuted, fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }}>VIDEOS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.libInnerTab, libTab === 'books' && { backgroundColor: theme.gold + '22' }]}
          onPress={() => setLibTab('books')}
        >
          <Text style={{ color: libTab === 'books' ? theme.gold : theme.textMuted, fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }}>BOOKS</Text>
        </TouchableOpacity>
      </View>

      {libTab === 'videos' ? (
        <>
          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md, marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {videoCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setVideoFilter(cat)}
                  style={[styles.filterPill, { backgroundColor: videoFilter === cat ? theme.gold + '22' : theme.bgElevated }]}
                >
                  <Text style={{ color: videoFilter === cat ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold, fontSize: 11, textTransform: 'capitalize' }}>{cat === 'all' ? 'All' : cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Channel Sections */}
          {channelSections.map((ch, ci) => {
            const channelCol = getChannelColor(ch.name);
            const creator = creators.find(c => c.name === ch.name);
            return (
              <View key={ci} style={{ marginBottom: SPACING.xl }}>
                {/* Channel Header */}
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedCreator(creator || { name: ch.name, platform: ch.platform });
                  }}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}
                >
                  <View style={[styles.channelCircle, { backgroundColor: channelCol + '22', borderColor: channelCol + '44', overflow: 'hidden' }]}>
                    {creator?.profile_image_url ? (
                      <Image source={{ uri: creator.profile_image_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ color: channelCol, fontFamily: FONTS.bold, fontSize: 14 }}>{getInitials(ch.name)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontFamily: FONTS.bold, fontSize: 13 }}>{ch.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONTS.regular }}>{ch.platform} · Tap for details</Text>
                  </View>
                  <Feather name="info" size={16} color={theme.textMuted} />
                </TouchableOpacity>

                {/* Horizontal Video Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {ch.videos.map((v: any) => {
                      const isRealYT = v.youtube_id && !v.youtube_id.includes('_');
                      const thumbUri = isRealYT
                        ? `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`
                        : undefined;
                      const isSaved = savedIds.has(v.id);
                      return (
                        <View key={v.id} style={{ width: 110 }}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              router.push({
                                pathname: "/library-video",
                                params: { id: v.id }
                              });
                            }}
                            style={[styles.libThumbWrap, { backgroundColor: channelCol + '15' }]}
                          >
                            {thumbUri ? (
                              <Image source={{ uri: thumbUri }} style={styles.libThumb} />
                            ) : (
                              <View style={[styles.libThumb, { backgroundColor: channelCol + '33', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: channelCol, fontFamily: FONTS.bold, fontSize: 20 }}>{getInitials(v.creator)}</Text>
                              </View>
                            )}
                            {/* Play overlay */}
                            <View style={styles.libPlayOverlay}>
                              <View style={[styles.libPlayCircle, { backgroundColor: theme.gold }]}>
                                <Feather name="play" size={16} color="#000" />
                              </View>
                            </View>
                          </TouchableOpacity>
                          <Text style={{ color: theme.textMuted, fontSize: 9, fontFamily: FONTS.regular, marginTop: 6, lineHeight: 12 }} numberOfLines={2}>
                            {v.title}
                          </Text>
                          {/* Share + Save pills */}
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            <TouchableOpacity onPress={() => handleShareVideo(v)} style={[styles.libMiniPill, { borderColor: theme.border }]}>
                              <Feather name="share" size={10} color={theme.textMuted} />
                              <Text style={{ color: theme.textMuted, fontSize: 9, fontFamily: FONTS.medium }}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleSave('video', v.id, v.title, thumbUri, v.creator)}
                              style={[styles.libMiniPill, { borderColor: isSaved ? theme.gold : theme.border }]}
                            >
                              <Feather name="bookmark" size={10} color={isSaved ? theme.gold : theme.textMuted} />
                              <Text style={{ color: isSaved ? theme.gold : theme.textMuted, fontSize: 9, fontFamily: FONTS.medium }}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            );
          })}

          {channelSections.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Feather name="video-off" size={40} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, marginTop: 12, fontFamily: FONTS.regular }}>No videos match this filter.</Text>
            </View>
          )}
        </>
      ) : (
        <>
          {/* Book Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md, marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {bookCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setBookFilter(cat)}
                  style={[styles.filterPill, { backgroundColor: bookFilter === cat ? theme.gold + '22' : theme.bgElevated }]}
                >
                  <Text style={{ color: bookFilter === cat ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold, fontSize: 11, textTransform: 'capitalize' }}>{cat === 'all' ? 'All' : cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Book Cards */}
          {filteredBooks.map((book: any) => {
            const bookColor = CHANNEL_COLORS[book.author] || '#C8A96E';
            const isSaved = savedIds.has(book.id);
            return (
              <TouchableOpacity
                key={book.id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: "/library-book", params: { id: book.id } })}
                style={[styles.libBookCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              >
                {/* Book Cover */}
                <View style={[styles.libBookCover, { backgroundColor: bookColor + '22', borderColor: bookColor + '44', borderWidth: 1, overflow: 'hidden' }]}>
                  {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  ) : (
                    <Text style={{ color: bookColor, fontFamily: FONTS.bold, fontSize: 9, textAlign: 'center', padding: 4 }}>
                      {book.title}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, paddingLeft: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ color: theme.textPrimary, fontFamily: FONTS.bold, fontSize: 15 }} numberOfLines={1}>{book.title}</Text>
                      <Text style={{ color: theme.gold, fontSize: 12, fontFamily: FONTS.medium, marginTop: 2 }}>{book.author}</Text>
                    </View>
                    <Badge label={book.category?.toUpperCase() || 'FINANCE'} />
                  </View>
                  
                  {book.key_lessons && book.key_lessons.length > 0 && (
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 6, fontFamily: FONTS.regular, lineHeight: 16 }} numberOfLines={2}>
                      {book.key_lessons[0]}
                    </Text>
                  )}
                  {/* Buy + Save */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {book.buy_link ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(book.buy_link)}
                        style={[styles.libBookBtn, { backgroundColor: theme.gold + '18', borderColor: theme.gold + '44' }]}
                      >
                        <Text style={{ color: theme.gold, fontSize: 11, fontFamily: FONTS.bold }}>Buy Now→</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => handleSave('book', book.id, book.title, book.cover_url, book.author)}
                      style={[styles.libBookBtn, { borderColor: isSaved ? theme.gold : theme.border }]}
                    >
                      <Feather name="bookmark" size={12} color={isSaved ? theme.gold : theme.textMuted} />
                      <Text style={{ color: isSaved ? theme.gold : theme.textMuted, fontSize: 11, fontFamily: FONTS.medium }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredBooks.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Feather name="book" size={40} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, marginTop: 12, fontFamily: FONTS.regular }}>No books match this filter.</Text>
            </View>
          )}
        </>
      )}
      {/* Premium Creator Detail Modal */}
      <Modal visible={!!selectedCreator} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: theme.bgSurface, 
            borderRadius: 32, 
            width: '100%',
            maxWidth: 400,
            padding: 32, 
            borderWidth: 1, 
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.5,
            shadowRadius: 30,
            elevation: 20
          }}>
            <TouchableOpacity 
              onPress={() => setSelectedCreator(null)}
              style={{ position: 'absolute', right: 20, top: 20, zIndex: 10, padding: 8 }}
            >
              <Feather name="x" size={24} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50, 
                backgroundColor: theme.bgElevated, 
                borderWidth: 3, 
                borderColor: theme.gold, 
                overflow: 'hidden', 
                marginBottom: 16,
                shadowColor: theme.gold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8
              }}>
                {selectedCreator?.profile_image_url ? (
                   <Image source={{ uri: selectedCreator.profile_image_url }} style={{ width: '100%', height: '100%' }} />
                ) : (
                   <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                     <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 32 }}>{getInitials(selectedCreator?.name || 'C')}</Text>
                   </View>
                )}
              </View>
              <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 28, textAlign: 'center' }}>{selectedCreator?.name}</Text>
              <View style={{ backgroundColor: theme.gold + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 }}>
                <Text style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1.5 }}>{selectedCreator?.platform?.toUpperCase() || 'ARCHIVE CREATOR'}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: theme.border, width: '100%', marginBottom: 20 }} />

            <ScrollView style={{ maxHeight: 300, marginBottom: 10 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 24, textAlign: 'center', fontFamily: FONTS.regular, fontStyle: 'italic' }}>
                "{selectedCreator?.bio || "Archived wisdom from one of the most influential minds in the space. More intelligence reports coming soon."}"
              </Text>
              
              {selectedCreator?.socials && (
                <View style={{ marginTop: 32 }}>
                   <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 2, textAlign: 'center', marginBottom: 16 }}>CONNECT</Text>
                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                    {Object.entries(selectedCreator.socials).map(([platform, link]: any) => (
                      <TouchableOpacity 
                        key={platform} 
                        onPress={() => Linking.openURL(link)}
                        style={{ 
                          backgroundColor: theme.bgElevated, 
                          width: 48, 
                          height: 48, 
                          borderRadius: 24, 
                          borderWidth: 1, 
                          borderColor: theme.border, 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Feather 
                          name={
                            platform === 'twitter' || platform === 'x' ? 'twitter' : 
                            platform === 'youtube' ? 'youtube' : 
                            platform === 'instagram' ? 'instagram' :
                            'external-link'
                          } 
                          size={20} 
                          color={theme.gold} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabBar: { maxHeight: 48, minHeight: 48, marginTop: SPACING.md, overflow: 'hidden' },

  // Library
  libInnerTabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.md },
  libInnerTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  channelCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  libThumbWrap: { width: 110, height: 62, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  libThumb: { width: '100%', height: '100%' },
  libPlayOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  libPlayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
  libMiniPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  libBookCard: { flexDirection: 'row', padding: SPACING.md, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  libBookCover: { width: 52, height: 72, borderRadius: 6, justifyContent: 'center', alignItems: 'center', padding: 4 },
  libBookBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
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
  chatInputRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 10, alignItems: 'center' },
  chatInput: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 16 },
  sendCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
