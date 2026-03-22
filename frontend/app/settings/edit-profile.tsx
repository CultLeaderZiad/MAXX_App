import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, profile, fetchProfile } = useAuth();
  const router = useRouter();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>FULL NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your Name"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>USERNAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>BIO</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>{bio.length}/200</Text>
        </View>

        <Button title="SAVE CHANGES" onPress={handleSave} loading={loading} style={{ marginTop: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
  content: { padding: SPACING.lg },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.medium },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular },
  bioInput: { height: 120, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { textAlign: 'right', fontSize: 11, marginTop: 4 },
});
