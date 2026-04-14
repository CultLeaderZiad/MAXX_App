import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

const ADMIN_EMAIL = 'cultleaderzoz.dev@gmail.com';

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  onboarding_completed?: boolean;
  xp?: number;
  power_level?: number;
  plan?: string;
  subscription_status?: string;
  trial_end?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    dob: string,
    extraData?: any
  ) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, mode?: string) => Promise<{ error: any }>;
  resendOtp: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  fetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    let profileSubscription: any = null;

    const setupProfileListener = (userId: string) => {
      if (profileSubscription) profileSubscription.unsubscribe();
      profileSubscription = supabase
        .channel(`profile:${userId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${userId}` 
        }, payload => {
          setProfile(payload.new as Profile);
        })
        .subscribe();
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          setupProfileListener(session.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user && event !== 'SIGNED_OUT') {
        const userId = session.user.id;
        setSession(session);
        setUser(session.user);
        await fetchProfile(userId);
        setupProfileListener(userId);
      } else {
        if (profileSubscription) profileSubscription.unsubscribe();
        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (profileSubscription) profileSubscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found — create default profile
        const { data: userData } = await supabase.auth.getUser();
        const metadata = userData?.user?.user_metadata;
        const userEmail = userData?.user?.email;

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: metadata?.full_name || 'Brother',
            role: userEmail === ADMIN_EMAIL ? 'admin' : 'user',
            xp: 0,
            power_level: 0,
            onboarding_completed: true, // Assume true to keep them out of onboarding
            level_title: 'Beginner',
            goals: metadata?.fitness_goals || [],
            weak_spots: [],
            height_cm: metadata?.height_cm || null,
            weight_kg: metadata?.weight_kg || null,
            body_type: metadata?.body_type || null,
            play_type: metadata?.play_type || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
        }
      } else if (error) {
        console.warn('Profile fetch error (retrying once):', error.message);
        // Retry once — handles transient RLS / network issues
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (retryData && !retryError) {
          setProfile(retryData);
        } else {
          console.error('Profile retry also failed:', retryError?.message);
          // Fallback: build a stub profile from auth metadata so the user
          // is NOT dumped to the landing page while the DB recovers
          const { data: userData } = await supabase.auth.getUser();
          const meta = userData?.user?.user_metadata;
          const userEmail = userData?.user?.email;
          setProfile({
            id: userId,
            full_name: meta?.full_name || 'Brother',
            role: userEmail === ADMIN_EMAIL ? 'admin' : 'user',
            xp: 0,
            power_level: 0,
            onboarding_completed: true, // Assume true to keep them out of onboarding
            level_title: 'Beginner',
            goals: meta?.fitness_goals || [],
            weak_spots: [],
            height_cm: meta?.height_cm || null,
            weight_kg: meta?.weight_kg || null,
            body_type: meta?.body_type || null,
            play_type: meta?.play_type || null,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // ── Banned user enforcement ──
        if (data?.banned === true) {
          Alert.alert(
            'Account Banned',
            'Your account has been banned. If you believe this is a mistake, contact support.',
            [{ text: 'OK', onPress: () => signOutBanned() }]
          );
          return;
        }
        setProfile(data);
      }
    } catch (e) {
      console.error('Exception fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    dob: string,
    extraData?: any
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          date_of_birth: dob,
          ...extraData,
        },
      },
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      // Check if user is banned immediately after sign-in
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        const { data: prof } = await supabase.from('profiles').select('banned').eq('id', signedInUser.id).single();
        if (prof?.banned === true) {
          await supabase.auth.signOut();
          return { error: { message: 'Your account has been banned. Contact support.' } as any };
        }
      }
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    router.replace('/');
  };

  /** Force sign-out for banned users — clears state and redirects */
  const signOutBanned = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) { /* ignore */ }
    setProfile(null);
    setUser(null);
    setSession(null);
    router.replace('/');
  };

  /**
   * Verify OTP — optionally pass mode to branch 'recovery' vs general auth.
   */
  const verifyOtp = async (email: string, token: string, mode?: string) => {
    if (mode === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      return { error };
    }

    // Default: try signup type first (most common for new registrations)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) {
      // If signup type fails, try email type (for signInWithOtp re-sends)
      const { data: emailData, error: emailError } =
        await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });
      return { error: emailError };
    }

    return { error: null };
  };

  /**
   * Resend the OTP. Uses signInWithOtp which sends a fresh 6-digit code
   * via the Magic Link email template. This works for both new and
   * existing users.
   */
  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    return { error };
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        verifyOtp,
        resendOtp,
        refreshProfile,
        fetchProfile: refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
