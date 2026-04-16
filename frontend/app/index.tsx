import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { GOLD } from '../src/constants/theme';

export default function Index() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login' as any);
    } else if (!profile?.onboarding_completed) {
      router.replace('/stats' as any);
    } else {
      router.replace('/(tabs)/home' as any);
    }
  }, [user, profile, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
      <ActivityIndicator color={GOLD} size="large" />
    </View>
  );
}
