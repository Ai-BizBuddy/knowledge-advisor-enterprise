'use client';
import { decodeJWT } from '@/utils/jwt';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDefaultNavigationItems } from './constants';
import type { NavigationMenuItem } from './types';

/**
 * JWT Claims interface matching the actual token structure
 * Custom claims are at ROOT LEVEL (added via custom_access_token_hook)
 */
interface JWTClaims {
  id: string;
  email?: string;
  // Custom claims at root level
  permissions?: string[];
  roles?: string[];
  role?: string;
  department_id?: string;
  department_name?: string;
  // Standard Supabase metadata
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  user_metadata?: {
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Custom hook for managing sidebar state and navigation logic with permission filtering
 */
export const useSidebar = () => {
    const pathname = usePathname();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [navigationItems, setNavigationItems] = useState<NavigationMenuItem[]>(getDefaultNavigationItems());
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
    const isInitialMount = useRef(true);
    const supabase = createClient();

    /**
     * Decode JWT token manually to extract custom claims
     */
    const decodeJWTToken = useCallback((token: string): JWTClaims | null => {
        return decodeJWT(token) as JWTClaims | null;
    }, []);

    /**
     * Decode JWT token and extract permissions and roles
     */
    const loadUserPermissions = useCallback(async () => {
        try {
            setIsLoadingPermissions(true);
            
            // Get the current session with JWT token
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error || !session) {
                console.warn('No active session found');
                setUserPermissions([]);
                setUserRoles([]);
                return;
            }

            console.log('📝 Sidebar - Raw JWT Access Token:', session.access_token);

            // Decode JWT manually to get ALL custom claims using utility function
            const decodedPayload = decodeJWTToken(session.access_token);
            
            if (!decodedPayload) {
                console.error('Failed to decode JWT token');
                setUserPermissions([]);
                setUserRoles([]);
                return;
            }

            // Also check session.user as fallback
            const claims = session.user as unknown as JWTClaims;
            console.log('👤 Sidebar - Supabase session.user:', JSON.stringify(claims, null, 2));
            
            // Use decoded payload as primary source
            const permissions = decodedPayload.permissions || claims.permissions || [];
            const roles = decodedPayload.roles || claims.roles || [];
            
            setUserPermissions(Array.isArray(permissions) ? permissions : []);
            setUserRoles(Array.isArray(roles) ? roles : []);
            
            console.log('✅ Sidebar - User permissions loaded:', { 
              permissions, 
              roles,
              department_id: decodedPayload.department_id || claims.department_id,
              department_name: decodedPayload.department_name || claims.department_name,
              email: decodedPayload.email || claims.email,
              source: decodedPayload.permissions ? 'decoded_jwt' : 'session_user'
            });
        } catch (error) {
            console.error('Error loading user permissions:', error);
            setUserPermissions([]);
            setUserRoles([]);
        } finally {
            setIsLoadingPermissions(false);
        }
    }, [supabase.auth, decodeJWTToken]);

    /**
     * Check if user has required permissions for a menu item
     */
    const hasRequiredPermissions = useCallback((item: NavigationMenuItem): boolean => {
        // If no permissions required, allow access
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
            // But still check roles if specified
            if (!item.requiredRoles || item.requiredRoles.length === 0) {
                return true;
            }
        }

        // Check if user has required roles
        if (item.requiredRoles && item.requiredRoles.length > 0) {
            const hasRole = item.requiredRoles.some(role => userRoles.includes(role));
            if (!hasRole) {
                return false;
            }
        }

        // Check if user has required permissions
        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            const hasPermission = item.requiredPermissions.every(permission => 
                userPermissions.includes(permission)
            );
            if (!hasPermission) {
                return false;
            }
        }

        return true;
    }, [userPermissions, userRoles]);

    /**
     * Filter navigation items based on user permissions
     */
    const filteredNavigationItems = useMemo(() => {
        if (isLoadingPermissions) {
            // While loading, return empty array - MenuSkeleton will be shown instead
            return [];
        }

        return navigationItems.filter(item => hasRequiredPermissions(item));
    }, [navigationItems, hasRequiredPermissions, isLoadingPermissions]);

    /**
     * Handles menu item activation and loading state
     */
    const handleMenuItemClick = useCallback((index: number) => {
        setNavigationItems(prev => prev.map((item, i) => ({
            ...item,
            active: i === index
        })));
    }, []);

    /**
     * Toggle user dropdown menu
     */
    const toggleUserMenu = useCallback(() => {
        setIsUserMenuOpen(prev => !prev);
    }, []);

    /**
     * Close user dropdown menu
     */
    const closeUserMenu = useCallback(() => {
        setIsUserMenuOpen(false);
    }, []);

    /**
     * Load permissions on mount
     */
    useEffect(() => {
        loadUserPermissions();
    }, [loadUserPermissions]);

    /**
     * Update active menu item based on current pathname
     */
    useEffect(() => {
        if (!pathname) return;

        setNavigationItems(prev => {
            const activeIndex = prev.findIndex(item => item.url === pathname);
            if (activeIndex !== -1 && !prev[activeIndex].active) {
                return prev.map((item, i) => ({
                    ...item,
                    active: i === activeIndex
                }));
            }
            return prev;
        });
        isInitialMount.current = false;
    }, [pathname]);

    return {
        navigationItems: filteredNavigationItems,
        isUserMenuOpen,
        handleMenuItemClick,
        toggleUserMenu,
        closeUserMenu,
        isLoadingPermissions,
        userPermissions,
        userRoles,
    };
};
