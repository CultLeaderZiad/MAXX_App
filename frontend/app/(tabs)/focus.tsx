import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, Animated, Easing, Share, KeyboardAvoidingView, Platform
} from 'react-native';
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
  }
];

// ─── Convo Scenarios ──────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'first_date', title: 'First Date', difficulty: 'EASY', desc: 'Break the ice and build rapport.', plan: 'trial',
    prompt: 'You are a young woman on a first date at a coffee shop. React realistically — sometimes engaged, sometimes reserved. After 8 exchanges give a score 1-10 and feedback.' },
  { id: 'cold_approach', title: 'Cold Approach', difficulty: 'HARD', desc: 'Stop her on the street naturally.', plan: 'trial',
    prompt: 'You are a young woman on a busy street. A man just stopped you. You are slightly surprised. React naturally. After 6 exchanges give feedback on the opener and delivery.' },
  { id: 'salary_negotiation', title: 'Salary Negotiation', difficulty: 'MEDIUM', desc: 'Get what you are worth.', plan: 'grind',
    prompt: 'You are a hiring manager. The candidate is negotiating salary. Be firm but fair. After 6 exchanges give feedback.' },
  { id: 'conflict_frame', title: 'Hold Your Frame', difficulty: 'MEDIUM', desc: 'Disagree without backing down.', plan: 'alpha',
    prompt: 'You are a peer who disagrees strongly. Push back firmly. After 6 exchanges give feedback on how well he maintained his frame.' },
  { id: 'group_social', title: 'Group Social', difficulty: 'HARD', desc: 'Own the room.', plan: 'alpha',
    prompt: 'You are part of a social group. The user is trying to integrate. React realistically. After 8 exchanges give score and feedback.' },
  { id: 'texting_game', title: 'Texting Game', difficulty: 'EASY', desc: 'Move from text to date.', plan: 'sigma',
    prompt: 'You are a girl who met this guy once. He is texting you. You are slightly interested but testing. After 6 texts give feedback on whether he could have gotten a date.' }
];

export default function FocusScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('Wisdom');

  const userPlan = profile?.plan || 'trial';

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
        {activeTab === 'Convo Lab' && <ConvoLabView theme={theme} user={user} canAccess={canAccessPlan} userPlan={userPlan} />}
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
function ConvoLabView({ theme, user, canAccess, userPlan }: any) {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted, marginBottom: SPACING.md }]}>SELECT SCENARIO</Text>
      {SCENARIOS.map(s => {
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
          >
            <Card style={[styles.scenarioCard, { opacity: locked ? 0.6 : 1, borderColor: locked ? theme.border : theme.gold + '33' }] as any}>
              <View>
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
