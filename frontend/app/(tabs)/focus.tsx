import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { supabase } from '../../lib/supabase';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

const TABS = ['Wisdom', 'Confidence', 'Convo Lab'];

export default function FocusScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Wisdom');

  const WisdomView = () => {
    const [mentors, setMentors] = useState([
        { id: 1, name: 'Andrew Tate', title: 'Top G', avatar: '🥊' },
        { id: 2, name: 'David Goggins', title: 'The Soul', avatar: '🏃' },
        { id: 3, name: 'Jordan Peterson', title: 'The Psychologist', avatar: '🧠' },
        { id: 4, name: 'Marcus Aurelius', title: 'The Emperor', avatar: '👑' },
    ]);

    return (
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.wisdomCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={[styles.wisdomLabel, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>TODAY'S WISDOM DROP</Text>
            <Text style={[styles.quote, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
            "Discipline is not punishment. It is the price of becoming."
            </Text>
            <Text style={[styles.author, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>— MAXX Doctrine</Text>
            <View style={styles.wisdomActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bgElevated }]}>
                <Feather name="bookmark" size={16} color={theme.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bgElevated }]}>
                <Feather name="share-2" size={16} color={theme.gold} />
            </TouchableOpacity>
            </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MENTOR PROFILES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mentorScroll}>
            {mentors.map(m => (
                <TouchableOpacity key={m.id} style={StyleSheet.flatten([styles.mentorCard, { backgroundColor: theme.bgElevated, borderColor: theme.border }])}>
                    <View style={[styles.mentorAvatar, { backgroundColor: theme.bgSurface }]}>
                        <Text style={{ fontSize: 24 }}>{m.avatar}</Text>
                    </View>
                    <Text style={[styles.mentorName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{m.name}</Text>
                    <Text style={[styles.mentorTitle, { color: theme.textMuted }]}>{m.title}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        <View style={[styles.quoteSmall, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginTop: SPACING.lg }]}>
            <Text style={[styles.quoteTextSmall, { color: theme.textSecondary, fontFamily: FONTS.semiBold }]}>
            "Comfort is the enemy wearing your face."
            </Text>
            <Text style={[styles.authorSmall, { color: theme.textMuted, fontFamily: FONTS.regular }]}>— Andrew Tate</Text>
        </View>
        </ScrollView>
    );
  };

  const ConfidenceView = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {[
        { id: 1, title: 'Body Language Blueprint', xp: 30, time: 5 },
        { id: 2, title: 'Rejection Mastery', xp: 30, time: 5 },
        { id: 3, title: 'Social Dynamics', locked: true },
        { id: 4, title: 'Scarcity & Value', locked: true },
      ].map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.moduleCard,
            { backgroundColor: theme.bgSurface, borderColor: theme.border, opacity: item.locked ? 0.4 : 1 }
          ]}
          disabled={item.locked}
        >
          <View style={[styles.moduleIcon, { backgroundColor: theme.bgElevated, borderColor: theme.gold }]}>
            <Text style={[styles.moduleNum, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{item.id}</Text>
          </View>
          <View style={styles.moduleMeta}>
            <Text style={[styles.moduleTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{item.title}</Text>
            <Text style={[styles.moduleSub, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
              {item.locked ? 'Upgrade to Alpha' : `${item.time} min · +${item.xp} XP`}
            </Text>
          </View>
          <Feather name={item.locked ? 'lock' : 'chevron-right'} size={18} color={theme.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ConvoLabView = () => {
      const [session, setSession] = useState(false);
      const [msg, setMsg] = useState('');
      
      if (!session) {
          return (
            <ScrollView contentContainerStyle={styles.tabContent}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted, marginBottom: SPACING.md }]}>SELECT SCENARIO</Text>
                {[
                    { id: 1, title: 'First Date', diff: 'Easy', desc: 'Break the ice and build rapport.' },
                    { id: 2, title: 'Cold Approach', diff: 'Hard', desc: 'Stop her on the street without being creepy.' },
                    { id: 3, title: 'Salary Negotiation', diff: 'Medium', desc: 'Get what you are worth.', locked: true },
                ].map(s => (
                    <TouchableOpacity key={s.id} onPress={() => !s.locked && setSession(true)} disabled={s.locked}>
                        <Card style={[styles.scenarioCard, { opacity: s.locked ? 0.6 : 1 }] as any}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={[styles.scenTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{s.title}</Text>
                                    <Badge label={s.diff} />
                                </View>
                                <Text style={[styles.scenDesc, { color: theme.textSecondary }]}>{s.desc}</Text>
                            </View>
                            {s.locked ? <Feather name="lock" size={18} color={theme.textMuted} /> : <Feather name="chevron-right" size={20} color={theme.gold} />}
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
          );
      }

      return (
        <View style={styles.labContainer}>
        <View style={[styles.labHeader, { backgroundColor: theme.bgSurface }]}>
            <TouchableOpacity onPress={() => setSession(false)} style={{ position: 'absolute', left: 16 }}>
                <Feather name="arrow-left" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.labTag, { color: theme.gold, fontFamily: FONTS.semiBold }]}>AI Scenario: First Date</Text>
        </View>
        <ScrollView contentContainerStyle={styles.chatScroll}>
            <View style={styles.botRow}>
            <View style={[styles.msgBox, { backgroundColor: theme.bgElevated }]}>
                <Text style={[styles.msgText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>
                Hey, I didn't expect to be this nervous on a first date... What made you choose this place?
                </Text>
            </View>
            </View>
        </ScrollView>
        <View style={styles.chatInputRow}>
            <TextInput
            style={[styles.chatInput, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textMuted}
            value={msg}
            onChangeText={setMsg}
            />
            <TouchableOpacity style={[styles.sendCircle, { backgroundColor: theme.gold }]}>
            <Feather name="send" size={16} color="#0A0A0A" />
            </TouchableOpacity>
        </View>
        </View>
      );
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
        {activeTab === 'Wisdom' && <WisdomView />}
        {activeTab === 'Confidence' && <ConfidenceView />}
        {activeTab === 'Convo Lab' && <ConvoLabView />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  tabText: { fontSize: 13 },
  tabContent: { padding: SPACING.lg, gap: SPACING.md },
  
  // Wisdom
  wisdomCard: { borderRadius: 16, borderWidth: 1, padding: SPACING.lg },
  wisdomLabel: { fontSize: 10, letterSpacing: 1.2, marginBottom: SPACING.md },
  quote: { fontSize: 22, lineHeight: 32 },
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
  quoteTextSmall: { fontSize: 16, lineHeight: 24 },
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
  labHeader: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md, justifyContent: 'center', flexDirection: 'row' },
  labTag: { fontSize: 12, letterSpacing: 1 },
  chatScroll: { flex: 1, padding: SPACING.lg },
  botRow: { marginBottom: SPACING.md, maxWidth: '85%' },
  msgBox: { padding: SPACING.md, borderRadius: 14, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: SPACING.lg, gap: 12, alignItems: 'center' },
  chatInput: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, paddingHorizontal: 20 },
  sendCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
