import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  animated?: boolean;
  testID?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 6, animated = true, testID }) => {
  const { theme } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, { toValue: progress, duration: 1200, useNativeDriver: false }).start();
    } else {
      animValue.setValue(progress);
    }
  }, [progress, animated]);

  const width = animValue.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View testID={testID} style={[styles.track, { height, backgroundColor: theme.bgElevated }]}>
      <Animated.View style={[styles.fillContainer, { width, height }]}>
        <LinearGradient colors={[...theme.goldGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { height }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: { borderRadius: 3, overflow: 'hidden', width: '100%' },
  fillContainer: { borderRadius: 3, overflow: 'hidden' },
  fill: { flex: 1 },
});
