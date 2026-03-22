import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ testID?: string }> = ({ testID }) => {
  const { mode, toggleTheme, theme } = useTheme();
  return (
    <TouchableOpacity onPress={toggleTheme} testID={testID || 'theme-toggle-btn'} style={styles.btn} activeOpacity={0.7}>
      <Feather name={mode === 'dark' ? 'sun' : 'moon'} size={20} color={theme.gold} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
