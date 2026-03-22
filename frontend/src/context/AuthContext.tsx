import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  date_of_birth?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isOnboarded: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, dob: string) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isOnboarded: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  signOut: async () => {},
  completeOnboarding: async () => {},
  updateUser: () => {},
});

const TOKEN_KEY = 'maxx_token';
const REFRESH_KEY = 'maxx_refresh';
const USER_KEY = 'maxx_user';
const ONBOARDED_KEY = 'maxx_onboarded';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, onboarded] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
      }
      setIsOnboarded(onboarded === 'true');
    } catch {
      // Fail silently on storage read
    } finally {
      setLoading(false);
    }
  };

  const signUp = useCallback(async (email: string, password: string, fullName: string, dob: string) => {
    try {
      const res = await api.post('/api/auth/register', {
        email,
        password,
        full_name: fullName,
        date_of_birth: dob,
      });
      if (res?.success) {
        setPendingEmail(email);
        return { success: true, requiresOtp: true };
      }
      return { success: false, error: res?.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    try {
      const res = await api.post('/api/auth/verify-otp', {
        email: pendingEmail,
        code,
      });
      if (res?.access_token) {
        const userData = res.user;
        setToken(res.access_token);
        setUser(userData);
        api.setToken(res.access_token);
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, res.access_token),
          AsyncStorage.setItem(REFRESH_KEY, res.refresh_token || ''),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
        ]);
        return { success: true };
      }
      return { success: false, error: res?.error || 'Invalid code' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Verification failed' };
    }
  }, [pendingEmail]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res?.access_token) {
        const userData = res.user;
        setToken(res.access_token);
        setUser(userData);
        api.setToken(res.access_token);
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, res.access_token),
          AsyncStorage.setItem(REFRESH_KEY, res.refresh_token || ''),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
        ]);
        const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
        setIsOnboarded(onboarded === 'true');
        return { success: true };
      }
      return { success: false, error: res?.error || 'Login failed' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      setToken(null);
      api.setToken(null);
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    } catch {
      // Fail silently
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      setIsOnboarded(true);
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    } catch {
      // Fail silently
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, isOnboarded, signIn, signUp, verifyOtp, signOut, completeOnboarding, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
