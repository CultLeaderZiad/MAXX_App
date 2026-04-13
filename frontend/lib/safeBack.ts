import { router } from 'expo-router';

/**
 * Safely navigate back. If there's no previous screen in the stack,
 * redirect to the tabs home instead of triggering a GO_BACK error.
 */
export function safeBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}
