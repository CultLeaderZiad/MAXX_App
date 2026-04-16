import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../../src/constants/theme';

interface UserRow {
  id: string;
  full_name: string;
  role: string;
  plan: string;
  xp: number;
  power_level: number;
  onboarding_completed: boolean;
  created_at: string;
}

const PLANS = ['trial', 'grind', 'alpha', 'sigma'];
const ROLES = ['user', 'admin'];

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const t = sess.session?.access_token;
      setToken(t ?? undefined);
    })();
  }, [user]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, page]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/admin/users?page=${page}&limit=20`, 'GET', undefined, token);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (userId: string, plan: string) => {
    if (!token) return;
    try {
      await apiCall(`/api/admin/users/${userId}/plan`, 'PUT', { plan }, token);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update plan');
    }
  };

  const updateRole = async (userId: string, role: string) => {
    if (!token) return;
    Alert.alert(
      'Change Role',
      `Set user role to "${role}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await apiCall(`/api/admin/users/${userId}/role`, 'PUT', { role }, token);
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const deleteUser = async (userId: string) => {
    if (!token) return;
    Alert.alert(
      'Delete User',
      'This permanently deletes the user account. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/api/admin/users/${userId}`, 'DELETE', undefined, token);
              setUsers(prev => prev.filter(u => u.id !== userId));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const PLAN_COLORS: Record<string, string> = {
    trial: '#9B59B6', grind: '#3498DB', alpha: '#F39C12', sigma: GOLD,
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.includes(search) ||
    u.plan?.includes(search)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>User Management</Text>
        <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 12 }]}>{total} users</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <Feather name="search" size={16} color={theme.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, plan, role..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.textPrimary, fontFamily: FONTS.regular }]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          renderItem={({ item: u }) => (
            <View style={[styles.userCard, { backgroundColor: theme.bgSurface, borderColor: u.role === 'admin' ? theme.gold + '60' : theme.border }]}>
              <View style={styles.userTop}>
                <View style={[styles.avatar, { backgroundColor: theme.gold + '22' }]}>
                  <Text style={[{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 16 }]}>
                    {u.full_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 14 }]}>{u.full_name || 'Unnamed'}</Text>
                  <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11 }]}>
                    Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'unknown'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[{ color: PLAN_COLORS[u.plan] || theme.gold, fontFamily: FONTS.bold, fontSize: 11 }]}>
                    {(u.plan || 'trial').toUpperCase()}
                  </Text>
                  {u.role === 'admin' && (
                    <View style={[styles.adminBadge, { backgroundColor: theme.gold + '20' }]}>
                      <Feather name="shield" size={10} color={theme.gold} />
                      <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 9 }]}>ADMIN</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.userStats}>
                <Text style={[styles.statItem, { color: theme.textMuted }]}>⚡ {u.xp || 0} XP</Text>
                <Text style={[styles.statItem, { color: theme.textMuted }]}>Lv. {u.power_level || 0}</Text>
                <Text style={[styles.statItem, { color: u.onboarding_completed ? '#2ECC71' : '#E74C3C' }]}>
                  {u.onboarding_completed ? '✓ Onboarded' : '○ Pending'}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => Alert.alert(
                    'Change Plan',
                    'Select new plan:',
                    [
                      ...PLANS.map(p => ({ text: p.toUpperCase(), onPress: () => updatePlan(u.id, p) })),
                      { text: 'Cancel', style: 'cancel' as const },
                    ]
                  )}
                  style={[styles.actionBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
                >
                  <Feather name="credit-card" size={13} color={theme.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Alert.alert(
                    'Change Role',
                    undefined,
                    [
                      ...ROLES.map(r => ({ text: r.toUpperCase(), onPress: () => updateRole(u.id, r) })),
                      { text: 'Cancel', style: 'cancel' as const },
                    ]
                  )}
                  style={[styles.actionBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
                >
                  <Feather name="shield" size={13} color={theme.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Role</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteUser(u.id)}
                  style={[styles.actionBtn, { backgroundColor: '#E74C3C22', borderColor: '#E74C3C55' }]}
                >
                  <Feather name="trash-2" size={13} color="#E74C3C" />
                  <Text style={[styles.actionBtnText, { color: '#E74C3C' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular }]}>No users found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md, gap: SPACING.sm },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: 22 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, paddingHorizontal: SPACING.md, height: 46, borderRadius: RADIUS.md, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  userCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  userTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  adminBadge: { flexDirection: 'row', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADIUS.full, alignItems: 'center' },
  userStats: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  statItem: { fontFamily: FONTS.regular, fontSize: 12 },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.sm, borderWidth: 1 },
  actionBtnText: { fontFamily: FONTS.semiBold, fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 40 },
});
