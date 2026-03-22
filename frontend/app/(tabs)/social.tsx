import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { BlurView } from 'expo-blur';
import { XPToast } from '../../src/components/XPToast';
import { formatDistanceToNow } from 'date-fns';

const TABS = ['Audit', 'Dating IQ', 'Brotherhood'];
const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'Tinder'];
const TAGS = ['Win', 'Milestone', 'Advice', 'Question'];

export default function SocialScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('Brotherhood');
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [aiEngine, setAiEngine] = useState('Claude');

  // Brotherhood State
  const [posts, setPosts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('Win');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVis, setToastVis] = useState(false);

  useEffect(() => {
    if (activeTab === 'Brotherhood') {
      fetchPosts();
      const channel = supabase
        .channel('community_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
          fetchPosts(); // Refresh on new post
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles(username, avatar_url, plan)')
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
      if (!newPostText.trim()) return;
      setPosting(true);

      let image_url = null;
      if (newPostImage && user) {
        try {
          const filePath = `posts/${user.id}/${Date.now()}.jpg`;
          const formData = new FormData();
          // @ts-ignore
          formData.append('file', { uri: newPostImage, name: 'post.jpg', type: 'image/jpeg' });
          const { error: uploadError } = await supabase.storage.from('social').upload(filePath, formData as any);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('social').getPublicUrl(filePath);
            image_url = publicUrl;
          }
        } catch (e) { console.error('Image upload failed', e); }
      }
      
      const newP = {
          user_id: user?.id,
          content: newPostText,
          post_type: newPostTag,
          image_url,
          likes: 0
      };

      try {
          const { error } = await supabase.from('community_posts').insert(newP);
          if (!error) {
              setNewPostText('');
              setNewPostImage(null);
              setShowCompose(false);
              setToastVis(true);
          }
      } catch(e) { console.error(e); }
      setPosting(false);
  };

  const pickPostImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setNewPostImage(result.assets[0].uri);
  };

  const handleRespect = async (id: string, currentLikes: number) => {
      // Optimistic
      setPosts((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, likes: currentLikes + 1 } : p));
      try {
        await supabase.from('community_posts').update({ likes: currentLikes + 1 }).eq('id', id);
      } catch(e) {}
  };

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

      <Button title="Analyse Profile" onPress={() => { alert('Analysis started (Backend Phase 10)'); }} testID="social-analyse-btn" />

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
          {loading && posts.length === 0 ? <ActivityIndicator color={theme.gold} style={{ marginTop: 20 }} /> : null}
          {posts.map((post: any) => {
            const isAlpha = post.profiles?.plan === 'alpha';
            return (
              <View key={post.id} style={[styles.postCard, { backgroundColor: theme.bgSurface, borderColor: isAlpha ? theme.gold : theme.border, borderWidth: isAlpha ? 1.5 : 1 }]}>
                <View style={styles.postHeader}>
                  <View style={styles.postUserRow}>
                    <View style={[styles.postAvatar, { backgroundColor: theme.bgElevated }]}>
                      {post.profiles?.avatar_url ? (
                        <Image source={{ uri: post.profiles.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
                      ) : (
                        <Feather name="user" size={14} color={theme.textMuted} />
                      )}
                    </View>
                    <Text style={[styles.postUser, { color: isAlpha ? theme.gold : theme.textSecondary, fontFamily: isAlpha ? FONTS.cinzelBold : FONTS.medium }]}>
                      {post.profiles?.username || 'Brother'}
                    </Text>
                    {isAlpha && <Feather name="award" size={14} color={theme.gold} />}
                  </View>
                  <View style={[styles.tagPill, { backgroundColor: theme.gold + '22' }]}>
                    <Text style={[styles.tagText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>{post.post_type || 'Win'}</Text>
                  </View>
                </View>
                <Text style={[styles.postText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{post.content}</Text>
                {post.image_url && (
                  <Image source={{ uri: post.image_url }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} />
                )}
                <View style={styles.postFooter}>
                  <Text style={[styles.postTime, { color: theme.textMuted }]}>
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at)) + ' ago' : 'Recently'}
                  </Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity onPress={() => handleRespect(post.id, post.likes)} style={[styles.likeBtn, { backgroundColor: theme.bgElevated }]}>
                       <Feather name="star" size={12} color={theme.gold} />
                       <Text style={[styles.likeText, { color: theme.textSecondary }]}>RESPECT • {post.likes || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
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
      <Modal visible={showCompose} transparent animationType="fade">
          <BlurView intensity={80} tint="dark" style={styles.modalBg}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyWrap}>
                 <View style={[styles.composeCard, { backgroundColor: theme.bgPrimary, borderColor: theme.border }]}>
                     <View style={styles.composeHeader}>
                         <Text style={[styles.composeTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Broadcast</Text>
                         <TouchableOpacity onPress={() => setShowCompose(false)}>
                             <Feather name="x" size={24} color={theme.textMuted} />
                         </TouchableOpacity>
                     </View>
                     
                     <TextInput 
                        style={[styles.composeInput, { color: theme.textPrimary, fontFamily: FONTS.regular, backgroundColor: theme.bgSurface, borderColor: theme.border }]}
                        placeholder="Share a win or milestone..."
                        placeholderTextColor={theme.textMuted}
                        multiline
                        autoFocus
                        value={newPostText}
                        onChangeText={setNewPostText}
                     />
                                          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={pickPostImage} style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                          {newPostImage ? (
                            <Image source={{ uri: newPostImage }} style={{ width: '100%', height: '100%', borderRadius: 11 }} />
                          ) : (
                            <Feather name="image" size={20} color={theme.gold} />
                          )}
                        </TouchableOpacity>
                        <View style={styles.composeTags}>
                          {TAGS.map(t => (
                              <TouchableOpacity 
                                 key={t} 
                                 onPress={() => setNewPostTag(t)}
                                 style={[styles.cTag, { 
                                      backgroundColor: newPostTag === t ? theme.gold + '33' : theme.bgElevated,
                                      borderColor: newPostTag === t ? theme.gold : 'transparent',
                                      borderWidth: 1
                                 }]}
                              >
                                  <Text style={{ color: newPostTag === t ? theme.gold : theme.textMuted, fontSize: 11, fontFamily: FONTS.semiBold }}>{t}</Text>
                              </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <Button title={posting ? "BROADCASTING..." : "POST TO BROTHERHOOD"} disabled={posting} onPress={handlePost} style={{ marginTop: SPACING.md }} />
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
