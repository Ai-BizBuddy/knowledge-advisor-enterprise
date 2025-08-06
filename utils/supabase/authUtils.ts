/**
 * Auth-Aware Supabase Client Utilities
 * 
 * Helper functions to make it easier to integrate the auth-aware Supabase client
 * across all services in the application.
 */

import { supabaseAuthClient } from '@/utils/supabase/authInterceptor';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create an auth-aware Supabase client with automatic token refresh
 */
export const createAuthAwareClient = () => {
  return supabaseAuthClient.getClient();
};

/**
 * Create an auth-aware table client with automatic token refresh
 */
export const createAuthAwareTable = () => {
  return supabaseAuthClient.createTable();
};

/**
 * Execute a database operation with automatic token refresh
 */
export const executeWithAuth = async <T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  return supabaseAuthClient.executeQuery(operation);
};

/**
 * Get the current authenticated session
 */
export const getAuthSession = () => {
  return supabaseAuthClient.getSession();
};

/**
 * Get a fresh access token
 */
export const getAccessToken = () => {
  return supabaseAuthClient.getAccessToken();
};

/**
 * Check if the current session is valid
 */
export const isSessionValid = () => {
  return supabaseAuthClient.isSessionValid();
};
