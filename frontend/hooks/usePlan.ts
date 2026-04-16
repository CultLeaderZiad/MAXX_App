import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

const PLAN_HIERARCHY: Record<string, number> = {
  free_trial: 0,
  grind: 1,
  alpha: 2,
  sigma: 3,
};

const FEATURE_GATES: Record<string, string> = {
  face_coach: 'alpha',
  brotherhood_post: 'alpha',
  convo_lab: 'alpha',
  supplement_builder: 'grind',
  dating_iq_advanced: 'alpha',
  dating_iq_basic: 'grind',
  calculators: 'free_trial',
  library: 'free_trial',
};

export function usePlan() {
  const { profile } = useAuth();
  const router = useRouter();

  /** Returns true if the user's trial_end is still in the future */
  const isInTrial = (): boolean => {
    if (!profile?.trial_end) return false;
    return new Date(profile.trial_end) > new Date();
  };

  /** Days remaining in trial (0 if expired or no trial) */
  const daysLeft = (): number => {
    if (!profile?.trial_end) return 0;
    const diff = new Date(profile.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  /** Hours remaining in trial */
  const hoursLeft = (): number => {
    if (!profile?.trial_end) return 0;
    const diff = new Date(profile.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 3600000));
  };

  /** True if trial has expired AND no active subscription */
  const trialExpired = (): boolean => {
    if (!profile) return false;
    if (isInTrial()) return false;
    if (profile.subscription_status === 'active') return false;
    if (!profile.trial_end) return false; // never had a trial → still allow access
    return true;
  };

  /** Main gate: can the current user access a feature? */
  const canAccess = (featureKey: string): boolean => {
    if (!profile) return false;
    if ((profile as any).banned) return false;

    // During active trial: FULL ACCESS
    if (isInTrial()) return true;

    // Active subscription: check plan hierarchy
    if (profile.subscription_status === 'active') {
      const plan = profile.plan || 'free_trial';
      const needed = FEATURE_GATES[featureKey] || 'free_trial';
      const currentIdx = PLAN_HIERARCHY[plan] ?? 0;
      const neededIdx = PLAN_HIERARCHY[needed] ?? 0;
      return currentIdx >= neededIdx;
    }

    // No trial_end means account is fresh — give access
    if (!profile.trial_end) return true;

    // Trial expired & no subscription → no access
    return false;
  };

  const handleGate = (requiredPlan: string) => {
    const names: Record<string, string> = { grind: 'Grind', alpha: 'Alpha', sigma: 'Sigma' };
    Alert.alert(
      trialExpired() ? 'Trial Ended' : `${names[requiredPlan] || 'Premium'} Feature`,
      trialExpired()
        ? 'Your 7-day free trial has ended. Upgrade to keep your progress.'
        : `Upgrade to ${names[requiredPlan] || 'a higher plan'} to unlock this.`,
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View Plans', onPress: () => router.push('/plans' as any) },
      ]
    );
  };

  const currentPlan = profile?.plan || 'free_trial';

  return { canAccess, handleGate, currentPlan, isInTrial, daysLeft, hoursLeft, trialExpired };
}
