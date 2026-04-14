import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, Image, Linking
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
      <View style={[s.header, { alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[s.headerTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 18 }]}>SUPER ADMIN</Text>
          <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>Ziad (CultLeaderZoz)</Text>
        </View>

        <Image 
          source={{ uri: 'https://github.com/CultLeaderZiad.png' }} 
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.gold }} 
        />
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
  const { user: authUser, profile } = useAuth();
  
  // Action Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('id, full_name, username, email, plan, subscription_status, role, banned, last_active, created_at, xp, power_level').order('created_at', { ascending: false }).limit(50);
      if (search.trim()) query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%`);
      const { data, error } = await query;
      if (!error && data) setUsers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  // ── REAL-TIME ACTIVE SYSTEM ──
  useEffect(() => {
    const channel = supabase
      .channel('admin-users-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new user to top if they aren't filtered out by current search
            setUsers(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(u => u.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (actionType: string, user: any) => {
    setSelectedUser(null);
    try {
      if (actionType === 'ban') {
        const currentlyBanned = user.banned;
        Alert.alert(`${currentlyBanned ? 'Unban' : 'Ban'} User`, `Are you sure you want to ${currentlyBanned ? 'unban' : 'ban'} ${user.username || user.full_name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: currentlyBanned ? 'UNBAN' : 'BAN', style: 'destructive', onPress: async () => {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: !currentlyBanned } : u));
              await supabase.from('profiles').update({ banned: !currentlyBanned, banned_at: !currentlyBanned ? new Date().toISOString() : null }).eq('id', user.id);
              await supabase.from('admin_logs').insert({ admin_id: profile?.id, action: currentlyBanned ? 'unban_user' : 'ban_user', target_id: user.id, details: { username: user.username } });
          }}
        ]);
      } else if (actionType === 'admin') {
        const isAdmin = user.role === 'admin';
        Alert.alert(isAdmin ? 'Revoke Admin' : 'Make Admin', `Are you sure you want to ${isAdmin ? 'remove admin rights from' : 'elevate'} ${user.username || user.full_name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: isAdmin ? 'REVOKE' : 'ELEVATE', style: isAdmin ? 'destructive' : 'default', onPress: async () => {
              const newRole = isAdmin ? 'user' : 'admin';
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
              await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
              await supabase.from('admin_logs').insert({ admin_id: profile?.id, action: isAdmin ? 'revoke_admin' : 'make_admin', target_id: user.id, details: { newRole } });
          }}
        ]);
      } else if (actionType === 'subscription') {
        Alert.alert('Manage Subscription', `Change plan for ${user.full_name || user.email}`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'GRIND (Free)', onPress: async () => {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: 'active', plan: 'grind' } : u));
              await supabase.from('profiles').update({ subscription_status: 'active', plan: 'grind' }).eq('id', user.id);
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'subscription',
                title: 'Plan Updated',
                body: 'Admin has updated your plan to GRIND (Free).'
              });
          }},
          { text: 'ALPHA (Premium)', onPress: async () => {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: 'active', plan: 'alpha' } : u));
              await supabase.from('profiles').update({ subscription_status: 'active', plan: 'alpha' }).eq('id', user.id);
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'subscription',
                title: 'Plan Updated',
                body: 'Admin has upgraded your plan to ALPHA (Premium)!'
              });
          }},
          { text: 'SIGMA (Elite)', onPress: async () => {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: 'active', plan: 'sigma' } : u));
              await supabase.from('profiles').update({ subscription_status: 'active', plan: 'sigma' }).eq('id', user.id);
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'subscription',
                title: 'Plan Updated',
                body: 'Admin has upgraded your plan to SIGMA (Elite)! You now have full access.'
              });
          }},
          { text: 'Expire Account', style: 'destructive', onPress: async () => {
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: 'expired' } : u));
              await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id);
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'subscription',
                title: 'Plan Expired',
                body: 'Your subscription has been expired by an admin.'
              });
          }}
        ]);
      } else if (actionType === 'email') {
        const destEmail = user.email; 
        if (!destEmail) {
          Alert.alert('Error', 'User email not found or not synced.');
          return;
        }
        Linking.openURL(`mailto:${destEmail}?subject=MAXX%20App%20Notification&body=Hello%20${user.full_name || 'Alhpa'},%0A%0A`);
        
        // Log the email attempt
        await supabase.from('email_logs').insert({ 
          sent_by: profile?.id, 
          recipient_id: user.id, 
          recipient_email: destEmail, 
          subject: 'Admin Notification', 
          body: 'Sent via mailto link' 
        });

        // Also send an in-app notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'admin_message',
          title: 'Message from Admin',
          body: 'You have been sent an email update regarding your account status.'
        });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <>
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
          <View key={u.id} style={[s.userCard, { backgroundColor: theme.bgSurface, borderColor: u.banned ? '#E74C3C' : theme.border, opacity: u.banned ? 0.7 : 1 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={[s.userName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>
                    {u.username || u.full_name || 'Anonymous User'}
                  </Text>
                  {u.banned && (
                    <Text style={{ color: '#E74C3C', fontSize: 10, fontFamily: FONTS.bold, marginLeft: 4 }}>
                      [BANNED]
                    </Text>
                  )}
                </View>
                {u.role === 'admin' && <View style={[s.badge, { backgroundColor: '#C8A96E22' }]}><Text style={{ color: '#C8A96E', fontSize: 7, fontWeight: '700' }}>ADMIN</Text></View>}
                {u.banned && <View style={[s.badge, { backgroundColor: '#E74C3C' }]}><Text style={{ color: '#FFF', fontSize: 7, fontWeight: '900' }}>BANNED</Text></View>}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                Plan: <Text style={{ color: theme.gold, fontWeight: 'bold' }}>{(u.plan || 'trial').toUpperCase()}</Text> · Status: {u.subscription_status || 'trial'} · Lvl {u.power_level || 1}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
               <TouchableOpacity onPress={() => handleAction('subscription', u)} style={[s.quickActionBtn, { backgroundColor: theme.gold + '15' }]}>
                 <Feather name="credit-card" size={14} color={theme.gold} />
               </TouchableOpacity>
               
               <TouchableOpacity onPress={() => handleAction('email', u)} style={[s.quickActionBtn, { backgroundColor: '#4A90D915' }]}>
                 <Feather name="mail" size={14} color="#4A90D9" />
               </TouchableOpacity>

               <TouchableOpacity onPress={() => handleAction('admin', u)} style={[s.quickActionBtn, { backgroundColor: u.role === 'admin' ? '#E74C3C15' : '#2ECC7115' }]}>
                 <Feather name="shield" size={14} color={u.role === 'admin' ? '#E74C3C' : '#2ECC71'} />
               </TouchableOpacity>

               <TouchableOpacity onPress={() => handleAction('ban', u)} style={[s.quickActionBtn, { backgroundColor: '#E74C3C15' }]}>
                 <Feather name={u.banned ? "refresh-cw" : "slash"} size={14} color="#E74C3C" />
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Action Modal */}
      {selectedUser && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', top: 0, justifyContent: 'flex-end', zIndex: 1000 }}>
          <View style={{ backgroundColor: theme.bgElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18 }}>Manage {selectedUser.username}</Text>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Feather name="x" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleAction('subscription', selectedUser)} style={[s.actionItem, { borderBottomColor: theme.border }]}>
              <Feather name="credit-card" size={20} color={theme.gold} style={{ width: 30 }} />
              <Text style={{ color: theme.textPrimary, fontSize: 16 }}>Manage Subscription</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleAction('email', selectedUser)} style={[s.actionItem, { borderBottomColor: theme.border }]}>
              <Feather name="mail" size={20} color="#4A90D9" style={{ width: 30 }} />
              <Text style={{ color: theme.textPrimary, fontSize: 16 }}>Send Email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleAction('admin', selectedUser)} style={[s.actionItem, { borderBottomColor: theme.border }]}>
              <Feather name="shield" size={20} color={selectedUser.role === 'admin' ? '#E74C3C' : "#2ECC71"} style={{ width: 30 }} />
              <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{selectedUser.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleAction('ban', selectedUser)} style={[s.actionItem, { borderBottomWidth: 0 }]}>
              <Feather name="slash" size={20} color="#E74C3C" style={{ width: 30 }} />
              <Text style={{ fontSize: 16, color: '#E74C3C' }}>{selectedUser.banned ? 'Unban User' : 'Ban User'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

// ═══ CONTENT TAB ═══
function ContentTab({ theme }: { theme: any }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  const fetchCounts = async () => {
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

  useEffect(() => {
    fetchCounts();
  }, []);

  const openManager = async (table: string) => {
    setSelectedTable(table);
    setContentLoading(true);
    try {
      const { data } = await supabase.from(table).select('*').limit(50).order('created_at', { ascending: false });
      setTableData(data || []);
    } catch (e) { console.error(e); }
    setContentLoading(false);
  };

  const handleDeleteContent = async (id: string) => {
    Alert.alert('Delete Content', 'Are you sure you want to delete this item? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await supabase.from(selectedTable!).delete().eq('id', id);
            setTableData(prev => prev.filter(item => item.id !== id));
            fetchCounts();
            Alert.alert('Deleted', 'Item removed successfully.');
          } catch(e) { console.error(e); }
      }}
    ]);
  };

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
    <>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.md }}>CONTENT OVERVIEW</Text>
        <View style={{ gap: 8 }}>
          {items.map(item => (
            <TouchableOpacity key={item.key} onPress={() => openManager(item.key)} style={[s.contentRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name={item.icon as any} size={16} color={theme.gold} />
                <Text style={{ color: theme.textPrimary, fontSize: 13, fontFamily: FONTS.medium }}>{item.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{counts[item.key] || 0}</Text>
                <Feather name="edit-2" size={14} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content Manager Modal */}
      {selectedTable && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: theme.bgPrimary, zIndex: 100 }}>
          <View style={[s.header, { borderBottomWidth: 1, borderBottomColor: theme.border, paddingTop: 60 }]}>
            <TouchableOpacity onPress={() => setSelectedTable(null)} style={{ padding: 4 }}>
              <Feather name="x" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{selectedTable.replace(/_/g, ' ').toUpperCase()}</Text>
            <TouchableOpacity onPress={() => Alert.alert('Add Custom Content', `To accurately add a new ${selectedTable} entry with proper media uploads, please use the Supabase Dashboard directly. Direct app insertion is locked to preserve schema integrity.`)}>
              <Feather name="plus-circle" size={24} color={theme.gold} />
            </TouchableOpacity>
          </View>
          {contentLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.gold} /></View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
              {tableData.length === 0 ? (
                <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>No items found.</Text>
              ) : (
                tableData.map(item => (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: theme.bgSurface, borderWidth: 0.5, borderColor: theme.border, borderRadius: 10, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 }}>{item.title || item.name || item.quote || 'Unnamed Item'}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>ID: {item.id.substring(0, 8)}... | Created: {new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteContent(item.id)} style={{ padding: 8, backgroundColor: '#E74C3C22', borderRadius: 8 }}>
                      <Feather name="trash-2" size={16} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      )}
    </>
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
  userName: {
    fontSize: 13,
  },
  quickActionBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  banBtn: { borderWidth: 1, borderRadius: 8, padding: 8, marginLeft: 8 },
  contentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderRadius: 10, padding: SPACING.md },
  statCard: { width: '48%' as any, borderWidth: 1, borderRadius: 12, padding: SPACING.lg, alignItems: 'center' },
  logRow: { borderWidth: 0.5, borderRadius: 8, padding: SPACING.md, marginBottom: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 0.5 },
});
