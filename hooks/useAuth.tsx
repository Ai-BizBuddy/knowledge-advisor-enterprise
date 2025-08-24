'use client';

import { useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useAuthContext } from '@/contexts/AuthContext';

interface AuthState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseAuth {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  getSession: () => Promise<Session | null>;
  loading: boolean;
  error: string | null;
  success: boolean;
  user: ReturnType<typeof useAuthContext>['user'];
  session: ReturnType<typeof useAuthContext>['session'];
  refreshToken: ReturnType<typeof useAuthContext>['refreshToken'];
}

export function useAuth(): UseAuth {
  const [state, setState] = useState<AuthState>({
    loading: false,
    error: null,
    success: false,
  });

  const supabase = createClient();
  const { user, session, refreshToken, signOut } = useAuthContext();

  const login = async (email: string, password: string) => {
    setState({ loading: true, error: null, success: false });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setState({
      loading: false,
      error: error ? error.message : null,
      success: !error,
    });
  };

  const logout = async () => {
    setState({ loading: true, error: null, success: false });
    await signOut();
    setState({
      loading: false,
      error: null,
      success: true,
    });
  };

  const signup = async (email: string, password: string) => {
    setState({ loading: true, error: null, success: false });
    const { error } = await supabase.auth.signUp({ email, password });
    setState({
      loading: false,
      error: error ? error.message : null,
      success: !error,
    });
  };

  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setState({ loading: false, error: error.message, success: false });
      return null;
    }
    return data.session;
  };

  return {
    login,
    logout,
    signup,
    getSession,
    loading: state.loading,
    error: state.error,
    success: state.success,
    user,
    session,
    refreshToken,
  };
}
