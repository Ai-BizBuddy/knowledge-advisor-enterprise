/**
 * JWT Token Utilities
 *
 * Helper functions to decode and extract user data from JWT tokens
 * including roles, permissions, and department information.
 */

/**
 * JWT payload structure for our application
 */
export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  role?: string;
  roles?: string[];
  role_ids?: number[]; // Array of role IDs
  permissions?: string[];
  department_name?: string;
  department_id?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
}

/**
 * Extracted user claims from JWT
 */
export interface UserClaims {
  userId: string;
  email?: string;
  role?: string;
  roles: string[];
  role_ids: number[]; // Array of role IDs
  permissions: string[];
  department_name?: string;
  department_id?: string;
  metadata: Record<string, unknown>;
}

/**
 * Decode JWT token without verification (for client-side use only)
 * Note: This should only be used for extracting claims, not for security validation
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);

    // Decode base64
    const decodedPayload = atob(paddedPayload);

    // Parse JSON
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
}

/**
 * Extract user claims from JWT token
 */
export function extractUserClaims(token: string): UserClaims | null {
  const payload = decodeJWTPayload(token);
  if (!payload) {
    return null;
  }

  // Extract roles from various possible locations
  const roles: string[] = [];
  if (payload.role) {
    roles.push(payload.role);
  }
  if (payload.roles && Array.isArray(payload.roles)) {
    roles.push(...payload.roles);
  }
  if (
    payload.app_metadata?.roles &&
    Array.isArray(payload.app_metadata.roles)
  ) {
    roles.push(...(payload.app_metadata.roles as string[]));
  }
  if (
    payload.user_metadata?.roles &&
    Array.isArray(payload.user_metadata.roles)
  ) {
    roles.push(...(payload.user_metadata.roles as string[]));
  }

  // Extract role IDs from various possible locations
  const role_ids: number[] = [];
  if (payload.role_ids && Array.isArray(payload.role_ids)) {
    role_ids.push(...payload.role_ids);
  }
  if (
    payload.app_metadata?.role_ids &&
    Array.isArray(payload.app_metadata.role_ids)
  ) {
    role_ids.push(...(payload.app_metadata.role_ids as number[]));
  }
  if (
    payload.user_metadata?.role_ids &&
    Array.isArray(payload.user_metadata.role_ids)
  ) {
    role_ids.push(...(payload.user_metadata.role_ids as number[]));
  }

  // Extract permissions from various possible locations
  const permissions: string[] = [];
  if (payload.permissions && Array.isArray(payload.permissions)) {
    permissions.push(...payload.permissions);
  }
  if (
    payload.app_metadata?.permissions &&
    Array.isArray(payload.app_metadata.permissions)
  ) {
    permissions.push(...(payload.app_metadata.permissions as string[]));
  }
  if (
    payload.user_metadata?.permissions &&
    Array.isArray(payload.user_metadata.permissions)
  ) {
    permissions.push(...(payload.user_metadata.permissions as string[]));
  }

  // Extract department information
  const department_name =
    payload.department_name ||
    (payload.app_metadata?.department_name as string) ||
    (payload.user_metadata?.department_name as string);

  const department_id =
    payload.department_id ||
    (payload.app_metadata?.department_id as string) ||
    (payload.user_metadata?.department_id as string);

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    roles: [...new Set(roles)], // Remove duplicates
    role_ids: [...new Set(role_ids)], // Remove duplicates
    permissions: [...new Set(permissions)], // Remove duplicates
    department_name,
    department_id,
    metadata: {
      ...payload.user_metadata,
      ...payload.app_metadata,
    },
  };
}

/**
 * Check if JWT token is expired
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get JWT expiration time
 */
export function getJWTExpiration(token: string): Date | null {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Extract user ID from JWT token
 */
export function getUserIdFromJWT(token: string): string | null {
  const payload = decodeJWTPayload(token);
  return payload?.sub || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(token: string, role: string): boolean {
  const claims = extractUserClaims(token);
  if (!claims) {
    return false;
  }

  return claims.roles.includes(role) || claims.role === role;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(token: string, permission: string): boolean {
  const claims = extractUserClaims(token);
  if (!claims) {
    return false;
  }

  return claims.permissions.includes(permission);
}

/**
 * Get user's department from JWT token
 */
export function getDepartmentFromJWT(
  token: string,
): { name?: string; id?: string } | null {
  const claims = extractUserClaims(token);
  if (!claims) {
    return null;
  }

  return {
    name: claims.department_name,
    id: claims.department_id,
  };
}
