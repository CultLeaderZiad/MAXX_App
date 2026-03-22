import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const LoadingSpinner: React.FC<{ testID?: string }> = ({ testID }) => {
  const { theme } = useTheme();
  return (
    <View testID={testID} style={styles.container}>
      <ActivityIndicator size="large" color={theme.gold} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
