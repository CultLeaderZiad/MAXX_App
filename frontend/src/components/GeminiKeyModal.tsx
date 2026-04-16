import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING } from '../constants/theme';
import { GeminiKeyService } from '../../lib/geminiKey';

interface Props {
  visible: boolean;
  onSuccess: (key: string) => void;
  onDismiss?: () => void;
}

export function GeminiKeyModal({ visible, onSuccess, onDismiss }: Props) {
  const { theme } = useTheme();
  const [keyInput, setKeyInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setError('Please enter your Gemini API key');
      return;
    }
    setValidating(true);
    setError(null);
    const result = await GeminiKeyService.validate(trimmed);
    setValidating(false);
    if (result.valid) {
      await GeminiKeyService.save(trimmed);
      onSuccess(trimmed);
    } else {
      setError(result.error || 'Invalid API key');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.gold + '22' }]}>
              <Feather name="zap" size={22} color={theme.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                AI Power Required
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                Enter your free Gemini API key to unlock AI features
              </Text>
            </View>
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Free key CTA */}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
            style={[styles.freeKeyBtn, { backgroundColor: theme.gold + '15', borderColor: theme.gold + '44' }]}
          >
            <Feather name="external-link" size={13} color={theme.gold} />
            <Text style={[styles.freeKeyText, { color: theme.gold, fontFamily: FONTS.semiBold }]}>
              Get Free API Key →
            </Text>
          </TouchableOpacity>

          {/* Key input */}
          <TextInput
            value={keyInput}
            onChangeText={t => { setKeyInput(t); setError(null); }}
            placeholder="AIzaSy..."
            placeholderTextColor={theme.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, {
              backgroundColor: theme.bgElevated,
              borderColor: error ? '#E74C3C' : theme.border,
              color: theme.textPrimary,
              fontFamily: FONTS.regular,
            }]}
          />

          {/* Error */}
          {error && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color="#E74C3C" />
              <Text style={[styles.errorText, { fontFamily: FONTS.regular }]}>{error}</Text>
            </View>
          )}

          {/* Validate button */}
          <TouchableOpacity
            onPress={handleValidate}
            disabled={validating}
            style={[styles.validateBtn, { backgroundColor: theme.gold, opacity: validating ? 0.7 : 1 }]}
          >
            {validating ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={[styles.validateText, { fontFamily: FONTS.bold }]}>VALIDATE & ACTIVATE</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.note, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
            Your key is stored locally on your device only.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.xl,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16 },
  subtitle: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  freeKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  freeKeyText: { fontSize: 13 },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  errorText: { color: '#E74C3C', fontSize: 12 },
  validateBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  validateText: { color: '#000', fontSize: 13, letterSpacing: 1 },
  note: { fontSize: 11, textAlign: 'center' },
});
