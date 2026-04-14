import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';

type AdminTab = 'Users' | 'Content' | 'Subs' | 'Logs';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const router = useRouter();

  // Guard: only admins
  if (profile?.role !== 'admin') {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: theme.bgPrimary }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Feather name="shield-off" size={48} color="#E74C3C" />
          <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18, marginTop: 16 }}>ACCESS DENIED</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>You don't have admin privileges.</Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={[s.goldBtn, { backgroundColor: theme.gold, marginTop: 24 }]}>
            <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold }}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('Users');

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>SUPER ADMIN</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: SPACING.md }} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8 }}>
        {(['Users', 'Content', 'Subs', 'Logs'] as AdminTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tab, { backgroundColor: activeTab === tab ? theme.gold : theme.bgElevated, borderColor: activeTab === tab ? theme.gold : theme.border }]}
          >
            <Text style={{ color: activeTab === tab ? '#0A0A0A' : theme.textMuted, fontSize: 11, fontWeight: '700' }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'Users' && <UsersTab theme={theme} />}
      {activeTab === 'Content' && <ContentTab theme={theme} />}
      {activeTab === 'Subs' && <SubsTab theme={theme} />}
      {activeTab === 'Logs' && <LogsTab theme={theme} />}
    </SafeAreaView>
  );
}

// ═══ USERS TAB ═══
function UsersTab({ theme }: { theme: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user: authUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('id, full_name, username, plan, subscription_status, role, banned, last_active, created_at, xp, power_level').order('created_at', { ascending: false }).limit(50);
      if (search.trim()) query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
      const { data, error } = await query;
      if (!error && data) setUsers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const toggleBan = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} user?`, `Are you sure you want to ${action} this user?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.toUpperCase(), style: 'destructive', onPress: async () => {
          try {
            await supabase.from('profiles').update({
              banned: !currentlyBanned,
              banned_at: !currentlyBanned ? new Date().toISOString() : null,
            }).eq('id', userId);
            await supabase.from('admin_logs').insert({
              admin_id: authUser?.id, action: `user_${action}`, target_id: userId, target_type: 'user',
              details: { action },
            });
            fetchUsers();
            Alert.alert('Done', `User ${action}ned successfully.`);
          } catch (e) { console.error(e); }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} tintColor={theme.gold} />}>
      <TextInput
        style={[s.searchInput, { backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]}
        value={search}
        onChangeText={setSearch}
        placeholder="Search users..."
        placeholderTextColor={theme.textMuted}
      />
      <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: SPACING.sm }}>{users.length} users found</Text>
      {users.map(u => (
        <View key={u.id} style={[s.userCard, { backgroundColor: theme.bgSurface, borderColor: u.banned ? '#E74C3C' : theme.border }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 13 }}>{u.full_name || u.username || 'Unknown'}</Text>
              {u.role === 'admin' && <View style={[s.badge, { backgroundColor: '#C8A96E22' }]}><Text style={{ color: '#C8A96E', fontSize: 7, fontWeight: '700' }}>ADMIN</Text></View>}
              {u.banned && <View style={[s.badge, { backgroundColor: '#E74C3C22' }]}><Text style={{ color: '#E74C3C', fontSize: 7, fontWeight: '700' }}>BANNED</Text></View>}
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
              Plan: {u.plan || 'trial'} · Status: {u.subscription_status || 'trial'} · Lvl {u.power_level || 1} · {u.xp || 0} XP
            </Text>
          </View>
          {u.role !== 'admin' && (
            <TouchableOpacity onPress={() => toggleBan(u.id, u.banned)} style={[s.banBtn, { borderColor: u.banned ? '#2ECC71' : '#E74C3C' }]}>
              <Feather name={u.banned ? 'user-check' : 'slash'} size={14} color={u.banned ? '#2ECC71' : '#E74C3C'} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ═══ CONTENT TAB ═══
function ContentTab({ theme }: { theme: any }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tables = ['training_programs', 'exercises', 'library_videos', 'library_books', 'supplement_catalog', 'wisdom_cards', 'looksmaxx_guides', 'nutrition_guides'];
        const results: Record<string, number> = {};
        for (const t of tables) {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          results[t] = count || 0;
        }
        setCounts(results);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.gold} /></View>;

  const items = [
    { key: 'training_programs', label: 'Training Programs', icon: 'target' },
    { key: 'exercises', label: 'Exercises', icon: 'activity' },
    { key: 'library_videos', label: 'Library Videos', icon: 'play-circle' },
    { key: 'library_books', label: 'Books', icon: 'book' },
    { key: 'supplement_catalog', label: 'Supplements', icon: 'box' },
    { key: 'wisdom_cards', label: 'Wisdom Cards', icon: 'feather' },
    { key: 'looksmaxx_guides', label: 'Looksmaxx Guides', icon: 'eye' },
    { key: 'nutrition_guides', label: 'Nutrition Guides', icon: 'coffee' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.md }}>CONTENT OVERVIEW</Text>
      <View style={{ gap: 8 }}>
        {items.map(item => (
          <View key={item.key} style={[s.contentRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name={item.icon as any} size={16} color={theme.gold} />
              <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{item.label}</Text>
            </View>
            <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{counts[item.key] || 0}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ═══ SUBSCRIPTIONS TAB ═══
function SubsTab({ theme }: { theme: any }) {
  const [stats, setStats] = useState({ total: 0, trialing: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: trialing } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trialing');
        const { count: active } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
        const { count: expired } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'expired');
        setStats({ total: total || 0, trialing: trialing || 0, active: active || 0, expired: expired || 0 });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.gold} /></View>;

  const cards = [
    { label: 'Total Users', value: stats.total, color: theme.gold },
    { label: 'Trialing', value: stats.trialing, color: '#4A90D9' },
    { label: 'Active Paid', value: stats.active, color: '#2ECC71' },
    { label: 'Expired', value: stats.expired, color: '#E74C3C' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.md }}>SUBSCRIPTION OVERVIEW</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {cards.map(c => (
          <View key={c.label} style={[s.statCard, { backgroundColor: theme.bgSurface, borderColor: c.color }]}>
            <Text style={{ color: c.color, fontFamily: FONTS.cinzelBold, fontSize: 24 }}>{c.value}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8, letterSpacing: 0.5 }}>{c.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ═══ LOGS TAB ═══
function LogsTab({ theme }: { theme: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setLogs(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.gold} /></View>;

  if (logs.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Feather name="file-text" size={40} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, marginTop: 12, fontFamily: FONTS.medium }}>No admin actions yet</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
      {logs.map(log => (
        <View key={log.id} style={[s.logRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={{ color: theme.gold, fontSize: 11, fontWeight: '700' }}>{log.action?.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 9 }}>{new Date(log.created_at).toLocaleString()}</Text>
          {log.details && <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2 }}>{JSON.stringify(log.details)}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle: { fontSize: 16 },
  tab: { borderWidth: 1, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 16 },
  goldBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  searchInput: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, marginBottom: SPACING.md },
  userCard: { borderWidth: 0.5, borderRadius: 10, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  banBtn: { borderWidth: 1, borderRadius: 8, padding: 8, marginLeft: 8 },
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderRadius: 10, padding: SPACING.md },
  statCard: { width: '48%' as any, borderWidth: 1, borderRadius: 12, padding: SPACING.lg, alignItems: 'center' },
  logRow: { borderWidth: 0.5, borderRadius: 8, padding: SPACING.md, marginBottom: 8 },
});
