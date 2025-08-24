"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { createClientAuth } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";

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
  const { user, session } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (!user || !session) {
      setUserProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClientAuth();

      // First try to get profile from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 = not found
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // Create profile object with fallbacks
      const profile: UserProfile = {
        id: user.id,
        email: user.email || "",
        full_name:
          profileData?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          null,
        avatar_url:
          profileData?.avatar_url || user.user_metadata?.avatar_url || null,
      };

      setUserProfile(profile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");

      // Set minimal profile data from auth user
      setUserProfile({
        id: user.id,
        email: user.email || "",
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  // Fetch profile when user or session changes
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Refresh function for manual updates
  const refreshProfile = async (): Promise<void> => {
    await fetchUserProfile();
  };

  return {
    userProfile,
    loading,
    error,
    refreshProfile,
  };
}
