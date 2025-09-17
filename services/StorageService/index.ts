/**
 * Storage Service for Role-Based Storage Usage Queries
 * 
 * Service to handle storage usage queries based on user roles.
 * Uses storage_usage_total RPC for admin users and storage_usage_by_user for regular users.
 */

import { extractUserClaims } from '@/utils/jwtUtils';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClient } from '@/utils/supabase/client';

/**
 * Storage usage response interface
 */
interface StorageUsageResponse {
  totalStorageBytes: number;
  totalStorageFormatted: string;
}

/**
 * TypedResponse interface for consistent API responses
 */
interface TypedResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

class StorageService {
  constructor() {
    // Service initialization
  }

  /**
   * Get current user session from Supabase auth
   */
  private async getCurrentSession() {
    try {
      const session = await getAuthSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has admin role
   * Checks for admin, super_admin, or administrator roles in JWT
   */
  private async isAdminUser(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session.access_token) {
        return false;
      }

      // Extract user claims from JWT
      const claims = extractUserClaims(session.access_token);
      if (!claims?.roles) {
        return false;
      }

      // Check if user has admin role
      const adminRoles = ['admin', 'super_admin', 'administrator'];
      return claims.roles.some(role => 
        adminRoles.includes(role.toLowerCase())
      );
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${value} ${sizes[i]}`;
  }

  /**
   * Get storage usage based on user role
   * Calls storage_usage_total for admin users
   * Calls storage_usage_by_user for regular users
   * RPC functions return bigint value representing bytes
   */
  async getStorageUsage(): Promise<TypedResponse<StorageUsageResponse>> {
    try {
      const supabase = createClient();
      const isAdmin = await this.isAdminUser();

      if (isAdmin) {
        // Admin user - call storage_usage_total RPC
        const { data, error } = await supabase.rpc('storage_usage_total');
        
        if (error) {
          console.error('Storage usage total RPC error:', error);
          return { 
            success: false, 
            error: `Failed to fetch storage usage: ${error.message}` 
          };
        }

        // RPC function returns bigint value directly (bytes)
        const storageBytes = typeof data === 'number' ? data : parseInt(data) || 0;
        
        return {
          success: true,
          data: {
            totalStorageBytes: storageBytes,
            totalStorageFormatted: this.formatBytes(storageBytes)
          }
        };
      } else {
        // Regular user - call storage_usage_by_user RPC (no parameters needed if it uses auth.uid())
        const { data, error } = await supabase.rpc('storage_usage_by_user');
        
        if (error) {
          console.error('Storage usage by user RPC error:', error);
          return { 
            success: false, 
            error: `Failed to fetch user storage usage: ${error.message}` 
          };
        }

        // RPC function returns bigint value directly (bytes)
        const storageBytes = typeof data === 'number' ? data : parseInt(data) || 0;
        
        return {
          success: true,
          data: {
            totalStorageBytes: storageBytes,
            totalStorageFormatted: this.formatBytes(storageBytes)
          }
        };
      }
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch storage usage',
        data: {
          totalStorageBytes: 0,
          totalStorageFormatted: '0 B'
        }
      };
    }
  }

  /**
   * Get user's admin status
   */
  async getUserAdminStatus(): Promise<TypedResponse<{ isAdmin: boolean }>> {
    try {
      const isAdmin = await this.isAdminUser();
      return {
        success: true,
        data: { isAdmin }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check admin status',
        data: { isAdmin: false }
      };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
export type { StorageUsageResponse, TypedResponse };
