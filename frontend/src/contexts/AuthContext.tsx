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

  const signInWithOAuth = useCallback((provider: 'google' | 'github'): Promise<{ error: AuthError | Error | null }> => {
    return new Promise((resolve) => {
      const W = 480;
      const H = 600;
      const left = Math.max(0, window.screenX + (window.outerWidth - W) / 2);
      const top  = Math.max(0, window.screenY + (window.outerHeight - H) / 2);
      const features = `width=${W},height=${H},left=${left},top=${top},resizable=yes,scrollbars=yes`;

      // ── CASE 1: No Supabase credentials → show mock account-picker popup ──
      if (!isSupabaseConfigured) {
        const isGoogle = provider === 'google';
        const accentColor = isGoogle ? '#1a73e8' : '#24292f';
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isGoogle ? 'Sign in – Google Accounts' : 'Sign in · GitHub'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:${isGoogle ? '"Google Sans",Roboto,Arial,sans-serif' : '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif'}}
    body{background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
    .card{width:100%;max-width:396px;border:1px solid #dadce0;border-radius:8px;padding:40px 40px 36px;text-align:center}
    .logo{margin-bottom:14px;display:flex;justify-content:center}
    h1{font-size:24px;font-weight:400;color:#202124;margin-bottom:8px;letter-spacing:-.5px}
    .sub{font-size:16px;color:#5f6368;margin-bottom:28px}
    .divider{height:1px;background:#e0e0e0;margin:0 -40px 4px}
    .item{display:flex;align-items:center;padding:14px 16px;cursor:pointer;border-radius:4px;transition:background .12s;text-align:left;border:none;width:100%;background:none}
    .item:hover{background:#f8f9fa}
    .avatar{width:40px;height:40px;border-radius:50%;background:${accentColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px;margin-right:14px;flex-shrink:0}
    .info .name{font-size:15px;color:#3c4043;font-weight:400}
    .info .mail{font-size:13px;color:#5f6368;margin-top:2px}
    .use-btn{display:flex;align-items:center;padding:14px 16px;cursor:pointer;font-size:14px;color:${accentColor};font-weight:500;border:none;background:none;width:100%;border-radius:4px;transition:background .12s}
    .use-btn:hover{background:#f8f9fa}
    .custom{display:none;padding:14px 0 0}
    .custom input{width:100%;padding:10px 12px;border:1px solid #dadce0;border-radius:4px;font-size:14px;margin-bottom:10px;outline:none;color:#202124}
    .custom input:focus{border-color:${accentColor};box-shadow:0 0 0 2px ${accentColor}22}
    .custom button{width:100%;padding:10px;background:${accentColor};color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:500;cursor:pointer;letter-spacing:.25px}
    .custom button:hover{opacity:.9}
    .footer{margin-top:28px;font-size:12px;color:#70757a;line-height:1.5}
    .footer a{color:${accentColor};text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      ${isGoogle
        ? `<svg width="48" height="48" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`
        : `<svg width="48" height="48" viewBox="0 0 24 24" fill="#24292f"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>`}
    </div>
    <h1>Choose an account</h1>
    <div class="sub">to continue to GitToScale</div>
    <div class="divider"></div>
    <button class="item" onclick="pick('Alex Developer','alex@gmail.com')">
      <div class="avatar">A</div>
      <div class="info"><div class="name">Alex Developer</div><div class="mail">alex@gmail.com</div></div>
    </button>
    <button class="item" onclick="pick('Dev Tester','dev.tester@gmail.com')">
      <div class="avatar" style="background:#34A853">D</div>
      <div class="info"><div class="name">Dev Tester</div><div class="mail">dev.tester@gmail.com</div></div>
    </button>
    <button class="use-btn" onclick="toggleCustom()">
      <svg style="margin-right:10px" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      Use another account
    </button>
    <div class="custom" id="customBox">
      <input type="text" id="custName" placeholder="Full Name" />
      <input type="email" id="custEmail" placeholder="${isGoogle ? 'yourname@gmail.com' : 'user@example.com'}" />
      <button onclick="submitCustom()">Continue</button>
    </div>
    <div class="footer">Before using this app, you can review GitToScale's<br><a href="#">Privacy Policy</a> and <a href="#">Terms of Service</a>.</div>
  </div>
  <script>
    function pick(name,email){
      if(window.opener) window.opener.postMessage({type:'GTS_OAUTH_DONE',user:{id:'usr_'+Math.random().toString(36).slice(2,10),email:email,fullName:name}},'*');
      window.close();
    }
    function toggleCustom(){var b=document.getElementById('customBox');b.style.display=b.style.display==='block'?'none':'block';if(b.style.display==='block')document.getElementById('custName').focus();}
    function submitCustom(){var n=document.getElementById('custName').value.trim()||'Developer';var e=document.getElementById('custEmail').value.trim();if(!e||!e.includes('@')){alert('Please enter a valid email address.');return;}pick(n,e);}
  </script>
</body>
</html>`;

        const popup = window.open('', `${provider}_oauth`, features);
        if (!popup) {
          resolve({ error: new Error('Popup was blocked. Please allow popups for this site and try again.') });
          return;
        }
        popup.document.open();
        popup.document.write(html);
        popup.document.close();

        let timer: ReturnType<typeof setInterval>;
        const onMsg = (ev: MessageEvent) => {
          if (ev.data?.type === 'GTS_OAUTH_DONE') {
            cleanup();
            const u = ev.data.user;
            // Build a proper mock Supabase User shape so route guards work
            const mockUser = {
              id: u.id,
              email: u.email,
              user_metadata: { full_name: u.fullName },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as unknown as import('@supabase/supabase-js').User;
            setUser(mockUser);
            setProfile({ id: u.id, email: u.email, fullName: u.fullName });
            try { localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(u)); } catch {}
            resolve({ error: null });
          }
        };
        const cleanup = () => { clearInterval(timer); window.removeEventListener('message', onMsg); };
        timer = setInterval(() => {
          if (popup.closed) {
            cleanup();
            resolve({ error: new Error('Sign-in cancelled') });
          }
        }, 400);
        window.addEventListener('message', onMsg);
        return;
      }

      // ── CASE 2: Supabase configured → real OAuth popup ──
      (async () => {
        try {
          const redirectUrl = `${window.location.origin}/auth/callback`;
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
              queryParams: { prompt: 'select_account' },
            },
          });
          if (error || !data?.url) { resolve({ error: error ?? new Error('No OAuth URL returned') }); return; }

          const popup = window.open(data.url, `${provider}_oauth`, features);
          if (!popup) { window.location.href = data.url; resolve({ error: null }); return; }

          let timer: ReturnType<typeof setInterval>;
          const cleanup = () => { clearInterval(timer); window.removeEventListener('message', onMsg); };

          const onMsg = async (ev: MessageEvent) => {
            if (ev.origin === window.location.origin) {
              if (ev.data?.type === 'GTS_OAUTH_SUCCESS') {
                cleanup();
                if (ev.data.session) {
                  setSession(ev.data.session);
                  setUser(ev.data.session.user);
                  await loadProfile(
                    ev.data.session.user.id,
                    ev.data.session.user.email || '',
                    ev.data.session.user.user_metadata
                  );
                } else {
                  const { data: { session: curSession } } = await supabase.auth.getSession();
                  if (curSession?.user) {
                    setSession(curSession);
                    setUser(curSession.user);
                    await loadProfile(
                      curSession.user.id,
                      curSession.user.email || '',
                      curSession.user.user_metadata
                    );
                  }
                }
                resolve({ error: null });
              } else if (ev.data?.type === 'GTS_OAUTH_ERROR') {
                cleanup();
                resolve({ error: new Error(ev.data.error || 'Authentication failed') });
              }
            }
          };

          timer = setInterval(async () => {
            if (popup.closed) {
              cleanup();
              // Check if session was stored in localStorage by callback before popup closed
              const { data: { session: curSession } } = await supabase.auth.getSession();
              if (curSession?.user) {
                setSession(curSession);
                setUser(curSession.user);
                await loadProfile(
                  curSession.user.id,
                  curSession.user.email || '',
                  curSession.user.user_metadata
                );
                resolve({ error: null });
              } else {
                resolve({ error: new Error('Sign-in cancelled') });
              }
            }
          }, 500);

          window.addEventListener('message', onMsg);
        } catch (err: any) {
          resolve({ error: err });
        }
      })();
    });
  }, [loadProfile]);








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

