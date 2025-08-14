"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

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
    throw new Error("useAuthContext must be used within an AuthProvider");
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
      console.log("Token refresh already in progress, waiting...");
      return refreshPromise;
    }

    const promise = (async () => {
      try {
        console.log("Refreshing session token...");
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error("Token refresh failed:", error);
          return null;
        }

        if (data.session) {
          console.log("Token refreshed successfully");
          setSession(data.session);
          setUser(data.session.user);
          return data.session;
        }

        return null;
      } catch (error) {
        console.error("Token refresh error:", error);
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
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  // Get access token function
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check if current token is expiring soon
      if (isTokenExpiring()) {
        console.log("Token is expiring soon, refreshing...");
        const newSession = await refreshToken();
        return newSession?.access_token || null;
      }

      // Return current token if still valid
      return session?.access_token || null;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }, [session, isTokenExpiring, refreshToken]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(
    (event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth state changed:", event, session);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      switch (event) {
        case "SIGNED_IN":
          console.log("User signed in");
          break;
        case "SIGNED_OUT":
          console.log("User signed out");
          // Redirect to login page after hydration
          setTimeout(() => {
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }, 0);
          break;
        case "TOKEN_REFRESHED":
          console.log("Token refreshed automatically by Supabase");
          break;
        case "USER_UPDATED":
          console.log("User updated");
          break;
        default:
          break;
      }
    },
    [],
  );

  // Set up automatic token refresh with improved logic
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    const setupTokenRefresh = (session: Session) => {
      if (!session.expires_at) return;

      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Refresh token 5 minutes before expiry, but at least 1 minute from now
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

      // Only set timer if we have enough time left
      if (refreshTime > 0) {
        refreshTimer = setTimeout(async () => {
          const newSession = await refreshToken();
          if (newSession) {
            setupTokenRefresh(newSession); // Set up next refresh
          } else {
            await signOut();
          }
        }, refreshTime);
      } else {
        refreshToken().then((newSession) => {
          if (newSession) {
            setupTokenRefresh(newSession);
          } else {
            signOut();
          }
        });
      }
    };

    // Initial session check and setup
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
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
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Clean up timer on unmount
    return () => {
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [supabase.auth, handleAuthStateChange, refreshToken, signOut]);

  // Update token refresh timer when session changes
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;

    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

      if (refreshTime > 0) {
        refreshTimer = setTimeout(async () => {
          const newSession = await refreshToken();
          if (!newSession) {
            await signOut();
          }
        }, refreshTime);
      }
    }

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [session, refreshToken, signOut]);

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
