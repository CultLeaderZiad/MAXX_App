import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiCall } from '../../lib/api';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

const ADMIN_TABS = ['Users', 'Content', 'Email', 'Subscriptions', 'Logs'];

const PLAN_COLORS: Record<string, string> = {
  free_trial: '#606060', grind: '#3498DB', alpha: GOLD, sigma: '#E74C3C',
};

const PLAN_OPTIONS = ['free_trial', 'grind', 'alpha', 'sigma'];

interface UserRow {
  id: string;
  full_name: string;
  plan: string;
  role: string;
  subscription_status: string;
  trial_end: string | null;
  created_at: string;
  banned: boolean;
}

function InitialsCircle({ name, plan }: { name: string; plan: string }) {
  const initials = (name || 'B').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[icStyles.circle, { backgroundColor: (PLAN_COLORS[plan] || '#606060') + '30', borderColor: (PLAN_COLORS[plan] || '#606060') + '60' }]}>
      <Text style={[icStyles.text, { color: PLAN_COLORS[plan] || GOLD, fontFamily: FONTS.cinzelBold }]}>{initials}</Text>
    </View>
  );
}
const icStyles = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 13 },
});

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('Users');
  const [stats, setStats] = useState({ total: 0, active_trial: 0, paying: 0, expired: 0, posts: 0, workouts: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionUser, setActionUser] = useState<UserRow | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<'all' | 'user'>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState<string>('custom');
  const [sending, setSending] = useState(false);

  // Access guard
  if (!profile || (profile as any).role !== 'admin') {
    router.replace('/(tabs)/home' as any);
    return null;
  }

  useEffect(() => { fetchAll(); }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchStats(), fetchUsers()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const data = await apiCall('/api/admin/stats', 'GET', undefined, token ?? undefined);
      // Fetch trial counts from profiles directly
      const { data: profiles } = await supabase
        .from('profiles')
        .select('trial_end, subscription_status, banned');
      const now = new Date();
      const total = profiles?.length || 0;
      const active_trial = (profiles || []).filter((p: any) => p.trial_end && new Date(p.trial_end) > now).length;
      const paying = (profiles || []).filter((p: any) => p.subscription_status === 'active').length;
      const expired = (profiles || []).filter((p: any) => p.trial_end && new Date(p.trial_end) <= now && p.subscription_status !== 'active').length;
      setStats({ total, active_trial, paying, expired, posts: data?.total_posts || 0, workouts: data?.total_workouts || 0 });
    } catch {}
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, plan, role, subscription_status, trial_end, created_at, banned')
        .order('created_at', { ascending: false })
        .limit(50);
      setUsers(data || []);
    } catch {}
    setLoadingUsers(false);
  }, []);

  const updatePlan = async (userId: string, plan: string) => {
    try {
      await supabase.from('profiles').update({ plan }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
      setShowPlanModal(false);
    } catch { Alert.alert('Error', 'Failed to update plan.'); }
  };

  const toggleBan = async (u: UserRow) => {
    Alert.alert(
      u.banned ? 'Unban User' : 'Ban User',
      `Are you sure you want to ${u.banned ? 'unban' : 'ban'} ${u.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: u.banned ? 'Unban' : 'Ban',
          style: u.banned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await supabase.from('profiles').update({ banned: !u.banned }).eq('id', u.id);
              setUsers(prev => prev.map(x => x.id === u.id ? { ...x, banned: !u.banned } : x));
            } catch { Alert.alert('Error', 'Failed to update ban status.'); }
          },
        },
      ]
    );
  };

  const extendTrial = async (u: UserRow) => {
    const newEnd = new Date(Date.now() + 7 * 86400000).toISOString();
    try {
      await supabase.from('profiles').update({ trial_end: newEnd }).eq('id', u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, trial_end: newEnd } : x));
      Alert.alert('Done', `Trial extended +7 days for ${u.full_name}.`);
    } catch { Alert.alert('Error', 'Failed to extend trial.'); }
  };

  const TEMPLATES: Record<string, { subject: string; body: string }> = {
    trial_ending: {
      subject: 'Your MAXX trial ends soon',
      body: 'Hi [Name],\n\nYour MAXX 7-day trial is ending in 2 days. Upgrade now to keep your streak and progress.\n\nUpgrade at: cultleaderziad.dev@gmail.com\n\n— MAXX Team',
    },
    welcome: {
      subject: 'Welcome to MAXX',
      body: 'Hi [Name],\n\nWelcome to MAXX. Your 7-day free trial is now active.\n\nLet\'s build.\n\n— MAXX Team',
    },
    custom: { subject: '', body: '' },
  };

  const applyTemplate = (templateId: string) => {
    setEmailTemplate(templateId);
    if (templateId !== 'custom') {
      setEmailSubject(TEMPLATES[templateId].subject);
      setEmailBody(TEMPLATES[templateId].body);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) { Alert.alert('Missing', 'Fill subject and body.'); return; }
    setSending(true);
    try {
      if (emailTarget === 'all') {
        await supabase.from('email_logs').insert({
          subject: emailSubject, body: emailBody, target: 'all', sent_by: user?.id, sent_at: new Date().toISOString(),
        });
        Alert.alert('Queued', 'Email queued for all users.');
      } else if (actionUser) {
        const mailBody = encodeURIComponent(emailBody);
        Linking.openURL(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${mailBody}`);
      }
    } catch {
      Linking.openURL(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
    } finally {
      setSending(false);
    }
  };

  const daysLeft = (trial_end: string | null) => {
    if (!trial_end) return null;
    const diff = new Date(trial_end).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 86400000);
  };

  const filteredUsers = users.filter(u =>
    search ? (u.full_name?.toLowerCase().includes(search.toLowerCase())) : true
  );

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const UsersTab = () => (
    <>
      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
        <Feather name="search" size={16} color="#606060" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name..."
          placeholderTextColor="#606060"
          style={[{ flex: 1, color: '#FFFFFF', fontFamily: FONTS.regular, fontSize: 14 }]}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={14} color="#606060" /></TouchableOpacity> : null}
      </View>

      {loadingUsers ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} />
      ) : (
        filteredUsers.map(u => {
          const days = daysLeft(u.trial_end);
          const planColor = PLAN_COLORS[u.plan] || '#606060';
          return (
            <View key={u.id} style={[styles.userRow, { backgroundColor: '#111111', borderColor: u.banned ? '#E74C3C30' : '#2A2A2A' }]}>
              <InitialsCircle name={u.full_name || 'B'} plan={u.plan} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 14 }]} numberOfLines={1}>
                    {u.full_name || 'Unknown'}
                  </Text>
                  {u.role === 'admin' && (
                    <View style={[styles.badge, { backgroundColor: '#E74C3C20', borderColor: '#E74C3C50' }]}>
                      <Text style={[{ color: '#E74C3C', fontSize: 8, fontFamily: FONTS.bold }]}>ADMIN</Text>
                    </View>
                  )}
                  {u.banned && (
                    <View style={[styles.badge, { backgroundColor: '#E74C3C20', borderColor: '#E74C3C50' }]}>
                      <Text style={[{ color: '#E74C3C', fontSize: 8, fontFamily: FONTS.bold }]}>BANNED</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.planBadge, { borderColor: planColor + '60' }]}>
                    <Text style={[{ color: planColor, fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.8 }]}>{u.plan?.toUpperCase()}</Text>
                  </View>
                  {days !== null && (
                    <Text style={[{ color: days > 0 ? '#2ECC71' : '#E74C3C', fontSize: 10, fontFamily: FONTS.bold }]}>
                      {days > 0 ? `${days}d trial` : 'Trial expired'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => { setActionUser(u); setShowPlanModal(true); }}
                  style={[styles.actionBtn, { borderColor: '#3498DB40', backgroundColor: '#3498DB15' }]}
                >
                  <Text style={[{ color: '#3498DB', fontSize: 9, fontFamily: FONTS.bold }]}>PLAN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => extendTrial(u)}
                  style={[styles.actionBtn, { borderColor: GOLD + '40', backgroundColor: GOLD + '15' }]}
                >
                  <Text style={[{ color: GOLD, fontSize: 9, fontFamily: FONTS.bold }]}>+7D</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleBan(u)}
                  style={[styles.actionBtn, { borderColor: '#E74C3C40', backgroundColor: '#E74C3C15' }]}
                >
                  <Text style={[{ color: '#E74C3C', fontSize: 9, fontFamily: FONTS.bold }]}>{u.banned ? 'UNBAN' : 'BAN'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity
        onPress={() => router.push('/admin/users' as any)}
        style={[styles.viewAllBtn, { borderColor: GOLD + '40' }]}
      >
        <Feather name="users" size={14} color={GOLD} />
        <Text style={[{ color: GOLD, fontFamily: FONTS.bold, fontSize: 13 }]}>Full User Management</Text>
        <Feather name="chevron-right" size={14} color={GOLD} />
      </TouchableOpacity>
    </>
  );

  const EmailTab = () => (
    <>
      {/* Target */}
      <Text style={[styles.sectionLabel, { color: '#9A9A9A' }]}>SEND TO</Text>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
        {(['all', 'user'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setEmailTarget(t)}
            style={[styles.targetBtn, { backgroundColor: emailTarget === t ? GOLD + '20' : '#111111', borderColor: emailTarget === t ? GOLD : '#2A2A2A' }]}
          >
            <Text style={[{ color: emailTarget === t ? GOLD : '#9A9A9A', fontFamily: FONTS.bold, fontSize: 12 }]}>
              {t === 'all' ? 'All Users' : 'Specific User'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Template */}
      <Text style={[styles.sectionLabel, { color: '#9A9A9A' }]}>TEMPLATE</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md, flexWrap: 'wrap' }}>
        {Object.keys(TEMPLATES).map(k => (
          <TouchableOpacity
            key={k}
            onPress={() => applyTemplate(k)}
            style={[styles.templateBtn, { backgroundColor: emailTemplate === k ? GOLD + '20' : '#111111', borderColor: emailTemplate === k ? GOLD : '#2A2A2A' }]}
          >
            <Text style={[{ color: emailTemplate === k ? GOLD : '#9A9A9A', fontFamily: FONTS.bold, fontSize: 11 }]}>
              {k === 'trial_ending' ? 'Trial Ending' : k === 'welcome' ? 'Welcome' : 'Custom'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields */}
      {[
        { label: 'SUBJECT', value: emailSubject, set: setEmailSubject, multi: false, h: 46 },
        { label: 'BODY', value: emailBody, set: setEmailBody, multi: true, h: 120 },
      ].map(f => (
        <View key={f.label} style={{ marginBottom: SPACING.md }}>
          <Text style={[styles.sectionLabel, { color: '#9A9A9A', marginBottom: 8 }]}>{f.label}</Text>
          <TextInput
            value={f.value}
            onChangeText={f.set}
            multiline={f.multi}
            placeholder={f.label === 'SUBJECT' ? 'Email subject...' : 'Email body... Use [Name] for personalization'}
            placeholderTextColor="#606060"
            style={[styles.emailInput, { height: f.h, backgroundColor: '#111111', borderColor: '#2A2A2A', color: '#FFFFFF',
              textAlignVertical: f.multi ? 'top' : 'center', paddingTop: f.multi ? 12 : 0 }]}
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={sendEmail}
        disabled={sending}
        style={[styles.sendEmailBtn, { backgroundColor: GOLD, opacity: sending ? 0.7 : 1 }]}
      >
        {sending ? <ActivityIndicator color="#000" size="small" /> : (
          <>
            <Feather name="send" size={16} color="#000" />
            <Text style={[{ color: '#000', fontFamily: FONTS.bold, fontSize: 14, letterSpacing: 1 }]}>SEND EMAIL</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const SubscriptionsTab = () => (
    <>
      <Text style={[styles.sectionLabel, { color: '#9A9A9A', marginBottom: SPACING.md }]}>ALL SUBSCRIPTIONS</Text>
      {users.map(u => {
        const days = daysLeft(u.trial_end);
        return (
          <View key={u.id} style={[styles.subRow, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 13 }]}>{u.full_name || 'Unknown'}</Text>
              <Text style={[{ color: '#606060', fontFamily: FONTS.regular, fontSize: 11, marginTop: 2 }]}>
                {u.subscription_status || 'trial'} · {days !== null ? `${days}d left` : 'No trial'}
              </Text>
            </View>
            <View style={[styles.planBadge, { borderColor: (PLAN_COLORS[u.plan] || '#606060') + '60' }]}>
              <Text style={[{ color: PLAN_COLORS[u.plan] || '#606060', fontSize: 10, fontFamily: FONTS.bold }]}>{u.plan?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => extendTrial(u)}
              style={[styles.actionBtn, { borderColor: GOLD + '40', backgroundColor: GOLD + '15' }]}
            >
              <Text style={[{ color: GOLD, fontSize: 9, fontFamily: FONTS.bold }]}>+7 DAYS</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  const ContentTab = () => (
    <>
      {[
        { id: 'exercises', label: 'Exercises', icon: 'activity', color: '#2ECC71', desc: 'Add/edit workout programs', route: '/admin/content' },
        { id: 'wisdom', label: 'Wisdom Cards', icon: 'book-open', color: GOLD, desc: 'Daily motivation cards', route: '/admin/content' },
        { id: 'posts', label: 'Community Posts', icon: 'message-square', color: '#3498DB', desc: 'Moderate brotherhood feed', route: '/admin/content' },
        { id: 'videos', label: 'Creator Library', icon: 'play-circle', color: '#E67E22', desc: 'Manage library videos', route: '/admin/content' },
      ].map(item => (
        <TouchableOpacity
          key={item.id}
          onPress={() => router.push(item.route as any)}
          style={[styles.contentCard, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}
          activeOpacity={0.8}
        >
          <View style={[styles.contentIcon, { backgroundColor: item.color + '18' }]}>
            <Feather name={item.icon as any} size={18} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 14 }]}>{item.label}</Text>
            <Text style={[{ color: '#606060', fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 }]}>{item.desc}</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#606060" />
        </TouchableOpacity>
      ))}
    </>
  );

  const LogsTab = () => (
    <>
      <Text style={[styles.sectionLabel, { color: '#9A9A9A', marginBottom: SPACING.md }]}>RECENT ACTIONS</Text>
      <View style={[styles.logsEmpty, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
        <Feather name="list" size={24} color="#606060" />
        <Text style={[{ color: '#606060', fontFamily: FONTS.regular, fontSize: 13, marginTop: 8 }]}>Admin logs will appear here.</Text>
      </View>
    </>
  );

  const tabContent: Record<string, React.ReactNode> = {
    Users: <UsersTab />,
    Content: <ContentTab />,
    Email: <EmailTab />,
    Subscriptions: <SubscriptionsTab />,
    Logs: <LogsTab />,
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator color={GOLD} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      {/* Plan modal */}
      <Modal visible={showPlanModal} transparent animationType="slide" onRequestClose={() => setShowPlanModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowPlanModal(false)}>
          <View style={[styles.planModal, { backgroundColor: '#111111' }]}>
            <Text style={[styles.sectionLabel, { color: '#FFFFFF', marginBottom: SPACING.md }]}>CHANGE PLAN — {actionUser?.full_name}</Text>
            {PLAN_OPTIONS.map(plan => (
              <TouchableOpacity
                key={plan}
                onPress={() => actionUser && updatePlan(actionUser.id, plan)}
                style={[styles.planOption, { backgroundColor: '#1A1A1A', borderColor: actionUser?.plan === plan ? PLAN_COLORS[plan] : '#2A2A2A' }]}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PLAN_COLORS[plan] }} />
                <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 }]}>{plan.toUpperCase()}</Text>
                {actionUser?.plan === plan && <Feather name="check" size={14} color={PLAN_COLORS[plan]} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSub, { color: '#606060', fontFamily: FONTS.bold }]}>SUPER ADMIN</Text>
            <Text style={[styles.title, { color: GOLD, fontFamily: FONTS.cinzelBold }]}>MAXX ADMIN</Text>
            <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.regular, fontSize: 12 }]}>{user?.email}</Text>
          </View>
          <View>
            <View style={[styles.adminBadge, { backgroundColor: '#E74C3C15', borderColor: '#E74C3C40' }]}>
              <Feather name="shield" size={12} color="#E74C3C" />
              <Text style={[{ color: '#E74C3C', fontFamily: FONTS.bold, fontSize: 10 }]}>SUPER ADMIN</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/home' as any)} style={{ marginTop: 8, alignItems: 'center' }}>
              <Feather name="home" size={18} color="#606060" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats row ────────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { label: 'TOTAL', value: stats.total, icon: 'users', color: '#3498DB' },
            { label: 'ON TRIAL', value: stats.active_trial, icon: 'clock', color: '#2ECC71' },
            { label: 'PAYING', value: stats.paying, icon: 'credit-card', color: GOLD },
            { label: 'EXPIRED', value: stats.expired, icon: 'x-circle', color: '#E74C3C' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
              <Feather name={s.icon as any} size={14} color={s.color} />
              <Text style={[styles.statVal, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: '#606060', fontFamily: FONTS.bold }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ────────────────────────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: SPACING.lg, marginBottom: SPACING.md }}>
          {ADMIN_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.adminTab, { backgroundColor: activeTab === tab ? GOLD + '20' : '#111111', borderColor: activeTab === tab ? GOLD : '#2A2A2A' }]}
            >
              <Text style={[{ color: activeTab === tab ? GOLD : '#9A9A9A', fontFamily: FONTS.bold, fontSize: 12 }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Tab content ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: SPACING.lg }}>
          {tabContent[activeTab]}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.lg },
  headerSub: { fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 24, letterSpacing: 3 },
  adminBadge: { flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  statCard: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 18 },
  statLabel: { fontSize: 7, letterSpacing: 0.5 },
  adminTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, marginRight: 8 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, fontFamily: FONTS.bold },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, height: 44 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.xs, borderWidth: 1 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs, borderWidth: 1 },
  userActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: RADIUS.xs, borderWidth: 1, minWidth: 40, alignItems: 'center' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, justifyContent: 'center', marginTop: SPACING.sm },
  targetBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  templateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1 },
  emailInput: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, fontFamily: FONTS.regular, fontSize: 14 },
  sendEmailBtn: { flexDirection: 'row', gap: 10, paddingVertical: 16, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  contentCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  contentIcon: { width: 46, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  logsEmpty: { padding: SPACING.xl, borderRadius: RADIUS.xl, borderWidth: 1, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  planModal: { padding: SPACING.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  planOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
});
