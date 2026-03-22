import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { FONTS } from '../constants/theme';

interface XPToastProps {
  amount: number;
  visible: boolean;
  onDone?: () => void;
}

export const XPToast: React.FC<XPToastProps> = ({ amount, visible, onDone }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      translateY.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -60, duration: 800, useNativeDriver: true }),
      ]).start(() => onDone?.());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.text, { fontFamily: FONTS.bold }]}>+{amount} XP</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 100 },
  text: { color: '#C8A96E', fontSize: 28, textShadowColor: 'rgba(200,169,110,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
});
