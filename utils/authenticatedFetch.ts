import type {
  ApiClientConfig,
  TypedFetchConfig,
  TypedFetchResponse,
} from '@/interfaces/FetchTypes';
import { BaseFetchClient } from '@/utils/fetchClient';
import { createClient } from '@/utils/supabase/client';

class AuthenticatedFetchClient extends BaseFetchClient {
  private supabase = createClient();

  constructor(config: ApiClientConfig) {
    super(config);

    // Add response interceptor to handle auth errors
    this.addResponseInterceptor((response) => {
      // If we get a 401, handle auth error
      if (response.status === 401) {
                if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/login';
        }
      }
      return response;
    });

    // Add error interceptor for auth errors
    this.addErrorInterceptor((error) => {
      if (error.status === 401) {
                if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          window.location.href = '/login';
        }
      }
      return error;
    });
  }

  /**
   * Add authentication header to request config
   */
  private async addAuthHeader(
    config: TypedFetchConfig,
  ): Promise<TypedFetchConfig> {
    try {
      // Get the current session
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
                return config;
      }

      if (session?.access_token) {
        // Add Authorization header
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${session.access_token}`,
          },
        };
      }

      return config;
    } catch (error) {
            return config;
    }
  }

  /**
   * Enhanced request methods with auth
   */
  async get<T = unknown>(
    url: string,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const authConfig = await this.addAuthHeader(config || {});
    return super.get<T>(url, authConfig);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const authConfig = await this.addAuthHeader(config || {});
    return super.post<T>(url, data, authConfig);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const authConfig = await this.addAuthHeader(config || {});
    return super.put<T>(url, data, authConfig);
  }

  async delete<T = unknown>(
    url: string,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const authConfig = await this.addAuthHeader(config || {});
    return super.delete<T>(url, authConfig);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    const authConfig = await this.addAuthHeader(config || {});
    return super.patch<T>(url, data, authConfig);
  }
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      return { session: null, error };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { session } = await this.getCurrentSession();
    return !!session?.access_token;
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  async authenticatedRequest<T = unknown>(
    url: string,
    config?: TypedFetchConfig,
  ): Promise<TypedFetchResponse<T>> {
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      try {
        // Check if we have a valid session
        const { session, error } = await this.getCurrentSession();

        if (error || !session) {
          throw new Error('No valid session found');
        }

        // Check if token is close to expiry (within 5 minutes)
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;

          if (timeUntilExpiry < 5 * 60 * 1000) {
            // 5 minutes
            await this.supabase.auth.refreshSession();
          }
        }

        // Make the request (auth header will be added by interceptor)
        return await this.get<T>(url, config);
      } catch (error: unknown) {
        const typedError = error as { status?: number };

        if (typedError.status === 401 && retryCount < maxRetries) {
          retryCount++;

          try {
            await this.supabase.auth.refreshSession();
            continue; // Retry the request
          } catch (refreshError) {
                        throw error;
          }
        }

        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }
}

// Create singleton instances for different APIs
const createAuthenticatedClient = (
  baseURL: string,
  config?: Partial<ApiClientConfig>,
) => {
  return new AuthenticatedFetchClient({
    baseURL,
    timeout: 30000,
    retryAttempts: 1,
    retryDelay: 1000,
    ...config,
  });
};

// API clients for different services
export const ingressServiceClient = createAuthenticatedClient(
  process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'http://localhost:3001',
);

export const langflowClient = createAuthenticatedClient(
  process.env.NEXT_PUBLIC_LANGFLOW_URL || 'http://localhost:7860',
);

export const apiClient = createAuthenticatedClient('/api');

export { AuthenticatedFetchClient, createAuthenticatedClient };
