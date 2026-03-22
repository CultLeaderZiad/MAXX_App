import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootNav() {
  const { theme, mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bgPrimary }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="weakspots" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
