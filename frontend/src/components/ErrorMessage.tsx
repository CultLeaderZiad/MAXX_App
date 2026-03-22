import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING } from '../constants/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  testID?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, testID }) => {
  const { theme } = useTheme();
  return (
    <View testID={testID} style={styles.container}>
      <Feather name="alert-triangle" size={24} color={theme.red} />
      <Text style={[styles.text, { color: theme.red, fontFamily: FONTS.medium }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} testID="error-retry-btn" style={[styles.retry, { borderColor: theme.red }]}>
          <Text style={[styles.retryText, { color: theme.red, fontFamily: FONTS.medium }]}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: SPACING.lg, gap: SPACING.sm },
  text: { fontSize: 14, textAlign: 'center' },
  retry: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 14 },
});
