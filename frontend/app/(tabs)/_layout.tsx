import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS } from '../../src/constants/theme';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  train: 'target',
  focus: 'eye',
  social: 'users',
  profile: 'user',
};

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgSurface,
          borderTopColor: theme.border + '44',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 70 : 88,
          paddingBottom: Platform.OS === 'android' ? 12 : 30,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontFamily: FONTS.medium, fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const iconName = TAB_ICONS[route.name] || 'circle';
          return (
            <View style={styles.iconWrap}>
              <Feather name={iconName} size={20} color={color} />
              {focused && <View style={[styles.dot, { backgroundColor: theme.gold }]} />}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="social" options={{ title: 'Social' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
