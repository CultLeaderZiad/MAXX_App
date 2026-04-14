import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { PlanProvider } from '../context/PlanContext';
import { ThemeProvider as NavigationThemeProvider, DarkTheme } from '@react-navigation/native';
import { PremiumModal } from '../src/components/PremiumModal';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const { theme, mode, isReady: themeReady } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Prevent multiple rapid navigations
    const currentSegment = segments[0] as string | undefined;
    const isPublic = !currentSegment || currentSegment === 'index' || currentSegment === 'otp' || currentSegment === 'login' || currentSegment === 'register' || currentSegment === 'forgot-password';
    const isOnboarding = currentSegment === 'goals' || currentSegment === 'weakspots' || currentSegment === 'plans' || currentSegment === 'payment' || currentSegment === 'stats';
    const isReset = currentSegment === 'reset-password';

    if (!session && !isPublic && !isReset) {
      router.replace('/');
      return;
    }
    
    if (session) {
      if (isReset) {
         // Let them stay on reset password
         return;
      }

      // If profile hasn't loaded yet, DON'T navigate — wait for it
      if (!profile) return;

      // Skip onboarding for admins entirely
      if (profile.role === 'admin') {
        if (isPublic || isOnboarding) {
          router.replace('/(tabs)');
        }
        return;
      }

      if (!profile.onboarding_completed) {
        if (!isOnboarding) {
          router.replace('/goals');
        }
      } else if (profile.onboarding_completed) {
        if (isPublic) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, profile, loading]);
  // NOTE: Removed `segments` from dep array — this was causing the "flash" 
  // since every route change triggered the effect, which then immediately
  // navigated again, creating a visual flash loop.

  useEffect(() => {
    if (themeReady && !loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [themeReady, loading]);

  if (loading || !themeReady) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color="#C8A96E" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationThemeProvider value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.bgPrimary,
          card: theme.bgSurface,
          text: theme.textPrimary,
          border: theme.border,
        }
      }}>
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: theme.bgPrimary },
          animation: 'fade_from_bottom',
          animationDuration: 250,
        }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="otp" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="register" options={{ animation: 'fade' }} />
          <Stack.Screen name="forgot-password" options={{ animation: 'fade' }} />
          <Stack.Screen name="reset-password" options={{ animation: 'fade' }} />
          <Stack.Screen name="goals" options={{ animation: 'fade' }} />
          <Stack.Screen name="weakspots" options={{ animation: 'fade' }} />
          <Stack.Screen name="stats" options={{ animation: 'fade' }} />
          <Stack.Screen name="plans" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="exercise" options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 300 }} />
          <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="nofap" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="calculator" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="admin/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="supplements" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </NavigationThemeProvider>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    async function checkUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync()
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync()
          await Updates.reloadAsync()
        }
      } catch (e) {
        console.log('Update check failed:', e)
      }
    }
    if (!__DEV__) checkUpdates()
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>
            <RootLayoutNav />
            <PremiumModal />
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
