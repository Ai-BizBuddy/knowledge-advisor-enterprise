'use client';

import { createClient } from '@/utils/supabase/client';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshToken: () => Promise<Session | null>;
  signOut: () => Promise<void>;
  isTokenExpiring: () => boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const [refreshPromise, setRefreshPromise] =
    useState<Promise<Session | null> | null>(null);

  // Check if token is expiring soon (within 5 minutes)
  const isTokenExpiring = useCallback((): boolean => {
    if (!session?.expires_at) return false;

    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Consider token expiring if less than 5 minutes remaining
    return timeUntilExpiry <= 5 * 60 * 1000;
  }, [session]);

  // Refresh token function with deduplication
  const refreshToken = useCallback(async (): Promise<Session | null> => {
    // If there's already a refresh in progress, return that promise
    if (refreshPromise) {
      return refreshPromise;
    }

    const promise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('Token refresh error:', error);
          return null;
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          return data.session;
        }

        return null;
      } catch (error) {
        console.error('Token refresh error:', error);
        return null;
      } finally {
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(promise);
    return promise;
  }, [supabase.auth, refreshPromise]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  // Get access token function
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check if current token is expiring soon
      if (isTokenExpiring()) {
        const newSession = await refreshToken();
        return newSession?.access_token || null;
      }

      // Return current token if still valid
      return session?.access_token || null;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }, [session, isTokenExpiring, refreshToken]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(
    (event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      switch (event) {
        case 'SIGNED_IN':
          // Only redirect to dashboard for NEW logins, not session restoration
          if (session?.user) {
            setTimeout(() => {
              if (window.location.pathname === '/login' || window.location.pathname === '/') {
                window.location.href = '/dashboard';
              }
            }, 0);
          }
          break;
        case 'SIGNED_OUT':
          // Redirect to login page after hydration
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 0);
          break;
        case 'TOKEN_REFRESHED':
          break;
        case 'USER_UPDATED':
          break;
        default:
          break;
      }
    },
    [], // No dependencies - this callback doesn't depend on external state
  );

  // Set up auth initialization and token refresh
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;
    let mounted = true;

    const setupTokenRefresh = (session: Session) => {
      // Clear any existing timer
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      if (!session.expires_at || !mounted) return;

      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Refresh token 5 minutes before expiry, but at least 1 minute from now
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

      // Only set timer if we have enough time left and component is mounted
      if (refreshTime > 0 && refreshTime < 24 * 60 * 60 * 1000 && mounted) { // Max 24 hours
        refreshTimer = setTimeout(async () => {
          if (!mounted) return;
          
          try {
            const newSession = await refreshToken();
            if (newSession && mounted) {
              setupTokenRefresh(newSession); // Set up next refresh
            } else if (mounted) {
              await signOut();
            }
          } catch (error) {
            console.error('Auto refresh failed:', error);
            if (mounted) {
              await signOut();
            }
          }
        }, refreshTime);
      } else if (timeUntilExpiry <= 5 * 60 * 1000 && mounted) {
        // Token is expiring soon, refresh immediately
        refreshToken().then((newSession) => {
          if (newSession && mounted) {
            setupTokenRefresh(newSession);
          } else if (mounted) {
            signOut();
          }
        }).catch((error) => {
          console.error('Immediate refresh failed:', error);
          if (mounted) {
            signOut();
          }
        });
      }
    };

    // Initial session check and setup
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Set up automatic refresh if we have a session
        if (session) {
          setupTokenRefresh(session);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      handleAuthStateChange(event, session);
      
      // Set up token refresh for new sessions
      if (session && event === 'TOKEN_REFRESHED') {
        setupTokenRefresh(session);
      }
    });

    // Clean up on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [supabase.auth, handleAuthStateChange, refreshToken, signOut]); // Include dependencies

  const value: AuthContextType = {
    user,
    session,
    loading,
    refreshToken,
    signOut,
    isTokenExpiring,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
