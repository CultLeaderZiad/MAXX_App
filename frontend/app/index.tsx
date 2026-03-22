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
  const x = useRef(new Animated.Value(startX)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const size = Math.random() * 4 + 2;

  useEffect(() => {
    const animate = () => {
      y.setValue(height);
      opacity.setValue(0);
      x.setValue(startX);
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -50, duration: 6000 + Math.random() * 2000, useNativeDriver: true }),
          Animated.timing(x, { toValue: startX + (Math.random() * 60 - 30), duration: 6000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 4500, useNativeDriver: true }),
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
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#C8A96E',
        opacity,
        transform: [{ translateY: y }, { translateX: x }],
      }}
    />
  );
}

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const letters = ['M', 'A', 'X', 'X'];
  const letterAnims = useRef(letters.map(() => new Animated.Value(0))).current;
  const btnSlide = useRef(new Animated.Value(100)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = letters.map((_, i) => 
      Animated.timing(letterAnims[i], { toValue: 1, duration: 600, delay: i * 150, useNativeDriver: true })
    );

    Animated.sequence([
      Animated.stagger(200, animations),
      Animated.timing(btnSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(btnPulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(btnPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (!profile?.onboarding_completed) {
        router.replace('/goals');
      } else {
        // If user exists but not onboarded, maybe go to goals?
        // For now let's just go to tabs or handle it in AuthContext
        router.replace('/(tabs)');
      }
    }
  }, [loading, user, profile?.onboarding_completed]);

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
      <View style={styles.content}>
        <View style={styles.logoRow}>
          {letters.map((char, i) => (
            <Animated.Text 
              key={i} 
              style={[
                styles.logoChar, 
                { 
                  color: '#C8A96E', 
                  fontFamily: FONTS.cinzelBold,
                  opacity: letterAnims[i],
                  transform: [{
                    translateY: letterAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
                  }]
                }
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text style={[styles.tagline, { color: theme.textSecondary, fontFamily: FONTS.regular, opacity: letterAnims[3] }]}>
          Become the man you were <Text style={{ color: theme.gold }}>built</Text> to be.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.bottom, { transform: [{ translateY: btnSlide }, { scale: btnPulse }] }]}>
        <Button title="START YOUR FREE 7 DAYS" onPress={() => router.push('/register')} testID="start-trial-btn" />
        <Text style={[styles.subtext, { color: theme.textMuted, fontFamily: FONTS.regular }]}>
          No charge until Day 8 · Cancel anytime
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRight: { position: 'absolute', top: 60, right: 16, zIndex: 10 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  logoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  logoChar: { fontSize: 80, letterSpacing: 4 },
  tagline: { fontSize: 18, marginTop: SPACING.md, textAlign: 'center', opacity: 0.9 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md },
  subtext: { fontSize: 11, textAlign: 'center' },
});
