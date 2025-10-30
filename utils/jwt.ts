/**
 * JWT Utilities for decoding and inspecting JWT tokens
 */

/**
 * JWT Payload structure for custom claims
 */
export interface JWTPayload {
  // Standard JWT claims
  sub: string; // Subject (user ID)
  aud: string; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at
  email?: string;
  role?: string;
  session_id?: string;
  
  // Custom claims (added via custom_access_token_hook)
  permissions?: string[];
  roles?: string[];
  department_id?: string;
  department_name?: string;
  
  // Supabase metadata
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
 * Decode a JWT token and return its payload
 * 
 * @param token - The JWT token string (format: header.payload.signature)
 * @returns Decoded payload object or null if decoding fails
 * 
 * @example
 * ```typescript
 * const payload = decodeJWT(session.access_token);
 * console.log('Permissions:', payload?.permissions);
 * console.log('Roles:', payload?.roles);
 * ```
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT token format: Expected 3 parts separated by dots');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 decode (handle URL-safe base64)
    // Replace URL-safe characters with standard base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 and handle special characters
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse JSON payload
    const decoded = JSON.parse(jsonPayload) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * 
 * @param token - The JWT token string or decoded payload
 * @returns true if the token is expired, false otherwise
 * 
 * @example
 * ```typescript
 * const isExpired = isJWTExpired(session.access_token);
 * if (isExpired) {
 *   console.log('Token has expired, please login again');
 * }
 * ```
 */
export function isJWTExpired(token: string | JWTPayload): boolean {
  try {
    const payload = typeof token === 'string' ? decodeJWT(token) : token;
    
    if (!payload || !payload.exp) {
      return true; // Consider invalid tokens as expired
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking JWT expiration:', error);
    return true;
  }
}

/**
 * Get time until JWT token expires
 * 
 * @param token - The JWT token string or decoded payload
 * @returns Number of milliseconds until expiration, or 0 if expired/invalid
 * 
 * @example
 * ```typescript
 * const msUntilExpiry = getJWTTimeUntilExpiry(session.access_token);
 * const minutesLeft = Math.floor(msUntilExpiry / 1000 / 60);
 * console.log(`Token expires in ${minutesLeft} minutes`);
 * ```
 */
export function getJWTTimeUntilExpiry(token: string | JWTPayload): number {
  try {
    const payload = typeof token === 'string' ? decodeJWT(token) : token;
    
    if (!payload || !payload.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeLeft = expirationTime - currentTime;
    
    return Math.max(0, timeLeft);
  } catch (error) {
    console.error('Error calculating JWT time until expiry:', error);
    return 0;
  }
}

/**
 * Extract permissions from a JWT token
 * 
 * @param token - The JWT token string or decoded payload
 * @returns Array of permission strings, or empty array if none found
 * 
 * @example
 * ```typescript
 * const permissions = getJWTPermissions(session.access_token);
 * console.log('User permissions:', permissions);
 * ```
 */
export function getJWTPermissions(token: string | JWTPayload): string[] {
  try {
    const payload = typeof token === 'string' ? decodeJWT(token) : token;
    
    if (!payload) {
      return [];
    }

    return payload.permissions || [];
  } catch (error) {
    console.error('Error extracting JWT permissions:', error);
    return [];
  }
}

/**
 * Extract roles from a JWT token
 * 
 * @param token - The JWT token string or decoded payload
 * @returns Array of role strings, or empty array if none found
 * 
 * @example
 * ```typescript
 * const roles = getJWTRoles(session.access_token);
 * if (roles.includes('admin')) {
 *   console.log('User is an admin');
 * }
 * ```
 */
export function getJWTRoles(token: string | JWTPayload): string[] {
  try {
    const payload = typeof token === 'string' ? decodeJWT(token) : token;
    
    if (!payload) {
      return [];
    }

    return payload.roles || [];
  } catch (error) {
    console.error('Error extracting JWT roles:', error);
    return [];
  }
}

/**
 * Pretty print JWT token information to console
 * Useful for debugging
 * 
 * @param token - The JWT token string
 * @param label - Optional label for the console output
 * 
 * @example
 * ```typescript
 * debugJWT(session.access_token, 'Current User Token');
 * ```
 */
export function debugJWT(token: string, label = 'JWT Token'): void {
  console.group(`🔐 ${label}`);
  
  const payload = decodeJWT(token);
  
  if (!payload) {
    console.error('Failed to decode token');
    console.groupEnd();
    return;
  }

  console.log('📧 Email:', payload.email);
  console.log('🆔 User ID (sub):', payload.sub);
  console.log('👥 Roles:', payload.roles || []);
  console.log('🔑 Permissions:', payload.permissions || []);
  console.log('🏢 Department:', payload.department_name || 'N/A');
  console.log('⏰ Issued At:', new Date(payload.iat * 1000).toLocaleString());
  console.log('⏳ Expires At:', new Date(payload.exp * 1000).toLocaleString());
  console.log('⚠️ Is Expired:', isJWTExpired(payload));
  
  const timeLeft = getJWTTimeUntilExpiry(payload);
  const minutesLeft = Math.floor(timeLeft / 1000 / 60);
  console.log('⏱️ Time Until Expiry:', `${minutesLeft} minutes`);
  
  console.log('📄 Full Payload:', payload);
  console.groupEnd();
}
