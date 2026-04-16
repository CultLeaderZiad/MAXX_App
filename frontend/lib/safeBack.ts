import { router } from 'expo-router';

/**
 * Navigate back safely — if there's no previous route,
 * fall back to the main tabs screen.
 */
export function safeBack(fallback = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
