import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PlanFeature = {
  id?: string;
  plan: string;
  feature_key: string;
  feature_name?: string;
  is_enabled: boolean;
  limit_value: number | null;
};

const DEFAULT_PLAN_FEATURES: PlanFeature[] = [
  { plan: 'trial', feature_key: 'jaw_training', is_enabled: true, limit_value: null },
  { plan: 'trial', feature_key: 'nofap_tracker', is_enabled: true, limit_value: null },
  { plan: 'trial', feature_key: 'daily_wisdom', is_enabled: true, limit_value: 3 },
  { plan: 'grind', feature_key: 'jaw_training', is_enabled: true, limit_value: null },
  { plan: 'grind', feature_key: 'body_programs', is_enabled: true, limit_value: null },
  { plan: 'alpha', feature_key: 'face_coach', is_enabled: true, limit_value: 4 },
  { plan: 'alpha', feature_key: 'profile_audit', is_enabled: true, limit_value: 3 },
  { plan: 'sigma', feature_key: 'convo_lab', is_enabled: true, limit_value: null },
  { plan: 'sigma', feature_key: 'face_coach', is_enabled: true, limit_value: null },
]

type PlanContextType = {
  plan: string;
  features: PlanFeature[];
  canAccess: (featureKey: string) => boolean;
  getLimit: (featureKey: string) => number | null;
  refreshPlan: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, user } = useAuth();
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [plan, setPlan] = useState('free'); // Default to free if no profile/plan

  useEffect(() => {
    if (profile?.plan) {
      setPlan(profile.plan);
    } else {
      setPlan('free');
    }
  }, [profile]);

  useEffect(() => {
    fetchFeatures();
  }, [plan]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .order('sort_order' as any); // use sort_order if available

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.log('Plan features fallback to defaults');
      // Use hardcoded defaults so app never crashes
      setFeatures(DEFAULT_PLAN_FEATURES);
    }
  };

  const canAccess = (featureKey: string) => {
    const fPlan = plan === 'free_trial' ? 'trial' : plan;
    const feature = features.find(f => f.feature_key === featureKey && f.plan === fPlan);
    return feature ? feature.is_enabled : false;
  };

  const getLimit = (featureKey: string) => {
    const fPlan = plan === 'free_trial' ? 'trial' : plan;
    const feature = features.find(f => f.feature_key === featureKey && f.plan === fPlan);
    return feature ? feature.limit_value : null;
  };

  const refreshPlan = async () => {
    await fetchFeatures();
  };

  return (
    <PlanContext.Provider value={{ plan, features, canAccess, getLimit, refreshPlan }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
