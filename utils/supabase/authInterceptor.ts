/**
 * Supabase Auth-Aware Client
 *
 * Enhanced Supabase client that automatically handles token refresh
 * and provides utility methods for authenticated requests.
 *
 * NOTE: This file is maintained for backward compatibility.
 * New code should use authUtils.ts for cleaner auth-aware operations.
 */

import { createClient } from '@/utils/supabase/client';
import { Session, SupabaseClient } from '@supabase/supabase-js';

/**
 * Enhanced Supabase client with automatic token refresh
 */
export class SupabaseAuthClient {
  private static instance: SupabaseAuthClient;
  private supabase: SupabaseClient;
  private refreshPromise: Promise<Session | null> | null = null;
  private cachedSession: Session | null = null;
  private lastSessionFetch: number = 0;
  private readonly SESSION_CACHE_TTL = 30000; // 30 seconds cache

  private constructor() {
    this.supabase = createClient();
  }

  public static getInstance(): SupabaseAuthClient {
    if (!SupabaseAuthClient.instance) {
      SupabaseAuthClient.instance = new SupabaseAuthClient();
    }
    return SupabaseAuthClient.instance;
  }

  /**
   * Get the underlying Supabase client
   */
  public getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Ensure we have a valid token, refresh if necessary
   */
  private async ensureValidToken(): Promise<void> {
    try {
      const session = await this.getSession();

      if (!session) {
        // Session not found - will be handled by auth error
        return;
      }

      // Check if token is expiring soon (within 5 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Only refresh if expiring within 5 minutes and no refresh in progress
      if (timeUntilExpiry <= 5 * 60 * 1000 && !this.refreshPromise) {
        await this.refreshToken();
      }
    } catch {
      // Silently handle errors - auth failures will be caught elsewhere
    }
  }

  /**
   * Refresh the session token with deduplication
   */
  private async refreshToken(): Promise<Session | null> {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const { data, error } = await this.supabase.auth.refreshSession();

        if (error) {
          // If refresh fails with specific errors, handle auth failure
          if (
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('invalid_refresh_token')
          ) {
            this.handleAuthFailure();
          }
          return null;
        }

        if (data.session) {
          // Update cached session with fresh data
          this.cachedSession = data.session;
          this.lastSessionFetch = Date.now();
          return data.session;
        }

        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Handle authentication failure
   */
  private handleAuthFailure(): void {
    // Clear cached session
    this.cachedSession = null;
    this.lastSessionFetch = 0;
    
    // Clear any stored session data
    this.supabase.auth.signOut();

    // Redirect to login page
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      window.location.href = '/login';
    }
  }

  /**
   * Get the current session with caching
   */
  public async getSession(): Promise<Session | null> {
    // Return cached session if still valid
    const now = Date.now();
    if (
      this.cachedSession && 
      (now - this.lastSessionFetch) < this.SESSION_CACHE_TTL
    ) {
      return this.cachedSession;
    }

    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        return null;
      }

      // Update cache
      this.cachedSession = session;
      this.lastSessionFetch = now;
      
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Get a fresh access token
   */
  public async getAccessToken(): Promise<string | null> {
    await this.ensureValidToken();
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Check if the current session is valid
   */
  public async isSessionValid(): Promise<boolean> {
    const session = await this.getSession();

    if (!session || !session.expires_at) {
      return false;
    }

    const expiresAt = session.expires_at * 1000;
    const now = Date.now();

    return expiresAt > now;
  }

  /**
   * Clear cached session (useful for testing or forced refresh)
   */
  public clearSessionCache(): void {
    this.cachedSession = null;
    this.lastSessionFetch = 0;
  }

  /**
   * Execute a database operation with automatic token refresh
   */
  public async executeQuery<T>(
    operation: (client: SupabaseClient) => Promise<T>,
  ): Promise<T> {
    try {
      // Ensure we have a valid token
      await this.ensureValidToken();

      // Execute the operation
      const result = await operation(this.supabase);

      return result;
    } catch (error: unknown) {
      // If we get an auth error, try to refresh and retry once
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('JWT') || errorMessage.includes('expired')) {
        const newSession = await this.refreshToken();

        if (newSession) {
          // Retry the operation
          return await operation(this.supabase);
        } else {
          // If refresh fails, handle auth failure
          this.handleAuthFailure();
          throw new Error('Authentication failed');
        }
      }

      throw error;
    }
  }

  /**
   * Create a table client with automatic token refresh
   * Enhanced version that supports both auth and custom schemas
   */
  public createTable(targetSchema?: string) {
    const schema =
      targetSchema || process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'knowledge';
    return this.supabase.schema(schema);
  }
}

// Initialize and export the auth client
export const supabaseAuthClient = SupabaseAuthClient.getInstance();
