import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../lib/api';
import { GeminiKeyService } from '../lib/geminiKey';
import { GeminiKeyModal } from '../src/components/GeminiKeyModal';
import { safeBack } from '../lib/safeBack';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

const { width: W } = Dimensions.get('window');

// ── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS: Record<string, { label: string; icon: string; tagline: string; prompt: string }> = {
  first_date: {
    label: 'First Date',
    icon: 'coffee',
    tagline: 'Coffee shop, first meeting',
    prompt:
      'You are a young woman on a first date at a coffee shop. React realistically — sometimes engaged, sometimes testing. After 8 exchanges, score the user 1-10 and give specific feedback on what worked and what to improve.',
  },
  cold_approach: {
    label: 'Cold Approach',
    icon: 'zap',
    tagline: 'Street opener practice',
    prompt:
      'You are a woman on a busy street. A man just stopped you. React naturally — sometimes curious, sometimes skeptical. After 6 exchanges, give honest feedback on the opener and conversation.',
  },
  salary_negotiation: {
    label: 'Salary Negotiation',
    icon: 'briefcase',
    tagline: 'Job offer negotiation',
    prompt:
      'You are a hiring manager. The candidate is negotiating salary. Be firm but fair. After 6 exchanges, give feedback on negotiation technique.',
  },
  texting_game: {
    label: 'Texting Game',
    icon: 'message-circle',
    tagline: 'Text conversation practice',
    prompt:
      'You are a girl who met this guy at a party. He is texting you now. You are slightly interested but will test him. After 6 texts, reveal whether he could have gotten a date.',
  },
  conflict_frame: {
    label: 'Frame Control',
    icon: 'shield',
    tagline: 'Hold your frame under pressure',
    prompt:
      'You are a peer who strongly disagrees with the user. Push back on everything. After 6 exchanges, give feedback on how well he maintained his frame and conviction.',
  },
};

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ theme }: { theme: any }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(400),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={[styles.aiBubble, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.dotsRow}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: theme.gold, opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, theme }: { message: Message; theme: any }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: theme.gold + '22' }]}>
          <Feather name="cpu" size={12} color={theme.gold} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.gold }]
            : [styles.aiBubble, { backgroundColor: theme.bgSurface, borderColor: theme.border }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? '#000' : theme.textPrimary, fontFamily: FONTS.regular },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ConvoLabScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ scenario?: string }>();

  const [activeScenario, setActiveScenario] = useState<string>(params.scenario || 'first_date');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const flatRef = useRef<FlatList>(null);

  // Load stored key on mount
  useEffect(() => {
    GeminiKeyService.get().then(k => {
      if (k) setGeminiKey(k);
    });
  }, []);

  // Reset conversation when scenario changes
  useEffect(() => {
    setMessages([]);
    setExchangeCount(0);
    const scenario = SCENARIOS[activeScenario];
    if (scenario) {
      // Intro message from AI
      setMessages([
        {
          id: 'intro',
          role: 'ai',
          content: getIntroMessage(activeScenario),
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeScenario]);

  function getIntroMessage(scenario: string): string {
    const intros: Record<string, string> = {
      first_date: "Hey! *looks up from phone* Oh, you made it. I wasn't sure if you'd actually show up.",
      cold_approach: "*walking quickly, glances at you* Um... hi?",
      salary_negotiation: "Thanks for coming in. We really enjoyed your interview. So, let's talk numbers.",
      texting_game: "Hey, I remember you from the party lol. What's up?",
      conflict_frame: "I'm going to be direct — I completely disagree with your position on this.",
    };
    return intros[scenario] || "Hello. Let's begin.";
  }

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    if (!geminiKey) {
      setShowKeyModal(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setExchangeCount(prev => prev + 1);

    // Scroll to bottom
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const result = await apiCall('/api/conversation', 'POST', {
        scenario: activeScenario,
        messages: history,
        user_message: text,
        api_key: geminiKey,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.reply || "...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      const errMsg = err?.message || 'AI unavailable — try again';
      const isKeyError = errMsg.toLowerCase().includes('api key') || errMsg.includes('401') || errMsg.includes('403');
      if (isKeyError) {
        await GeminiKeyService.clear();
        setGeminiKey(null);
        setShowKeyModal(true);
        setMessages(prev => prev.slice(0, -1)); // Remove user message
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: 'AI unavailable right now. Check your connection and try again.',
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [inputText, messages, isTyping, geminiKey, activeScenario]);

  const resetConversation = () => {
    setMessages([]);
    setExchangeCount(0);
    setMessages([
      {
        id: 'intro',
        role: 'ai',
        content: getIntroMessage(activeScenario),
        timestamp: new Date(),
      },
    ]);
  };

  const currentScenario = SCENARIOS[activeScenario];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            CONVO LAB
          </Text>
          <Text style={[styles.headerSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
            {currentScenario?.tagline}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={resetConversation} style={styles.iconBtn}>
            <Feather name="refresh-cw" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowKeyModal(true)}
            style={[styles.iconBtn, { backgroundColor: geminiKey ? theme.gold + '22' : theme.bgElevated }]}
          >
            <Feather name="zap" size={16} color={geminiKey ? theme.gold : theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scenario selector — horizontal scroll */}
      <View style={styles.scenarioBar}>
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <TouchableOpacity
            key={key}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveScenario(key); }}
            style={[
              styles.scenarioChip,
              {
                backgroundColor: activeScenario === key ? theme.gold : theme.bgElevated,
                borderColor: activeScenario === key ? theme.gold : theme.border,
              },
            ]}
          >
            <Feather name={s.icon as any} size={12} color={activeScenario === key ? '#000' : theme.textSecondary} />
            <Text style={[styles.scenarioLabel, {
              color: activeScenario === key ? '#000' : theme.textSecondary,
              fontFamily: FONTS.semiBold,
            }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exchange counter */}
      <View style={[styles.exchangeBar, { backgroundColor: theme.bgElevated }]}>
        <Feather name="bar-chart-2" size={12} color={theme.textMuted} />
        <Text style={[styles.exchangeText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          {exchangeCount} exchanges
        </Text>
        {!geminiKey && (
          <TouchableOpacity onPress={() => setShowKeyModal(true)} style={[styles.keyPill, { backgroundColor: theme.gold + '22' }]}>
            <Feather name="zap" size={10} color={theme.gold} />
            <Text style={[styles.keyPillText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>Add AI Key</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="height"
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <MessageBubble message={item} theme={theme} />}
          ListFooterComponent={isTyping ? <TypingIndicator theme={theme} /> : null}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.bgSurface, borderTopColor: theme.border }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={theme.textMuted}
            style={[styles.input, {
              backgroundColor: theme.bgElevated,
              borderColor: theme.border,
              color: theme.textPrimary,
              fontFamily: FONTS.regular,
            }]}
            multiline
            maxLength={400}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !isTyping ? theme.gold : theme.bgElevated,
                borderColor: theme.border,
              },
            ]}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color={theme.gold} />
            ) : (
              <Feather name="send" size={18} color={inputText.trim() ? '#000' : theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gemini Key Modal */}
      <GeminiKeyModal
        visible={showKeyModal}
        onSuccess={key => { setGeminiKey(key); setShowKeyModal(false); }}
        onDismiss={() => setShowKeyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 14, letterSpacing: 2 },
  headerSub: { fontSize: 11, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  scenarioBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
    flexWrap: 'nowrap',
  },
  scenarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  scenarioLabel: { fontSize: 11 },
  exchangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 7,
    marginHorizontal: SPACING.lg,
    marginBottom: 6,
    borderRadius: 8,
  },
  exchangeText: { fontSize: 11, flex: 1 },
  keyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  keyPillText: { fontSize: 10 },
  messageList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, paddingBottom: 20 },
  messageRow: { marginBottom: 12, maxWidth: '85%' },
  messageRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageRowAI: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: W * 0.72,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', gap: 5, paddingVertical: 4, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
