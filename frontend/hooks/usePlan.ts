import { useAuth } from '../context/AuthContext';
import { DeviceEventEmitter } from 'react-native';

export const usePlan = () => {
  const { profile } = useAuth();
  
  const isInTrial = (): boolean => {
    if (!profile?.trial_end) return false;
    return new Date(profile.trial_end) > new Date();
  };
  
  const selectedPlan = profile?.plan || 'trial';
  
  const hasActiveSubscription = profile?.subscription_status === 'active';

  const effectivePlan = isInTrial() ? selectedPlan : (
    hasActiveSubscription ? selectedPlan : 'trial'
  );

  const trialDaysRemaining = (): number => {
    if (!profile?.trial_end) return 7; // Default 7 if not set
    const diff = new Date(profile.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };
  
  const trialExpired = !isInTrial() &&
    !hasActiveSubscription &&
    profile?.trial_end != null;

  const isPremium = hasActiveSubscription || isInTrial();
  
  const canAccess = (requiredPlan: string): boolean => {
    if (!profile) return false;

    // Admin always has access
    if (profile.role === 'admin') return true;
    
    // During active trial or active subscription, grant full access to their selected plan tier
    if (isPremium) {
      const planHierarchy: Record<string, number> = { trial: 0, grind: 1, alpha: 2, sigma: 3 };
      const requiredLevel = planHierarchy[requiredPlan] || 0;
      const userLevel = planHierarchy[effectivePlan] || 0;
      return userLevel >= requiredLevel;
    }
    
    // Expired trial: only trial-level features
    const planHierarchy: Record<string, number> = { trial: 0, grind: 1, alpha: 2, sigma: 3 };
    return (planHierarchy[requiredPlan] || 0) === 0;
  };

  const handleGate = (featureKey: string): boolean => {
    if (trialExpired) {
      DeviceEventEmitter.emit('showPremiumModal', 'Your free trial has ended. Upgrade to continue.');
      return false;
    }
    if (!canAccess(featureKey)) {
      DeviceEventEmitter.emit('showPremiumModal', 'This is a premium feature. Upgrade to unlock.');
      return false;
    }
    return true;
  };
  
  return {
    canAccess,
    handleGate,
    isInTrial: isInTrial(),
    isPremium,
    effectivePlan,
    selectedPlan,
    trialDaysRemaining: trialDaysRemaining(),
    trialExpired,
    hasActiveSubscription
  };
};
