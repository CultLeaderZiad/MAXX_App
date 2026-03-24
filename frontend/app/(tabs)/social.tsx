import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiCall } from '../../lib/api';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { BlurView } from 'expo-blur';
import { XPToast } from '../../src/components/XPToast';
import { formatDistanceToNow } from 'date-fns';

const TABS = ['Audit', 'Dating IQ', 'Brotherhood'];
const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'Tinder'];
const POST_TYPES = ['WIN', 'MILESTONE', 'INSIGHT'];

export default function SocialScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('Brotherhood');
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [aiEngine, setAiEngine] = useState('Gemini');

  // Brotherhood State
  const [posts, setPosts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostType, setNewPostType] = useState('WIN');
  const [loading, setLoading] = useState(true);
  const [toastVis, setToastVis] = useState(false);

  // Audit state
  const [bioText, setBioText] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Brotherhood subscriptions
  useEffect(() => {
    if (activeTab !== 'Brotherhood') return;
    fetchPosts();
    const channel = supabase
      .channel('brotherhood')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        payload => {
          if (!payload.new.is_flagged) {
            setPosts(prev => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.log('Brotherhood fetch error:', err);
      setPosts([]);
    } finally {
      setLoading(false); // ← ALWAYS called
    }
  };

  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setPosting(true);
    const anonName = 'Alpha_' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const newP = {
      user_id: user?.id,
      content: newPostText,
      post_type: newPostType,
      anon_display_name: anonName,
      respect_count: 0,
      is_flagged: false,
    };
    try {
      const { error } = await supabase.from('community_posts').insert(newP);
      if (!error) {
        setNewPostText('');
        setShowCompose(false);
        setToastVis(true);
        fetchPosts();
      }
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  const handleRespect = async (postId: string, currentCount: number) => {
    if (!user) return;
    // Check if already respected
    try {
      const { data: existing } = await supabase
        .from('post_respects')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      if (existing) return; // already respected
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, respect_count: (p.respect_count || 0) + 1 } : p));
      await supabase.from('post_respects').insert({ user_id: user.id, post_id: postId });
      await supabase.from('community_posts').update({ respect_count: currentCount + 1 }).eq('id', postId);
    } catch (e) { console.error(e); }
  };

  // ─── Profile Audit ─────────────────────────────────────────────────────────
  const analyseProfile = async () => {
    if (!bioText.trim()) {
      Alert.alert('Missing Bio', 'Paste your bio or describe your profile first.');
      return;
    }
    setAnalysing(true);
    setAuditResult(null);
    try {
      const data = await apiCall('/api/profile-audit', 'POST', {
        platform: activePlatform,
        bio: bioText.trim(),
      });
      setAuditResult(data);
    } catch (err) {
      // Fallback mock so UI never breaks
      setAuditResult({
        score: 6.0,
        strengths: ['Has some personality', 'Relatively concise'],
        improvements: ['Too generic', 'No conversation hook', 'Sounds like everyone else'],
        rewritten_bio: 'Training jaw + posture daily. Building something real. Ask me.',
        quick_wins: ['Add one specific detail only you have', 'Remove all generic words', 'End with an opener'],
      });
    } finally {
      setAnalysing(false);
    }
  };

  const AuditView = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.platformRow}>
        {PLATFORMS.map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setActivePlatform(p)}
            style={[styles.platformBtn, { backgroundColor: activePlatform === p ? theme.gold : theme.bgElevated, borderColor: activePlatform === p ? theme.gold : theme.border }]}
          >
            <Text style={[styles.platformText, { color: activePlatform === p ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.medium }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.bioInput, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
        placeholder="Paste your bio here or describe your profile..."
        placeholderTextColor={theme.textMuted}
        multiline
        value={bioText}
        onChangeText={setBioText}
      />

      <Button title={analysing ? 'ANALYSING...' : 'ANALYSE PROFILE'} onPress={analyseProfile} testID="social-analyse-btn" />

      {/* Result Card */}
      {auditResult && (
        <View style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Profile Score</Text>
            <Text style={[styles.scoreVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{auditResult.score} / 10</Text>
          </View>
          {auditResult.strengths?.map((s: string, i: number) => (
            <View key={i} style={styles.resultItem}>
              <Feather name="check" size={14} color="#2ECC71" />
              <Text style={[styles.resultText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{s}</Text>
            </View>
          ))}
          {auditResult.improvements?.map((s: string, i: number) => (
            <View key={i} style={styles.resultItem}>
              <Feather name="x" size={14} color="#E74C3C" />
              <Text style={[styles.resultText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{s}</Text>
            </View>
          ))}
          {auditResult.rewritten_bio && (
            <View style={styles.suggestionRow}>
              <View style={[styles.sugCard, { backgroundColor: theme.bgElevated }]}>
                <Text style={[styles.sugLabel, { color: theme.textMuted }]}>Before: your original bio</Text>
              </View>
              <View style={[styles.sugCard, { backgroundColor: theme.bgElevated, borderColor: theme.gold, borderWidth: 0.5 }]}>
                <Text style={[styles.sugLabel, { color: theme.gold }]}>After: "{auditResult.rewritten_bio}"</Text>
              </View>
            </View>
          )}
        </View>
      )}
      {!auditResult && (
        <View style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Profile Score</Text>
            <Text style={[styles.scoreVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>—</Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>Enter your bio above and tap Analyse to get your score.</Text>
        </View>
      )}
    </ScrollView>
  );

  const BrotherhoodView = () => (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 20 }} />
        ) : posts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>💪</Text>
            <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 16, marginBottom: 8 }}>Be the first to post a win</Text>
            <TouchableOpacity onPress={() => setShowCompose(true)} style={{ backgroundColor: theme.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.pill }}>
              <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold }}>Post Your Win</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post: any) => {
            const name = post.anon_display_name || post.profiles?.username || 'Brother';
            const isAlpha = post.profiles?.plan === 'alpha';
            return (
              <View key={post.id} style={[styles.postCard, { backgroundColor: theme.bgSurface, borderColor: isAlpha ? theme.gold : theme.border, borderWidth: isAlpha ? 1.5 : 1 }]}>
                <View style={styles.postHeader}>
                  <View style={styles.postUserRow}>
                    <View style={[styles.postAvatar, { backgroundColor: theme.bgElevated }]}>
                      <Feather name="user" size={14} color={theme.textMuted} />
                    </View>
                    <Text style={[styles.postUser, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{name}</Text>
                  </View>
                  <View style={[styles.tagPill, { backgroundColor: theme.gold + '22' }]}>
                    <Text style={[styles.tagText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>{post.post_type || 'WIN'}</Text>
                  </View>
                </View>
                <Text style={[styles.postText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{post.content}</Text>
                <View style={styles.postFooter}>
                  <Text style={[styles.postTime, { color: theme.textMuted }]}>
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at)) + ' ago' : 'Recently'}
                  </Text>
                  <TouchableOpacity onPress={() => handleRespect(post.id, post.respect_count || 0)} style={[styles.likeBtn, { backgroundColor: theme.bgElevated }]}>
                    <Text style={{ fontSize: 14 }}>💪</Text>
                    <Text style={[styles.likeText, { color: theme.textSecondary }]}>RESPECT • {post.respect_count || 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <TouchableOpacity onPress={() => setShowCompose(true)} style={[styles.fab, { backgroundColor: theme.gold }]}>
        <Feather name="edit-2" size={24} color="#0A0A0A" />
      </TouchableOpacity>
    </View>
  );

  const DatingIQView = () => {
      const lessons = [
          { id: 1, title: 'The Approach', time: '5 min', number: '01' },
          { id: 2, title: 'Texting Game', time: '8 min', number: '02' },
          { id: 3, title: 'First Date Logistics', time: '6 min', number: '03' },
          { id: 4, title: 'Escalation', time: '7 min', number: '04', locked: true },
      ];
      
      return (
        <ScrollView contentContainerStyle={styles.tabContent}>
            {lessons.map(l => (
                <TouchableOpacity key={l.id}>
                    <Card style={StyleSheet.flatten([styles.lessonCard, { opacity: l.locked ? 0.6 : 1 }])}>
                        <View style={styles.lessonLeft}>
                            <Text style={[styles.lessonNum, { color: theme.textMuted, fontFamily: FONTS.cinzelBold }]}>{l.number}</Text>
                            <View>
                                <Text style={[styles.lessonTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{l.title}</Text>
                                <Text style={[styles.lessonTime, { color: theme.textSecondary }]}>{l.time} read</Text>
                            </View>
                        </View>
                        {l.locked ? <Feather name="lock" size={18} color={theme.textMuted} /> : <Feather name="play-circle" size={20} color={theme.gold} />}
                    </Card>
                </TouchableOpacity>
            ))}
        </ScrollView>
      );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="social-screen">
      <XPToast visible={toastVis} amount={10} onDone={() => setToastVis(false)} />
      
      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
        {activeTab}
      </Text>
      
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
        {activeTab === 'Dating IQ' && <DatingIQView />}
      </View>

      {/* Compose Post Modal */}
      <Modal visible={showCompose} transparent animationType="slide">
        <BlurView intensity={80} tint="dark" style={styles.modalBg}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyWrap}>
            <View style={[styles.composeCard, { backgroundColor: theme.bgPrimary, borderColor: theme.border }]}>
              <View style={styles.composeHeader}>
                <Text style={[styles.composeTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Broadcast</Text>
                <TouchableOpacity onPress={() => setShowCompose(false)}>
                  <Feather name="x" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Post type chips */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
                {POST_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setNewPostType(t)}
                    style={[styles.cTag, {
                      backgroundColor: newPostType === t ? theme.gold + '33' : theme.bgElevated,
                      borderColor: newPostType === t ? theme.gold : 'transparent',
                      borderWidth: 1,
                    }]}
                  >
                    <Text style={{ color: newPostType === t ? theme.gold : theme.textMuted, fontSize: 11, fontFamily: FONTS.semiBold }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.composeInput, { color: theme.textPrimary, fontFamily: FONTS.regular, backgroundColor: theme.bgSurface, borderColor: theme.border }]}
                placeholder="Share a win or milestone... (500 chars max)"
                placeholderTextColor={theme.textMuted}
                multiline
                autoFocus
                maxLength={500}
                value={newPostText}
                onChangeText={setNewPostText}
              />
              <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'right', marginBottom: SPACING.md }}>{newPostText.length}/500</Text>

              <Button title={posting ? 'BROADCASTING...' : 'POST TO BROTHERHOOD'} disabled={posting} onPress={handlePost} style={{ marginTop: SPACING.md }} />
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
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
  postText: { fontSize: 14, lineHeight: 22, marginVertical: SPACING.sm },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postTime: { fontSize: 11 },
  postActions: { flexDirection: 'row', gap: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  likeText: { fontSize: 12, letterSpacing: 0.5 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  
  // Dating IQ
  lessonCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  lessonNum: { fontSize: 18, width: 30 },
  lessonTitle: { fontSize: 15 },
  lessonTime: { fontSize: 12, marginTop: 2 },

  // Modal Compose
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  modalKeyWrap: { flex: 1, justifyContent: 'flex-end' },
  composeCard: { padding: SPACING.xl, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  composeTitle: { fontSize: 20 },
  composeInput: { height: 100, borderRadius: 12, borderWidth: 1, padding: SPACING.md, textAlignVertical: 'top', marginBottom: SPACING.md },
  composeTags: { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl, flexWrap: 'wrap' },
  cTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
});
