'use client';
import { createClientAuth } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { handleCatchError } from '@/utils/errorHelpers';

interface SystemStatus {
  totalUsers: number;
  activeSessions: number;
  systemRoles: number;
  loading: boolean;
  error: string | null;
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    totalUsers: 0,
    activeSessions: 0,
    systemRoles: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemStatus() {
      try {
        const supabase = createClientAuth();

        // Total Users from auth.users
        const { count: userCount, error: userError } = await supabase
          .from('user_view')
          .select('id', { count: 'exact', head: true });

        // System Roles from auth.roles
        const { count: roleCount, error: roleError } = await supabase
          .from('role_view')
          .select('id', { count: 'exact', head: true });

        const { count: activeCount, error: activeError } = await supabase
          .from('user_view')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');

        if (!isMounted) return;

        setSystemStatus({
          totalUsers: userCount ?? 0,
          activeSessions: activeCount ?? 0,
          systemRoles: roleCount ?? 0,
          loading: false,
          error:
            userError?.message ||
            roleError?.message ||
            activeError?.message ||
            null,
        });
      } catch (error) {
        if (!isMounted) return;

        setSystemStatus((prev) => ({
          ...prev,
          loading: false,
          error: handleCatchError(error, 'Unknown error').message,
        }));
      }
    }

    fetchSystemStatus();

    return () => {
      isMounted = false;
    };
  }, []); // createClientAuth is a module import, safe to omit from deps

  return { systemStatus };
}
