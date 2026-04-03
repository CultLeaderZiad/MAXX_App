import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const { theme, mode, isReady: themeReady } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] as string | undefined;
    const isPublic = !currentSegment || currentSegment === 'index' || currentSegment === 'otp' || currentSegment === 'login' || currentSegment === 'register';

    if (!session && !isPublic) {
      router.replace('/');
    } else if (session) {
      // Logic for authenticated users
      const isOnboarding = currentSegment === 'goals' || currentSegment === 'weakspots' || currentSegment === 'plans' || currentSegment === 'payment';
      
      if (profile && !profile.onboarding_completed) {
        // User needs to onboard. If they aren't on an onboarding screen, force them there.
        if (!isOnboarding) {
          router.replace('/goals');
        }
      } else if (profile?.onboarding_completed) {
        // User has onboarded. If they are on a public page or an onboarding page (except plans/payment), send to app.
        if (isPublic || (isOnboarding && currentSegment !== 'plans' && currentSegment !== 'payment')) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, profile, loading, segments]);

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
          animation: 'fade',
          animationDuration: 200,
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="otp" />
          <Stack.Screen name="goals" />
          <Stack.Screen name="weakspots" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="plans" />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="exercise" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
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
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

