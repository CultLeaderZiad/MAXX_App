import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, SPACING } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';

const TABS = ['Audit', 'Dating IQ', 'Brotherhood'];
const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'Tinder'];

export default function SocialScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Audit');
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [aiEngine, setAiEngine] = useState('Claude');

  const AuditView = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.platformRow}>
        {PLATFORMS.map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setActivePlatform(p)}
            style={[
              styles.platformBtn,
              {
                backgroundColor: activePlatform === p ? theme.gold : theme.bgElevated,
                borderColor: activePlatform === p ? theme.gold : theme.border,
              }
            ]}
          >
            <Text style={[styles.platformText, { color: activePlatform === p ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.medium }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aiToggleRow}>
        <Text style={[styles.label, { color: theme.textMuted, fontFamily: FONTS.medium }]}>AI Engine:</Text>
        <View style={styles.toggleGroup}>
          {['Claude', 'Gemini'].map(eng => (
            <TouchableOpacity
              key={eng}
              onPress={() => setAiEngine(eng)}
              style={[styles.toggleBtn, { backgroundColor: aiEngine === eng ? theme.bgElevated : 'transparent' }]}
            >
              <Text style={[styles.toggleText, { color: aiEngine === eng ? theme.gold : theme.textMuted, fontFamily: FONTS.semiBold }]}>{eng}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.usageText, { color: theme.textMuted, fontFamily: FONTS.regular }]}>2 of 3 used</Text>
      </View>

      <TextInput
        style={[styles.bioInput, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
        placeholder="Paste your bio here or describe your profile..."
        placeholderTextColor={theme.textMuted}
        multiline
      />

      <Button title="Analyse Profile" onPress={() => {}} testID="social-analyse-btn" />

      {/* Result Card */}
      <View style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Profile Score</Text>
          <Text style={[styles.scoreVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>7.2 / 10</Text>
        </View>
        <View style={styles.resultItem}>
          <Feather name="check" size={14} color="#2ECC71" />
          <Text style={[styles.resultText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Good photo lighting</Text>
        </View>
        <View style={styles.resultItem}>
          <Feather name="x" size={14} color="#E74C3C" />
          <Text style={[styles.resultText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Bio too generic — no personality</Text>
        </View>
        <View style={styles.suggestionRow}>
          <View style={[styles.sugCard, { backgroundColor: theme.bgElevated }]}>
             <Text style={[styles.sugLabel, { color: theme.textMuted }]}>Before: "23 | Fitness | Coffee"</Text>
          </View>
          <View style={[styles.sugCard, { backgroundColor: theme.bgElevated, borderColor: theme.gold, borderWidth: 0.5 }]}>
             <Text style={[styles.sugLabel, { color: theme.gold }]}>After: "Building something. Training harder. Asking questions."</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const BrotherhoodView = () => (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subText, { color: theme.textMuted, fontFamily: FONTS.regular, fontStyle: 'italic', marginBottom: SPACING.md }]}>Wins only · Anonymous · No negativity</Text>
        
        {[
          { id: 1, user: 'Alpha_4921', tag: 'Win', tagCol: '#2ECC71', text: 'Day 30 NoFap complete. First time in 3 years. My focus is insane now. Keep going brothers.', likes: 24, time: '2 hours ago' },
          { id: 2, user: 'Alpha_0072', tag: 'Milestone', tagCol: theme.gold, text: 'Level 2 jaw training unlocked. Jaw line starting to show after 2 weeks. The mewing actually works.', likes: 11, time: '5 hours ago' },
          { id: 3, user: 'Alpha_3317', tag: 'Insight', tagCol: '#3498DB', text: 'Cold showers for 14 days straight. The first 30 seconds never gets easier but everything after does.', likes: 8, time: '1 day ago' },
        ].map(post => (
          <View key={post.id} style={[styles.postCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.postHeader}>
              <View style={styles.postUserRow}>
                <View style={[styles.postAvatar, { backgroundColor: theme.bgElevated }]}>
                  <Feather name="user" size={14} color={theme.textMuted} />
                </View>
                <Text style={[styles.postUser, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>{post.user}</Text>
              </View>
              <View style={[styles.tagPill, { backgroundColor: post.tagCol + '22' }]}>
                <Text style={[styles.tagText, { color: post.tagCol, fontFamily: FONTS.semiBold }]}>{post.tag}</Text>
              </View>
            </View>
            <Text style={[styles.postText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{post.text}</Text>
            <View style={styles.postFooter}>
              <Text style={[styles.postTime, { color: theme.textMuted }]}>{post.time}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={[styles.likeBtn, { backgroundColor: theme.bgElevated }]}>
                   <Feather name="thumbs-up" size={12} color={theme.gold} />
                   <Text style={[styles.likeText, { color: theme.textSecondary }]}>{post.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.gold }]}>
        <Feather name="plus" size={24} color="#0A0A0A" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="social-screen">
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{activeTab === 'Brotherhood' ? 'Brotherhood' : 'Social'}</Text>
      
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
        {activeTab === 'Audit' && <AuditView />}
        {activeTab === 'Brotherhood' && <BrotherhoodView />}
        {activeTab === 'Dating IQ' && <View style={styles.placeholder}><Text style={{ color: theme.textMuted }}>Coming Soon</Text></View>}
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
  
  // Audit
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  platformText: { fontSize: 12 },
  aiToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SPACING.md },
  label: { fontSize: 13 },
  toggleGroup: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  toggleText: { fontSize: 11 },
  usageText: { fontSize: 11, marginLeft: 'auto' },
  bioInput: { height: 120, borderRadius: 14, borderWidth: 1, padding: SPACING.md, textAlignVertical: 'top', marginTop: SPACING.md },
  resultCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 1, marginTop: SPACING.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  scoreLabel: { fontSize: 13 },
  scoreVal: { fontSize: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resultText: { fontSize: 13 },
  suggestionRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.lg },
  sugCard: { flex: 1, padding: 12, borderRadius: 10 },
  sugLabel: { fontSize: 11, lineHeight: 16 },

  // Brotherhood
  subText: { fontSize: 12, marginLeft: 4 },
  postCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 1, marginBottom: SPACING.md },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  postUserRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  postUser: { fontSize: 14 },
  tagPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  tagText: { fontSize: 10, textTransform: 'uppercase' },
  postText: { fontSize: 14, lineHeight: 22, marginBottom: SPACING.md },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postTime: { fontSize: 11 },
  postActions: { flexDirection: 'row', gap: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  likeText: { fontSize: 12 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
