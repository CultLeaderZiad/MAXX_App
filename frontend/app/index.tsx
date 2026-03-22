import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { FONTS, SPACING } from '../src/constants/theme';

const { width, height } = Dimensions.get('window');

function GoldParticle({ delay, startX }: { delay: number; startX: number; key?: any }) {
  const y = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      y.setValue(height);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -20, duration: 4000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 3200, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C8A96E',
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { user, isOnboarded, loading } = useAuth();
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        // If user exists but not onboarded, maybe go to goals?
        // For now let's just go to tabs or handle it in AuthContext
        router.replace('/(tabs)');
      }
    }
  }, [loading, user, isOnboarded]);

  const particles = [
    { delay: 0, x: width * 0.15 },
    { delay: 600, x: width * 0.35 },
    { delay: 1200, x: width * 0.55 },
    { delay: 400, x: width * 0.7 },
    { delay: 800, x: width * 0.85 },
    { delay: 1600, x: width * 0.45 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="welcome-screen">
      {particles.map((p, i) => (
        <GoldParticle key={i} delay={p.delay} startX={p.x} />
      ))}
      <View style={styles.topRight}>
        <ThemeToggle />
      </View>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={[styles.logo, { fontFamily: FONTS.cinzelBold, color: '#C8A96E' }]}>MAXX</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
          Become the man you were <Text style={{ color: theme.gold }}>built</Text> to be.
        </Text>
      </Animated.View>
      <View style={styles.bottom}>
        <Button title="START YOUR FREE 7 DAYS" onPress={() => router.push('/register')} testID="start-trial-btn" />
        <Text style={[styles.subtext, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          No charge until Day 8 · Cancel anytime
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRight: { position: 'absolute', top: 60, right: 16, zIndex: 10 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  logo: { fontSize: 80, letterSpacing: 12, textAlign: 'center' },
  tagline: { fontSize: 18, marginTop: SPACING.md, textAlign: 'center', opacity: 0.9 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md },
  subtext: { fontSize: 11, textAlign: 'center' },
});
