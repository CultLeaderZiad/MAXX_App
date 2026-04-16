import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { GOLD } from '../src/constants/theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'stats';

    if (!user) {
      if (!inAuthGroup) router.replace('/auth/login' as any);
    } else if (user && !profile?.onboarding_completed) {
      if (!inOnboarding) router.replace('/stats' as any);
    } else if (user && profile?.onboarding_completed) {
      if (inAuthGroup || inOnboarding) router.replace('/(tabs)/home' as any);
    }
  }, [user, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function AppShell() {
  const { mode } = useTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Cinzel_400Regular,
    Cinzel_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="exercise" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="supplements" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="convo-lab" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="stack-builder" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/reset-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="plans" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="support" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="calculator" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <AppShell />
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
