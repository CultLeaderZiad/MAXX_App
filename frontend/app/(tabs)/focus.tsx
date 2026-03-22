import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, SPACING } from '../../src/constants/theme';

const TABS = ['Wisdom', 'Confidence', 'Convo Lab'];

export default function FocusScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Wisdom');
  const [msg, setMsg] = useState('');

  const WisdomView = () => (
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

      <View style={[styles.quoteSmall, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Text style={[styles.quoteTextSmall, { color: theme.textSecondary, fontFamily: FONTS.semiBold }]}>
          "Comfort is the enemy wearing your face."
        </Text>
        <Text style={[styles.authorSmall, { color: theme.textMuted, fontFamily: FONTS.regular }]}>— Andrew Tate</Text>
      </View>
      
      <View style={[styles.quoteSmall, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Text style={[styles.quoteTextSmall, { color: theme.textSecondary, fontFamily: FONTS.semiBold }]}>
          "The man who has nothing to protect..."
        </Text>
        <Text style={[styles.authorSmall, { color: theme.textMuted, fontFamily: FONTS.regular }]}>— MAXX Doctrine</Text>
      </View>
    </ScrollView>
  );

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

  const ConvoLabView = () => (
    <View style={styles.labContainer}>
      <View style={[styles.labHeader, { backgroundColor: theme.bgSurface }]}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="focus-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Focus</Text>
      
      {/* Sub Tabs */}
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
  quoteSmall: { padding: SPACING.lg, borderRadius: 14, borderWidth: 1 },
  quoteTextSmall: { fontSize: 16, lineHeight: 24 },
  authorSmall: { fontSize: 12, marginTop: 4, opacity: 0.6 },

  // Confidence
  moduleCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 14, borderWidth: 1, gap: SPACING.md },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moduleNum: { fontSize: 16 },
  moduleMeta: { flex: 1 },
  moduleTitle: { fontSize: 15 },
  moduleSub: { fontSize: 12, marginTop: 2 },

  // Convo Lab
  labContainer: { flex: 1 },
  labHeader: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  labTag: { fontSize: 12, letterSpacing: 1 },
  chatScroll: { flex: 1, padding: SPACING.lg },
  botRow: { marginBottom: SPACING.md, maxWidth: '85%' },
  msgBox: { padding: SPACING.md, borderRadius: 14, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: SPACING.lg, gap: 12, alignItems: 'center' },
  chatInput: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, paddingHorizontal: 20 },
  sendCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
