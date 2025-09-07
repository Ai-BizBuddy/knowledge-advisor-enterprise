'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { createClientAuth } from '@/utils/supabase/client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook to manage user profile data from Supabase
 * Integrates with AuthContext to provide profile information
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchUserProfile = async (): Promise<void> => {
      // Prevent infinite loops by checking if user ID actually changed
      if (!user || currentUserIdRef.current === user.id) {
        if (!user) {
          setUserProfile(null);
          currentUserIdRef.current = null;
        }
        return;
      }

      currentUserIdRef.current = user.id;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClientAuth();

        // First try to get profile from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = not found
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        // Create profile object with fallbacks
        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name:
            profileData?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            null,
          avatar_url:
            profileData?.avatar_url || user.user_metadata?.avatar_url || null,
        };

        setUserProfile(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');

        // Set minimal profile data from auth user
        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name:
            user.user_metadata?.full_name || user.email?.split('@')[0] || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]); // Safe to depend on user now with ref guard

  // Refresh function for manual updates
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const supabase = createClientAuth();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      const profile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name:
          profileData?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          null,
        avatar_url:
          profileData?.avatar_url || user.user_metadata?.avatar_url || null,
      };

      setUserProfile(profile);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    userProfile,
    loading,
    error,
    refreshProfile,
  };
}
