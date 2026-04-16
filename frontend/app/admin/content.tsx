import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

interface WisdomCard {
  id: string;
  quote: string;
  author: string;
  lesson?: string;
  action_today?: string;
  card_date: string;
}

interface Post {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  anon_display_name?: string;
}

const TABS = ['Wisdom Cards', 'Community Posts'];

export default function AdminContentScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Wisdom Cards');
  const [cards, setCards] = useState<WisdomCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>();

  // New card form
  const [showForm, setShowForm] = useState(false);
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [lesson, setLesson] = useState('');
  const [action, setAction] = useState('');
  const [cardDate, setCardDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const t = sess.session?.access_token;
      setToken(t ?? undefined);
    })();
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchCards();
      fetchPosts();
    }
  }, [token]);

  const fetchCards = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiCall('/api/admin/wisdom-cards', 'GET', undefined, token);
      setCards(data.cards || []);
    } catch (e: any) {
      console.log('Cards error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const data = await apiCall('/api/admin/posts', 'GET', undefined, token);
      setPosts(data.posts || []);
    } catch (e: any) {
      console.log('Posts error:', e.message);
    }
  };

  const createCard = async () => {
    if (!quote.trim() || !author.trim()) {
      Alert.alert('Missing Fields', 'Quote and Author are required.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const data = await apiCall('/api/admin/wisdom-cards', 'POST', {
        quote: quote.trim(),
        author: author.trim(),
        lesson: lesson.trim() || undefined,
        action_today: action.trim() || undefined,
        card_date: cardDate,
      }, token);
      if (data.card) setCards(prev => [data.card, ...prev]);
      setQuote(''); setAuthor(''); setLesson(''); setAction('');
      setCardDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      Alert.alert('Created', 'Wisdom card published!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create card');
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (id: string) => {
    if (!token) return;
    Alert.alert('Delete', 'Remove this wisdom card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiCall(`/api/admin/wisdom-cards/${id}`, 'DELETE', undefined, token);
            setCards(prev => prev.filter(c => c.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const deletePost = async (id: string) => {
    if (!token) return;
    Alert.alert('Delete Post', 'Remove this community post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiCall(`/api/admin/posts/${id}`, 'DELETE', undefined, token);
            setPosts(prev => prev.filter(p => p.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Content</Text>
        {activeTab === 'Wisdom Cards' && (
          <TouchableOpacity
            onPress={() => setShowForm(v => !v)}
            style={[styles.addBtn, { backgroundColor: theme.gold }]}
          >
            <Feather name={showForm ? 'x' : 'plus'} size={16} color="#000" />
            <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 12 }}>
              {showForm ? 'Cancel' : 'Add Card'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingHorizontal: SPACING.lg }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, { borderBottomColor: activeTab === tab ? theme.gold : 'transparent', borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.gold : theme.textMuted, fontFamily: activeTab === tab ? FONTS.bold : FONTS.regular }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* New Card Form */}
        {showForm && activeTab === 'Wisdom Cards' && (
          <View style={[styles.formCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold + '40' }]}>
            <Text style={[styles.formTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>New Wisdom Card</Text>

            {[
              { label: 'QUOTE *', value: quote, setter: setQuote, multi: true, placeholder: 'Enter the wisdom quote...' },
              { label: 'AUTHOR *', value: author, setter: setAuthor, multi: false, placeholder: 'Who said this?' },
              { label: 'LESSON', value: lesson, setter: setLesson, multi: true, placeholder: 'Explain the deeper meaning...' },
              { label: 'ACTION TODAY', value: action, setter: setAction, multi: true, placeholder: 'Actionable takeaway...' },
              { label: 'DATE (YYYY-MM-DD)', value: cardDate, setter: setCardDate, multi: false, placeholder: 'YYYY-MM-DD' },
            ].map(field => (
              <View key={field.label}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{field.label}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.textMuted}
                  multiline={field.multi}
                  numberOfLines={field.multi ? 3 : 1}
                  style={[
                    styles.input,
                    { backgroundColor: theme.bgElevated, borderColor: theme.border, color: theme.textPrimary },
                    field.multi && { height: 80, textAlignVertical: 'top', paddingTop: 10 },
                  ]}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={createCard}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: theme.gold, opacity: saving ? 0.7 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }}>PUBLISH CARD</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
        ) : activeTab === 'Wisdom Cards' ? (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{cards.length} cards published</Text>
            {cards.map(card => (
              <View key={card.id} style={[styles.cardItem, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1, marginBottom: 4 }]}>
                    {card.card_date}
                  </Text>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 13, lineHeight: 20 }]} numberOfLines={2}>
                    "{card.quote}"
                  </Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 }]}>— {card.author}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteCard(card.id)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{posts.length} community posts</Text>
            {posts.map(post => (
              <View key={post.id} style={[styles.cardItem, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.bgElevated }]}>
                      <Text style={[{ color: theme.textMuted, fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 0.8 }]}>
                        {(post.post_type || 'post').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 }]} numberOfLines={3}>
                    {post.content}
                  </Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 }]}>
                    {post.anon_display_name || 'Anonymous'} · {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deletePost(post.id)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md, gap: SPACING.sm },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: 22 },
  addBtn: { flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, alignItems: 'center' },
  tabBar: { flexDirection: 'row', marginBottom: SPACING.md },
  tabBtn: { paddingVertical: 10, paddingHorizontal: SPACING.md, marginRight: 8 },
  tabText: { fontSize: 14 },
  formCard: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.lg, gap: SPACING.md },
  formTitle: { fontSize: 18 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 6 },
  input: { borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: 14, height: 46, fontSize: 14 },
  saveBtn: { height: 52, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  sectionLabel: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: SPACING.md },
  cardItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  deleteBtn: { padding: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs },
});
