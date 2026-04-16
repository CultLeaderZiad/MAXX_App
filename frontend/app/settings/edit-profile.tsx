import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FONTS, SPACING } from '../../src/constants/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setBio(profile?.bio || '');
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  // ── Avatar upload to Supabase Storage ────────────────────────────────────
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64 && user) {
      setUploadingAvatar(true);
      try {
        const base64 = result.assets[0].base64;
        const filePath = `${user.id}/avatar_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(base64), { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUrl(publicUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e: any) {
        Alert.alert('Upload Failed', e?.message || 'Try again with a smaller image.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName ? fullName[0].toUpperCase() : (profile?.full_name?.[0]?.toUpperCase() || 'U');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color={theme.gold} />
            : <Text style={[styles.saveBtnText, { color: theme.gold, fontFamily: FONTS.bold }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarTouch}>
            {uploadingAvatar ? (
              <View style={[styles.avatarCircle, { backgroundColor: theme.bgElevated }]}>
                <ActivityIndicator color={theme.gold} />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarCircle} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: theme.gold + '22' }]}>
                <Text style={[{ fontSize: 40, color: theme.gold, fontFamily: FONTS.cinzelBold }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: theme.gold }]}>
              <Feather name="camera" size={14} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
            Tap to upload photo
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>DISPLAY NAME</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            maxLength={40}
          />

          <Text style={[styles.fieldLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>BIO</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={160}
            style={[styles.input, styles.bioInput, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
          />
          <Text style={[{ color: theme.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4, fontFamily: FONTS.regular }]}>
            {bio.length}/160
          </Text>

          <Text style={[styles.fieldLabel, { color: theme.textMuted, fontFamily: FONTS.bold }]}>EMAIL</Text>
          <View style={[styles.input, styles.readOnlyField, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
            <Text style={[{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 15 }]}>{user?.email}</Text>
            <Feather name="lock" size={14} color={theme.textMuted} />
          </View>
          <Text style={[{ color: theme.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 4 }]}>
            Email cannot be changed here. Contact support.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: theme.gold, opacity: saving ? 0.7 : 1 }]}
        >
          {saving
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={[styles.saveButtonText, { fontFamily: FONTS.bold }]}>SAVE CHANGES</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, width: 44 },
  title: { flex: 1, fontSize: 18, textAlign: 'center' },
  saveBtn: { width: 44, alignItems: 'flex-end' },
  saveBtnText: { fontSize: 15 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginVertical: 28 },
  avatarTouch: { position: 'relative' },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarHint: { fontSize: 12, marginTop: 10 },
  fields: { gap: 4 },
  fieldLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  bioInput: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  readOnlyField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#000', fontSize: 14, letterSpacing: 1 },
});
