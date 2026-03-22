import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { WEAK_SPOT_OPTIONS } from '../src/constants/mockData';

export default function WeakSpotsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const { goals } = useLocalSearchParams();

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="weakspots-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="weakspots-back-btn" style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 1 ? theme.gold : theme.border }]} />
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Weak spots</Text>
        <Text style={[styles.sub, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>Be honest. This is just between us.</Text>
        {WEAK_SPOT_OPTIONS.map((item) => {
          const isSel = selected.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              testID={`weak-${item.key}`}
              onPress={() => toggle(item.key)}
              activeOpacity={0.7}
              style={[styles.row, { backgroundColor: isSel ? 'rgba(200,169,110,0.06)' : theme.bgSurface, borderColor: isSel ? theme.borderActive : theme.border }]}
            >
              <View style={[styles.checkbox, { borderColor: isSel ? theme.gold : theme.border, backgroundColor: isSel ? theme.gold : 'transparent' }]}>
                {isSel && <Feather name="check" size={12} color="#0A0A0A" />}
              </View>
              <Feather name={item.icon as any} size={18} color={isSel ? theme.gold : theme.textMuted} />
              <Text style={[styles.label, { color: isSel ? theme.textPrimary : theme.textSecondary, fontFamily: FONTS.medium }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.bottom}>
        <Button 
          title="CONTINUE" 
          onPress={async () => {
            await AsyncStorage.setItem('onboarding_weak_spots', JSON.stringify(selected));
            router.push({ pathname: '/stats', params: { goals, weak_spots: JSON.stringify(selected) } });
          }} 
          disabled={selected.length === 0} 
          testID="weakspots-continue-btn" 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginLeft: 'auto', marginRight: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: SPACING.lg, gap: SPACING.sm },
  title: { fontSize: 28 },
  sub: { fontSize: 14, marginBottom: SPACING.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, flex: 1 },
  bottom: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
});
