import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PlanFeature = {
  id: string;
  plan: string;
  feature_key: string;
  feature_name: string;
  is_enabled: boolean;
  limit_value: number | null;
};

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
      // Fetch features for the current plan
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan', plan);

      if (error) {
        console.error('Error fetching plan features:', error);
      } else {
        setFeatures(data || []);
      }
    } catch (e) {
      console.error('Exception fetching plan features:', e);
    }
  };

  const canAccess = (featureKey: string) => {
    const feature = features.find(f => f.feature_key === featureKey);
    return feature ? feature.is_enabled : false;
  };

  const getLimit = (featureKey: string) => {
    const feature = features.find(f => f.feature_key === featureKey);
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
