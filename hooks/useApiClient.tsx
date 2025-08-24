/**
 * useApiClient Hook - Provides authenticated API client instances
 *
 * Hook for accessing authenticated API clients with automatic token refresh
 */

import { useMemo } from 'react';
import {
  apiClient,
  ingressServiceClient,
  langflowClient,
  createAuthenticatedClient,
} from '@/utils/authenticatedFetch';

interface UseApiClient {
  apiClient: typeof apiClient;
  ingressServiceClient: typeof ingressServiceClient;
  langflowClient: typeof langflowClient;
  createClient: typeof createAuthenticatedClient;
}

/**
 * Hook for authenticated API clients
 */
export const useApiClient = (): UseApiClient => {
  const clients = useMemo(
    () => ({
      apiClient,
      ingressServiceClient,
      langflowClient,
      createClient: createAuthenticatedClient,
    }),
    [],
  );

  return clients;
};

export default useApiClient;
