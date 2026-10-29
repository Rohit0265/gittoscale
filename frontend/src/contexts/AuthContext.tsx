import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type PendingAction =
  | {
      type: 'prompt';
      prompt: string;
      returnUrl: string;
      customAnswers?: any;
      createdAt: number;
    }
  | {
      type: 'repo';
      repoUrl: string;
      returnUrl: string;
      llmConfig?: any;
      createdAt: number;
    };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | Error | null }>;
  pendingAction: PendingAction | null;
  savePendingAction: (action: PendingAction) => void;
  clearPendingAction: () => void;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PENDING_ACTION_STORAGE_KEY = 'gts_pending_action';
const MOCK_USER_STORAGE_KEY = 'gts_mock_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingAction, setPendingActionState] = useState<PendingAction | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PENDING_ACTION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });


  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      // Sandbox / Mock simulation fallback
      const mockUser = {
        id: `usr_${provider}_${Date.now().toString(36)}`,
        email: `user@${provider}.com`,
        fullName: `${provider.toUpperCase()} Developer`,
      };
      setUser(mockUser as any);
      try {
        localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // ignore storage errors
      }
      return { error: null };
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  }, []);








  // Save pending action to both memory and localStorage
  const savePendingAction = useCallback((action: PendingAction) => {
    setPendingActionState(action);
    try {
      localStorage.setItem(PENDING_ACTION_STORAGE_KEY, JSON.stringify(action));
    } catch (e) {
      console.warn('Failed to save pending action to localStorage:', e);
    }
  }, []);

  // Clear pending action
  const clearPendingAction = useCallback(() => {
    setPendingActionState(null);
    try {
      localStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove pending action from localStorage:', e);
    }
  }, []);

  // Fetch user profile from Supabase
  const loadProfile = useCallback(async (userId: string, userEmail: string, userMeta?: any) => {
    if (!isSupabaseConfigured) {
      setProfile({
        id: userId,
        email: userEmail,
        fullName: userMeta?.full_name || userEmail.split('@')[0],
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile({
          id: data.id,
          fullName: data.full_name || userMeta?.full_name || userEmail.split('@')[0],
          email: data.email || userEmail,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        });
      } else {
        // Fallback to auth metadata if profile row not ready yet
        setProfile({
          id: userId,
          email: userEmail,
          fullName: userMeta?.full_name || userEmail.split('@')[0],
        });
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setProfile({
        id: userId,
        email: userEmail,
        fullName: userMeta?.full_name || userEmail.split('@')[0],
      });
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      setIsLoading(true);

      if (isSupabaseConfigured) {
        try {
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching Supabase session:', error);
          }
          if (mounted && initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await loadProfile(
              initialSession.user.id,
              initialSession.user.email || '',
              initialSession.user.user_metadata
            );
          }
        } catch (err) {
          console.error('Unexpected error in session initialization:', err);
        }
      } else {
        // Mock session mode when Supabase credentials are not in .env yet
        try {
          const savedMock = localStorage.getItem(MOCK_USER_STORAGE_KEY);
          if (savedMock) {
            const parsed = JSON.parse(savedMock);
            const mockUser = {
              id: parsed.id,
              email: parsed.email,
              user_metadata: { full_name: parsed.fullName },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as unknown as User;
            setUser(mockUser);
            setProfile(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse mock session:', e);
        }
      }

      if (mounted) setIsLoading(false);
    }

    initSession();

    // Listen to live auth changes if Supabase configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data: subData } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
        if (newSession?.user) {
          await loadProfile(
            newSession.user.id,
            newSession.user.email || '',
            newSession.user.user_metadata
          );
        } else {
          setProfile(null);
        }
      });
      subscription = subData.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Sign up
  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<{ error: AuthError | Error | null }> => {
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        // In-memory mock registration
        const mockId = `usr_${Date.now().toString(36)}`;
        const mockProfile: UserProfile = {
          id: mockId,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        const mockUser = {
          id: mockId,
          email: mockProfile.email,
          user_metadata: { full_name: mockProfile.fullName },
          app_metadata: {},
          aud: 'authenticated',
          created_at: mockProfile.createdAt,
        } as unknown as User;

        setUser(mockUser);
        setProfile(mockProfile);
        try {
          localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockProfile));
        } catch {}
        setIsLoading(false);
        return { error: null };
      }

      try {
        const redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          setIsLoading(false);
          return { error };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await loadProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        }

        setIsLoading(false);
        return { error: null };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err };
      }
    },
    [loadProfile]
  );

  // Sign in
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | Error | null }> => {
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        // Mock login
        const mockProfile: UserProfile = {
          id: `usr_${Math.random().toString(36).substring(2, 9)}`,
          email: email.trim().toLowerCase(),
          fullName: email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        const mockUser = {
          id: mockProfile.id,
          email: mockProfile.email,
          user_metadata: { full_name: mockProfile.fullName },
          app_metadata: {},
          aud: 'authenticated',
          created_at: mockProfile.createdAt,
        } as unknown as User;

        setUser(mockUser);
        setProfile(mockProfile);
        try {
          localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockProfile));
        } catch {}
        setIsLoading(false);
        return { error: null };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { error };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await loadProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        }

        setIsLoading(false);
        return { error: null };
      } catch (err: any) {
        setIsLoading(false);
        return { error: err };
      }
    },
    [loadProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
    try {
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    } catch {}
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
  }, []);

  // Password reset request
  const resetPassword = useCallback(async (email: string): Promise<{ error: AuthError | Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?type=recovery`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: AuthError | Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  // Helper to obtain authorization token for backend API requests
  const getAuthToken = useCallback((): string | null => {
    if (session?.access_token) {
      return session.access_token;
    }
    if (user) {
      // Mock token for local/dev
      return `mock_jwt_${btoa(JSON.stringify({ id: user.id, email: user.email, name: profile?.fullName }))}`;
    }
    return null;
  }, [session, user, profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        resetPassword,
        updatePassword,
        pendingAction,
        savePendingAction,
        clearPendingAction,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

