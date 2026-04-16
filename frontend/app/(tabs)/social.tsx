import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { decode } from 'base64-arraybuffer';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiCall } from '../../lib/api';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { BlurView } from 'expo-blur';
import { XPToast } from '../../src/components/XPToast';
import { formatDistanceToNow } from 'date-fns';
import { usePlan } from '../../hooks/usePlan';
import { GeminiKeyService } from '../../lib/geminiKey';
import { GeminiKeyModal } from '../../src/components/GeminiKeyModal';

const TABS = ['Audit', 'Dating IQ', 'Brotherhood', 'Library'];
const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'Tinder'];
const POST_TYPES = ['win', 'milestone', 'insight'];

// ── Seed posts shown when the real feed is empty ──────────────────────────────
const SEED_POSTS = [
  {
    id: 'seed-1',
    content: 'Just completed my first 30-day mewing streak. Face structure is visibly changing. Stay consistent brothers. The results are real.',
    post_type: 'win',
    anon_display_name: 'Alpha_BRKR',
    respect_count: 87,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Alpha_BRKR', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-2',
    content: 'Gym PR today — 100kg bench at 78kg bodyweight. 8 months of consistent training. The grind never lies.',
    post_type: 'milestone',
    anon_display_name: 'Iron_VZRT',
    respect_count: 143,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Iron_VZRT', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-3',
    content: 'Discipline is not about how you feel. It is about what you do when you feel nothing. Cold shower every day since January. No exceptions.',
    post_type: 'insight',
    anon_display_name: 'Sigma_MNVR',
    respect_count: 210,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Sigma_MNVR', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-4',
    content: 'Lost 15kg in 4 months. No cheat meals. No excuses. The body follows the mind. You are more capable than you think.',
    post_type: 'win',
    anon_display_name: 'Delta_XKRL',
    respect_count: 195,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Delta_XKRL', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-5',
    content: 'Stopped doom-scrolling for 30 days. Read 4 books. Focus is completely transformed. Information diet matters as much as food diet.',
    post_type: 'insight',
    anon_display_name: 'Omega_TRVL',
    respect_count: 167,
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Omega_TRVL', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-6',
    content: '2 years of hard mewing, face pulls, and jaw training. Face is completely different now. Natural methods work if you are consistent.',
    post_type: 'milestone',
    anon_display_name: 'Gamma_FXRT',
    respect_count: 323,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Gamma_FXRT', avatar_url: null, role: 'user' },
  },
  {
    id: 'seed-7',
    content: 'Interviewed for 3 roles this month. Got all 3 offers. Posture training and confidence work changed how I present myself in every room.',
    post_type: 'win',
    anon_display_name: 'Alpha_PZRT',
    respect_count: 281,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    is_flagged: false,
    profile: { full_name: 'Alpha_PZRT', avatar_url: null, role: 'user' },
  },
];

export default function SocialScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Brotherhood');
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const { canAccess, handleGate } = usePlan();

  // Brotherhood State
  const [feedScope, setFeedScope] = useState<'brotherhood' | 'global'>('global');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [posts, setPosts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostType, setNewPostType] = useState('win');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [toastVis, setToastVis] = useState(false);

  const EMOJI_QUICK_ACTIONS = ['🏆', '🔥', '💪', '🚀', '🧠', '💼', '🤝', '💎', '📈'];

  // ── Image picker → Supabase Storage ──────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64 && user) {
      const base64 = result.assets[0].base64;
      setImageUploading(true);
      try {
        const filePath = `posts/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('community')
          .upload(filePath, decode(base64), {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('community')
            .getPublicUrl(filePath);
          setNewPostImage(publicUrl);
        } else {
          // Fallback: keep as base64 data URL if storage bucket doesn't exist yet
          setNewPostImage(`data:image/jpeg;base64,${base64}`);
        }
      } catch (e) {
        setNewPostImage(`data:image/jpeg;base64,${base64}`);
      } finally {
        setImageUploading(false);
      }
    }
  };

  // Audit state
  const [bioText, setBioText] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [geminiKey, setGeminiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    GeminiKeyService.get().then(k => k && setGeminiKey(k));
  }, []);

  // ── Profile Audit ─────────────────────────────────────────────────────────
  const analyseProfile = async () => {
    if (!bioText.trim()) {
      Alert.alert('Missing Bio', 'Paste your bio or describe your profile first.');
      return;
    }
    if (!geminiKey) {
      setShowKeyModal(true);
      return;
    }
    setAnalysing(true);
    setAuditResult(null);
    try {
      const data = await apiCall('/api/profile-audit', 'POST', {
        platform: activePlatform,
        bio: bioText.trim(),
        goals: profile?.goals || [],
        weak_spots: profile?.weak_spots || [],
        height_cm: profile?.height_cm || null,
        weight_kg: profile?.weight_kg || null,
        api_key: geminiKey,
      });
      setAuditResult(data);
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('api key') || errMsg.includes('no_api_key')) {
        await GeminiKeyService.clear();
        setGeminiKey(null);
        setShowKeyModal(true);
      } else {
        Alert.alert('AI Unavailable', 'Could not analyse profile. Try again.');
      }
    } finally {
      setAnalysing(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'Brotherhood') return;

    let active = true;
    const timeout = setTimeout(() => {
      if (active && loading) setLoading(false);
    }, 6000);

    fetchPosts().then(() => {
      if (active) clearTimeout(timeout);
    });

    // ── Real-time subscription ──────────────────────────────────────────────
    const channel = supabase
      .channel('brotherhood')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        payload => {
          if (!payload.new.is_flagged) {
            fetchPosts(); // Re-fetch to get joined profile relation
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [activeTab, feedScope, sortOrder]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles!user_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('is_flagged', false)
        .order('created_at', { ascending: sortOrder === 'oldest' })
        .limit(30);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.log('Brotherhood fetch error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit post ───────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newPostText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    const anonName = 'Alpha_' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const newP = {
      user_id: user?.id,
      content: newPostText,
      post_type: newPostType,
      anon_display_name: anonName,
      respect_count: 0,
      is_flagged: false,
      image_url: newPostImage,
    };
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert(newP)
        .select(`*, profile:profiles!user_id (full_name, avatar_url, role)`)
        .single();

      if (error) {
        Alert.alert('Post Failed', error.message);
      } else if (data) {
        setNewPostText('');
        setNewPostImage(null);
        setShowCompose(false);
        setToastVis(true);
        setFeedScope('global');
        // Optimistic prepend
        setPosts(prev => {
          if (prev.find(p => p.id === data.id)) return prev;
          return sortOrder === 'oldest' ? [...prev, data] : [data, ...prev];
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    }
    setPosting(false);
  };

  // ── Respect (like) with duplicate prevention ──────────────────────────────
  const handleRespect = async (postId: string, currentCount: number) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data: existing } = await supabase
        .from('post_respects')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      if (existing) return; // already respected
      // Optimistic update
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, respect_count: (p.respect_count || 0) + 1 } : p)
      );
      await supabase.from('post_respects').insert({ user_id: user.id, post_id: postId });
      await supabase
        .from('community_posts')
        .update({ respect_count: currentCount + 1 })
        .eq('id', postId);
    } catch (e) {
      console.error(e);
    }
  };

  const renderPostContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <Text
            key={i}
            onPress={() => Alert.alert('Profile', `Viewing ${part}'s profile. (Coming Soon)`)}
            style={{ color: theme.gold, fontFamily: FONTS.semiBold }}
          >
            {part}
          </Text>
        );
      }
      return <Text key={i} style={{ color: theme.textPrimary }}>{part}</Text>;
    });
  };

  const AuditView = () => (
    <View style={styles.tabContent}>
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
              },
            ]}
          >
            <Text style={[styles.platformText, { color: activePlatform === p ? '#000' : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={bioText}
        onChangeText={setBioText}
        placeholder="Paste your bio or describe your profile..."
        placeholderTextColor={theme.textMuted}
        multiline
        style={[styles.bioInput, { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
      />

      <Button
        label={analysing ? 'Analysing...' : 'ANALYSE PROFILE'}
        onPress={analyseProfile}
        disabled={analysing}
      />

      {auditResult && (
        <View style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: theme.textSecondary, fontFamily: FONTS.bold }]}>Profile Score</Text>
            <Text style={[styles.scoreVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{auditResult.score} / 10</Text>
          </View>
          {auditResult.vibe_rating && (
            <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: FONTS.semiBold, marginBottom: SPACING.md }}>
              "{auditResult.vibe_rating}"
            </Text>
          )}
          <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 8 }}>STRENGTHS</Text>
          {auditResult.strengths?.map((s: string, i: number) => (
            <View key={i} style={styles.resultItem}>
              <Feather name="check" size={14} color={theme.success || '#2ECC71'} />
              <Text style={[styles.resultText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{s}</Text>
            </View>
          ))}
          <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginTop: SPACING.md, marginBottom: 8 }}>WEAKNESSES</Text>
          {(auditResult.weaknesses || auditResult.improvements)?.map((s: string, i: number) => (
            <View key={i} style={styles.resultItem}>
              <Feather name="arrow-up-right" size={14} color={theme.gold} />
              <Text style={[styles.resultText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{s}</Text>
            </View>
          ))}
          {auditResult.recommendations?.length > 0 && (
            <>
              <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginTop: SPACING.md, marginBottom: 8 }}>RECOMMENDATIONS</Text>
              {auditResult.recommendations.map((s: string, i: number) => (
                <View key={i} style={styles.resultItem}>
                  <Feather name="star" size={14} color={theme.gold} />
                  <Text style={[styles.resultText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{s}</Text>
                </View>
              ))}
            </>
          )}
          {auditResult.rewritten_bio && (
            <View style={{ marginTop: SPACING.md, padding: SPACING.md, backgroundColor: theme.bgElevated, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: theme.gold }}>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONTS.bold, marginBottom: 6 }}>AI-REWRITTEN BIO</Text>
              <Text style={{ color: theme.textPrimary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 }}>"{auditResult.rewritten_bio}"</Text>
            </View>
          )}
          {auditResult.quick_wins?.length > 0 && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 8 }}>QUICK WINS</Text>
              {auditResult.quick_wins.map((s: string, i: number) => (
                <View key={i} style={styles.resultItem}>
                  <Feather name="zap" size={14} color="#27AE60" />
                  <Text style={[styles.resultText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {!auditResult && (
        <View style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: theme.textSecondary, fontFamily: FONTS.bold }]}>Profile Score</Text>
            <Text style={[styles.scoreVal, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>—</Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>
            {!geminiKey ? 'Add your Gemini AI key (free) to unlock analysis.' : 'Enter your bio above and tap Analyse to get your score.'}
          </Text>
          {!geminiKey && (
            <TouchableOpacity
              onPress={() => setShowKeyModal(true)}
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Feather name="zap" size={14} color={theme.gold} />
              <Text style={{ color: theme.gold, fontFamily: FONTS.semiBold, fontSize: 13 }}>Add AI Key →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // ── Brotherhood View ──────────────────────────────────────────────────────
  const BrotherhoodView = () => {
    // Show seed posts when DB feed is empty (e.g., fresh launch)
    const displayPosts = posts.length > 0 ? posts : SEED_POSTS;

    return (
      <ScrollView style={styles.flex} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}>
        {/* Scope / sort controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md }}>
          <View style={[styles.scopeBar, { borderColor: theme.border, flex: 1 }]}>
            <TouchableOpacity
              onPress={() => setFeedScope('global')}
              style={[styles.scopeBtn, feedScope === 'global' && { backgroundColor: theme.gold + '22' }]}
            >
              <Text style={[styles.subText, { color: feedScope === 'global' ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold }]}>GLOBAL FEED</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFeedScope('brotherhood')}
              style={[styles.scopeBtn, feedScope === 'brotherhood' && { backgroundColor: theme.gold + '22' }]}
            >
              <Text style={[styles.subText, { color: feedScope === 'brotherhood' ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold }]}>MY BROTHERHOOD</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: theme.bgElevated, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: theme.border }}
          >
            <Feather name="clock" size={12} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, fontSize: 10, fontFamily: FONTS.semiBold }}>
              {sortOrder === 'latest' ? 'LATEST FIRST' : 'OLDEST FIRST'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
        ) : (
          displayPosts.map((post: any) => {
            const name = post.anon_display_name || post.profile?.full_name || 'Brother';
            return (
              <View
                key={post.id}
                style={[styles.postCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postUserRow}>
                    <View style={[styles.postAvatar, { backgroundColor: theme.gold + '22' }]}>
                      <Text style={{ color: theme.gold, fontSize: 13, fontFamily: FONTS.bold }}>{name[0]}</Text>
                    </View>
                    <View>
                      <Text style={[styles.postUser, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONTS.regular }}>
                        {post.profile?.rank || 'Member'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.tagPill, { backgroundColor: theme.gold + '22' }]}>
                    <Text style={[styles.tagText, { color: theme.gold, fontFamily: FONTS.bold }]}>{post.post_type || 'win'}</Text>
                  </View>
                </View>

                <Text style={[styles.postText, { color: theme.textPrimary, fontFamily: FONTS.regular }]}>
                  {renderPostContent(post.content)}
                </Text>

                {post.image_url && (
                  <View style={styles.postImageWrap}>
                    <Image source={{ uri: post.image_url }} style={styles.postImage} />
                  </View>
                )}

                <View style={styles.postFooter}>
                  <Text style={[styles.postTime, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
                    {post.created_at
                      ? formatDistanceToNow(new Date(post.created_at)) + ' ago'
                      : 'Recently'}
                  </Text>
                  <View style={styles.reactionRow}>
                    {['💪', '🔥', '🏆', '🤝'].map(emoji => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => handleRespect(post.id, post.respect_count || 0)}
                        style={[styles.miniReaction, { backgroundColor: theme.bgElevated, borderColor: theme.border, borderWidth: 0.5 }]}
                      >
                        <Text style={{ fontSize: 12 }}>{emoji}</Text>
                        <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>{post.respect_count || 0}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* FAB - Opens compose bottom sheet */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowCompose(true); }}
          style={[styles.fab, { backgroundColor: theme.gold, position: 'absolute', bottom: 20, right: 20 }]}
        >
          <Feather name="plus" size={28} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const DatingIQView = () => {
    const lessons = [
      { id: 1, title: 'The Approach', time: '5 min', number: '01', scenario: 'cold_approach', plan: 'trial' },
      { id: 2, title: 'Texting Game', time: '8 min', number: '02', scenario: 'texting_game', plan: 'sigma' },
      { id: 3, title: 'First Date Logistics', time: '6 min', number: '03', scenario: 'first_date', plan: 'trial' },
      { id: 4, title: 'Escalation', time: '7 min', number: '04', scenario: 'number_close', plan: 'alpha' },
    ];

    return (
      <View style={styles.tabContent}>
        {lessons.map(l => (
          <TouchableOpacity
            key={l.id}
            onPress={() => {
              if (!canAccess(l.plan)) {
                handleGate(l.plan);
                return;
              }
              router.push({ pathname: '/convo-lab', params: { scenario: l.scenario } } as any);
            }}
            style={[styles.lessonCard, { backgroundColor: theme.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 12 }]}
          >
            <View style={styles.lessonLeft}>
              <Text style={[styles.lessonNum, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{l.number}</Text>
              <View>
                <Text style={[styles.lessonTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>{l.title}</Text>
                <Text style={[styles.lessonTime, { color: theme.textMuted, fontFamily: FONTS.regular }]}>{l.time} read • Practice now</Text>
              </View>
            </View>
            {!canAccess(l.plan) ? <Feather name="lock" size={16} color={theme.textMuted} /> : <Feather name="chevron-right" size={16} color={theme.gold} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const LibraryView = () => {
    const CREATOR_VIDEOS = [
      { id: '1', creator: 'Andrew Huberman', title: 'Science of Testosterone Optimization', youtube_id: 'qJXKhu5UZwk', category: 'Science', color: '#4A90D9' },
      { id: '2', creator: 'David Goggins', title: 'How to Build Mental Toughness', youtube_id: 'TLKxdTmk-zc', category: 'Mindset', color: '#E74C3C' },
      { id: '3', creator: 'Elliott Hulse', title: 'Become the Strongest Version', youtube_id: 'lE6RYpe9IT0', category: 'Fitness', color: '#2ECC71' },
      { id: '4', creator: 'Myron Gaines', title: 'Fresh & Fit Podcast', youtube_id: 'WKqVfmJe7F4', category: 'Dating', color: '#9B59B6' },
      { id: '5', creator: 'Joe Rogan', title: 'Discipline, Health and Success', youtube_id: 'J7eTH5m7WmM', category: 'Mindset', color: '#F39C12' },
      { id: '6', creator: 'Sneako', title: 'The Modern Man\'s Guide', youtube_id: 'iMGO6wf8gMI', category: 'Mindset', color: GOLD },
      { id: '7', creator: 'Alex Hormozi', title: '$100M Business Lessons', youtube_id: '5_cC5q1NdiI', category: 'Finance', color: '#1ABC9C' },
      { id: '8', creator: 'Ryan Holiday', title: 'Stoicism for Modern Men', youtube_id: 'nu59OfUSpFg', category: 'Wisdom', color: '#8E44AD' },
    ];
    const cats = ['All', 'Mindset', 'Fitness', 'Dating', 'Science', 'Finance', 'Wisdom'];
    const [selCat, setSelCat] = React.useState('All');
    const filtered = selCat === 'All' ? CREATOR_VIDEOS : CREATOR_VIDEOS.filter(v => v.category === selCat);

    const openVideo = (ytId: string) => {
      const { Linking } = require('react-native');
      Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`);
    };

    return (
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100, backgroundColor: '#0A0A0A' }} showsVerticalScrollIndicator={false} style={{ backgroundColor: '#0A0A0A' }}>
        <Text style={[{ color: theme.textMuted, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: SPACING.md }]}>
          CREATOR LIBRARY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
          {cats.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelCat(cat)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, marginRight: 8,
                backgroundColor: selCat === cat ? theme.gold : theme.bgSurface, borderWidth: 1, borderColor: selCat === cat ? theme.gold : theme.border }}
            >
              <Text style={[{ fontSize: 12, fontFamily: FONTS.bold, color: selCat === cat ? '#000' : theme.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {filtered.map(video => (
          <TouchableOpacity key={video.id} onPress={() => openVideo(video.youtube_id)}
            style={[{ backgroundColor: theme.bgSurface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: theme.border, marginBottom: SPACING.md, overflow: 'hidden' }]}
            activeOpacity={0.85}
          >
            <View style={{ height: 100, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center' }}>
              <Image source={{ uri: `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg` }}
                style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="play" size={20} color="#FFFFFF" />
              </View>
              <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: video.color + 'EE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={[{ color: '#000', fontSize: 9, fontFamily: FONTS.bold }]}>{video.category.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ padding: SPACING.md }}>
              <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14, marginBottom: 4 }]}>{video.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: video.color }} />
                <Text style={[{ color: video.color, fontFamily: FONTS.bold, fontSize: 11 }]}>{video.creator}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <XPToast visible={toastVis} onHide={() => setToastVis(false)} />

      <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>{activeTab}</Text>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, { backgroundColor: activeTab === tab ? 'rgba(200,169,110,0.1)' : 'transparent' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Audit' && <AuditView />}
      {activeTab === 'Brotherhood' && <BrotherhoodView />}
      {activeTab === 'Dating IQ' && <DatingIQView />}
      {activeTab === 'Library' && <LibraryView />}

      {/* ── Compose Post Modal (bottom sheet style) ────────────────────────── */}      <Modal
        visible={showCompose}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompose(false)}
      >
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowCompose(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyWrap}>
            <TouchableOpacity activeOpacity={1}>
              <View style={[styles.composeCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                {/* Header */}
                <View style={styles.composeHeader}>
                  <Text style={[styles.composeTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Broadcast</Text>
                  <TouchableOpacity onPress={() => setShowCompose(false)}>
                    <Feather name="x" size={22} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Post type chips: WIN | MILESTONE | INSIGHT */}
                <View style={styles.composeTags}>
                  {POST_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setNewPostType(t)}
                      style={[
                        styles.cTag,
                        {
                          backgroundColor: newPostType === t ? theme.gold + '33' : theme.bgElevated,
                          borderColor: newPostType === t ? theme.gold : 'transparent',
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text style={{ color: newPostType === t ? theme.gold : theme.textSecondary, fontSize: 12, fontFamily: FONTS.bold, textTransform: 'uppercase' }}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Emoji row */}
                <View style={styles.composeToolsRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                    {['🏆', '🔥', '💪', '🚀', '🧠', '💼', '🤝', '💎', '📈'].map(em => (
                      <TouchableOpacity
                        key={em}
                        onPress={() => setNewPostText(prev => prev + em)}
                        style={styles.emojiBtn}
                      >
                        <Text style={{ fontSize: 20 }}>{em}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={[styles.imgBtn, { borderColor: theme.border }]}
                    disabled={imageUploading}
                  >
                    {imageUploading
                      ? <ActivityIndicator size="small" color={theme.gold} />
                      : <Feather name="image" size={18} color={theme.textSecondary} />
                    }
                  </TouchableOpacity>
                </View>

                {/* Image preview */}
                {newPostImage && (
                  <View style={styles.composeImgPreviewWrap}>
                    <Image source={{ uri: newPostImage }} style={styles.composeImgPreview} />
                    <TouchableOpacity onPress={() => setNewPostImage(null)} style={styles.composeImgRemove}>
                      <Feather name="x" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Text input (max 500 chars + counter) */}
                <TextInput
                  value={newPostText}
                  onChangeText={t => t.length <= 500 && setNewPostText(t)}
                  placeholder="What did you achieve today, brother?"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  style={[styles.composeInput, { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
                />
                <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'right', marginBottom: SPACING.md, fontFamily: FONTS.regular }}>
                  {newPostText.length}/500
                </Text>

                <Button
                  label={posting ? 'POSTING...' : 'POST TO BROTHERHOOD'}
                  onPress={handlePost}
                  disabled={posting || !newPostText.trim() || imageUploading}
                />
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Gemini Key Modal — shown when audit or other AI feature needs key */}
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
  title: { fontSize: 28, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  tabBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginRight: 8 },
  tabText: { fontSize: 13 },
  tabContent: { padding: SPACING.lg, gap: SPACING.md },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  platformText: { fontSize: 12 },
  bioInput: { height: 120, borderRadius: 14, borderWidth: 1, padding: SPACING.md, textAlignVertical: 'top', marginTop: SPACING.md },
  resultCard: { padding: SPACING.lg, borderRadius: 16, borderWidth: 1, marginTop: SPACING.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  scoreLabel: { fontSize: 13 },
  scoreVal: { fontSize: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  resultText: { fontSize: 13 },
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
  reactionRow: { flexDirection: 'row', gap: 6 },
  miniReaction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.sm },
  reactionCount: { fontSize: 10, fontFamily: FONTS.semiBold },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#C8A96E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, zIndex: 9999 },
  scopeBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  scopeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  postImageWrap: { marginBottom: SPACING.md, borderRadius: 12, overflow: 'hidden' },
  postImage: { width: '100%', height: 200, resizeMode: 'cover' },
  lessonCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  lessonNum: { fontSize: 18, width: 30 },
  lessonTitle: { fontSize: 15 },
  lessonTime: { fontSize: 12, marginTop: 2 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalKeyWrap: { flex: 1, justifyContent: 'flex-end' },
  composeCard: { padding: SPACING.xl, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  composeTitle: { fontSize: 20 },
  composeInput: { height: 100, borderRadius: 12, borderWidth: 1, padding: SPACING.md, textAlignVertical: 'top', marginBottom: 4 },
  composeTags: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg, flexWrap: 'wrap' },
  cTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  composeToolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  emojiRow: { flexDirection: 'row', maxHeight: 40 },
  emojiBtn: { padding: 4, marginRight: 4 },
  imgBtn: { padding: 8, borderRadius: 8, borderWidth: 1, marginLeft: 8 },
  composeImgPreviewWrap: { position: 'relative', marginBottom: SPACING.md, alignSelf: 'flex-start' },
  composeImgPreview: { width: 100, height: 100, borderRadius: 8, resizeMode: 'cover' },
  composeImgRemove: { position: 'absolute', top: -8, right: -8, backgroundColor: '#E74C3C', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
