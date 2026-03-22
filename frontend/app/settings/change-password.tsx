import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { FONTS, SPACING } from '../../src/constants/theme';
import { api } from '../../src/services/api';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
        Alert.alert('Error', 'New password must be at least 8 characters');
        return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/user/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      Alert.alert('Success', 'Password updated successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password');
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
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Change Password</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>OLD PASSWORD</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <Button 
            title="UPDATE PASSWORD" 
            onPress={handleChangePassword} 
            loading={loading} 
            style={{ marginTop: SPACING.xl }} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: SPACING.sm },
  backBtn: { padding: 8 },
  title: { fontSize: 20 },
  content: { padding: SPACING.lg },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.medium },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.regular },
});
