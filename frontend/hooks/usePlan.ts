import { useAuth } from '../context/AuthContext';
import { DeviceEventEmitter } from 'react-native';

export const usePlan = () => {
  const { profile } = useAuth();
  
  const isInTrial = () => {
    if (!profile?.trial_end) return false;
    return new Date(profile.trial_end) > new Date();
  };
  
  const selectedPlan = profile?.plan || 'trial';
  
  const effectivePlan = isInTrial() ? selectedPlan : (
    profile?.subscription_status === 'active'
      ? selectedPlan
      : 'trial'
  );

  const trialDaysRemaining = (): number => {
    if (!profile?.trial_end) return 0;
    const diff = new Date(profile.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };
  
  const trialExpired = isInTrial() === false &&
    profile?.subscription_status !== 'active' &&
    selectedPlan !== 'trial';
  
  const canAccess = (featureKey: string): boolean => {
    if (!profile) return false;
    
    // Always give full access to Alpha & Sigma *during* active trial
    if (isInTrial() && ['alpha','sigma'].includes(selectedPlan)) {
      return true;
    }
    
    // Fallback dictionary
    const planHierarchy = { trial: 0, grind: 1, alpha: 2, sigma: 3 };
    const featurePlanMap: Record<string, string> = {
      face_coach: 'alpha',
      profile_audit: 'grind',
      brotherhood_post: 'alpha',
      convo_lab: 'alpha',
      confidence_56: 'alpha',
      supplement_builder: 'grind',
      dating_iq: 'grind',
      library_books: 'trial',
      library_videos: 'trial',
      favorites: 'trial',
      // Add other features here as needed
    };
    
    const requiredPlanLevel = planHierarchy[(featurePlanMap[featureKey] || 'trial') as keyof typeof planHierarchy] || 0;
    const userPlanLevel = planHierarchy[effectivePlan as keyof typeof planHierarchy] || 0;
    
    return userPlanLevel >= requiredPlanLevel;
  };

  const handleGate = (featureKey: string): boolean => {
    if (trialExpired) {
      DeviceEventEmitter.emit('showPremiumModal', 'Subscription Expired');
      return false;
    }
    if (!canAccess(featureKey)) {
      DeviceEventEmitter.emit('showPremiumModal', 'Premium Feature');
      return false;
    }
    return true;
  };
  
  return {
    canAccess,
    handleGate,
    isInTrial: isInTrial(),
    effectivePlan,
    selectedPlan,
    trialDaysRemaining: trialDaysRemaining(),
    trialExpired
  };
};
