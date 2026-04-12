import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING } from '../constants/theme';
import { Feather } from '@expo-google-fonts/cinzel'; // Wait, it's @expo/vector-icons
import { Feather as Icon } from '@expo/vector-icons';

export function PremiumModal() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('Premium Feature');
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('showPremiumModal', (newTitle) => {
      setTitle(newTitle || 'Premium Feature');
      setVisible(true);
    });
    return () => sub.remove();
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.content, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.bgElevated, borderColor: theme.gold }]}>
            <Icon name="lock" size={24} color={theme.gold} />
          </View>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>
            {title === 'Subscription Expired' 
              ? 'Your trial has ended. Upgrade to continue accessing premium features and maximizing your potential.'
              : 'Upgrade to Alpha or Sigma to unlock this feature and ascend further.'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.btnPrimary, { backgroundColor: theme.gold }]}
            onPress={() => {
              setVisible(false);
              router.push('/plans');
            }}
          >
            <Text style={[styles.btnPrimaryText, { fontFamily: FONTS.bold }]}>VIEW PLANS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.btnSecondary}
            onPress={() => setVisible(false)}
          >
            <Text style={[styles.btnSecondaryText, { color: theme.textMuted, fontFamily: FONTS.medium }]}>Not right now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  content: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  btnPrimary: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 14,
    letterSpacing: 1,
  },
  btnSecondary: {
    padding: SPACING.sm,
  },
  btnSecondaryText: {
    fontSize: 14,
  },
});
