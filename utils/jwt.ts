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

