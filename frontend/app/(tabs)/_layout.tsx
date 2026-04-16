import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { FONTS, GOLD } from '../../src/constants/theme';
import { View, Text, StyleSheet, Platform } from 'react-native';

function TabIcon({ name, label, focused, color }: { name: string; label: string; focused: boolean; color: string }) {
  return (
    <View style={styles.tabIconWrap}>
      <Feather name={name as any} size={22} color={color} />
      <Text style={[styles.tabLabel, { color, fontFamily: focused ? FONTS.semiBold : FONTS.regular }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.bgSurface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="activity" label="Train" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="sun" label="Focus" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="users" label="Social" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="user" label="Profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: { alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 10, letterSpacing: 0.5 },
});
